"""Application cache layer — Redis-backed with no-op fallback."""

from __future__ import annotations

import json
import logging
from collections.abc import Callable
from typing import Any, TypeVar

from app.core.config import settings
from app.core.redis import get_redis, redis_available

logger = logging.getLogger(__name__)

T = TypeVar("T")


class AppCache:
    def __init__(self) -> None:
        self._misses = 0
        self._hits = 0

    @property
    def enabled(self) -> bool:
        return settings.redis_cache_enabled and redis_available()

    def get_json(self, key: str) -> Any | None:
        if not self.enabled:
            return None
        client = get_redis()
        if client is None:
            return None
        try:
            raw = client.get(key)
            if raw is None:
                return None
            self._hits += 1
            return json.loads(raw)
        except Exception as exc:
            logger.debug("cache get failed key=%s (%s)", key, exc)
            return None

    def set_json(self, key: str, value: Any, ttl_seconds: int | None = None) -> None:
        if not self.enabled:
            return
        client = get_redis()
        if client is None:
            return
        ttl = ttl_seconds if ttl_seconds is not None else settings.redis_cache_default_ttl_seconds
        try:
            client.setex(key, ttl, json.dumps(value, default=str))
        except Exception as exc:
            logger.debug("cache set failed key=%s (%s)", key, exc)

    def delete(self, *keys: str) -> int:
        if not self.enabled or not keys:
            return 0
        client = get_redis()
        if client is None:
            return 0
        try:
            return int(client.delete(*keys))
        except Exception as exc:
            logger.debug("cache delete failed (%s)", exc)
            return 0

    def delete_by_pattern(self, pattern: str) -> int:
        if not self.enabled:
            return 0
        client = get_redis()
        if client is None:
            return 0
        deleted = 0
        try:
            for key in client.scan_iter(match=pattern, count=200):
                deleted += int(client.delete(key))
        except Exception as exc:
            logger.debug("cache delete pattern=%s failed (%s)", pattern, exc)
        return deleted

    def get_or_set_json(
        self,
        key: str,
        ttl_seconds: int,
        factory: Callable[[], T],
    ) -> T:
        cached = self.get_json(key)
        if cached is not None:
            return cached  # type: ignore[return-value]
        self._misses += 1
        value = factory()
        self.set_json(key, value, ttl_seconds)
        return value


_cache = AppCache()


def get_cache() -> AppCache:
    return _cache


def invalidate_org_calculation_cache(org_id: int) -> None:
    from app.core.cache_keys import calc_latest_key

    get_cache().delete(calc_latest_key(org_id))


def invalidate_org_bundle_cache(org_id: int) -> None:
    from app.core.cache_keys import annual_bundle_key

    get_cache().delete(annual_bundle_key(org_id))


def invalidate_org_data_cache(org_id: int) -> None:
    """ล้าง cache ที่ผูก org (ผลคำนวณ + bundle กรอกข้อมูล)"""
    invalidate_org_calculation_cache(org_id)
    invalidate_org_bundle_cache(org_id)


def invalidate_announcements_cache() -> None:
    from app.core.cache_keys import announcements_public_key

    get_cache().delete(announcements_public_key())


def invalidate_ef_reference_cache() -> None:
    from app.core.cache_keys import ef_cache_pattern

    get_cache().delete_by_pattern(ef_cache_pattern())
