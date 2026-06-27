from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    """รับอีเมลหรือ uname — ตรวจทั้ง user_privileges.uname และ users.email"""

    email: str = Field(min_length=1, max_length=50, description="อีเมลหรือชื่อผู้ใช้ล็อกอิน")
    password: str = Field(min_length=1, max_length=255)


class RegisterRequest(BaseModel):
    """ลงทะเบียนแบบย่อ — กรอกข้อมูลส่วนตัว/องค์กรหลังล็อกอินที่หน้าตั้งค่า"""

    email: EmailStr = Field(max_length=50)
    password: str = Field(min_length=8, max_length=128)


class RegisterOkResponse(BaseModel):
    message: str


class UserPublic(BaseModel):
    """รูปแบบโปรไฟล์ให้สอดคล้อง Frontend UserProfile + user_id"""

    user_id: int
    fname: str
    lname: str
    prefix: str | None = None
    email: str
    username: str
    role: Literal["USER", "ADMIN"]
    organization_id: int
    address: str | None = None
    subdistrict: str | None = None
    district: str | None = None
    province: str | None = None
    postal_code: str | None = None
    phone: str | None = None
    imageprofile: str | None = None

    model_config = {"populate_by_name": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserPublic
    session_id: str | None = Field(
        default=None,
        description="มีเมื่อเปิด REDIS_SESSIONS_ENABLED — ใช้ revoke/logout ฝั่ง server",
    )


class SessionStatusResponse(BaseModel):
    authenticated: bool
    user: UserPublic | None = None
    sessions_server_side: bool = False


class ForgotPasswordRequest(BaseModel):
    email: EmailStr = Field(max_length=50)


class ForgotPasswordResponse(BaseModel):
    message: str


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=1)
    new_password: str = Field(min_length=8, max_length=128)
    confirm_password: str = Field(min_length=8, max_length=128)


class ResetPasswordResponse(BaseModel):
    message: str
