from loguru import logger

from fastapi_mail import FastMail, MessageSchema, MessageType

from app.core.config import settings
from app.core.mail import get_mail_config

_TEMPLATE_NAME = "mail/password_reset.html"


async def send_password_reset_email(*, to: str, reset_link: str, expire_minutes: int) -> None:
    if not settings.mail_enabled:
        logger.info("MAIL_DISABLED password reset link for {}: {}", to, reset_link)
        return

    message = MessageSchema(
        subject="รีเซ็ตรหัสผ่าน CONTROL-Z",
        recipients=[to],
        template_body={
            "app_name": settings.mail_from_name,
            "reset_link": reset_link,
            "link_expiry_min": expire_minutes,
        },
        subtype=MessageType.html,
    )
    fm = FastMail(get_mail_config())
    await fm.send_message(message, template_name=_TEMPLATE_NAME)
    logger.info("Password reset email sent to {}", to)
