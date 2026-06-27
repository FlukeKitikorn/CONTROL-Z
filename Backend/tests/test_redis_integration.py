"""Redis cache + session helpers (mock client — ไม่ต้องมี Redis จริง)."""

from __future__ import annotations

import json
from unittest.mock import MagicMock, patch

import pytest

from app.core import cache as cache_module
from app.core.cache import AppCache, invalidate_announcements_cache, invalidate_org_data_cache
from app.core.cache_keys import (
    announcements_public_key,
    annual_bundle_key,
    calc_latest_key,
    ef_ui_options_key,
    session_key,
)
from app.services.session_store import (
    SessionRecord,
    create_session,
    is_session_active,
    revoke_session,
)


@pytest.fixture(autouse=True)
def reset_cache_singleton() -> None:
    cache_module._cache = AppCache()
    yield
    cache_module._cache = AppCache()


def test_cache_keys_use_prefix() -> None:
    with patch("app.core.cache_keys.settings") as mock_settings:
        mock_settings.redis_key_prefix = "controlz"
        assert ef_ui_options_key(2, "stationary_combustion") == (
            "controlz:cache:ef:ui-options:2:stationary_combustion"
        )
        assert calc_latest_key(7) == "controlz:cache:calc:latest:7"
        assert annual_bundle_key(7) == "controlz:cache:bundle:latest:7"
        assert announcements_public_key() == "controlz:cache:announcements:public"
        assert session_key("abc") == "controlz:session:abc"


def test_app_cache_get_or_set_json() -> None:
    mock_redis = MagicMock()
    mock_redis.get.return_value = None
    factory = MagicMock(return_value={"ok": True})

    with (
        patch("app.core.cache.redis_available", return_value=True),
        patch("app.core.cache.get_redis", return_value=mock_redis),
        patch("app.core.cache.settings.redis_cache_enabled", True),
    ):
        cache = AppCache()
        value = cache.get_or_set_json("k", 60, factory)

    assert value == {"ok": True}
    factory.assert_called_once()
    mock_redis.setex.assert_called_once()
    args = mock_redis.setex.call_args[0]
    assert args[0] == "k"
    assert args[1] == 60
    assert json.loads(args[2]) == {"ok": True}


def test_invalidate_org_data_cache_deletes_both_keys() -> None:
    mock_redis = MagicMock()

    with (
        patch("app.core.cache.redis_available", return_value=True),
        patch("app.core.cache.get_redis", return_value=mock_redis),
        patch("app.core.cache.settings.redis_cache_enabled", True),
        patch("app.core.cache_keys.settings.redis_key_prefix", "controlz"),
    ):
        invalidate_org_data_cache(42)

    mock_redis.delete.assert_any_call("controlz:cache:calc:latest:42")
    mock_redis.delete.assert_any_call("controlz:cache:bundle:latest:42")
    assert mock_redis.delete.call_count == 2


def test_invalidate_announcements_cache() -> None:
    mock_redis = MagicMock()

    with (
        patch("app.core.cache.redis_available", return_value=True),
        patch("app.core.cache.get_redis", return_value=mock_redis),
        patch("app.core.cache.settings.redis_cache_enabled", True),
        patch("app.core.cache_keys.settings.redis_key_prefix", "controlz"),
    ):
        invalidate_announcements_cache()

    mock_redis.delete.assert_called_once_with("controlz:cache:announcements:public")


def test_session_store_create_and_revoke() -> None:
    mock_redis = MagicMock()
    pipe = MagicMock()
    mock_redis.pipeline.return_value = pipe

    with (
        patch("app.services.session_store.sessions_enabled", return_value=True),
        patch("app.services.session_store.get_redis", return_value=mock_redis),
        patch("app.services.session_store.settings.session_ttl_seconds", 3600),
        patch("app.core.cache_keys.settings.redis_key_prefix", "controlz"),
    ):
        sid = create_session(user_id=1, role="USER", organization_id=9, session_id="sess-1")
        assert sid == "sess-1"
        pipe.setex.assert_called_once()
        pipe.sadd.assert_called_once()
        pipe.expire.assert_called_once()
        pipe.execute.assert_called_once()

        revoke_session("sess-1", user_id=1)
        pipe.delete.assert_called()
        pipe.srem.assert_called()


def test_is_session_active_when_disabled() -> None:
    with patch("app.services.session_store.sessions_enabled", return_value=False):
        assert is_session_active("") is True


def test_session_record_roundtrip() -> None:
    rec = SessionRecord(user_id=1, role="ADMIN", organization_id=2, created_at="2026-01-01T00:00:00Z")
    restored = SessionRecord.from_dict(rec.to_dict())
    assert restored == rec
