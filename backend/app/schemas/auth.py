from pydantic import BaseModel, EmailStr, Field, ConfigDict
from uuid import UUID
from typing import Optional
from datetime import date


class LoginRequest(BaseModel):
    """Schema for login request"""
    email: EmailStr = Field(..., description="User email")
    password: str = Field(..., min_length=8, description="User password")


class RefreshRequest(BaseModel):
    """Schema for token refresh request"""
    refresh_token: str = Field(..., description="Refresh token")


class UserResponse(BaseModel):
    """Schema for user response"""
    id: UUID
    email: str
    full_name: str
    role: str = "user"
    is_initial_admin: bool = False
    phone: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    youth_protection_expiration: Optional[date] = None

    model_config = ConfigDict(from_attributes=True)


class UserContactUpdate(BaseModel):
    """Schema for updating user contact information"""
    phone: Optional[str] = Field(None, max_length=50, description="User phone number")
    emergency_contact_name: Optional[str] = Field(None, max_length=255, description="Emergency contact name")
    emergency_contact_phone: Optional[str] = Field(None, max_length=50, description="Emergency contact phone")
    youth_protection_expiration: Optional[date] = Field(None, description="Youth protection expiration date")


class TokenResponse(BaseModel):
    """Schema for token response"""
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field("bearer", description="Token type")
    user: UserResponse = Field(..., description="User information")