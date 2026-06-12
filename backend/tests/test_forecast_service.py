import os
import unittest
from datetime import date, datetime, timezone
from unittest.mock import patch

os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core import security
from app.database import models
from app.database.database import Base
from app.main import app, get_db
from app.ml_integration.forecast_service import ForecastService, InsufficientForecastHistory, forecast_service


class ForecastServiceTests(unittest.TestCase):
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

    def create_user(self):
        db = self.SessionLocal()
        user = models.User(
            full_name="Forecast Operator",
            email="forecast@sakafarma.com",
            hashed_password=security.get_password_hash("Strong1!"),
            role="technician",
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        token = security.create_access_token(data={"user_id": user.id, "role": user.role})
        db.close()
        return {"Authorization": f"Bearer {token}"}

    def test_forecast_routes_require_authentication(self):
        self.assertEqual(self.client.get("/api/forecast/latest").status_code, 401)
        self.assertEqual(self.client.post("/api/forecast/latest").status_code, 401)

    def test_rejected_gate_returns_503_instead_of_weak_prediction(self):
        headers = self.create_user()
        response = self.client.post("/api/forecast/latest", headers=headers)
        self.assertEqual(response.status_code, 503)
        self.assertIn("deployment gate", response.json()["detail"])

    def test_insufficient_history_returns_409(self):
        headers = self.create_user()
        with patch.object(forecast_service, "generate", side_effect=InsufficientForecastHistory("Need more history.")):
            response = self.client.post("/api/forecast/latest", headers=headers)
        self.assertEqual(response.status_code, 409)

    def test_successful_generation_is_audited(self):
        headers = self.create_user()
        payload = {
            "generated_at": datetime(2026, 6, 6, tzinfo=timezone.utc),
            "history_start": date(2026, 5, 1),
            "history_end": date(2026, 6, 6),
            "target_metric": "daily_p95_reconstruction_mae",
            "conditional_on_operation": True,
            "threshold": 0.22,
            "threshold_source": "artifact_baseline",
            "model_version": "test-v1",
            "deployment_gate": {"passed": True},
            "observed_history": [],
            "forecasts": [],
            "limitations": [],
            "cache_status": "refreshed",
        }
        with patch.object(forecast_service, "generate", return_value=payload):
            response = self.client.post("/api/forecast/latest", headers=headers)
        self.assertEqual(response.status_code, 200)
        db = self.SessionLocal()
        audit = db.query(models.AuditLog).filter(models.AuditLog.action == "FORECAST_GENERATE").first()
        db.close()
        self.assertIsNotNone(audit)

    def test_validated_history_bootstrap_is_idempotent(self):
        db = self.SessionLocal()
        first = forecast_service.bootstrap_history(db, models, machine_id="PMA Granulator #01")
        second = forecast_service.bootstrap_history(db, models, machine_id="PMA Granulator #01")
        stored = db.query(models.DailyHealthMetric).count()
        db.close()
        self.assertGreater(first, 0)
        self.assertEqual(second, 0)
        self.assertEqual(stored, first)

    def test_daily_metric_updates_from_saved_anomaly_events(self):
        db = self.SessionLocal()
        event_time = datetime(2026, 6, 6, 8, 0, tzinfo=timezone.utc)
        for value in (0.1, 0.2, 0.3):
            db.add(
                models.AnomalyEvent(
                    timestamp=event_time,
                    machine_id="PMA Granulator #01",
                    reconstruction_error=value,
                    threshold=0.22,
                    is_anomaly=value > 0.22,
                )
            )
        db.commit()
        event = db.query(models.AnomalyEvent).order_by(models.AnomalyEvent.id.desc()).first()
        forecast_service.update_daily_metric_from_event(db, models, event=event, source="test")
        metric = db.query(models.DailyHealthMetric).filter(models.DailyHealthMetric.metric_date == date(2026, 6, 6)).first()
        db.close()
        self.assertEqual(metric.observation_count, 3)
        self.assertEqual(metric.max_reconstruction_error, 0.3)
        self.assertEqual(metric.source, "test")

    def test_cache_key_changes_with_history_model_or_threshold(self):
        service = ForecastService()
        service._metadata = {"model_version": "v1"}
        metric = models.DailyHealthMetric(
            machine_id="PMA Granulator #01",
            metric_date=date(2026, 6, 6),
            p95_reconstruction_error=0.2,
            mean_reconstruction_error=0.15,
            max_reconstruction_error=0.3,
            observation_count=4,
            observation_flag=True,
            source="test",
            updated_at=datetime(2026, 6, 6, tzinfo=timezone.utc),
        )
        first, _ = service._cache_key([metric], {"threshold": 0.22, "threshold_source": "artifact_baseline"})
        second, _ = service._cache_key([metric], {"threshold": 0.25, "threshold_source": "admin_override"})
        service._metadata = {"model_version": "v2"}
        third, _ = service._cache_key([metric], {"threshold": 0.22, "threshold_source": "artifact_baseline"})
        metric.observation_count = 5
        fourth, _ = service._cache_key([metric], {"threshold": 0.22, "threshold_source": "artifact_baseline"})
        self.assertEqual(len({first, second, third, fourth}), 4)

    def test_threshold_risk_mapping(self):
        self.assertEqual(ForecastService.risk_status(0.19, 0.2), "HEALTHY")
        self.assertEqual(ForecastService.risk_status(0.2, 0.2), "WARNING")
        self.assertEqual(ForecastService.risk_status(0.3, 0.2), "CRITICAL")


if __name__ == "__main__":
    unittest.main()
