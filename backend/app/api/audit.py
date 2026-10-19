from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.auth import require_role
from app.db.models import User, AuditEvent

router = APIRouter(prefix="/api/audit", tags=["Audit Trail"])

@router.get("")
def get_audit_trail(
    limit: int = 50,
    current_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    events = (
        db.query(AuditEvent)
        .order_by(AuditEvent.timestamp.desc())
        .limit(limit)
        .all()
    )
    results = []
    for ev in events:
        results.append({
            "id": ev.id,
            "actor_id": ev.actor_id,
            "actor_name": ev.actor_name,
            "actor_role": ev.actor_role,
            "event_type": ev.event_type,
            "record_type": ev.record_type,
            "record_id": ev.record_id,
            "details": ev.details,
            "timestamp": ev.timestamp.isoformat() if ev.timestamp else None
        })
    return results
