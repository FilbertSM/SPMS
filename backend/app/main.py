import re
from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app import models, schemas, database
from sqlalchemy.orm import Session
from app.core import security
from fastapi.security import OAuth2PasswordRequestForm
from contextlib import asynccontextmanager 
from app.core.security import create_reset_token 
from app.utils.email import send_reset_email 
from pydantic import BaseModel
from jose import jwt, JWTError
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from fastapi.security import OAuth2PasswordBearer
from app.core.security import SECRET_KEY, ALGORITHM
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.database.database import engine, SessionLocal
from app.database import models
from fastapi import Request
from fastapi.responses import StreamingResponse
import io
import csv

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

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🛡️ Starting up SPMS Backend... Cyber Security Shield Activated")
    yield
    print("🛑 Shutting down SPMS Backend...")

def get_application() -> FastAPI:
    # Build tables before starting the app
    models.Base.metadata.create_all(bind=engine)

    _app = FastAPI(
        title=settings.PROJECT_NAME,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        description="Secure Predictive Maintenance System API",
        version="1.0.0"
    )

    # --- ADD A STATE & EXCEPTION HANDLER LIMITER TO THE APP ---
    _app.state.limiter = limiter
    _app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    _app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,  
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    return _app

app = get_application()

@app.get("/")
def health_check():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "message": "SPMS API is ready for telemetry."
    }

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- ACCESS CONTROL HELPER ---

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

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
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        client_ip = request.client.host if request.client else "Unknown"
        user_agent = request.headers.get("user-agent", "Unknown")
        
        log = models.AuditLog(
            user_email=current_user.email,
            action="UNAUTHORIZED_ACCESS",
            status="FAILED",
            ip_address=client_ip,
            browser_info=user_agent
        )
        db.add(log)
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Administrative Privileges Required"
        )
    return current_user


# --- AUTHENTICATION ENDPOINTS ---

@app.post("/api/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Email already registered"
        )
    
    ALLOWED_DOMAINS = ['sakafarma.com', 'president.ac.id', 'student.president.ac.id']
    email_domain = user.email.split('@')[-1].lower() if '@' in user.email else ''
    if email_domain not in ALLOWED_DOMAINS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration is restricted to official company domains only."
        )

    has_uppercase = re.search(r"[A-Z]", user.password)
    has_number = re.search(r"[0-9]", user.password)
    has_symbol = re.search(r"[^A-Za-z0-9]", user.password)
    
    if len(user.password) < 8 or len(user.password) > 20 or not has_uppercase or not has_number or not has_symbol:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long and contain uppercase letters, numbers, and symbols."
        )
    
    print(f"--- DEBUG: Security validation passed for user: {user.email} ---")
    
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


