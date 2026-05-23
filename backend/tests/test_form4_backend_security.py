import os
import unittest
from datetime import datetime, timedelta

os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")

from fastapi.testclient import TestClient
from jose import jwt
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker

from app.core import security
from app.core.config import settings
from app.core.security import ALGORITHM
from app.database import models
from app.database.database import Base
from app.main import app, get_db


class Form4BackendSecurityTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        Base.metadata.create_all(bind=self.engine)

        def override_get_db():
            db = self.SessionLocal()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[get_db] = override_get_db
        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()
        Base.metadata.drop_all(bind=self.engine)
        self.engine.dispose()

    def create_user(
        self,
        *,
        email: str = "operator@sakafarma.com",
        password: str = "Strong1!",
        role: str = "technician",
        is_active: bool = True,
        email_notifications: bool = True,
    ) -> models.User:
        db = self.SessionLocal()
        user = models.User(
            full_name="SPMS Operator",
            email=email,
            hashed_password=security.get_password_hash(password),
            role=role,
            is_active=is_active,
            email_notifications=email_notifications,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        db.close()
        return user

    def auth_headers(self, user: models.User) -> dict[str, str]:
        token = security.create_access_token(data={"user_id": user.id, "role": user.role})
        return {"Authorization": f"Bearer {token}"}

    def test_users_me_includes_email_notifications_and_preferences_persist(self):
        user = self.create_user(email_notifications=False)

        response = self.client.get("/api/users/me", headers=self.auth_headers(user))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["email_notifications"], False)

        update = self.client.patch(
            "/api/users/me/preferences",
            json={"email_notifications": True},
            headers=self.auth_headers(user),
        )
        self.assertEqual(update.status_code, 200)
        self.assertEqual(update.json()["email_notifications"], True)

        db = self.SessionLocal()
        refreshed = db.query(models.User).filter(models.User.id == user.id).first()
        audit = db.query(models.AuditLog).filter(models.AuditLog.action == "PREFERENCES_UPDATED").first()
        db.close()

        self.assertTrue(refreshed.email_notifications)
        self.assertIsNotNone(audit)

    def test_inactive_user_cannot_login_or_use_token(self):
        inactive = self.create_user(is_active=False)

        login_response = self.client.post(
            "/api/login",
            data={"username": inactive.email, "password": "Strong1!"},
        )
        self.assertEqual(login_response.status_code, 403)

        token_response = self.client.get("/api/users/me", headers=self.auth_headers(inactive))
        self.assertEqual(token_response.status_code, 401)

    def test_reset_password_enforces_policy_scope_and_successful_login(self):
        user = self.create_user(password="OldPass1!")
        reset_token = security.create_reset_token(data={"sub": user.email})

        weak_response = self.client.post(
            "/api/reset-password",
            json={"token": reset_token, "new_password": "weak"},
        )
        self.assertEqual(weak_response.status_code, 400)

        wrong_scope = jwt.encode(
            {
                "sub": user.email,
                "exp": datetime.utcnow() + timedelta(minutes=15),
                "scope": "access",
            },
            settings.SECRET_KEY,
            algorithm=ALGORITHM,
        )
        wrong_scope_response = self.client.post(
            "/api/reset-password",
            json={"token": wrong_scope, "new_password": "NewPass1!"},
        )
        self.assertEqual(wrong_scope_response.status_code, 401)

        success_response = self.client.post(
            "/api/reset-password",
            json={"token": reset_token, "new_password": "NewPass1!"},
        )
        self.assertEqual(success_response.status_code, 200)

        login_response = self.client.post(
            "/api/login",
            data={"username": user.email, "password": "NewPass1!"},
        )
        self.assertEqual(login_response.status_code, 200)

    def test_register_and_dashboard_summary_create_audit_evidence(self):
        register_response = self.client.post(
            "/api/register",
            json={
                "full_name": "New User",
                "email": "new.user@sakafarma.com",
                "password": "Strong1!",
            },
        )
        self.assertEqual(register_response.status_code, 201)

        user = self.create_user(email="dashboard@sakafarma.com")
        summary_response = self.client.get(
            "/api/dashboard/summary",
            headers=self.auth_headers(user),
        )
        self.assertEqual(summary_response.status_code, 200)
        self.assertIn("artifact_status", summary_response.json())

        db = self.SessionLocal()
        actions = {row.action for row in db.query(models.AuditLog).all()}
        db.close()

        self.assertIn("USER_REGISTER", actions)
        self.assertIn("DASHBOARD_SUMMARY_VIEW", actions)

    def test_audit_logs_are_admin_only_and_exportable(self):
        technician = self.create_user(email="tech@sakafarma.com", role="technician")
        admin = self.create_user(email="admin@sakafarma.com", role="admin")

        denied = self.client.get("/api/audit-logs", headers=self.auth_headers(technician))
        self.assertEqual(denied.status_code, 403)

        allowed = self.client.get("/api/audit-logs", headers=self.auth_headers(admin))
        self.assertEqual(allowed.status_code, 200)

        exported = self.client.get("/api/audit-logs/export", headers=self.auth_headers(admin))
        self.assertEqual(exported.status_code, 200)
        self.assertIn("text/csv", exported.headers["content-type"])
        self.assertIn("User Email", exported.text)

    def test_alerts_endpoint_returns_saved_anomaly_events(self):
        user = self.create_user(email="alerts@sakafarma.com")
        db = self.SessionLocal()
        db.add(
            models.AnomalyEvent(
                machine_id="PMA Granulator #01",
                reconstruction_error=0.5,
                threshold=0.2,
                is_anomaly=True,
                severity="warning",
                threshold_policy="test policy",
                model_version="test-model",
            )
        )
        db.commit()
        db.close()

        response = self.client.get("/api/alerts", headers=self.auth_headers(user))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)
        self.assertEqual(response.json()[0]["severity"], "warning")

        db = self.SessionLocal()
        audit = db.query(models.AuditLog).filter(models.AuditLog.action == "ALERTS_VIEW").first()
        db.close()
        self.assertIsNotNone(audit)


if __name__ == "__main__":
    unittest.main()
