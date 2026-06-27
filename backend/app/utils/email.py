from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from urllib.parse import urlencode

from app.core.config import settings

conf = ConnectionConfig(
    MAIL_USERNAME = settings.MAIL_USERNAME,
    MAIL_PASSWORD = settings.MAIL_PASSWORD,
    MAIL_FROM = settings.MAIL_USERNAME,
    MAIL_PORT = 587,
    MAIL_SERVER = "smtp.gmail.com",
    MAIL_STARTTLS = True,
    MAIL_SSL_TLS = False,
    USE_CREDENTIALS = True
)

async def send_reset_email(email_to: str, token: str):
    reset_url = (
        f"{str(settings.FRONTEND_BASE_URL).rstrip('/')}/reset-password?"
        f"{urlencode({'token': token})}"
    )
    
    message = MessageSchema(
        subject="SPMS Password Reset Request",
        recipients=[email_to],
        body=f"""
        <p>You requested a password reset for your SPMS account.</p>
        <p>Click the link below to set a new password. This link expires in 15 minutes:</p>
        <a href="{reset_url}">{reset_url}</a>
        <p>If you did not request this, please ignore this email.</p>
        """,
        subtype="html"
    )

    fm = FastMail(conf)
    await fm.send_message(message)
