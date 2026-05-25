"""人格实验室：同一情境下多流派并行解释 + 五维评分。"""
from __future__ import annotations

import asyncio
import json
import time
import uuid
from typing import AsyncIterator

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..db import SessionLocal
from ..llm import LLMError, build_messages, chat_complete, chat_stream
from ..models import ChatLog, LearningEvent, User
from ..safety import check_user_input
from ..security import get_current_user

router = APIRouter(prefix="/api/lab", tags=["lab"])


class PersonaLabIn(BaseModel):
    scenario: str = Field(..., min_length=4)
    schools: list[str] = Field(default_factory=lambda: ["精神分析", "人本主义", "特质理论", "社会学习理论"])
    session_id: str | None = None


SCHOOL_HINT: dict[str, str] = {
    "精神分析": "围绕潜意识、本我/自我/超我、防御机制等概念；不下临床诊断。",
    "人本主义": "围绕自我概念、价值条件、积极关注、自我实现需要；强调共情。",
    "特质理论": "围绕大五人格(OCEAN)等可测量特质，谨慎区分情境与特质。",
    "社会学习理论": "围绕观察学习、自我效能、三元交互、控制点；关注环境与建模。",
    "认知取向": "围绕图式、归因、自动思维与认知重评；不替代临床干预。",
    "行为主义": "围绕条件作用、强化与惩罚、塑造；不替代临床干预。",
}

DIMS = ["人格结构", "动力机制", "发展观", "情境敏感度", "教学可操作性"]


def _explain_prompt(school: str) -> str:
    hint = SCHOOL_HINT.get(school, "请用该流派的核心概念进行教学化解释。")
    return (
        f"你将以《人格心理学》课程的教学化身身份，使用「{school}」流派进行解读。\n"
        f"流派提示：{hint}\n"
        "请输出简洁可读的 Markdown：\n"
        "1) **关键概念**（2-4 个，要点式）\n"
        "2) **如何解释这一情境**（避免诊断与贴标签，限 120 字内）\n"
        "3) **可观察的行为线索**（要点式 2 条）\n"
        "4) **教学建议**（一句话，限 40 字）\n"
        "请严格控制总长不超过 350 字。"
    )


async def _stream_school(school: str, scenario: str) -> AsyncIterator[dict]:
    """单一流派的流式增量。yield {school, type, text}。"""
    msgs = build_messages(_explain_prompt(school), f"情境如下：\n{scenario}")
    try:
        async for piece in chat_stream(msgs, temperature=0.5, max_tokens=520):
            yield {"school": school, "type": "delta", "text": piece}
    except LLMError as e:
        yield {"school": school, "type": "error", "text": str(e)}
    yield {"school": school, "type": "school_done"}


async def _score_all(scenario: str, schools: list[str]) -> dict[str, list[int]]:
    """让模型一次性给出每个流派在 5 个维度的 1-5 分评分（用于雷达对比）。"""
    sys = (
        "你将为以下流派在五个维度上打分（整数 1-5），用于教学讨论的雷达图比较。"
        f"\n维度依次为：{DIMS}\n"
        f"流派：{schools}\n"
        "严格输出 JSON，不要任何附加文字：\n"
        '{"<流派>": [s1, s2, s3, s4, s5], ...}'
    )
    msgs = build_messages(sys, f"情境如下：\n{scenario}")
    try:
        raw = await chat_complete(msgs, temperature=0.2, max_tokens=400)
    except LLMError:
        return {s: [3, 3, 3, 3, 3] for s in schools}

    text = (raw or "").strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:]
    s = text.find("{")
    e = text.rfind("}")
    if s == -1 or e == -1:
        return {s_: [3, 3, 3, 3, 3] for s_ in schools}
    try:
        data = json.loads(text[s : e + 1])
    except Exception:
        return {s_: [3, 3, 3, 3, 3] for s_ in schools}

    out: dict[str, list[int]] = {}
    for sc in schools:
        v = data.get(sc) or [3, 3, 3, 3, 3]
        if not isinstance(v, list) or len(v) != 5:
            v = [3, 3, 3, 3, 3]
        v = [max(1, min(5, int(round(float(x))))) for x in v]
        out[sc] = v
    return out


@router.post("/persona/stream")
async def persona_stream(body: PersonaLabIn, user: User = Depends(get_current_user)):
    started = time.time()
    sid = body.session_id or uuid.uuid4().hex
    verdict = check_user_input(body.scenario)

    if verdict.flag == "blocked":
        async def blocked_gen():
            yield "data: " + json.dumps({"type": "meta", "session_id": sid, "schools": body.schools, "safety_flag": "blocked", "notice": verdict.notice}, ensure_ascii=False) + "\n\n"
            yield "data: " + json.dumps({"type": "done"}, ensure_ascii=False) + "\n\n"

        return StreamingResponse(blocked_gen(), media_type="text/event-stream")

    schools = body.schools or list(SCHOOL_HINT.keys())[:4]

    async def gen():
        # 先发 meta
        yield "data: " + json.dumps({"type": "meta", "session_id": sid, "schools": schools, "safety_flag": verdict.flag, "notice": verdict.notice}, ensure_ascii=False) + "\n\n"

        # 并行流式：把多个 async generator 合并到一个队列，公平输出
        queue: asyncio.Queue = asyncio.Queue()

        async def consume(school: str):
            async for evt in _stream_school(school, body.scenario):
                await queue.put(evt)
            await queue.put({"school": school, "type": "_finished"})

        tasks = [asyncio.create_task(consume(s)) for s in schools]
        finished = 0
        try:
            while finished < len(schools):
                evt = await queue.get()
                if evt.get("type") == "_finished":
                    finished += 1
                    continue
                yield "data: " + json.dumps(evt, ensure_ascii=False) + "\n\n"
        finally:
            for t in tasks:
                if not t.done():
                    t.cancel()

        # 评分
        scores = await _score_all(body.scenario, schools)
        yield "data: " + json.dumps({"type": "scores", "dims": DIMS, "scores": scores}, ensure_ascii=False) + "\n\n"

        yield "data: " + json.dumps({"type": "done"}, ensure_ascii=False) + "\n\n"

        # 持久化
        db = SessionLocal()
        try:
            db.add(ChatLog(user_id=user.id, module="lab", role="user", content=body.scenario[:6000], session_id=sid, safety_flag=verdict.flag))
            db.add(LearningEvent(
                user_id=user.id, module="lab", intent="persona_lab", session_id=sid,
                duration_ms=int((time.time() - started) * 1000),
                payload={"schools": schools, "scores": scores, "len": len(body.scenario)},
            ))
            db.commit()
        finally:
            db.close()

    return StreamingResponse(gen(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
