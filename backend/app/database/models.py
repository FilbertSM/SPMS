from sqlalchemy import Column, Integer, String, Boolean
from app.database.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    full_name = Column(String(255), nullable=False)
    
    # Login via email only
    email = Column(String(255), unique=True, index=True, nullable=False)
    
    # NEVER store raw passwords. This will hold the bcrypt hash.
    hashed_password = Column(String(255), nullable=False)
    
    # Useful for an enterprise system (e.g., "admin" vs "technician")
    role = Column(String(50), default="technician")
    
    # Allows you to disable an account without deleting their audit logs
    is_active = Column(Boolean, default=True)