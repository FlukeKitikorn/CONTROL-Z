"""Redis key namespaces — ใช้ร่วมกันทั้ง cache และ session."""

from __future__ import annotations

from app.core.config import settings


def _prefix() -> str:
    return settings.redis_key_prefix.rstrip(":")


def session_key(session_id: str) -> str:
    return f"{_prefix()}:session:{session_id}"


def user_sessions_key(user_id: int) -> str:
    return f"{_prefix()}:user_sessions:{user_id}"


def ef_ui_options_key(scope_scid: int | None, ui_context: str | None) -> str:
    sc = scope_scid if scope_scid is not None else "all"
    ctx = (ui_context or "all").strip() or "all"
    return f"{_prefix()}:cache:ef:ui-options:{sc}:{ctx}"


def calc_latest_key(org_id: int) -> str:
    return f"{_prefix()}:cache:calc:latest:{org_id}"


def annual_bundle_key(org_id: int) -> str:
    return f"{_prefix()}:cache:bundle:latest:{org_id}"


def announcements_public_key() -> str:
    return f"{_prefix()}:cache:announcements:public"


def org_cache_pattern(org_id: int) -> str:
    return f"{_prefix()}:cache:*:{org_id}*"


def ef_cache_pattern() -> str:
    return f"{_prefix()}:cache:ef:*"
