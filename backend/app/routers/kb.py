from __future__ import annotations

import os
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from ..config import settings
from ..db import get_db
from ..ingest import ingest_document
from ..models import Document, User, Chunk
from ..retrieval import search
from ..schemas import DocumentOut, HitOut, SearchIn
from ..security import get_current_user, require_teacher

router = APIRouter(prefix="/api/kb", tags=["kb"])


@router.get("/documents", response_model=list[DocumentOut])
def list_documents(
    chapter: Optional[str] = None,
    school: Optional[str] = None,
    doc_type: Optional[str] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = db.query(Document)
    if chapter:
        q = q.filter(Document.chapter == chapter)
    if school:
        q = q.filter(Document.school == school)
    if doc_type:
        q = q.filter(Document.doc_type == doc_type)
    return q.order_by(Document.created_at.desc()).all()


@router.post("/upload", response_model=DocumentOut)
def upload(
    title: str = Form(""),
    chapter: str = Form(""),
    school: str = Form(""),
    doc_type: str = Form("material"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_teacher),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="未提供文件")
    safe_name = f"{uuid.uuid4().hex}_{file.filename}"
    save_path = os.path.join(settings.UPLOAD_DIR, safe_name)
    with open(save_path, "wb") as f:
        f.write(file.file.read())
    doc, n = ingest_document(
        db, title=title, chapter=chapter, school=school, doc_type=doc_type, file_path=save_path, user_id=user.id
    )
    return doc


@router.delete("/documents/{doc_id}")
def delete_document(doc_id: int, db: Session = Depends(get_db), user: User = Depends(require_teacher)):
    doc = db.query(Document).get(doc_id)
    if not doc:
        raise HTTPException(404, "文档不存在")
    db.delete(doc)
    db.commit()
    return {"ok": True}


@router.post("/search", response_model=list[HitOut])
def kb_search(body: SearchIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    hits = search(db, body.query, body.chapter, body.school, body.top_k)
    return [
        HitOut(
            chunk_id=h.chunk_id,
            document_id=h.document_id,
            chapter=h.chapter,
            school=h.school,
            text=h.text,
            score=h.score,
        )
        for h in hits
    ]


@router.get("/stats")
def kb_stats(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    doc_count = db.query(Document).count()
    chunk_count = db.query(Chunk).count()
    return {"documents": doc_count, "chunks": chunk_count}
