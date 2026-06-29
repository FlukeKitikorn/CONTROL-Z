"""บันทึกรูปลง storage/uploads — ปรับขนาด + WebP คุณภาพสูง (แสดงบนเว็บชัดเท่าเดิม)."""

from __future__ import annotations

import io
import logging
import secrets
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path

from fastapi import HTTPException, status
from PIL import Image, ImageOps, UnidentifiedImageError

from app.core.config import settings

logger = logging.getLogger(__name__)

UPLOAD_URL_PREFIX = "/uploads"


class ImageAssetKind(str, Enum):
    AVATAR = "avatar"
    LOGO = "logo"
    MAP = "map"
    STRUCTURE = "structure"
    IMAGE = "image"


def repo_root() -> Path:
    """Root โปรเจกต์ CONTROL-Z (โฟลเดอร์ที่มี Backend/, Frontend/, storage/)."""
    return Path(__file__).resolve().parents[3]


def upload_root() -> Path:
    root = Path(settings.upload_root)
    if not root.is_absolute():
        root = repo_root() / root
    root.mkdir(parents=True, exist_ok=True)
    return root


def legacy_upload_root() -> Path:
    """ไฟล์เก่าที่บันทึกใต้ Backend/uploads (mount /static)."""
    return Path(__file__).resolve().parent.parent.parent / "uploads"


def relative_storage_dir(*, org_id: int, user_id: int | None, kind: ImageAssetKind) -> Path:
    if kind == ImageAssetKind.AVATAR:
        if user_id is None:
            raise ValueError("user_id required for avatar")
        return Path("orgs") / str(org_id) / "users" / str(user_id) / "avatar"
    return Path("orgs") / str(org_id) / "assets" / kind.value


def build_filename(*, kind: ImageAssetKind, owner_id: int) -> str:
    ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    token = secrets.token_hex(4)
    return f"{kind.value}_{owner_id}_{ts}_{token}.webp"


def public_url(relative_path: str | Path) -> str:
    rel = str(relative_path).replace("\\", "/").lstrip("/")
    return f"{UPLOAD_URL_PREFIX}/{rel}"


def resolve_disk_path(url_or_rel: str | None) -> Path | None:
    if not url_or_rel or not url_or_rel.strip():
        return None
    raw = url_or_rel.strip()
    for prefix in (UPLOAD_URL_PREFIX, "/static"):
        if raw.startswith(prefix):
            raw = raw[len(prefix) :].lstrip("/")
            break
    candidate = upload_root() / raw
    if candidate.is_file():
        return candidate
    legacy = legacy_upload_root() / raw
    if legacy.is_file():
        return legacy
    return None


def delete_stored_file(url_or_rel: str | None) -> None:
    path = resolve_disk_path(url_or_rel)
    if path is None:
        return
    try:
        path.unlink(missing_ok=True)
    except OSError as exc:
        logger.warning("delete image failed path=%s (%s)", path, exc)


def _max_edge_for(kind: ImageAssetKind) -> int:
    if kind == ImageAssetKind.AVATAR:
        return settings.image_avatar_max_edge
    if kind == ImageAssetKind.LOGO:
        return settings.image_logo_max_edge
    return settings.image_org_asset_max_edge


def optimize_image_bytes(content: bytes, *, kind: ImageAssetKind) -> bytes:
    if len(content) > settings.upload_max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"ไฟล์ใหญ่เกิน {settings.upload_max_bytes // (1024 * 1024)}MB",
        )
    try:
        with Image.open(io.BytesIO(content)) as img:
            img = ImageOps.exif_transpose(img)
            if img.mode not in ("RGB", "RGBA"):
                img = img.convert("RGBA" if "A" in img.getbands() else "RGB")
            max_edge = _max_edge_for(kind)
            w, h = img.size
            if max(w, h) > max_edge:
                scale = max_edge / float(max(w, h))
                img = img.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.Resampling.LANCZOS)
            out = io.BytesIO()
            save_kwargs: dict = {
                "format": "WEBP",
                "quality": settings.image_webp_quality,
                "method": 6,
            }
            if img.mode == "RGBA":
                save_kwargs["lossless"] = False
            img.save(out, **save_kwargs)
            return out.getvalue()
    except UnidentifiedImageError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ไฟล์ไม่ใช่รูปภาพที่รองรับ (PNG, JPEG, WEBP, GIF)",
        ) from exc
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("image optimize failed")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ประมวลผลรูปภาพไม่สำเร็จ",
        ) from exc


def store_image(
    content: bytes,
    *,
    org_id: int,
    user_id: int | None,
    kind: ImageAssetKind,
    owner_id: int,
) -> str:
    """บันทึกรูปที่ optimize แล้ว — คืน public URL (/uploads/...)."""
    optimized = optimize_image_bytes(content, kind=kind)
    rel_dir = relative_storage_dir(org_id=org_id, user_id=user_id, kind=kind)
    filename = build_filename(kind=kind, owner_id=owner_id)
    dest_dir = upload_root() / rel_dir
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / filename
    dest.write_bytes(optimized)
    return public_url(rel_dir / filename)
