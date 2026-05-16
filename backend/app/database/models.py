from sqlalchemy import Column, Integer, String, Boolean, DateTime
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

class AuditLog(Base):
    """
    🛡️ Tabel Audit Log (Cyber Security Layer)
    Digunakan untuk mencatat jejak aktivitas user dan deteksi serangan.
    """
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    user_email = Column(String(255), nullable=True)    
    action = Column(String(255), nullable=False)
    status = Column(String(50), nullable=True) # Mencatat SUCCESS atau FAILED
    ip_address = Column(String(45), nullable=True)
    browser_info = Column(String(500), nullable=True)