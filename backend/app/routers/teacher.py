from __future__ import annotations

import csv
import io
import time
import uuid
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..db import get_db
from ..llm import LLMError, build_messages, chat_complete
from ..models import ChatLog, LearningEvent, QuizAttempt, User
from ..retrieval import format_context, search
from ..schemas import FeedbackIn, GenDiscussIn
from ..security import get_current_user, require_teacher

router = APIRouter(prefix="/api/teacher", tags=["teacher"])


@router.get("/stats")
def stats(db: Session = Depends(get_db), user: User = Depends(require_teacher)):
    total_users = db.query(User).count()
    students = db.query(User).filter(User.role == "student").count()
    today = datetime.utcnow() - timedelta(days=1)
    active_24h = db.query(LearningEvent.user_id).filter(LearningEvent.created_at >= today).distinct().count()

    by_module = (
        db.query(LearningEvent.module, func.count(LearningEvent.id))
        .group_by(LearningEvent.module)
        .all()
    )
    by_module_map = {m: c for m, c in by_module}

    avg_score_row = db.query(func.avg(QuizAttempt.score)).first()
    avg_score = round(float(avg_score_row[0] or 0.0), 2)

    last7 = []
    for i in range(6, -1, -1):
        day_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=i)
        day_end = day_start + timedelta(days=1)
        c = db.query(LearningEvent).filter(LearningEvent.created_at >= day_start, LearningEvent.created_at < day_end).count()
        last7.append({"date": day_start.strftime("%m-%d"), "count": c})

    return {
        "users": total_users,
        "students": students,
        "active_24h": active_24h,
        "avg_quiz_score": avg_score,
        "by_module": by_module_map,
        "last7_events": last7,
    }


@router.get("/logs")
def logs(
    module: Optional[str] = None,
    user_id: Optional[int] = None,
    keyword: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    user: User = Depends(require_teacher),
):
    q = db.query(ChatLog).order_by(ChatLog.created_at.desc())
    if module:
        q = q.filter(ChatLog.module == module)
    if user_id:
        q = q.filter(ChatLog.user_id == user_id)
    if keyword:
        q = q.filter(ChatLog.content.like(f"%{keyword}%"))
    items = q.limit(min(limit, 500)).all()
    out = []
    for it in items:
        u = db.query(User).get(it.user_id)
        out.append({
            "id": it.id, "user_id": it.user_id, "username": (u.username if u else ""),
            "module": it.module, "role": it.role, "content": it.content,
            "session_id": it.session_id, "safety_flag": it.safety_flag,
            "created_at": it.created_at.isoformat(),
        })
    return out


@router.get("/events")
def events(
    module: Optional[str] = None,
    user_id: Optional[int] = None,
    days: int = 30,
    db: Session = Depends(get_db),
    user: User = Depends(require_teacher),
):
    since = datetime.utcnow() - timedelta(days=days)
    q = db.query(LearningEvent).filter(LearningEvent.created_at >= since)
    if module:
        q = q.filter(LearningEvent.module == module)
    if user_id:
        q = q.filter(LearningEvent.user_id == user_id)
    items = q.order_by(LearningEvent.created_at.desc()).limit(500).all()
    out = []
    for it in items:
        u = db.query(User).get(it.user_id)
        out.append({
            "id": it.id, "user_id": it.user_id, "username": (u.username if u else ""),
            "module": it.module, "intent": it.intent, "session_id": it.session_id,
            "duration_ms": it.duration_ms, "payload": it.payload,
            "created_at": it.created_at.isoformat(),
        })
    return out


@router.get("/export.csv")
def export_csv(
    kind: str = Query("events", pattern="^(events|logs|attempts)$"),
    db: Session = Depends(get_db),
    user: User = Depends(require_teacher),
):
    buf = io.StringIO()
    writer = csv.writer(buf)
    if kind == "events":
        writer.writerow(["id", "user_id", "module", "intent", "session_id", "duration_ms", "payload", "created_at"])
        for e in db.query(LearningEvent).order_by(LearningEvent.created_at.desc()).limit(5000).all():
            writer.writerow([e.id, e.user_id, e.module, e.intent, e.session_id, e.duration_ms, str(e.payload), e.created_at.isoformat()])
    elif kind == "logs":
        writer.writerow(["id", "user_id", "module", "role", "session_id", "safety_flag", "content", "created_at"])
        for c in db.query(ChatLog).order_by(ChatLog.created_at.desc()).limit(5000).all():
            writer.writerow([c.id, c.user_id, c.module, c.role, c.session_id, c.safety_flag, c.content, c.created_at.isoformat()])
    else:
        writer.writerow(["id", "user_id", "quiz_id", "score", "total", "created_at"])
        for a in db.query(QuizAttempt).order_by(QuizAttempt.created_at.desc()).limit(5000).all():
            writer.writerow([a.id, a.user_id, a.quiz_id, a.score, a.total, a.created_at.isoformat()])
    buf.seek(0)
    headers = {"Content-Disposition": f"attachment; filename={kind}.csv"}
    return StreamingResponse(iter([buf.getvalue()]), media_type="text/csv; charset=utf-8", headers=headers)


@router.post("/discuss")
async def gen_discuss(body: GenDiscussIn, db: Session = Depends(get_db), user: User = Depends(require_teacher)):
    started = time.time()
    hits = search(db, body.topic or body.chapter or "人格心理学", chapter=body.chapter or None, top_k=3)
    ctx = format_context(hits) if hits else ""
    sys_prompt = (
        "请为人格心理学课堂生成讨论题，要求：开放、可争论、结合理论与生活情境；"
        "每题输出形式：题干 / 思考路径 / 建议时长 / 理论关联。\n"
        f"题目数量：{body.n}。\n=== 知识库片段 ===\n{ctx}\n=== 结束 ==="
    )
    user_text = f"章节：{body.chapter or '不限'}；主题：{body.topic or '不限'}"
    msgs = build_messages(sys_prompt, user_text)
    try:
        text = await chat_complete(msgs, temperature=0.6, max_tokens=1200)
    except LLMError as e:
        raise HTTPException(502, str(e))
    db.add(LearningEvent(user_id=user.id, module="kb", intent="gen_discuss", session_id=uuid.uuid4().hex,
                         duration_ms=int((time.time() - started) * 1000), payload={"chapter": body.chapter, "topic": body.topic}))
    db.commit()
    return {"text": text}


@router.post("/feedback")
async def feedback(body: FeedbackIn, db: Session = Depends(get_db), user: User = Depends(require_teacher)):
    started = time.time()
    sys_prompt = (
        "你是人格心理学课程的助教，请为学生作业提供结构化反馈，输出 Markdown：\n"
        "## 一、亮点\n## 二、不足与误区\n## 三、改进建议（与课程概念绑定）\n## 四、评分参考（不是最终分数）\n"
        "约束：禁止涉及临床诊断/标签；语言鼓励、具体、可操作。\n"
        f"评分量规：{body.rubric or '默认（理论准确度40% / 案例联系30% / 反思深度20% / 表达10%）'}"
    )
    msgs = build_messages(sys_prompt, body.student_text)
    try:
        text = await chat_complete(msgs, temperature=0.5, max_tokens=1400)
    except LLMError as e:
        raise HTTPException(502, str(e))
    db.add(LearningEvent(user_id=user.id, module="kb", intent="feedback", session_id=uuid.uuid4().hex,
                         duration_ms=int((time.time() - started) * 1000), payload={"len": len(body.student_text)}))
    db.commit()
    return {"text": text}
