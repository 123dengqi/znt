from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    Column, Integer, String, Text, DateTime, ForeignKey, Float, Boolean, JSON,
)
from sqlalchemy.orm import relationship

from .db import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(16), default="student")  # student / teacher / admin
    name = Column(String(64), default="")
    created_at = Column(DateTime, default=datetime.utcnow)


class Document(Base):
    """知识库文档（教材/课件/大纲等）。"""
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    chapter = Column(String(64), default="")  # 章节
    school = Column(String(64), default="")   # 流派
    doc_type = Column(String(32), default="material")  # material / case / quiz
    filename = Column(String(255), default="")
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    chunks = relationship("Chunk", back_populates="document", cascade="all, delete-orphan")


class Chunk(Base):
    """文档切片（关键词检索基本单元）。"""
    __tablename__ = "chunks"
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), index=True)
    chapter = Column(String(64), default="")
    school = Column(String(64), default="")
    text = Column(Text, nullable=False)
    tokens = Column(Text, default="")  # 预分词，空格分隔
    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="chunks")


class CaseItem(Base):
    """案例库。"""
    __tablename__ = "cases"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, default="")
    tags = Column(String(255), default="")  # 逗号分隔
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)


class Quiz(Base):
    __tablename__ = "quizzes"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    chapter = Column(String(64), default="")
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    questions = relationship("Question", back_populates="quiz", cascade="all, delete-orphan")


class Question(Base):
    __tablename__ = "questions"
    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), index=True)
    stem = Column(Text, nullable=False)
    options = Column(JSON, default=list)  # ["A.xx", "B.xx" ...]
    answer = Column(String(8), default="")  # "A"
    explanation = Column(Text, default="")
    quiz = relationship("Quiz", back_populates="questions")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), index=True)
    score = Column(Float, default=0.0)
    total = Column(Integer, default=0)
    detail = Column(JSON, default=list)  # [{question_id, picked, correct}]
    created_at = Column(DateTime, default=datetime.utcnow)


class LearningEvent(Base):
    """学习事件埋点（形成性评价基础数据）。"""
    __tablename__ = "learning_events"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    module = Column(String(32), index=True)  # qa / compare / case / role / quiz / kb / login ...
    intent = Column(String(64), default="")
    session_id = Column(String(64), default="", index=True)
    duration_ms = Column(Integer, default=0)
    payload = Column(JSON, default=dict)  # 提问摘要、命中文档、得分等
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class ChatLog(Base):
    """对话日志（教师审计可见，敏感场景仅存摘要）。"""
    __tablename__ = "chat_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    module = Column(String(32), index=True)
    role = Column(String(16))  # user / assistant / system
    content = Column(Text, default="")
    session_id = Column(String(64), default="", index=True)
    safety_flag = Column(String(32), default="")  # blocked / warned / ok
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class Feedback(Base):
    """学生对单条 AI 回答的点赞/点踩，作为过程性证据。"""
    __tablename__ = "feedback"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    module = Column(String(32), index=True)
    session_id = Column(String(64), default="", index=True)
    rating = Column(Integer, default=0)  # +1 / -1
    comment = Column(Text, default="")
    payload = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


# ============ 课程思政融入设计中心 ============

class IdeologyElement(Base):
    """思政元素库。"""
    __tablename__ = "ideology_elements"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(64), nullable=False, index=True)
    category = Column(String(64), default="")  # 元素类别（如 学术伦理 / 文化自信）
    description = Column(Text, default="")
    suitable_chapters = Column(String(255), default="")  # 逗号分隔
    example_cases = Column(Text, default="")
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)


class KnowledgeIdeologyMapping(Base):
    """《人格心理学》知识点-思政元素映射。"""
    __tablename__ = "knowledge_ideology_mappings"
    id = Column(Integer, primary_key=True, index=True)
    chapter = Column(String(64), default="", index=True)
    knowledge_point = Column(String(128), default="")
    ideology_element_id = Column(Integer, ForeignKey("ideology_elements.id"), index=True)
    integration_method = Column(Text, default="")  # 融入方式
    teaching_scenario = Column(String(64), default="")  # 课前/课中/课后
    prompt_template = Column(Text, default="")
    evaluation_indicator = Column(Text, default="")
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)


class IdeologyTeachingTask(Base):
    """思政教学任务（教师发布给学生）。"""
    __tablename__ = "ideology_tasks"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    chapter = Column(String(64), default="", index=True)
    knowledge_point = Column(String(128), default="")
    ideology_elements = Column(String(255), default="")  # 逗号分隔
    task_type = Column(String(32), default="reflection")
    # 课前思考题 pre_think / 课中讨论 in_class_discuss / 案例分析 case_analysis
    # 角色模拟 role_play / 课后反思 post_reflection / 章节价值引导 value_guide
    task_content = Column(Text, default="")  # 任务正文（题干 / 案例 / 提示）
    target_students = Column(String(255), default="all")  # all 或逗号分隔的 user_id
    status = Column(String(16), default="published")  # draft / published / archived
    lesson_plan = Column(JSON, default=dict)  # 完整教学设计 JSON
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class IdeologyReflection(Base):
    """学生针对任务提交的反思。"""
    __tablename__ = "ideology_reflections"
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("ideology_tasks.id"), index=True)
    student_id = Column(Integer, ForeignKey("users.id"), index=True)
    response_text = Column(Text, default="")
    ai_feedback = Column(Text, default="")
    ai_dimensions = Column(JSON, default=dict)  # {专业关联度,表达完整性,伦理意识,反思深度}
    teacher_comment = Column(Text, default="")
    score = Column(Float, default=0.0)
    submitted_at = Column(DateTime, default=datetime.utcnow, index=True)


class IdeologyAnalyticsEvent(Base):
    """思政模块学习行为埋点（便于效果分析）。"""
    __tablename__ = "ideology_analytics_events"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    task_id = Column(Integer, ForeignKey("ideology_tasks.id"), index=True, nullable=True)
    chapter = Column(String(64), default="", index=True)
    event_type = Column(String(32), default="")  # view / submit / regenerate / publish ...
    duration_ms = Column(Integer, default=0)
    payload = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
