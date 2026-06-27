from fastapi import APIRouter

from app.core.cache import get_cache
from app.core.cache_keys import announcements_public_key
from app.core.config import settings
from app.schemas.rest import AnnouncementRead
from app.services import runtime_announcements as ann_store

router = APIRouter(prefix="/announcements", tags=["announcements"])


@router.get("", response_model=list[AnnouncementRead])
def list_public_announcements() -> list[AnnouncementRead]:
    cache = get_cache()
    key = announcements_public_key()

    def load_rows() -> list[dict]:
        return ann_store.list_announcements(active_only=True)

    if cache.enabled:
        rows = cache.get_or_set_json(key, settings.redis_cache_announcements_ttl_seconds, load_rows)
    else:
        rows = load_rows()
    return [AnnouncementRead.model_validate(r) for r in rows]
