import csv
import io
import json
import re
from datetime import datetime, timezone
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

# --- USER IMPORTS RESTORED ---
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType

from app import schemas
from app.core import security
from app.core.config import settings
from app.core.security import ALGORITHM, SECRET_KEY
from app.database import models
from app.database.database import SessionLocal, engine
from app.ml_integration.inference_service import inference_service
from app.ml_integration.window_builder import (
    WindowSourceUnavailable,
    WindowValidationError,
    build_latest_valid_pma_l1_window,
    fetch_latest_pma_l1_rows,
    validate_prediction_window,
)
import random
from datetime import timedelta

# --- INISIALISATION LIMITER ---
limiter = Limiter(key_func=get_remote_address)

# --- CONFIGURATION EMAIL ---
conf = ConnectionConfig(
    MAIL_USERNAME = "jason_a@smaknasionalanglo.sch.id",
    MAIL_PASSWORD = "dpxfvzcuqlvncbmv",
    MAIL_FROM = "jason_a@smaknasionalanglo.sch.id",
    MAIL_PORT = 587,
    MAIL_SERVER = "smtp.gmail.com",
    MAIL_STARTTLS = True,
    MAIL_SSL_TLS = False,
    USE_CREDENTIALS = True,
    VALIDATE_CERTS = True
)


def get_application() -> FastAPI:
    # print("--- ⚠️ RESET DATABASE SEMENTARA ⚠️ ---")
    try:
        # models.Base.metadata.drop_all(bind=engine)
        models.Base.metadata.create_all(bind=engine)
    except SQLAlchemyError as exc:
        print(f"WARNING: database table initialization skipped: {exc}")

    app = FastAPI(
        title=settings.PROJECT_NAME,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        description="Secure Predictive Maintenance System API",
        version="1.0.0",
    )

    # --- ADD A STATE & EXCEPTION HANDLER LIMITER TO THE APP ---
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    return app


app = get_application()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def health_check():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "message": "SPMS API is ready for telemetry.",
    }


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        token_user_id = payload.get("user_id")
        if token_user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.id == token_user_id).first()
    if user is None:
        raise credentials_exception

    return user


def get_current_admin(
    request: Request,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "admin":
        client_ip = request.client.host if request.client else "Unknown"
        user_agent = request.headers.get("user-agent", "Unknown")

        log = models.AuditLog(
            user_email=current_user.email,
            action="UNAUTHORIZED_ACCESS",
            status="FAILED",
            ip_address=client_ip,
            browser_info=user_agent,
        )
        db.add(log)
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Administrative Privileges Required",
        )

    return current_user


@app.post("/api/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(request: Request, user: schemas.UserCreate, db: Session = Depends(get_db)):
    normalized_email = user.email.strip().lower()
    
    # Menangkap IP Address dan User Agent untuk keperluan audit
    client_ip = request.client.host if request.client else "Unknown"
    user_agent = request.headers.get("user-agent", "Unknown")

    # 1. Gagal karena Email Sudah Terdaftar
    existing_user = db.query(models.User).filter(models.User.email == normalized_email).first()
    if existing_user:
        failed_log = models.AuditLog(
            user_email=normalized_email,
            action="USER_REGISTRATION",
            status="FAILED",
            ip_address=client_ip,
            browser_info=user_agent
        )
        db.add(failed_log)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # 2. Gagal karena Domain Tidak Diizinkan
    allowed_domains = ["sakafarma.com", "gmail.com", "president.ac.id", "student.president.ac.id"]
    email_domain = normalized_email.split("@")[-1] if "@" in normalized_email else ""
    if email_domain not in allowed_domains:
        failed_log = models.AuditLog(
            user_email=normalized_email,
            action="USER_REGISTRATION",
            status="FAILED",
            ip_address=client_ip,
            browser_info=user_agent
        )
        db.add(failed_log)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration is restricted to official company domains only.",
        )

    # 3. Gagal karena Kompleksitas Password Kurang
    has_uppercase = re.search(r"[A-Z]", user.password)
    has_number = re.search(r"[0-9]", user.password)
    has_symbol = re.search(r"[^A-Za-z0-9]", user.password)

    if len(user.password) < 8 or len(user.password) > 20 or not has_uppercase or not has_number or not has_symbol:
        failed_log = models.AuditLog(
            user_email=normalized_email,
            action="USER_REGISTRATION",
            status="FAILED",
            ip_address=client_ip,
            browser_info=user_agent
        )
        db.add(failed_log)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long and contain uppercase letters, numbers, and symbols.",
        )

    print(f"--- DEBUG: Security validation passed for user: {normalized_email} ---")

    # Proses simpan data pengguna baru
    new_user = models.User(
        full_name=user.full_name,
        email=normalized_email,
        hashed_password=security.get_password_hash(user.password),
    )
    db.add(new_user)
    
    # 4. Sukses Registrasi (Catat log status SUCCESS)
    success_log = models.AuditLog(
        user_email=normalized_email,
        action="USER_REGISTRATION",
        status="SUCCESS",
        ip_address=client_ip,
        browser_info=user_agent
    )
    db.add(success_log)
    
    db.commit()
    db.refresh(new_user)
    return new_user


