from fastapi import APIRouter

from app.schemas.rest import AnnouncementRead
from app.services import runtime_announcements as ann_store

router = APIRouter(prefix="/announcements", tags=["announcements"])


@router.get("", response_model=list[AnnouncementRead])
def list_public_announcements() -> list[AnnouncementRead]:
    rows = ann_store.list_announcements(active_only=True)
    return [AnnouncementRead.model_validate(r) for r in rows]
