from __future__ import annotations

import json
import time
import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from ..db import SessionLocal, get_db
from ..llm import LLMError, build_messages, chat_complete, chat_stream
from ..models import ChatLog, Feedback, LearningEvent, User
from ..retrieval import format_context, search
from ..safety import check_user_input
from ..schemas import (
    CaseAnalyzeIn,
    CompareIn,
    FeedbackInline,
    HitOut,
    QAIn,
    QAOut,
    RolePlayIn,
)
from ..security import get_current_user

router = APIRouter(prefix="/api/chat", tags=["chat"])


def _log(db: Session, user_id: int, module: str, role: str, content: str, sid: str, flag: str = "ok"):
    db.add(ChatLog(user_id=user_id, module=module, role=role, content=content[:8000], session_id=sid, safety_flag=flag))


def _event(db: Session, user_id: int, module: str, intent: str, sid: str, duration_ms: int, payload: dict):
    db.add(LearningEvent(user_id=user_id, module=module, intent=intent, session_id=sid, duration_ms=duration_ms, payload=payload))


@router.post("/qa", response_model=QAOut)
async def qa(body: QAIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    started = time.time()
    sid = body.session_id or uuid.uuid4().hex
    verdict = check_user_input(body.question)
    if verdict.flag == "blocked":
        _log(db, user.id, "qa", "user", body.question, sid, "blocked")
        _log(db, user.id, "qa", "assistant", verdict.notice, sid, "blocked")
        _event(db, user.id, "qa", "blocked", sid, int((time.time() - started) * 1000), {"q": body.question[:200]})
        db.commit()
        return QAOut(answer=verdict.notice, citations=[], safety_flag="blocked", notice=verdict.notice)

    hits = search(db, body.question, body.chapter, body.school, top_k=5)
    ctx = format_context(hits) if hits else ""
    sys_prompt = (
        "你的任务是回答《人格心理学》课程相关问题。如下是从课程知识库检索到的片段，"
        "请优先依据片段进行作答，并在末尾用 [片段X] 标注引用；若片段不足以回答，请明确说明并给出审慎建议。"
        f"\n\n=== 课程知识库片段 ===\n{ctx if ctx else '（未命中相关片段）'}\n=== 片段结束 ==="
    )
    extra = []
    if verdict.flag == "warned":
        extra.append("用户的提问可能涉及自我诊断/标签化，请明确告知本系统不进行诊断，并改为从教学层面解释相关概念。")
    msgs = build_messages(sys_prompt, body.question, extra_system=extra)
    try:
        answer = await chat_complete(msgs)
    except LLMError as e:
        raise HTTPException(502, str(e))

    _log(db, user.id, "qa", "user", body.question, sid, verdict.flag)
    _log(db, user.id, "qa", "assistant", answer, sid, verdict.flag)
    _event(
        db,
        user.id,
        "qa",
        "qa",
        sid,
        int((time.time() - started) * 1000),
        {"q": body.question[:200], "hit_ids": [h.chunk_id for h in hits], "chapter": body.chapter, "school": body.school},
    )
    db.commit()
    return QAOut(
        answer=answer,
        citations=[
            HitOut(
                chunk_id=h.chunk_id,
                document_id=h.document_id,
                chapter=h.chapter,
                school=h.school,
                text=h.text,
                score=h.score,
            )
            for h in hits
        ],
        safety_flag=verdict.flag,
        notice=verdict.notice,
    )


@router.post("/compare", response_model=QAOut)
async def compare(body: CompareIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    started = time.time()
    sid = body.session_id or uuid.uuid4().hex
    schools = " / ".join(body.schools)
    query = f"对比 {schools} 在 {body.topic or '人格结构与动力'} 上的观点"

    aggregated_hits = []
    for s in body.schools:
        aggregated_hits += search(db, body.topic or s, school=s, top_k=2)
    ctx = format_context(aggregated_hits) if aggregated_hits else ""

    sys_prompt = (
        "请围绕给定的人格心理学流派进行结构化对比。输出格式：\n"
        "1) 简表（Markdown 表格）：列=核心观点 / 人格结构 / 动力机制 / 发展观 / 测评取向 / 适用边界 / 局限\n"
        "2) 简评：3-5 句的对比小结，强调适用边界与教学启示。\n"
        f"\n=== 课程知识库片段 ===\n{ctx if ctx else '（未命中相关片段）'}\n=== 片段结束 ==="
    )
    user_text = f"流派列表：{schools}\n主题：{body.topic or '默认（人格结构与动力）'}"
    msgs = build_messages(sys_prompt, user_text)
    try:
        answer = await chat_complete(msgs, temperature=0.3, max_tokens=1400)
    except LLMError as e:
        raise HTTPException(502, str(e))

    _log(db, user.id, "compare", "user", query, sid)
    _log(db, user.id, "compare", "assistant", answer, sid)
    _event(db, user.id, "compare", "compare", sid, int((time.time() - started) * 1000), {"schools": body.schools, "topic": body.topic})
    db.commit()
    return QAOut(answer=answer, citations=[
        HitOut(chunk_id=h.chunk_id, document_id=h.document_id, chapter=h.chapter, school=h.school, text=h.text, score=h.score)
        for h in aggregated_hits
    ])


@router.post("/case", response_model=QAOut)
async def case_analyze(body: CaseAnalyzeIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    started = time.time()
    sid = body.session_id or uuid.uuid4().hex
    verdict = check_user_input(body.case_text)
    if verdict.flag == "blocked":
        _log(db, user.id, "case", "user", body.case_text, sid, "blocked")
        db.commit()
        return QAOut(answer=verdict.notice, citations=[], safety_flag="blocked", notice=verdict.notice)

    hits = search(db, body.case_text, school=None if body.perspective == "综合" else body.perspective, top_k=5)
    ctx = format_context(hits) if hits else ""
    sys_prompt = (
        "你将以教学辅助身份对学生提交的人格心理学案例进行结构化分析。严格遵守：不做临床诊断、不贴标签。\n"
        "输出固定结构（Markdown）：\n"
        "## 一、可观察行为与情境要点\n"
        "## 二、理论联系（视角：{perspective}）\n"
        "  - 核心概念解释\n  - 与案例的连接（不下诊断）\n"
        "## 三、其他视角的补充对照（至少一条）\n"
        "## 四、可探究的问题（3-5 条苏格拉底式追问）\n"
        "## 五、教学反思建议（学生可写在反思日志中）\n"
        f"\n=== 课程知识库片段 ===\n{ctx if ctx else '（未命中相关片段）'}\n=== 片段结束 ==="
    ).replace("{perspective}", body.perspective)

    msgs = build_messages(sys_prompt, body.case_text)
    try:
        answer = await chat_complete(msgs, temperature=0.5, max_tokens=1600)
    except LLMError as e:
        raise HTTPException(502, str(e))

    _log(db, user.id, "case", "user", body.case_text, sid, verdict.flag)
    _log(db, user.id, "case", "assistant", answer, sid, verdict.flag)
    _event(db, user.id, "case", "case_analyze", sid, int((time.time() - started) * 1000),
           {"perspective": body.perspective, "len": len(body.case_text), "hit_ids": [h.chunk_id for h in hits]})
    db.commit()
    return QAOut(
        answer=answer,
        safety_flag=verdict.flag,
        notice=verdict.notice,
        citations=[HitOut(chunk_id=h.chunk_id, document_id=h.document_id, chapter=h.chapter, school=h.school, text=h.text, score=h.score) for h in hits],
    )


ROLE_TEMPLATES = {
    "弗洛伊德": "你将扮演西格蒙德·弗洛伊德的教学化身，使用精神分析视角（本我/自我/超我、潜意识、防御机制等）和学生进行对话。语言风格沉稳、引导反思；不做现代临床诊断；保持19世纪末-20世纪初学者口吻，但用现代汉语。",
    "罗杰斯": "你将扮演卡尔·罗杰斯的教学化身，使用人本主义视角（自我概念、积极关注、价值条件等）。表达温和共情，强调学生自我探索；不做诊断。",
    "阿尔伯特·班杜拉": "你将扮演班杜拉的教学化身，从社会学习/自我效能视角与学生交流，鼓励观察学习与替代经验示例；不做诊断。",
    "特质理论学者": "你将扮演大五人格(OCEAN)取向学者，强调可测量、稳定的特质差异，谨慎区分情境与特质；不做诊断。",
    "来访者-成长困惑": "你将扮演一名大学生来访者，向学生（扮演成长伙伴或同伴）讲述困惑（学业压力、人际、自我认同），保持真实感但不夸张化、不涉及自伤。学生可以提问。",
}


@router.post("/role", response_model=QAOut)
async def role_play(body: RolePlayIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    started = time.time()
    sid = body.session_id or uuid.uuid4().hex
    verdict = check_user_input(body.user_message)
    if verdict.flag == "blocked":
        _log(db, user.id, "role", "user", body.user_message, sid, "blocked")
        db.commit()
        return QAOut(answer=verdict.notice, citations=[], safety_flag="blocked", notice=verdict.notice)

    role_sys = ROLE_TEMPLATES.get(body.role, f"你将以教学化身扮演 {body.role}，进行《人格心理学》情境对话；不做诊断、不贴标签。")
    sys_prompt = (
        role_sys
        + "\n要求：\n- 使用第一人称\n- 每次回答 80-180 字\n- 适时反问以推动学生思考\n- 末尾给出 1 条与人格理论相关的反思提示。"
    )
    history = body.history or []
    msgs = [{"role": "system", "content": sys_prompt}]
    msgs += history[-10:]
    msgs.append({"role": "user", "content": body.user_message})

    try:
        answer = await chat_complete(msgs, temperature=0.7, max_tokens=600)
    except LLMError as e:
        raise HTTPException(502, str(e))

    _log(db, user.id, "role", "user", body.user_message, sid, verdict.flag)
    _log(db, user.id, "role", "assistant", answer, sid, verdict.flag)
    _event(db, user.id, "role", body.role, sid, int((time.time() - started) * 1000),
           {"role": body.role, "turns": len(history) // 2 + 1})
    db.commit()
    return QAOut(answer=answer, safety_flag=verdict.flag, notice=verdict.notice)


@router.post("/qa/stream")
async def qa_stream(body: QAIn, user: User = Depends(get_current_user)):
    """SSE 流式问答：前端逐字渲染。完整记录与日志在结束后异步落库。"""
    started = time.time()
    sid = body.session_id or uuid.uuid4().hex
    verdict = check_user_input(body.question)

    # 检索（在请求线程内打开 db）
    db: Session = SessionLocal()
    try:
        hits = search(db, body.question, body.chapter, body.school, top_k=5) if verdict.flag != "blocked" else []
    finally:
        db.close()
    ctx = format_context(hits) if hits else ""

    cit_payload = [
        {
            "chunk_id": h.chunk_id,
            "document_id": h.document_id,
            "chapter": h.chapter,
            "school": h.school,
            "score": round(h.score, 3),
            "text": h.text[:300],
        }
        for h in hits
    ]

    sys_prompt = (
        "你的任务是回答《人格心理学》课程相关问题。如下是从课程知识库检索到的片段，"
        "请优先依据片段进行作答，并在末尾用 [片段X] 标注引用；若片段不足以回答，请明确说明并给出审慎建议。"
        f"\n\n=== 课程知识库片段 ===\n{ctx if ctx else '（未命中相关片段）'}\n=== 片段结束 ==="
    )
    extra = []
    if verdict.flag == "warned":
        extra.append("用户的提问可能涉及自我诊断/标签化，请明确告知本系统不进行诊断，并改为从教学层面解释相关概念。")
    msgs = build_messages(sys_prompt, body.question, extra_system=extra)

    async def gen():
        # 头：会话信息 + 引用
        yield "data: " + json.dumps({"type": "meta", "session_id": sid, "safety_flag": verdict.flag, "notice": verdict.notice, "citations": cit_payload}, ensure_ascii=False) + "\n\n"

        if verdict.flag == "blocked":
            yield "data: " + json.dumps({"type": "delta", "text": verdict.notice}, ensure_ascii=False) + "\n\n"
            yield "data: " + json.dumps({"type": "done"}, ensure_ascii=False) + "\n\n"
            _persist_qa(user.id, body, sid, hits, verdict, verdict.notice, started)
            return

        full = []
        try:
            async for piece in chat_stream(msgs, temperature=0.4, max_tokens=1200):
                full.append(piece)
                yield "data: " + json.dumps({"type": "delta", "text": piece}, ensure_ascii=False) + "\n\n"
        except LLMError as e:
            yield "data: " + json.dumps({"type": "error", "message": str(e)}, ensure_ascii=False) + "\n\n"
            return
        answer = "".join(full)
        yield "data: " + json.dumps({"type": "done"}, ensure_ascii=False) + "\n\n"
        _persist_qa(user.id, body, sid, hits, verdict, answer, started)

    return StreamingResponse(gen(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


def _persist_qa(user_id: int, body: QAIn, sid: str, hits, verdict, answer: str, started: float) -> None:
    db = SessionLocal()
    try:
        _log(db, user_id, "qa", "user", body.question, sid, verdict.flag)
        _log(db, user_id, "qa", "assistant", answer, sid, verdict.flag)
        db.add(LearningEvent(
            user_id=user_id, module="qa", intent="qa", session_id=sid,
            duration_ms=int((time.time() - started) * 1000),
            payload={"q": body.question[:200], "hit_ids": [h.chunk_id for h in hits], "chapter": body.chapter, "school": body.school},
        ))
        db.commit()
    finally:
        db.close()


@router.post("/feedback")
def feedback(body: FeedbackInline, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rec = Feedback(
        user_id=user.id, module=body.module, session_id=body.session_id,
        rating=body.rating, comment=body.comment or "", payload=body.payload or {},
    )
    db.add(rec)
    db.add(LearningEvent(user_id=user.id, module=body.module, intent="feedback",
                         session_id=body.session_id, payload={"rating": body.rating}))
    db.commit()
    return {"ok": True, "id": rec.id}
