from __future__ import annotations

import json
from typing import AsyncIterator, Iterable

import httpx

from .config import settings


class LLMError(RuntimeError):
    pass


SAFETY_SYSTEM = (
    "你是《人格心理学》课程的教学助手。严格遵守：\n"
    "1) 只服务教学目的；不进行任何心理/精神疾病的临床诊断、不开治疗方案、不推荐药物；\n"
    "2) 不给学生贴病理化标签，不做个体化风险预测；\n"
    "3) 涉及自伤/伤人/危机迹象，应温和提示寻求专业帮助与校园心理支持，并停止延伸讨论；\n"
    "4) 回答优先依据用户提供的课程材料/知识库；当材料不足以回答时，明确说明并避免编造；\n"
    "5) 语言克制、有学理性，必要时给出引用片段编号（如 [片段1]）。"
)


async def chat_complete(messages: list[dict], temperature: float = 0.4, max_tokens: int = 1024) -> str:
    """非流式补全。messages: [{role, content}]"""
    if not settings.DEEPSEEK_API_KEY:
        raise LLMError("未配置 DEEPSEEK_API_KEY")

    url = settings.DEEPSEEK_BASE_URL.rstrip("/") + "/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
        "Content-Type": "application/json",
    }
    body = {
        "model": settings.DEEPSEEK_CHAT_MODEL,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": False,
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.post(url, headers=headers, json=body)
        if r.status_code >= 400:
            raise LLMError(f"LLM 调用失败: {r.status_code} {r.text[:200]}")
        data = r.json()
        try:
            return data["choices"][0]["message"]["content"]
        except Exception as e:  # pragma: no cover
            raise LLMError(f"LLM 响应解析失败: {e}; raw={data}")


async def chat_stream(messages: list[dict], temperature: float = 0.4, max_tokens: int = 1024) -> AsyncIterator[str]:
    """流式补全：异步逐 token 产出文本片段。"""
    if not settings.DEEPSEEK_API_KEY:
        raise LLMError("未配置 DEEPSEEK_API_KEY")

    url = settings.DEEPSEEK_BASE_URL.rstrip("/") + "/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
    }
    body = {
        "model": settings.DEEPSEEK_CHAT_MODEL,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": True,
    }
    async with httpx.AsyncClient(timeout=120.0) as client:
        async with client.stream("POST", url, headers=headers, json=body) as r:
            if r.status_code >= 400:
                text = await r.aread()
                raise LLMError(f"LLM 调用失败: {r.status_code} {text[:200]!r}")
            async for line in r.aiter_lines():
                if not line:
                    continue
                if line.startswith("data:"):
                    line = line[5:].strip()
                if line == "[DONE]":
                    break
                try:
                    data = json.loads(line)
                except Exception:
                    continue
                try:
                    delta = data["choices"][0]["delta"].get("content")
                except Exception:
                    delta = None
                if delta:
                    yield delta


def build_messages(system: str, user: str, extra_system: Iterable[str] | None = None) -> list[dict]:
    msgs = [{"role": "system", "content": SAFETY_SYSTEM}, {"role": "system", "content": system}]
    if extra_system:
        for s in extra_system:
            msgs.append({"role": "system", "content": s})
    msgs.append({"role": "user", "content": user})
    return msgs
