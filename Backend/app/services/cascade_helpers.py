"""ลบข้อมูลแบบ cascade ตาม FK ของสคีมา MySQL"""

from sqlmodel import Session, select

from app.models import (
    Category,
    CategoryAnswer,
    CollectInformation,
    DetailsScope,
    EditForm,
    FormDetail,
    Fr041Detail,
    GhgtForm,
    OrganizationInformation,
    PointsConsider,
    SubjectScope,
)


def delete_subject_scope_tree(session: Session, subid: int) -> None:
    for fr in list(session.exec(select(Fr041Detail).where(Fr041Detail.subid == subid)).all()):
        session.delete(fr)
    for d in list(session.exec(select(DetailsScope).where(DetailsScope.subid == subid)).all()):
        session.delete(d)
    sub = session.get(SubjectScope, subid)
    if sub:
        session.delete(sub)


def delete_form_cascade(session: Session, fid: int) -> None:
    subs = list(session.exec(select(SubjectScope).where(SubjectScope.fid == fid)).all())
    for sub in subs:
        if sub.subid is not None:
            delete_subject_scope_tree(session, sub.subid)
    cats = list(session.exec(select(Category).where(Category.fid == fid)).all())
    for cat in cats:
        for ans in list(session.exec(select(CategoryAnswer).where(CategoryAnswer.cid == cat.cid)).all()):
            session.delete(ans)
        session.delete(cat)
    for pc in list(session.exec(select(PointsConsider).where(PointsConsider.fid == fid)).all()):
        session.delete(pc)
    for fd in list(session.exec(select(FormDetail).where(FormDetail.fid == fid)).all()):
        session.delete(fd)
    for ef in list(session.exec(select(EditForm).where(EditForm.fid == fid)).all()):
        session.delete(ef)
    form = session.get(GhgtForm, fid)
    if form:
        session.delete(form)


def delete_organization_cascade(session: Session, organization_id: int) -> None:
    forms = list(session.exec(select(GhgtForm).where(GhgtForm.organization_id == organization_id)).all())
    for f in forms:
        if f.fid is not None:
            delete_form_cascade(session, f.fid)
    for ci in list(
        session.exec(select(CollectInformation).where(CollectInformation.organization_id == organization_id)).all()
    ):
        session.delete(ci)
    for oi in list(
        session.exec(
            select(OrganizationInformation).where(OrganizationInformation.organization_id == organization_id)
        ).all()
    ):
        session.delete(oi)
