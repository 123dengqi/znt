from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class LoginIn(BaseModel):
    username: str
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    name: str
    username: str


class UserOut(BaseModel):
    id: int
    username: str
    role: str
    name: str

    class Config:
        from_attributes = True


# --- KB ---
class DocumentOut(BaseModel):
    id: int
    title: str
    chapter: str
    school: str
    doc_type: str
    filename: str
    created_at: datetime

    class Config:
        from_attributes = True


class SearchIn(BaseModel):
    query: str
    chapter: Optional[str] = None
    school: Optional[str] = None
    top_k: int = 5


class HitOut(BaseModel):
    chunk_id: int
    document_id: int
    chapter: str
    school: str
    text: str
    score: float


# --- Chat / QA ---
class QAIn(BaseModel):
    question: str
    chapter: Optional[str] = None
    school: Optional[str] = None
    session_id: Optional[str] = None


class QAOut(BaseModel):
    answer: str
    citations: list[HitOut] = []
    safety_flag: str = "ok"
    notice: str = ""


class CompareIn(BaseModel):
    schools: list[str] = Field(..., min_length=2)
    topic: str = ""
    session_id: Optional[str] = None


class CaseAnalyzeIn(BaseModel):
    case_text: str
    perspective: str = "综合"  # 精神分析/人本主义/特质理论/社会学习/综合
    session_id: Optional[str] = None


class RolePlayIn(BaseModel):
    role: str  # 如 "弗洛伊德" / "罗杰斯" / "来访者-成长困惑"
    user_message: str
    history: list[dict] = []  # [{role, content}]
    session_id: Optional[str] = None


# --- Quiz ---
class QuestionIn(BaseModel):
    stem: str
    options: list[str]
    answer: str
    explanation: str = ""


class QuizIn(BaseModel):
    title: str
    chapter: str = ""
    questions: list[QuestionIn]


class QuestionOut(BaseModel):
    id: int
    stem: str
    options: list[str]

    class Config:
        from_attributes = True


class QuizOut(BaseModel):
    id: int
    title: str
    chapter: str
    questions: list[QuestionOut]

    class Config:
        from_attributes = True


class QuizSubmitIn(BaseModel):
    quiz_id: int
    answers: dict[int, str]  # {question_id: "A"}


class QuizResultOut(BaseModel):
    score: float
    total: int
    detail: list[dict[str, Any]]


# --- Cases (教师库) ---
class CaseIn(BaseModel):
    title: str
    description: str
    tags: str = ""


class CaseOut(BaseModel):
    id: int
    title: str
    description: str
    tags: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- 教师工具 ---
class GenQuizIn(BaseModel):
    chapter: str = ""
    school: str = ""
    topic: str = ""
    n: int = 5


class GenDiscussIn(BaseModel):
    chapter: str = ""
    topic: str = ""
    n: int = 3


class FeedbackIn(BaseModel):
    student_text: str
    rubric: str = ""


class FeedbackInline(BaseModel):
    """学生针对单条 AI 回答的点赞/点踩。"""
    module: str
    session_id: str = ""
    rating: int  # +1 / -1
    comment: str = ""
    payload: dict[str, Any] = {}


# --- 课程思政融入设计 ---

class IdeologyElementIn(BaseModel):
    name: str = Field(..., min_length=1)
    category: str = ""
    description: str = ""
    suitable_chapters: str = ""
    example_cases: str = ""


class IdeologyElementOut(BaseModel):
    id: int
    name: str
    category: str
    description: str
    suitable_chapters: str
    example_cases: str
    created_at: datetime

    class Config:
        from_attributes = True


class MappingIn(BaseModel):
    chapter: str = ""
    knowledge_point: str
    ideology_element_id: int
    integration_method: str = ""
    teaching_scenario: str = ""
    prompt_template: str = ""
    evaluation_indicator: str = ""


class MappingOut(BaseModel):
    id: int
    chapter: str
    knowledge_point: str
    ideology_element_id: int
    integration_method: str
    teaching_scenario: str
    prompt_template: str
    evaluation_indicator: str
    created_at: datetime
    element_name: str = ""

    class Config:
        from_attributes = True


class MappingGenerateIn(BaseModel):
    """AI 推荐：给定章节/知识点，推荐若干思政元素。"""
    chapter: str = ""
    knowledge_point: str


class LessonPlanIn(BaseModel):
    chapter: str
    knowledge_point: str
    ideology_elements: list[str] = Field(default_factory=list)
    teaching_scenario: str = "完整教学环节"


class TaskIn(BaseModel):
    title: str
    chapter: str = ""
    knowledge_point: str = ""
    ideology_elements: str = ""
    task_type: str = "post_reflection"
    task_content: str
    target_students: str = "all"
    status: str = "published"
    lesson_plan: dict[str, Any] = {}


class TaskOut(BaseModel):
    id: int
    title: str
    chapter: str
    knowledge_point: str
    ideology_elements: str
    task_type: str
    task_content: str
    target_students: str
    status: str
    lesson_plan: dict[str, Any] = {}
    created_at: datetime
    submission_count: int = 0
    submitted: bool = False  # 学生视角是否已提交

    class Config:
        from_attributes = True


class ReflectionIn(BaseModel):
    task_id: int
    response_text: str = Field(..., min_length=1)


class ReflectionOut(BaseModel):
    id: int
    task_id: int
    student_id: int
    response_text: str
    ai_feedback: str
    ai_dimensions: dict[str, Any] = {}
    teacher_comment: str
    score: float
    submitted_at: datetime
    student_name: str = ""
    task_title: str = ""

    class Config:
        from_attributes = True


class TeacherCommentIn(BaseModel):
    teacher_comment: str = ""
    score: float = 0.0


class LessonPlanExportIn(BaseModel):
    """把 AI 流式生成出的 Markdown 文本回传以导出 Word。"""
    chapter: str = ""
    knowledge_point: str = ""
    ideology_elements: list[str] = []
    markdown: str = Field(..., min_length=1)
