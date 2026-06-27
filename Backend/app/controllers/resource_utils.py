from fastapi import HTTPException
from sqlmodel import Session

from app.models import GhgtForm


def get_form_in_org(session: Session, org_id: int, fid: int) -> GhgtForm:
    f = session.get(GhgtForm, fid)
    if f is None or f.organization_id != org_id:
        raise HTTPException(status_code=404, detail="ไม่พบฟอร์ม")
    return f
