from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db, models
from app.core.security import create_password_reset_token
from app.utils.email import send_reset_email
from app.schemas import ForgotPasswordRequest

router = APIRouter()

@router.post("/forgot-password")
async def request_password_reset(
    request: ForgotPasswordRequest, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    # 1. Look for the user in your MariaDB/PostgreSQL DB
    user = db.query(models.User).filter(models.User.email == request.email).first()
    
    # 2. If user exists, prepare the email
    if user:
        token = create_password_reset_token(email=user.email)
        
        # Using BackgroundTasks keeps the API response fast for the user
        background_tasks.add_task(send_reset_email, user.email, token)
        
    # 3. Always return success to prevent email fishing
    return {"message": "If an account exists for this email, a reset link has been sent."}