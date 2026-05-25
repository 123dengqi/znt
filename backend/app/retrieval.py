from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Iterable

import jieba
from rank_bm25 import BM25Okapi
from sqlalchemy.orm import Session

from .models import Chunk

_STOP = set("的 了 和 与 及 或 是 在 也 就 都 而 又 但 并 还 一个 一种 这 那 这个 那个 我们 他们 你们 我 你 他 她 它".split())


def tokenize(text: str) -> list[str]:
    text = re.sub(r"\s+", " ", text or "")
    toks = [t.strip() for t in jieba.lcut(text) if t.strip()]
    return [t for t in toks if t not in _STOP and len(t) > 1 or t.isalnum()]


def chunk_text(text: str, size: int = 500, overlap: int = 80) -> list[str]:
    text = (text or "").strip()
    if not text:
        return []
    chunks = []
    step = max(1, size - overlap)
    for i in range(0, len(text), step):
        seg = text[i : i + size]
        if len(seg) < 50 and chunks:
            chunks[-1] = (chunks[-1] + seg)[:size + overlap]
        else:
            chunks.append(seg)
        if i + size >= len(text):
            break
    return chunks


@dataclass
class Hit:
    chunk_id: int
    document_id: int
    chapter: str
    school: str
    text: str
    score: float


def search(
    db: Session,
    query: str,
    chapter: str | None = None,
    school: str | None = None,
    top_k: int = 5,
) -> list[Hit]:
    q = db.query(Chunk)
    if chapter:
        q = q.filter(Chunk.chapter == chapter)
    if school:
        q = q.filter(Chunk.school == school)
    rows: list[Chunk] = q.all()
    if not rows:
        return []
    corpus = [(r.tokens or "").split() if r.tokens else tokenize(r.text) for r in rows]
    if not any(corpus):
        return []
    bm25 = BM25Okapi(corpus)
    q_toks = tokenize(query)
    if not q_toks:
        return []
    scores = bm25.get_scores(q_toks)
    pairs = sorted(zip(rows, scores), key=lambda x: x[1], reverse=True)[:top_k]
    hits: list[Hit] = []
    for r, s in pairs:
        if s <= 0:
            continue
        hits.append(Hit(r.id, r.document_id, r.chapter or "", r.school or "", r.text, float(s)))
    return hits


def format_context(hits: Iterable[Hit]) -> str:
    parts = []
    for i, h in enumerate(hits, 1):
        head = f"[片段{i}] 章节={h.chapter or '-'} 流派={h.school or '-'}"
        parts.append(head + "\n" + h.text)
    return "\n\n".join(parts)
