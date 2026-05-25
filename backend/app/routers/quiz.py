from __future__ import annotations

import json
import time
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..llm import LLMError, build_messages, chat_complete
from ..models import LearningEvent, Question, Quiz, QuizAttempt, User
from ..retrieval import format_context, search
from ..schemas import (
    GenQuizIn,
    QuestionOut,
    QuizIn,
    QuizOut,
    QuizResultOut,
    QuizSubmitIn,
)
from ..security import get_current_user, require_teacher

router = APIRouter(prefix="/api/quiz", tags=["quiz"])


@router.get("/list", response_model=list[dict])
def list_quizzes(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    qs = db.query(Quiz).order_by(Quiz.created_at.desc()).all()
    return [{"id": q.id, "title": q.title, "chapter": q.chapter, "count": len(q.questions)} for q in qs]


@router.get("/{quiz_id}", response_model=QuizOut)
def get_quiz(quiz_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    quiz = db.query(Quiz).get(quiz_id)
    if not quiz:
        raise HTTPException(404, "测验不存在")
    return quiz


@router.post("/create", response_model=QuizOut)
def create_quiz(body: QuizIn, db: Session = Depends(get_db), user: User = Depends(require_teacher)):
    quiz = Quiz(title=body.title, chapter=body.chapter, created_by=user.id)
    db.add(quiz)
    db.flush()
    for q in body.questions:
        db.add(Question(quiz_id=quiz.id, stem=q.stem, options=q.options, answer=q.answer, explanation=q.explanation))
    db.commit()
    db.refresh(quiz)
    return quiz


@router.delete("/{quiz_id}")
def delete_quiz(quiz_id: int, db: Session = Depends(get_db), user: User = Depends(require_teacher)):
    quiz = db.query(Quiz).get(quiz_id)
    if not quiz:
        raise HTTPException(404, "测验不存在")
    db.delete(quiz)
    db.commit()
    return {"ok": True}


@router.post("/submit", response_model=QuizResultOut)
def submit(body: QuizSubmitIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    quiz = db.query(Quiz).get(body.quiz_id)
    if not quiz:
        raise HTTPException(404, "测验不存在")
    detail = []
    correct = 0
    for q in quiz.questions:
        picked = body.answers.get(q.id, "")
        ok = (picked.strip().upper() == (q.answer or "").strip().upper())
        if ok:
            correct += 1
        detail.append({
            "question_id": q.id, "stem": q.stem, "picked": picked,
            "answer": q.answer, "correct": ok, "explanation": q.explanation,
        })
    total = len(quiz.questions) or 1
    score = round(correct * 100 / total, 1)
    attempt = QuizAttempt(user_id=user.id, quiz_id=quiz.id, score=score, total=total, detail=detail)
    db.add(attempt)
    db.add(LearningEvent(user_id=user.id, module="quiz", intent="submit", session_id=uuid.uuid4().hex, payload={
        "quiz_id": quiz.id, "score": score, "total": total, "correct": correct,
    }))
    db.commit()
    return QuizResultOut(score=score, total=total, detail=detail)


@router.post("/generate", response_model=QuizOut)
async def generate_quiz(body: GenQuizIn, db: Session = Depends(get_db), user: User = Depends(require_teacher)):
    started = time.time()
    hits = search(db, body.topic or body.chapter or body.school or "人格心理学", chapter=body.chapter or None, school=body.school or None, top_k=4)
    ctx = format_context(hits) if hits else ""
    sys_prompt = (
        "请基于人格心理学课程知识，为教师生成单选题测验，严格输出 JSON：\n"
        '{"title": "...", "questions": [{"stem":"...","options":["A. xx","B. xx","C. xx","D. xx"],"answer":"A","explanation":"..."}]}\n'
        f"题目数量：{body.n}。每题 4 个选项，answer 为 A/B/C/D。\n"
        "禁止生成涉及临床诊断/标签化的题目。"
        f"\n=== 课程知识库片段 ===\n{ctx}\n=== 片段结束 ==="
    )
    user_text = f"章节：{body.chapter or '不限'}；流派：{body.school or '不限'}；主题：{body.topic or '不限'}"
    msgs = build_messages(sys_prompt, user_text)
    try:
        raw = await chat_complete(msgs, temperature=0.4, max_tokens=2000)
    except LLMError as e:
        raise HTTPException(502, str(e))
    data = _safe_json(raw)
    if not data or "questions" not in data:
        raise HTTPException(500, f"模型返回不合法：{raw[:200]}")

    quiz = Quiz(title=data.get("title") or f"AI生成-{body.chapter or '通用'}", chapter=body.chapter, created_by=user.id)
    db.add(quiz)
    db.flush()
    for q in data["questions"][: body.n]:
        db.add(Question(quiz_id=quiz.id, stem=q.get("stem", ""), options=q.get("options", []),
                        answer=q.get("answer", ""), explanation=q.get("explanation", "")))
    db.add(LearningEvent(user_id=user.id, module="kb", intent="gen_quiz", session_id=uuid.uuid4().hex,
                         duration_ms=int((time.time() - started) * 1000),
                         payload={"chapter": body.chapter, "n": body.n}))
    db.commit()
    db.refresh(quiz)
    return quiz


def _safe_json(text: str):
    if not text:
        return None
    s = text.strip()
    if s.startswith("```"):
        s = s.strip("`")
        if s.lower().startswith("json"):
            s = s[4:]
    start = s.find("{")
    end = s.rfind("}")
    if start == -1 or end == -1:
        return None
    try:
        return json.loads(s[start:end + 1])
    except Exception:
        return None