# Addition of the @limiter.limit decorator and the request parameter: Request
@app.post("/api/login", response_model=schemas.Token)
@limiter.limit("5/minute")
def login(request: Request, user_credentials: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == user_credentials.username).first()
    
    # Menangkap IP Address dan User Agent dari request
    client_ip = request.client.host if request.client else "Unknown"
    user_agent = request.headers.get("user-agent", "Unknown")
    
    # 1. Skenario Gagal Login (Catat log status FAILED)
    if not user or not security.verify_password(user_credentials.password, user.hashed_password):
        failed_log = models.AuditLog(
            user_email=user_credentials.username,
            action="USER_LOGIN",
            status="FAILED",
            ip_address=client_ip,
            browser_info=user_agent
        )
        db.add(failed_log)
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid Credentials",
            headers={"WWW-Authenticate": "Bearer"}
        )
        
    # 2. Skenario Sukses Login (Catat log status SUCCESS)
    success_log = models.AuditLog(
        user_email=user.email,
        action="USER_LOGIN",
        status="SUCCESS",
        ip_address=client_ip,
        browser_info=user_agent
    )
    db.add(success_log)
    db.commit()
        
    # Generate Token
    access_token = security.create_access_token(
        data={"user_id": user.id, "role": user.role}
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

class EmailSchema(BaseModel):
    email: str

@app.post("/api/logout")
def logout(
    request: Request, 
    current_user: models.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    client_ip = request.client.host if request.client else "Unknown"
    user_agent = request.headers.get("user-agent", "Unknown")
    
    # --- LOG: USER LOGOUT ---
    log = models.AuditLog(
        user_email=current_user.email,
        action="USER_LOGOUT",
        status="SUCCESS",
        ip_address=client_ip,
        browser_info=user_agent
    )
    db.add(log)
    db.commit()
    
    return {"message": "Logged out successfully"}

@app.post("/api/forgot-password")
async def forgot_password(request: Request, body: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    # Ambil IP dan User Agent
    client_ip = request.client.host if request.client else "Unknown"
    user_agent = request.headers.get("user-agent", "Unknown")
    
    # Perhatikan: gunakan body.email
    user = db.query(models.User).filter(models.User.email == body.email.strip()).first()
    
    if user:
        reset_token = security.create_reset_token(data={"sub": user.email})
        reset_link = f"http://localhost:5173/reset-password?token={reset_token}"
        
        message = MessageSchema(
            subject="SPMS - Password Reset Request",
            recipients=[user.email],
            body=f"""
            <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; color: #1b263b;">
                <h3 style="font-size: 20px; font-weight: bold; margin-bottom: 8px;">Reset Your SPMS Password</h3>
                <p style="font-size: 14px; color: #45474d; margin-bottom: 16px;">You requested a password reset for your account.</p>
                <p style="font-size: 14px; color: #45474d; margin-bottom: 24px;">Click the button below to set a new password. This link expires in 15 minutes.</p>
                <a href="{reset_link}" style="display: inline-block; padding: 12px 24px; background-color: #1b263b; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; text-transform: uppercase;">Reset Password</a>
                <p style="font-size: 11px; color: #777; margin-top: 28px; line-height: 1.5;">
                    If the button above doesn't work, copy and paste this URL into your browser:<br>
                    <a href="{reset_link}" style="color: #2ecc71;">{reset_link}</a>
                </p>
            </div>
            """,
            subtype=MessageType.html
        )

        fm = FastMail(config=conf)
        await fm.send_message(message)
        
        # --- LOG: PERMINTAAN RESET VALID ---
        log = models.AuditLog(
            user_email=user.email,
            action="PASSWORD_RESET_REQ",
            status="SUCCESS",
            ip_address=client_ip,
            browser_info=user_agent
        )
        db.add(log)
        db.commit()
    else:
        # --- LOG: PERMINTAAN RESET DARI EMAIL TIDAK DIKENAL ---
        log = models.AuditLog(
            user_email=body.email.strip(),
            action="PASSWORD_RESET_REQ",
            status="FAILED",
            ip_address=client_ip,
            browser_info=user_agent
        )
        db.add(log)
        db.commit()
        
    # Selalu return sukses (seperti di frontend) untuk keamanan
    return {"message": "If this email is registered, a reset link has been sent."}

class ResetPassword(BaseModel):
    token: str
    new_password: str

@app.post("/api/reset-password")
def reset_password(request: Request, data: schemas.ResetPassword, db: Session = Depends(get_db)):
    client_ip = request.client.host if request.client else "Unknown"
    user_agent = request.headers.get("user-agent", "Unknown")

    try:
        unverified_payload = jwt.get_unverified_claims(data.token)
        email: str = unverified_payload.get("sub")
        
        if not email:
            raise HTTPException(status_code=401, detail="Token expired or invalid")
            
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Token expired or invalid")

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Update password baru
    user.hashed_password = security.get_password_hash(data.new_password)
    
    # --- LOG: RESET PASSWORD BERHASIL ---
    reset_log = models.AuditLog(
        user_email=user.email,
        action="PASSWORD_RESET_SUCCESS",
        status="SUCCESS",
        ip_address=client_ip,
        browser_info=user_agent
    )
    db.add(reset_log)
    db.commit()

    return {"message": "Password updated successfully. You can now login."}


@app.get("/api/audit-logs")
def get_audit_logs(
    current_user: models.User = Depends(get_current_admin), 
    db: Session = Depends(get_db)
):
    logs = db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).all()
    
    if not logs:
        return []
        
    return logs

@app.get("/api/users/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.patch("/api/users/me/preferences")
def update_user_preferences(
    request: Request,
    preferences: schemas.UserPreferencesUpdate, 
    current_user: models.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    current_user.email_notifications = preferences.email_notifications
    
    # --- LOG: UPDATE PREFERENSI ---
    client_ip = request.client.host if request.client else "Unknown"
    user_agent = request.headers.get("user-agent", "Unknown")
    
    log = models.AuditLog(
        user_email=current_user.email,
        action="PREFERENCES_UPDATED",
        status="SUCCESS",
        ip_address=client_ip,
        browser_info=user_agent
    )
    db.add(log)
    db.commit()
    
    return {"message": "Preferences updated successfully", "email_notifications": current_user.email_notifications}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
    
@app.get("/api/audit-logs/export")
def export_audit_logs(
    current_user: models.User = Depends(get_current_admin), 
    db: Session = Depends(get_db)
):
    logs = db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).all()
    
    stream = io.StringIO()
    csv_writer = csv.writer(stream)
    
    # Menulis Header / Judul Kolom di Excel
    csv_writer.writerow(["ID", "Timestamp (UTC)", "User Email", "Action", "Status", "IP Address", "Browser Info"])
    
    # Menulis isi datanya
    for log in logs:
        # Mengubah format waktu agar rapi di Excel
        time_str = log.timestamp.strftime("%Y-%m-%d %H:%M:%S") if log.timestamp else "N/A"
        csv_writer.writerow([
            log.id, 
            time_str, 
            log.user_email or "System/Anonymous", 
            log.action, 
            log.status, 
            log.ip_address or "N/A", 
            log.browser_info or "N/A"
        ])
        
    stream.seek(0)
    
    response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=security_audit_report.csv"
    
    return response