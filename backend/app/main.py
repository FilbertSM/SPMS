from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app import models, schemas, database
from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core import security
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager # Fixes line 18
from app.core.security import create_reset_token # Fixes line 150
from app.utils.email import send_reset_email # Fixes line 151
from pydantic import BaseModel
from jose import jwt
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from fastapi.security import OAuth2PasswordBearer
from app.core.security import SECRET_KEY, ALGORITHM
from jose import JWTError, jwt
from sqlalchemy import text
from datetime import datetime, timezone
from typing import Optional
from fastapi import Query

# NEW: Import your database engine and models.
# (If you put these inside your 'app' folder, change this to: from app.database import engine, models)
from app.database.database import engine, SessionLocal

# 2. Look in the 'app' folder -> 'database' folder, and import the 'models.py' file
from app.database import models

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
    # This code runs ON STARTUP
    print("Starting up SPMS Backend...")
    # If you had code in on_startup, put it here
    
    yield
    
    # This code runs ON SHUTDOWN
    print("Shutting down SPMS Backend...")

def get_application() -> FastAPI:
    # Tell SQLAlchemy to build the tables in MariaDB before starting the app.
    models.Base.metadata.create_all(bind=engine)

    _app = FastAPI(
        title=settings.PROJECT_NAME,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        description="Secure Predictive Maintenance System API",
        version="1.0.0"
    )

    # 1. Define the exact URLs of your frontend
    origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    # 2. Attach the middleware directly using YOUR origins list (Removed the 'if' statement)
    _app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,  # <--- Changed to use your 'origins' variable directly
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

# Entry point for local debugging (Uvicorn)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)


@app.post("/api/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # 1. Check for existing email
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Email already registered"
        )
    
    print(f"--- DEBUG: Password length is {len(user.password)} characters ---")
    print(f"--- DEBUG: Password value is: {user.password} ---")
    
    # 2. Hash password
    hashed_pw = security.get_password_hash(user.password)
    
    # 3. Create the new user object (Now including full_name)
    new_user = models.User(
        full_name=user.full_name,  # NEW
        email=user.email,
        hashed_password=hashed_pw
    )
    
    # 4. Save to MariaDB
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


@app.post("/api/login", response_model=schemas.Token)
def login(user_credentials: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    
    # 1. Find the user by email
    # Note: OAuth2 form uses 'username' by default, but React will pass the email into this field
    user = db.query(models.User).filter(models.User.email == user_credentials.username).first()
    
    # 2. Check if user exists AND password is correct
    if not user or not security.verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid Credentials",
            headers={"WWW-Authenticate": "Bearer"}
        )
        
    # 3. Create the JWT Token containing the user's ID and Role
    access_token = security.create_access_token(
        data={"user_id": user.id, "role": user.role}
    )
    
    # 4. Return the token to React
    return {"access_token": access_token, "token_type": "bearer"}

class EmailSchema(BaseModel):
    email: str

    

@app.post("/forgot-password")
async def forgot_password(request: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    
    if user:
        reset_token = security.create_reset_token(data={"sub": user.email})
        
        # Build the reset link pointing to your React page
        reset_link = f"http://localhost:5173/reset-password?token={reset_token}"
        
        # Create the email content
        message = MessageSchema(
            subject="SPMS - Password Reset Request",
            recipients=[user.email],
            body=f"""
            <h3>Reset Your SPMS Password</h3>
            <p>You requested a password reset for your account.</p>
            <p>Click the link below to set a new password. This link expires in 15 minutes.</p>
            <a href="{reset_link}">{reset_link}</a>
            """,
            subtype=MessageType.html
        )

        fm = FastMail(conf)
        await fm.send_message(message)
        
    return {"message": "If this email is registered, a reset link has been sent."}


class ResetPassword(BaseModel):
    token: str
    new_password: str

@app.post("/api/reset-password")
def reset_password(data: schemas.ResetPassword, db: Session = Depends(get_db)):
    try:
        # 1. Decode and verify the token
        payload = jwt.decode(data.token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        email: str = payload.get("sub")
        scope: str = payload.get("scope")
        
        # 2. Safety check: ensure this isn't a login token!
        if scope != "password_reset":
            raise HTTPException(status_code=401, detail="Invalid token scope")
            
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Token expired or invalid")

    # 3. Find the user
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 4. Hash the new password and save
    user.hashed_password = security.get_password_hash(data.new_password)
    db.commit()

    return {"message": "Password updated successfully. You can now login."}

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"--- DEBUG PAYLOAD: {payload} ---")
        
        # STEP 1: Extract the correct key
        token_user_id = payload.get("user_id")
        print(f"--- DEBUG STEP 1: Extracted ID: {token_user_id} ---")
        
        # If user_id wasn't in the token, fail here
        if token_user_id is None:
            print("--- FAILED: No 'user_id' found in token ---")
            raise credentials_exception
            
    except JWTError as e:
        print(f"--- FAILED: JWT Decode Error: {e} ---")
        raise credentials_exception
        
    # STEP 2: Query the database using the integer ID
    user = db.query(models.User).filter(models.User.id == token_user_id).first()
    
    # If the user was deleted from the database but the token is still active, fail here
    if user is None:
        print(f"--- FAILED: User ID {token_user_id} not found in database ---")
        raise credentials_exception
        
    print(f"--- SUCCESS: Authorized User: {user.email} ---")
    return user

# Make sure this route exists so React has somewhere to go!
@app.get("/api/users/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.patch("/api/users/me/preferences")
def update_user_preferences(
    preferences: schemas.UserPreferencesUpdate, 
    current_user: models.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    # Update the user's row in the database
    current_user.email_notifications = preferences.email_notifications
    db.commit()
    
    return {"message": "Preferences updated successfully", "email_notifications": current_user.email_notifications}

@app.get("/api/pma/getPMAData")
def get_pma_telemetry(
    start: Optional[str] = None, 
    end: Optional[str] = None, 
    # Change to Optional and default to None
    limit: Optional[int] = None, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(security.get_current_user)
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

    # Date handling
    if start and end:
        try:
            start_dt = datetime.strptime(start, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            end_dt = datetime.strptime(end, "%Y-%m-%d").replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
            
            params["start_unix"] = start_dt.timestamp()
            params["end_unix"] = end_dt.timestamp()
            
            query_str += " AND `time@timestamp` >= :start_unix AND `time@timestamp` <= :end_unix"
        except ValueError:
            pass

    # Sort Logic
    if start and end:
        query_str += " ORDER BY `time@timestamp` ASC"
    else:
        query_str += " ORDER BY `time@timestamp` DESC"

    # Only apply the LIMIT clause if a limit was actually provided
    if limit is not None:
        query_str += " LIMIT :limit"
        params["limit"] = limit
    elif not start and not end:
        # Safety net: If they don't provide dates AND don't provide a limit, 
        # force a limit so we don't accidentally crash the server loading 5 years of data
        query_str += " LIMIT 1000"

    query = text(query_str)
    results = db.execute(query, params).fetchall()
    
    data = [dict(row._mapping) for row in results]
    
    # Reverse if it was a default descending load
    if not start and not end:
        return data[::-1]
        
    return data

@app.get("/api/motor/telemetry")
def get_motor_telemetry(
    start: Optional[str] = None, 
    end: Optional[str] = None, 
    limit: Optional[int] = None, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(security.get_current_user)
):
    # Perform the division directly in SQL and map the exact keys!
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

    results = db.execute(text(query_str), params).fetchall()
    data = [dict(row._mapping) for row in results]
    
    if not start and not end:
        return data[::-1]
    return data