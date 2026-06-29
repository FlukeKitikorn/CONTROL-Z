from functools import cached_property

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "CONTROL-Z API"
    debug: bool = False
    database_url: str = "mysql+pymysql://user:mysql%40%231234@127.0.0.1:3306/control_z"

    jwt_secret_key: str = "change-me-in-production-use-long-random-string"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    password_reset_secret_key: str = "change-me-reset-secret-use-long-random-string"
    password_reset_expire_minutes: int = 10
    frontend_base_url: str = "http://localhost:5173"

    mail_enabled: bool = False
    mail_server: str = "smtp.gmail.com"
    mail_port: int = 587
    mail_starttls: bool = True
    mail_ssl_tls: bool = False
    mail_username: str = ""
    mail_password: str = ""
    mail_from: str = ""
    mail_from_name: str = "CONTROL-Z"

    # Redis — ว่าง = ไม่ใช้ Redis (พฤติกรรมเดิมทั้งหมด)
    redis_url: str = ""
    redis_key_prefix: str = "controlz"
    redis_socket_timeout_seconds: float = 2.0
    redis_cache_enabled: bool = True
    redis_cache_default_ttl_seconds: int = 300
    redis_cache_ef_ttl_seconds: int = 3600
    redis_cache_calc_latest_ttl_seconds: int = 120
    redis_cache_announcements_ttl_seconds: int = 60
    redis_cache_bundle_ttl_seconds: int = 120

    # Server-side sessions (ต้องมี REDIS_URL) — ใช้คู่ JWT claim jti
    redis_sessions_enabled: bool = False
    session_ttl_seconds: int = 60 * 60 * 24
    session_cookie_name: str = "controlz_session"
    session_cookie_secure: bool = False
    session_cookie_samesite: str = "lax"

    # ไฟล์อัปโหลด — {repo}/storage/uploads (Docker: UPLOAD_ROOT=/app/storage/uploads)
    upload_root: str = "storage/uploads"
    upload_max_bytes: int = 15 * 1024 * 1024
    image_webp_quality: int = 92
    image_avatar_max_edge: int = 1024
    image_logo_max_edge: int = 1200
    image_org_asset_max_edge: int = 2048

    @cached_property
    def redis_configured(self) -> bool:
        return bool(self.redis_url.strip())

    @cached_property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
