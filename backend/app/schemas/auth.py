"""
backend/app/schemas/auth.py — P1

Request/response shapes for login & register. Passwords never appear in
any *Read schema — only hashed server-side, never echoed back.
"""

from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str
    aadhaar_ref: str | None = None  # masked reference only — never a raw Aadhaar number


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserRead(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead
