from datetime import date, datetime
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
    threshold_source: str = "artifact_baseline"
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
    threshold_source: str | None = None
    model_version: str | None = None
    details: str | None = None
    acknowledged_at: datetime | None = None
    acknowledged_by: str | None = None
    acknowledgement_note: str | None = None

    class Config:
        from_attributes = True


class AlertAcknowledgeRequest(BaseModel):
    note: str | None = Field(default=None, max_length=1000)


class DashboardSummary(BaseModel):
    machine_id: str
    status: str
    latest_reading: TelemetryReadingResponse | None
    latest_prediction: AlertResponse | None
    threshold: float | None
    threshold_policy: str
    threshold_source: str
    artifact_threshold: float | None = None
    valid_window_count: int | None
    skipped_window_count: int | None
    artifact_status: dict[str, Any]
    recent_alerts: list[AlertResponse]

class MaintenanceTicketCreate(BaseModel):
    machine_id: str
    issue_description: str
    anomaly_event_id: int | None = None

class MaintenanceTicketResponse(BaseModel):
    id: int
    anomaly_event_id: int | None = None
    machine_id: str
    issue_description: str
    resolution_note: str | None = None
    reported_by: str
    timestamp: datetime
    updated_at: datetime | None = None
    resolved_at: datetime | None = None
    status: str

    class Config:
        from_attributes = True


class MaintenanceTicketStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(OPEN|IN_REVIEW|RESOLVED)$")
    resolution_note: str | None = None


class ThresholdSettingResponse(BaseModel):
    threshold: float
    threshold_policy: str
    threshold_source: str
    artifact_threshold: float | None = None
    override_active: bool
    reason: str | None = None
    updated_by: str | None = None
    updated_at: datetime | None = None


class ThresholdSettingUpdate(BaseModel):
    threshold: float = Field(..., gt=0)
    reason: str = Field(..., min_length=3, max_length=1000)


class SystemStatusResponse(BaseModel):
    checked_at: datetime
    database: dict[str, Any]
    ml_artifacts: dict[str, Any]
    forecast_artifacts: dict[str, Any]
    threshold: ThresholdSettingResponse
    audit_chain: dict[str, Any]
    telemetry_source: dict[str, Any]


class DailyHealthMetricResponse(BaseModel):
    date: date
    p95_reconstruction_error: float
    mean_reconstruction_error: float
    max_reconstruction_error: float
    observation_count: int
    source: str


class ForecastPointResponse(BaseModel):
    horizon_days: int
    target_date: date
    predicted_reconstruction_error: float
    lower_bound: float
    upper_bound: float
    forecast_risk_status: str
    interval_crosses_threshold: bool


class ForecastResponse(BaseModel):
    generated_at: datetime
    history_start: date
    history_end: date
    target_metric: str
    conditional_on_operation: bool
    threshold: float
    threshold_source: str
    model_version: str
    deployment_gate: dict[str, Any]
    observed_history: list[DailyHealthMetricResponse]
    forecasts: list[ForecastPointResponse]
    limitations: list[str]
    cache_status: str
