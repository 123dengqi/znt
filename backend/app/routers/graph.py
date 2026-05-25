"""知识图谱探险：返回图谱结构 + 节点流式讲解（基于 RAG）。"""
from __future__ import annotations

import json
import time
import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..db import SessionLocal
from ..graph_data import find_node, get_graph, neighbors
from ..llm import LLMError, build_messages, chat_stream
from ..models import LearningEvent, User
from ..retrieval import search as bm25_search
from ..security import get_current_user

router = APIRouter(prefix="/api/graph", tags=["graph"])


@router.get("")
def graph(_: User = Depends(get_current_user)):
    return get_graph()


class GraphExplainIn(BaseModel):
    node_id: str = Field(..., min_length=1)
    session_id: str | None = None


def _build_prompt(node: dict, neigh: list[dict], context_chunks: list) -> tuple[str, str]:
    sys = (
        "你是《人格心理学》课程的教学化身。请用教学化、清晰、简洁的中文，"
        "输出 Markdown，分四个段落讲解一个人格心理学概念/人物/流派节点：\n"
        "1) **它是什么**：一句话定义 + 关键要点（不超过 3 个）\n"
        "2) **与相邻节点的关系**：结合给定的相邻节点解释关联（用要点式）\n"
        "3) **典型教学场景**：1 个生活化场景，避免临床诊断和贴标签\n"
        "4) **易混点 / 边界**：与最容易混淆的概念做简短区分\n"
        "总长 350-500 字。如果检索到课程材料，请优先依据它，并保持教学边界。"
    )
    neigh_txt = "\n".join(
        f"- [{n.get('rel', '')}] {n['name']}：{n['brief']}" for n in neigh[:8]
    ) or "（无）"
    chunk_txt = "\n\n".join((getattr(c, "text", "") or "")[:500] for c in context_chunks[:3]) or "（无）"
    user = (
        f"【目标节点】{node['name']}\n"
        f"【简介】{node['brief']}\n\n"
        f"【相邻节点】\n{neigh_txt}\n\n"
        f"【课程材料片段】\n{chunk_txt}\n"
    )
    return sys, user


@router.post("/explain")
async def explain(body: GraphExplainIn, user: User = Depends(get_current_user)):
    node = find_node(body.node_id)
    if not node:
        raise HTTPException(status_code=404, detail="节点不存在")
    neigh = neighbors(body.node_id)
    sid = body.session_id or uuid.uuid4().hex
    started = time.time()

    # RAG: 用节点名作为查询，检索课程材料
    db = SessionLocal()
    try:
        chunks = bm25_search(db, query=node["name"], top_k=3) or []
    except Exception:
        chunks = []
    finally:
        db.close()

    sys, usr = _build_prompt(node, neigh, chunks)
    msgs = build_messages(sys, usr)

    async def gen():
        yield "data: " + json.dumps({
            "type": "meta",
            "session_id": sid,
            "node": node,
            "neighbors": neigh,
            "context_count": len(chunks),
        }, ensure_ascii=False) + "\n\n"
        try:
            async for piece in chat_stream(msgs, temperature=0.4, max_tokens=720):
                yield "data: " + json.dumps({"type": "delta", "text": piece}, ensure_ascii=False) + "\n\n"
        except LLMError as e:
            yield "data: " + json.dumps({"type": "error", "text": str(e)}, ensure_ascii=False) + "\n\n"
        yield "data: " + json.dumps({"type": "done"}, ensure_ascii=False) + "\n\n"

        db2 = SessionLocal()
        try:
            db2.add(LearningEvent(
                user_id=user.id,
                module="graph",
                intent="graph_explain",
                session_id=sid,
                duration_ms=int((time.time() - started) * 1000),
                payload={"node_id": node["id"], "name": node["name"], "neighbors": [n["id"] for n in neigh]},
            ))
            db2.commit()
        finally:
            db2.close()

    return StreamingResponse(gen(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
