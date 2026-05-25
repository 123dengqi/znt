from __future__ import annotations

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import LearningEvent, QuizAttempt, User
from ..security import get_current_user

router = APIRouter(prefix="/api/student", tags=["student"])


@router.get("/overview")
def overview(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    since = datetime.utcnow() - timedelta(days=14)
    events = (
        db.query(LearningEvent)
        .filter(LearningEvent.user_id == user.id, LearningEvent.created_at >= since)
        .all()
    )

    by_module: dict[str, int] = {}
    for e in events:
        by_module[e.module] = by_module.get(e.module, 0) + 1

    last14 = []
    for i in range(13, -1, -1):
        day = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=i)
        nxt = day + timedelta(days=1)
        n = (
            db.query(LearningEvent)
            .filter(
                LearningEvent.user_id == user.id,
                LearningEvent.created_at >= day,
                LearningEvent.created_at < nxt,
            )
            .count()
        )
        last14.append({"date": day.strftime("%m-%d"), "count": n})

    attempts = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.user_id == user.id)
        .order_by(QuizAttempt.created_at.desc())
        .limit(10)
        .all()
    )
    avg_score = round(float(db.query(func.avg(QuizAttempt.score)).filter(QuizAttempt.user_id == user.id).scalar() or 0.0), 2)
    best_score = float(db.query(func.max(QuizAttempt.score)).filter(QuizAttempt.user_id == user.id).scalar() or 0.0)

    total_minutes = round(sum(e.duration_ms for e in events) / 60000.0, 1)

    return {
        "user": {"name": user.name or user.username, "username": user.username},
        "totals": {
            "events": len(events),
            "minutes": total_minutes,
            "quiz_count": len(attempts),
            "avg_score": avg_score,
            "best_score": best_score,
        },
        "by_module": by_module,
        "last14": last14,
        "recent_attempts": [
            {"id": a.id, "quiz_id": a.quiz_id, "score": a.score, "total": a.total, "created_at": a.created_at.isoformat()}
            for a in attempts
        ],
    }
