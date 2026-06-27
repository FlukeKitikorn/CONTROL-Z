"""ประกาศและ audit log แบบไฟล์ภายใต้ Backend/runtime/ (ไม่ใช้ DB)."""

from __future__ import annotations

import json
import uuid
from pathlib import Path
from typing import Any

from filelock import FileLock

RUNTIME_DIR = Path(__file__).resolve().parent.parent.parent / "runtime"
ANNOUNCEMENTS_PATH = RUNTIME_DIR / "announcements.json"
AUDIT_PATH = RUNTIME_DIR / "admin_audit.jsonl"
STORE_LOCK = RUNTIME_DIR / ".announcements.lock"
AUDIT_LOCK = RUNTIME_DIR / ".audit.lock"


def _utc_now_iso() -> str:
    from datetime import datetime, timezone

    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _ensure_runtime() -> None:
    RUNTIME_DIR.mkdir(parents=True, exist_ok=True)


def _default_store() -> dict[str, Any]:
    return {"version": 1, "announcements": []}


def _load_store_unlocked() -> dict[str, Any]:
    if not ANNOUNCEMENTS_PATH.exists():
        return json.loads(json.dumps(_default_store()))
    try:
        with ANNOUNCEMENTS_PATH.open(encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, dict) and isinstance(data.get("announcements"), list):
            return data
    except (json.JSONDecodeError, OSError):
        pass
    return json.loads(json.dumps(_default_store()))


def _atomic_write_json(path: Path, payload: dict[str, Any]) -> None:
    _ensure_runtime()
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(path)


def append_audit(event: dict[str, Any]) -> None:
    _ensure_runtime()
    line = json.dumps(event, ensure_ascii=False) + "\n"
    with FileLock(str(AUDIT_LOCK), timeout=30):
        with AUDIT_PATH.open("a", encoding="utf-8") as f:
            f.write(line)


def list_announcements(*, active_only: bool = False) -> list[dict[str, Any]]:
    _ensure_runtime()
    with FileLock(str(STORE_LOCK), timeout=30):
        data = _load_store_unlocked()
    items = list(data.get("announcements") or [])
    if active_only:
        items = [x for x in items if x.get("active") is True]

    def sort_key(x: dict[str, Any]) -> tuple[int, str]:
        return (-int(x.get("priority") or 0), str(x.get("updated_at") or x.get("created_at") or ""))

    items.sort(key=sort_key)
    return items


def get_announcement(announcement_id: str) -> dict[str, Any] | None:
    for a in list_announcements(active_only=False):
        if str(a.get("id")) == announcement_id:
            return a
    return None


def create_announcement(
    *,
    title: str,
    body: str,
    active: bool,
    priority: int,
    created_by_email: str | None,
) -> dict[str, Any]:
    _ensure_runtime()
    now = _utc_now_iso()
    new_row: dict[str, Any] = {
        "id": str(uuid.uuid4()),
        "title": title,
        "body": body,
        "active": active,
        "priority": priority,
        "created_at": now,
        "updated_at": now,
        "created_by_email": created_by_email,
    }
    with FileLock(str(STORE_LOCK), timeout=30):
        data = _load_store_unlocked()
        ann = list(data.get("announcements") or [])
        ann.append(new_row)
        data["announcements"] = ann
        _atomic_write_json(ANNOUNCEMENTS_PATH, data)
    append_audit(
        {
            "ts": now,
            "action": "announcement.created",
            "actor_email": created_by_email,
            "resource": "announcement",
            "detail": {"id": new_row["id"], "title": title},
        }
    )
    return new_row


def update_announcement(
    announcement_id: str,
    *,
    title: str | None,
    body: str | None,
    active: bool | None,
    priority: int | None,
    actor_email: str | None,
) -> dict[str, Any] | None:
    _ensure_runtime()
    now = _utc_now_iso()
    with FileLock(str(STORE_LOCK), timeout=30):
        data = _load_store_unlocked()
        ann = list(data.get("announcements") or [])
        found: dict[str, Any] | None = None
        for i, row in enumerate(ann):
            if str(row.get("id")) == announcement_id:
                found = dict(row)
                if title is not None:
                    found["title"] = title
                if body is not None:
                    found["body"] = body
                if active is not None:
                    found["active"] = active
                if priority is not None:
                    found["priority"] = priority
                found["updated_at"] = now
                ann[i] = found
                break
        if found is None:
            return None
        data["announcements"] = ann
        _atomic_write_json(ANNOUNCEMENTS_PATH, data)
    append_audit(
        {
            "ts": now,
            "action": "announcement.updated",
            "actor_email": actor_email,
            "resource": "announcement",
            "detail": {"id": announcement_id},
        }
    )
    return found


def delete_announcement(announcement_id: str, *, actor_email: str | None) -> bool:
    _ensure_runtime()
    now = _utc_now_iso()
    title_gone = ""
    with FileLock(str(STORE_LOCK), timeout=30):
        data = _load_store_unlocked()
        ann = list(data.get("announcements") or [])
        new_ann: list[dict[str, Any]] = []
        hit = False
        for row in ann:
            if str(row.get("id")) == announcement_id:
                hit = True
                title_gone = str(row.get("title") or "")
                continue
            new_ann.append(row)
        if not hit:
            return False
        data["announcements"] = new_ann
        _atomic_write_json(ANNOUNCEMENTS_PATH, data)
    append_audit(
        {
            "ts": now,
            "action": "announcement.deleted",
            "actor_email": actor_email,
            "resource": "announcement",
            "detail": {"id": announcement_id, "title": title_gone},
        }
    )
    return True


def read_audit_entries(limit: int = 200) -> list[dict[str, Any]]:
    _ensure_runtime()
    if limit < 1:
        limit = 1
    if limit > 2000:
        limit = 2000
    if not AUDIT_PATH.exists():
        return []
    with FileLock(str(AUDIT_LOCK), timeout=30):
        text = AUDIT_PATH.read_text(encoding="utf-8")
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    tail = lines[-limit:]
    out: list[dict[str, Any]] = []
    for line in reversed(tail):
        try:
            out.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return out
