from typing import Optional, Union
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import models
from app.database.database import SessionLocal
from jose import JWTError, jwt
from datetime import datetime, timedelta
from passlib.context import CryptContext
from app.core.config import settings

# 🛡️ Gunakan URL yang sama dengan endpoint login di main.py
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- JWT Configuration ---
# 🛡️ PENTING: Gunakan key ini agar sinkron dengan proses pembuatan token
SECRET_KEY = "pma_granulator_secure_secret_key_2026"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

# 👇 INI FUNGSI YANG SUDAH KITA UPDATE 👇
def create_access_token(data: dict, expires_delta: Optional[Union[timedelta, int]] = None):
    to_encode = data.copy()
    
    if expires_delta:
        if isinstance(expires_delta, int):
            expire = datetime.utcnow() + timedelta(minutes=expires_delta)
        else:
            expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
    to_encode.update({"exp": expire})
    
    # Menghasilkan token JWT
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# 👇 FUNGSI INI TELAH DIPERBAIKI AGAR SESUAI DENGAN PAYLOAD LOGIN 👇
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Mendekode token untuk mengambil identitas user
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # 🛡️ FIX: Mengambil 'user_id' karena login route mengirimkan 'user_id', bukan 'sub'
        token_user_id = payload.get("user_id")
        
        if token_user_id is None:
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception
        
    # Mencari user di MariaDB berdasarkan ID (Lebih cepat daripada mencari via string email)
    user = db.query(models.User).filter(models.User.id == token_user_id).first()
    
    if user is None:
        raise credentials_exception
        
    return user

def create_reset_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({
        "exp": expire, 
        "scope": "password_reset" 
    })
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt