"""ทดสอบ image storage — optimize + path naming."""

from __future__ import annotations

import io

import pytest
from PIL import Image

from app.core.config import settings
from app.services.image_storage import (
    ImageAssetKind,
    build_filename,
    optimize_image_bytes,
    public_url,
    relative_storage_dir,
    store_image,
    upload_root,
)


def _png_bytes(w: int = 800, h: int = 600) -> bytes:
    img = Image.new("RGB", (w, h), color=(40, 120, 200))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_relative_storage_dir_avatar() -> None:
    p = relative_storage_dir(org_id=3, user_id=9, kind=ImageAssetKind.AVATAR)
    assert p.as_posix() == "orgs/3/users/9/avatar"


def test_relative_storage_dir_logo() -> None:
    p = relative_storage_dir(org_id=3, user_id=None, kind=ImageAssetKind.LOGO)
    assert p.as_posix() == "orgs/3/assets/logo"


def test_build_filename_pattern() -> None:
    name = build_filename(kind=ImageAssetKind.AVATAR, owner_id=42)
    assert name.startswith("avatar_42_")
    assert name.endswith(".webp")


def test_public_url() -> None:
    assert public_url("orgs/1/users/2/avatar/x.webp") == "/uploads/orgs/1/users/2/avatar/x.webp"


def test_optimize_reduces_large_png() -> None:
    raw = _png_bytes(3000, 2000)
    out = optimize_image_bytes(raw, kind=ImageAssetKind.AVATAR)
    assert len(out) < len(raw)
    with Image.open(io.BytesIO(out)) as img:
        assert max(img.size) <= 1024


def test_upload_root_under_repo_storage(monkeypatch) -> None:
    from app.services.image_storage import repo_root, upload_root

    monkeypatch.setattr(settings, "upload_root", "storage/uploads")
    root = upload_root()
    assert root == repo_root() / "storage" / "uploads"
    assert root.parent.name == "storage"


def test_store_image_writes_webp(tmp_path, monkeypatch) -> None:
    monkeypatch.setattr("app.services.image_storage.upload_root", lambda: tmp_path)
    url = store_image(
        _png_bytes(400, 400),
        org_id=1,
        user_id=5,
        kind=ImageAssetKind.AVATAR,
        owner_id=5,
    )
    assert url.startswith("/uploads/orgs/1/users/5/avatar/")
    rel = url.removeprefix("/uploads/")
    assert (tmp_path / rel).is_file()
    assert (tmp_path / rel).stat().st_size > 0
