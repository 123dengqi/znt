from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import CaseItem, User
from ..schemas import CaseIn, CaseOut
from ..security import get_current_user, require_teacher

router = APIRouter(prefix="/api/cases", tags=["cases"])


@router.get("", response_model=list[CaseOut])
def list_cases(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(CaseItem).order_by(CaseItem.created_at.desc()).all()


@router.post("", response_model=CaseOut)
def create_case(body: CaseIn, db: Session = Depends(get_db), user: User = Depends(require_teacher)):
    c = CaseItem(title=body.title, description=body.description, tags=body.tags, created_by=user.id)
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@router.delete("/{case_id}")
def delete_case(case_id: int, db: Session = Depends(get_db), user: User = Depends(require_teacher)):
    c = db.query(CaseItem).get(case_id)
    if not c:
        raise HTTPException(404, "案例不存在")
    db.delete(c)
    db.commit()
    return {"ok": True}
