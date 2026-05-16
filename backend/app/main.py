from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from contextlib import asynccontextmanager
from jose import jwt
from pydantic import BaseModel
from typing import List
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType

# --- SECURITY LIBRARIES (Cyber Security Layer) ---
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# --- APP IMPORTS ---
from app.core.config import settings
from app import schemas
from app.core import security
from app.database.database import engine, SessionLocal
from app.database import models

# 1. Inisialisasi Rate Limiter (🛡️ Mencegah Brute Force)
limiter = Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🛡️ SPMS Backend: Cyber Security Shield Activated")
    models.Base.metadata.create_all(bind=engine)
    yield
    print("🛑 SPMS Backend: Shutting down...")

# 2. Fungsi Helper untuk Audit Log (🛡️ Mencatat Jejak Aktivitas)
def create_audit_entry(db: Session, email: str, action: str, request: Request, status: str):
    new_log = models.AuditLog(
        user_email=email,
        action=action,
        status=status,
        ip_address=request.client.host,
        browser_info=request.headers.get("user-agent")
    )
    db.add(new_log)
    db.commit()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Konfigurasi Email
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
    _app = FastAPI(
        title="SPMS API - Secured Version",
        lifespan=lifespan
    )
    _app.state.limiter = limiter
    _app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    _app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    return _app

app = get_application()

@app.get("/")
def health_check():
    return {"status": "online", "security_layer": "active"}

# --- AUTHENTICATION ENDPOINTS ---

@app.post("/api/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pw = security.get_password_hash(user.password)
    new_user = models.User(
        full_name=user.full_name,
        email=user.email,
        hashed_password=hashed_pw
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/login", response_model=schemas.Token)
@limiter.limit("5/minute")
def login(request: Request, user_credentials: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == user_credentials.username).first()
    
    if not user or not security.verify_password(user_credentials.password, user.hashed_password):
        create_audit_entry(db, user_credentials.username, "LOGIN_ATTEMPT", request, "FAILED")
        raise HTTPException(status_code=401, detail="Invalid Credentials")
        
    create_audit_entry(db, user.email, "LOGIN_SUCCESS", request, "SUCCESS")
    access_token = security.create_access_token(data={"sub": user.email, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}

# --- CYBER SECURITY ENDPOINTS ---

@app.get("/api/audit-logs")
def get_audit_logs(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak: Anda bukan Admin")
    
    logs = db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).limit(100).all()
    return logs

# --- PASSWORD RESET LOGIC ---

@app.post("/api/forgot-password")
async def forgot_password(request: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    
    if user:
        reset_token = security.create_access_token(
            data={"sub": user.email, "scope": "password_reset"},
            expires_delta=15
        )
        reset_link = f"http://localhost:5173/reset-password?token={reset_token}"
        
        message = MessageSchema(
            subject="SPMS Password Reset",
            recipients=[user.email],
            body=f"Klik link berikut untuk reset password: {reset_link}",
            subtype=MessageType.html
        )
        fm = FastMail(conf)
        await fm.send_message(message)
        
    return {"message": "Jika email terdaftar, instruksi reset telah dikirim."}

@app.post("/api/reset-password")
def reset_password(data: schemas.ResetPassword, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(data.token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        email: str = payload.get("sub")
        if payload.get("scope") != "password_reset":
            raise HTTPException(status_code=401, detail="Token tidak valid")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Token kedaluwarsa")

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")

    user.hashed_password = security.get_password_hash(data.new_password)
    db.commit()
    return {"message": "Password berhasil diperbarui"}

@app.get("/api/users/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(security.get_current_user)):
    return current_user