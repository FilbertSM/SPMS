from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    full_name: str
    email: str
    password: str = Field(max_length=72)
    
class UserResponse(BaseModel): # <--- This must match exactly
    id: int
    full_name: str
    email: str
    role: str
    is_active: bool
    email_notifications: bool

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class ResetPassword(BaseModel):
    email: str
    otp: str
    new_password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class UserPreferencesUpdate(BaseModel):
    email_notifications: bool

    class Config:
        from_attributes = True


class TelemetryReadingCreate(BaseModel):
    timestamp: datetime | None = None
    machine_id: str = "PMA Granulator #01"
    batch_id: str | None = None
    process_id: str | None = None
    impeller_rpm: float | None = None
    chopper_rpm: float | None = None
    impeller_ampere: float | None = None
    x_axis_rms_velocity: float | None = None
    z_axis_rms_velocity: float | None = None
    x_axis_peak_acceleration: float | None = None
    z_axis_peak_acceleration: float | None = None
    temperature_c: float | None = None


class TelemetryReadingResponse(TelemetryReadingCreate):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True


class AnomalyPredictionRequest(BaseModel):
    machine_id: str = "PMA Granulator #01"
    window: list[TelemetryReadingCreate] = Field(..., min_length=15, max_length=15)


class AnomalyPredictionResponse(BaseModel):
    machine_id: str
    reconstruction_error: float
    threshold: float
    is_anomaly: bool
    severity: str
    threshold_policy: str
    window_size: int
    features: list[str]
    model_version: str
    limitations: list[str]
    window_start: datetime | None = None
    window_end: datetime | None = None
    source: str | None = None


class AlertResponse(BaseModel):
    id: int
    timestamp: datetime
    machine_id: str
    reconstruction_error: float
    threshold: float
    is_anomaly: bool
    severity: str
    threshold_policy: str | None = None
    model_version: str | None = None
    details: str | None = None

    class Config:
        from_attributes = True


class DashboardSummary(BaseModel):
    machine_id: str
    status: str
    latest_reading: TelemetryReadingResponse | None
    latest_prediction: AlertResponse | None
    threshold: float | None
    threshold_policy: str
    valid_window_count: int | None
    skipped_window_count: int | None
    artifact_status: dict[str, Any]
    recent_alerts: list[AlertResponse]

class MaintenanceTicketCreate(BaseModel):
    machine_id: str
    issue_description: str

class MaintenanceTicketResponse(BaseModel):
    id: int
    machine_id: str
    issue_description: str
    reported_by: str
    timestamp: datetime
    status: str

    class Config:
        from_attributes = True