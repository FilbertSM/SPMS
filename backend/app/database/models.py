from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Text
from sqlalchemy.sql import func
from app.database.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="technician")    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    email_notifications = Column(Boolean, default=True)
    reset_otp = Column(String(6), nullable=True) 
    reset_otp_expire = Column(DateTime(timezone=True), nullable=True)

class AuditLog(Base):
    """
    🛡️ Tabel Audit Log (Cyber Security Layer)
    Digunakan untuk mencatat jejak aktivitas user dan deteksi serangan.
    """
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    user_email = Column(String(255), nullable=True, index=True)    
    action = Column(String(255), nullable=False)
    status = Column(String(50), nullable=True) 
    ip_address = Column(String(45), nullable=True)
    browser_info = Column(String(500), nullable=True)


class TelemetryReading(Base):
    __tablename__ = "telemetry_readings"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    machine_id = Column(String(100), default="PMA Granulator #01", index=True)
    batch_id = Column(String(100), nullable=True)
    process_id = Column(String(100), nullable=True)
    impeller_rpm = Column(Float, nullable=True)
    chopper_rpm = Column(Float, nullable=True)
    impeller_ampere = Column(Float, nullable=True)
    x_axis_rms_velocity = Column(Float, nullable=True)
    z_axis_rms_velocity = Column(Float, nullable=True)
    x_axis_peak_acceleration = Column(Float, nullable=True)
    z_axis_peak_acceleration = Column(Float, nullable=True)
    temperature_c = Column(Float, nullable=True)


class AnomalyEvent(Base):
    __tablename__ = "anomaly_events"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    machine_id = Column(String(100), default="PMA Granulator #01", index=True)
    reconstruction_error = Column(Float, nullable=False)
    threshold = Column(Float, nullable=False)
    is_anomaly = Column(Boolean, default=False, index=True)
    severity = Column(String(30), default="normal")
    threshold_policy = Column(String(255), nullable=True)
    model_version = Column(String(255), nullable=True)
    details = Column(Text, nullable=True)
    
class MaintenanceTicket(Base):
    __tablename__ = "maintenance_tickets"

    # Pastikan baris di bawah ini ada tulisan primary_key=True
    id = Column(Integer, primary_key=True, index=True) 
    
    machine_id = Column(String(50), index=True)
    issue_description = Column(Text, nullable=False)
    reported_by = Column(String(100), nullable=False)
    status = Column(String(20), default="Open")
    timestamp = Column(DateTime(timezone=True), server_default=func.now())