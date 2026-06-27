"""คำสั่งสำหรับ ops — แสดงในแอป admin ให้คัดลอกไปรันบนเซิร์ฟเวอร์ (SSH)."""

from __future__ import annotations

from typing import Any


def monitor_commands() -> list[dict[str, Any]]:
    return [
        {
            "title": "ดูสถานะ Docker Compose",
            "description": "บริการ API / DB รันผ่าน compose หรือไม่",
            "command": "cd /path/to/CONTROL-Z && docker compose ps",
        },
        {
            "title": "ดู log API แบบติดตาม (ล่าสุด)",
            "description": "แทนชื่อคอนเทนเนอร์ตามจริง เช่น control-z-api-1",
            "command": "docker logs -f --tail 200 control-z-api-1",
        },
        {
            "title": "ทรัพยากรระบบแบบย่อ",
            "description": "CPU / RAM / disk — ใช้ตรวจว่าเครื่องแน่นหรือไม่",
            "command": "uptime && free -h && df -h",
        },
        {
            "title": "พอร์ตที่เปิดฟัง (API / MySQL)",
            "description": "ตรวจว่า 8000 / 3306 ถูก bind หรือไม่",
            "command": "ss -tulpn | grep -E ':8000|:3306' || true",
        },
        {
            "title": "เชื่อมต่อ MySQL จากเครื่องแอป (ตัวอย่าง)",
            "description": "ปรับ host/user/db ให้ตรงสภาพแวดล้อม",
            "command": "mysql -h 127.0.0.1 -u control_z -p control_z -e 'SELECT 1;'",
        },
        {
            "title": "ประกาศและ audit (ไฟล์ runtime)",
            "description": "ดูไฟล์ที่แอปเขียนเมื่อมีการประกาศจากผู้ดูแล",
            "command": "tail -n 50 Backend/runtime/admin_audit.jsonl && cat Backend/runtime/announcements.json | head",
        },
    ]
