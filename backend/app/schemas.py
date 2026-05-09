from pydantic import BaseModel, Field

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

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str