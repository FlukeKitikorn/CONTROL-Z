from pathlib import Path

from fastapi_mail import ConnectionConfig

from app.core.config import settings

_TEMPLATES_DIR = Path(__file__).resolve().parent.parent / "templates"


def get_mail_config() -> ConnectionConfig:
    mail_from = settings.mail_from or settings.mail_username
    return ConnectionConfig(
        MAIL_USERNAME=settings.mail_username,
        MAIL_PASSWORD=settings.mail_password,
        MAIL_FROM=mail_from,
        MAIL_FROM_NAME=settings.mail_from_name,
        MAIL_PORT=settings.mail_port,
        MAIL_SERVER=settings.mail_server,
        MAIL_STARTTLS=settings.mail_starttls,
        MAIL_SSL_TLS=settings.mail_ssl_tls,
        USE_CREDENTIALS=True,
        VALIDATE_CERTS=True,
        TEMPLATE_FOLDER=_TEMPLATES_DIR,
    )
