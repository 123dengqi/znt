from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db import Base, SessionLocal, engine
from .models import User
from .routers import auth, cases, chat, graph, ideology, kb, lab, quiz, student, teacher
from .security import hash_password


def create_app() -> FastAPI:
    app = FastAPI(title="人格心理学教育智能体", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    Base.metadata.create_all(bind=engine)
    seed_users()
    _try_seed_quizzes()
    _try_seed_cases()
    _try_seed_ideology()

    app.include_router(auth.router)
    app.include_router(kb.router)
    app.include_router(chat.router)
    app.include_router(quiz.router)
    app.include_router(cases.router)
    app.include_router(student.router)
    app.include_router(teacher.router)
    app.include_router(lab.router)
    app.include_router(graph.router)
    app.include_router(ideology.router)

    @app.get("/api/health")
    def health():
        return {"status": "ok", "model": settings.DEEPSEEK_CHAT_MODEL}

    return app


def _try_seed_quizzes() -> None:
    """尝试运行预置测验种子；仅在缺失时插入。"""
    try:
        import sys
        from pathlib import Path

        root = Path(__file__).resolve().parents[1]
        if str(root) not in sys.path:
            sys.path.insert(0, str(root))
        import seed_quizzes  # type: ignore

        seed_quizzes.main()
    except Exception as e:  # pragma: no cover
        print(f"[seed_quizzes] skipped: {e}")


def _try_seed_cases() -> None:
    """尝试运行预置案例种子；仅在缺失时插入。"""
    try:
        import sys
        from pathlib import Path

        root = Path(__file__).resolve().parents[1]
        if str(root) not in sys.path:
            sys.path.insert(0, str(root))
        import seed_cases  # type: ignore

        seed_cases.main()
    except Exception as e:  # pragma: no cover
        print(f"[seed_cases] skipped: {e}")


def _try_seed_ideology() -> None:
    """尝试运行预置思政元素/映射/示例任务种子。"""
    try:
        import sys
        from pathlib import Path

        root = Path(__file__).resolve().parents[1]
        if str(root) not in sys.path:
            sys.path.insert(0, str(root))
        import seed_ideology  # type: ignore

        seed_ideology.main()
    except Exception as e:  # pragma: no cover
        print(f"[seed_ideology] skipped: {e}")


def seed_users() -> None:
    db = SessionLocal()
    try:
        if not db.query(User).filter(User.username == "teacher").first():
            db.add(User(username="teacher", password_hash=hash_password("teacher123"), role="teacher", name="演示教师"))
        if not db.query(User).filter(User.username == "student").first():
            db.add(User(username="student", password_hash=hash_password("student123"), role="student", name="演示学生"))
        db.commit()
    finally:
        db.close()


app = create_app()