@app.post("/api/login", response_model=schemas.Token)
@limiter.limit("5/minute")
def login(
    request: Request,
    user_credentials: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    normalized_email = user_credentials.username.strip().lower()
    user = db.query(models.User).filter(models.User.email == normalized_email).first()

    client_ip = request.client.host if request.client else "Unknown"
    user_agent = request.headers.get("user-agent", "Unknown")

    if not user or not security.verify_password(user_credentials.password, user.hashed_password):
        failed_log = models.AuditLog(
            user_email=normalized_email,
            action="USER_LOGIN",
            status="FAILED",
            ip_address=client_ip,
            browser_info=user_agent,
        )
        db.add(failed_log)
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    success_log = models.AuditLog(
        user_email=user.email,
        action="USER_LOGIN",
        status="SUCCESS",
        ip_address=client_ip,
        browser_info=user_agent,
    )
    db.add(success_log)
    db.commit()

    access_token = security.create_access_token(
        data={"user_id": user.id, "role": user.role}
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/api/logout")
def logout(
    request: Request,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    client_ip = request.client.host if request.client else "Unknown"
    user_agent = request.headers.get("user-agent", "Unknown")

    log = models.AuditLog(
        user_email=current_user.email,
        action="USER_LOGOUT",
        status="SUCCESS",
        ip_address=client_ip,
        browser_info=user_agent,
    )
    db.add(log)
    db.commit()

    return {"message": "Logged out successfully"}


@app.post("/api/forgot-password")
async def forgot_password(
    request: Request,
    body: schemas.ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    client_ip = request.client.host if request.client else "Unknown"
    user_agent = request.headers.get("user-agent", "Unknown")
    normalized_email = body.email.strip().lower()

    user = db.query(models.User).filter(models.User.email == normalized_email).first()

    if user:
        # --- GENERATE 6-DIGIT OTP ---
        otp_code = str(random.randint(100000, 999999))
        
        # Simpan OTP dan waktu kedaluwarsa (15 menit dari sekarang) ke database
        user.reset_otp = otp_code
        user.reset_otp_expire = datetime.utcnow() + timedelta(minutes=15)
        db.commit()

        message = MessageSchema(
            subject="SPMS - Your Password Reset OTP",
            recipients=[user.email],
            body=f"""
            <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; color: #1b263b; text-align: center;">
                <h3 style="font-size: 20px; font-weight: bold; margin-bottom: 8px;">Password Reset Request</h3>
                <p style="font-size: 14px; color: #45474d; margin-bottom: 24px;">You requested a password reset for your SPMS account. Please use the verification code below:</p>
                
                <div style="background-color: #f1f4f3; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                    <span style="font-size: 32px; font-weight: black; letter-spacing: 8px; color: #2ecc71;">{otp_code}</span>
                </div>
                
                <p style="font-size: 12px; color: #777; line-height: 1.5;">
                    This code will expire in 15 minutes.<br>
                    If you did not request this, please ignore this email and your password will remain unchanged.
                </p>
            </div>
            """,
            subtype=MessageType.html,
        )

        fm = FastMail(config=conf)
        await fm.send_message(message)

        log = models.AuditLog(
            user_email=user.email,
            action="OTP_SENT",
            status="SUCCESS",
            ip_address=client_ip,
            browser_info=user_agent,
        )
    else:
        log = models.AuditLog(
            user_email=normalized_email,
            action="OTP_REQ_FAILED",
            status="FAILED",
            ip_address=client_ip,
            browser_info=user_agent,
        )

    db.add(log)
    db.commit()

    return {"message": "If this email is registered, an OTP code has been sent."}


@app.post("/api/reset-password")
def reset_password(
    request: Request,
    data: schemas.ResetPassword, # Ini otomatis akan membaca email, otp, dan new_password dari schemas.py
    db: Session = Depends(get_db),
):
    client_ip = request.client.host if request.client else "Unknown"
    user_agent = request.headers.get("user-agent", "Unknown")
    normalized_email = data.email.strip().lower()

    # Cari user berdasarkan email
    user = db.query(models.User).filter(models.User.email == normalized_email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # --- VALIDASI OTP ---
    if user.reset_otp != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP code.")
    
    # --- VALIDASI WAKTU KEDALUWARSA ---
    if user.reset_otp_expire is None or datetime.utcnow() > user.reset_otp_expire:
        raise HTTPException(status_code=400, detail="OTP code has expired. Please request a new one.")

    # Jika lolos validasi, update password
    user.hashed_password = security.get_password_hash(data.new_password)
    
    # Hapus OTP dari database agar tidak bisa dipakai ulang
    user.reset_otp = None
    user.reset_otp_expire = None
    
    reset_log = models.AuditLog(
        user_email=user.email,
        action="PASSWORD_RESET_SUCCESS",
        status="SUCCESS",
        ip_address=client_ip,
        browser_info=user_agent,
    )
    db.add(reset_log)
    db.commit()

    return {"message": "Password updated successfully. You can now login."}


@app.get("/api/audit-logs")
def get_audit_logs(
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).all()


@app.get("/api/audit-logs/export")
def export_audit_logs(
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    logs = db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).all()

    stream = io.StringIO()
    csv_writer = csv.writer(stream)
    csv_writer.writerow(["ID", "Timestamp (UTC)", "User Email", "Action", "Status", "IP Address", "Browser Info"])

    for log in logs:
        time_str = log.timestamp.strftime("%Y-%m-%d %H:%M:%S") if log.timestamp else "N/A"
        csv_writer.writerow(
            [
                log.id,
                time_str,
                log.user_email or "System/Anonymous",
                log.action,
                log.status,
                log.ip_address or "N/A",
                log.browser_info or "N/A",
            ]
        )

    stream.seek(0)
    response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=security_audit_report.csv"
    return response


@app.get("/api/users/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user


@app.patch("/api/users/me/preferences")
def update_user_preferences(
    request: Request,
    preferences: schemas.UserPreferencesUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.email_notifications = preferences.email_notifications

    client_ip = request.client.host if request.client else "Unknown"
    user_agent = request.headers.get("user-agent", "Unknown")

    log = models.AuditLog(
        user_email=current_user.email,
        action="PREFERENCES_UPDATED",
        status="SUCCESS",
        ip_address=client_ip,
        browser_info=user_agent,
    )
    db.add(log)
    db.commit()

    return {
        "message": "Preferences updated successfully",
        "email_notifications": current_user.email_notifications,
    }


# ==========================================
# --- TEAMMATE ML & TELEMETRY ENDPOINTS ---
# ==========================================

@app.get("/api/pma/getPMAData")
def get_pma_telemetry(
    start: Optional[str] = None,
    end: Optional[str] = None,
    limit: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query_str = """
        SELECT
            `time@timestamp` AS timestamp,
            data_format_2 AS impeller_rpm,
            data_format_3 AS filterclear_interval_sec,
            data_format_4 AS processtime_min,
            data_format_5 AS chopper_rpm,
            data_format_6 AS pump_speed,
            data_format_7 AS impeller_ampere
        FROM `cmt-fhdgea1_ebr_pma_data`
        WHERE `time@timestamp` IS NOT NULL
    """

    params = {}

    if start and end:
        try:
            start_dt = datetime.strptime(start, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            end_dt = datetime.strptime(end, "%Y-%m-%d").replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
            params["start_unix"] = start_dt.timestamp()
            params["end_unix"] = end_dt.timestamp()
            query_str += " AND `time@timestamp` >= :start_unix AND `time@timestamp` <= :end_unix"
        except ValueError:
            pass

    if start and end:
        query_str += " ORDER BY `time@timestamp` ASC"
    else:
        query_str += " ORDER BY `time@timestamp` DESC"

    if limit is not None:
        query_str += " LIMIT :limit"
        params["limit"] = limit
    elif not start and not end:
        query_str += " LIMIT 1000"

    try:
        results = db.execute(text(query_str), params).fetchall()
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="PMA telemetry source table is not initialized. Reset the local Docker database volume so db_init imports can run.",
        ) from exc

    data = [dict(row._mapping) for row in results]
    if not start and not end:
        return data[::-1]
    return data


@app.get("/api/motor/telemetry")
def get_motor_telemetry(
    start: Optional[str] = None,
    end: Optional[str] = None,
    limit: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query_str = """
        SELECT
            `time@timestamp` AS timestamp,
            (data_format_0 / 100.0) AS x_velocity_mm_s,
            (data_format_2 / 100.0) AS z_velocity_mm_s,
            (data_format_4 / 1000.0) AS x_peak_accel_g,
            (data_format_5 / 1000.0) AS z_peak_accel_g,
            (data_format_6 / 100.0) AS temperature
        FROM `cmt-mtc_motor1.1_data`
        WHERE `time@timestamp` IS NOT NULL
    """
    params = {}

    if start and end:
        try:
            start_dt = datetime.strptime(start, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            end_dt = datetime.strptime(end, "%Y-%m-%d").replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
            params["start_unix"] = start_dt.timestamp()
            params["end_unix"] = end_dt.timestamp()
            query_str += " AND `time@timestamp` >= :start_unix AND `time@timestamp` <= :end_unix"
            query_str += " ORDER BY `time@timestamp` ASC"
        except ValueError:
            pass
    else:
        query_str += " ORDER BY `time@timestamp` DESC"

    if limit is not None:
        query_str += " LIMIT :limit"
        params["limit"] = limit
    elif not start and not end:
        query_str += " LIMIT 1000"

    try:
        results = db.execute(text(query_str), params).fetchall()
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Motor telemetry source table is not initialized. Reset the local Docker database volume so db_init imports can run.",
        ) from exc

    data = [dict(row._mapping) for row in results]
    if not start and not end:
        return data[::-1]
    return data


def _anomaly_severity(reconstruction_error: float, threshold: float, is_anomaly: bool) -> str:
    if not is_anomaly:
        return "normal"
    if threshold > 0 and reconstruction_error >= threshold * 1.5:
        return "critical"
    return "warning"


def _reading_to_prediction_row(reading: schemas.TelemetryReadingCreate) -> dict:
    return {
        "timestamp": reading.timestamp,
        "machine_id": reading.machine_id,
        "batch_id": reading.batch_id,
        "process_id": reading.process_id,
        "impeller_rpm": reading.impeller_rpm,
        "chopper_rpm": reading.chopper_rpm,
        "impeller_ampere": reading.impeller_ampere,
        "x_axis_rms_velocity": reading.x_axis_rms_velocity,
        "z_axis_rms_velocity": reading.z_axis_rms_velocity,
        "x_axis_peak_acceleration": reading.x_axis_peak_acceleration,
        "z_axis_peak_acceleration": reading.z_axis_peak_acceleration,
        "temperature_c": reading.temperature_c,
    }


def _fallback_latest_telemetry(db: Session, *, machine_id: str, limit: int):
    return (
        db.query(models.TelemetryReading)
        .filter(models.TelemetryReading.machine_id == machine_id)
        .order_by(models.TelemetryReading.timestamp.desc())
        .limit(limit)
        .all()
    )


def _latest_telemetry_rows(db: Session, *, machine_id: str, limit: int):
    try:
        pma_rows = fetch_latest_pma_l1_rows(db, limit=limit, machine_id=machine_id)
    except WindowSourceUnavailable:
        pma_rows = []
    if pma_rows:
        return pma_rows
    return _fallback_latest_telemetry(db, machine_id=machine_id, limit=limit)


def _save_anomaly_event(
    db: Session,
    *,
    machine_id: str,
    prediction: dict,
    source: str,
    window_start: datetime | None,
    window_end: datetime | None,
) -> tuple[models.AnomalyEvent, str]:
    severity = _anomaly_severity(
        prediction["reconstruction_error"],
        prediction["threshold"],
        prediction["is_anomaly"],
    )

    event = models.AnomalyEvent(
        machine_id=machine_id,
        reconstruction_error=prediction["reconstruction_error"],
        threshold=prediction["threshold"],
        is_anomaly=prediction["is_anomaly"],
        severity=severity,
        threshold_policy=prediction["threshold_policy"],
        model_version=prediction["model_version"],
        details=json.dumps(
            {
                "features": prediction["features"],
                "window_size": prediction["window_size"],
                "limitations": prediction["limitations"],
                "source": source,
                "window_start": window_start.isoformat() if window_start else None,
                "window_end": window_end.isoformat() if window_end else None,
                "requested_at": datetime.utcnow().isoformat(),
            }
        ),
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event, severity


def _prediction_response(
    *,
    machine_id: str,
    prediction: dict,
    severity: str,
    source: str,
    window_start: datetime | None,
    window_end: datetime | None,
) -> dict:
    return {
        "machine_id": machine_id,
        "reconstruction_error": prediction["reconstruction_error"],
        "threshold": prediction["threshold"],
        "is_anomaly": prediction["is_anomaly"],
        "severity": severity,
        "threshold_policy": prediction["threshold_policy"],
        "window_size": prediction["window_size"],
        "features": prediction["features"],
        "model_version": prediction["model_version"],
        "limitations": prediction["limitations"],
        "window_start": window_start,
        "window_end": window_end,
        "source": source,
    }


@app.post("/api/telemetry", response_model=schemas.TelemetryReadingResponse, status_code=status.HTTP_201_CREATED)
def create_telemetry_reading(
    reading: schemas.TelemetryReadingCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    payload = reading.model_dump(exclude_none=True)
    if reading.timestamp is None:
        payload.pop("timestamp", None)

    stored = models.TelemetryReading(**payload)
    db.add(stored)
    db.commit()
    db.refresh(stored)
    return stored


@app.get("/api/telemetry/latest", response_model=list[schemas.TelemetryReadingResponse])
def read_latest_telemetry(
    limit: int = 60,
    machine_id: str = "PMA Granulator #01",
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    safe_limit = max(1, min(limit, 500))
    return _latest_telemetry_rows(db, machine_id=machine_id, limit=safe_limit)


@app.post("/api/predict/anomaly", response_model=schemas.AnomalyPredictionResponse)
def predict_anomaly(
    request: schemas.AnomalyPredictionRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        window = validate_prediction_window(
            [_reading_to_prediction_row(row) for row in request.window],
            expected_window=inference_service.window_size(),
            feature_names=inference_service.feature_names(),
        )
        prediction = inference_service.predict_window(window)
    except WindowValidationError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except ImportError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"ML runtime dependency is missing: {exc}",
        ) from exc

    _, severity = _save_anomaly_event(
        db,
        machine_id=request.machine_id,
        prediction=prediction,
        source="manual",
        window_start=window[0]["timestamp"],
        window_end=window[-1]["timestamp"],
    )

    return _prediction_response(
        machine_id=request.machine_id,
        prediction=prediction,
        severity=severity,
        source="manual",
        window_start=window[0]["timestamp"],
        window_end=window[-1]["timestamp"],
    )


@app.post("/api/predict/anomaly/latest", response_model=schemas.AnomalyPredictionResponse)
def predict_latest_anomaly(
    machine_id: str = "PMA Granulator #01",
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        window_payload = build_latest_valid_pma_l1_window(
            db,
            expected_window=inference_service.window_size(),
            feature_names=inference_service.feature_names(),
            machine_id=machine_id,
        )
        prediction = inference_service.predict_window(window_payload["rows"])
    except WindowValidationError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    except WindowSourceUnavailable as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except ImportError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"ML runtime dependency is missing: {exc}",
        ) from exc

    _, severity = _save_anomaly_event(
        db,
        machine_id=machine_id,
        prediction=prediction,
        source=window_payload["source"],
        window_start=window_payload["window_start"],
        window_end=window_payload["window_end"],
    )

    return _prediction_response(
        machine_id=machine_id,
        prediction=prediction,
        severity=severity,
        source=window_payload["source"],
        window_start=window_payload["window_start"],
        window_end=window_payload["window_end"],
    )


@app.get("/api/dashboard/summary", response_model=schemas.DashboardSummary)
def read_dashboard_summary(
    machine_id: str = "PMA Granulator #01",
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    latest_rows = _latest_telemetry_rows(db, machine_id=machine_id, limit=1)
    latest_reading = latest_rows[0] if latest_rows else None
    latest_prediction = (
        db.query(models.AnomalyEvent)
        .filter(models.AnomalyEvent.machine_id == machine_id)
        .order_by(models.AnomalyEvent.timestamp.desc())
        .first()
    )
    recent_alerts = (
        db.query(models.AnomalyEvent)
        .filter(models.AnomalyEvent.machine_id == machine_id)
        .order_by(models.AnomalyEvent.timestamp.desc())
        .limit(10)
        .all()
    )

    metadata = inference_service.metadata()
    threshold = metadata.get("threshold")
    threshold_policy = metadata.get("threshold_policy", "unknown")

    if latest_prediction is None:
        machine_status = "NO DATA"
    elif latest_prediction.severity == "critical":
        machine_status = "CRITICAL"
    elif latest_prediction.is_anomaly:
        machine_status = "WARNING"
    else:
        machine_status = "HEALTHY"

    return {
        "machine_id": machine_id,
        "status": machine_status,
        "latest_reading": latest_reading,
        "latest_prediction": latest_prediction,
        "threshold": threshold,
        "threshold_policy": threshold_policy,
        "valid_window_count": metadata.get("valid_window_count"),
        "skipped_window_count": metadata.get("skipped_window_count"),
        "artifact_status": inference_service.readiness_status(),
        "recent_alerts": recent_alerts,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)