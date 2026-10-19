from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.auth import get_current_user
from app.db.models import User, Declaration, AuditEvent

router = APIRouter(prefix="/api/declarations", tags=["Declarations"])

class DeclarationCreateRequest(BaseModel):
    trade_category: str
    years_experience: float
    tools_used: List[str]
    tasks_performed: List[str]
    informal_training: Optional[str] = ""
    work_environment: Optional[str] = ""
    status: Optional[str] = "SUBMITTED"  # 'DRAFT' or 'SUBMITTED'

class ConfirmQualificationRequest(BaseModel):
    qp_code: str

@router.get("/me")
def get_my_declaration(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    declaration = (
        db.query(Declaration)
        .filter(Declaration.worker_id == current_user.id)
        .order_by(Declaration.created_at.desc())
        .first()
    )
    if not declaration:
        return {"has_declaration": False, "declaration": None}
    
    return {
        "has_declaration": True,
        "declaration": {
            "id": declaration.id,
            "trade_category": declaration.trade_category,
            "years_experience": declaration.years_experience,
            "tools_used": declaration.tools_used or [],
            "tasks_performed": declaration.tasks_performed or [],
            "informal_training": declaration.informal_training,
            "work_environment": declaration.work_environment,
            "status": declaration.status,
            "confirmed_qp_code": declaration.confirmed_qp_code,
            "created_at": declaration.created_at.isoformat() if declaration.created_at else None,
            "updated_at": declaration.updated_at.isoformat() if declaration.updated_at else None
        }
    }

@router.post("")
def save_declaration(
    req: DeclarationCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    declaration = (
        db.query(Declaration)
        .filter(Declaration.worker_id == current_user.id)
        .first()
    )
    
    if declaration:
        declaration.trade_category = req.trade_category
        declaration.years_experience = req.years_experience
        declaration.tools_used = req.tools_used
        declaration.tasks_performed = req.tasks_performed
        declaration.informal_training = req.informal_training
        declaration.work_environment = req.work_environment
        declaration.status = req.status
    else:
        declaration = Declaration(
            worker_id=current_user.id,
            trade_category=req.trade_category,
            years_experience=req.years_experience,
            tools_used=req.tools_used,
            tasks_performed=req.tasks_performed,
            informal_training=req.informal_training,
            work_environment=req.work_environment,
            status=req.status
        )
        db.add(declaration)

    audit = AuditEvent(
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        actor_role=current_user.role,
        event_type="DECLARATION_SAVED",
        record_type="DECLARATION",
        record_id=declaration.id,
        details=f"Saved declaration with status {req.status} for trade {req.trade_category}"
    )
    db.add(audit)
    db.commit()

    return {
        "success": True,
        "declaration_id": declaration.id,
        "status": declaration.status
    }

@router.post("/confirm-qualification")
def confirm_qualification(
    req: ConfirmQualificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    declaration = (
        db.query(Declaration)
        .filter(Declaration.worker_id == current_user.id)
        .first()
    )
    if not declaration:
        raise HTTPException(status_code=404, detail="No experience declaration found to confirm.")
    
    declaration.confirmed_qp_code = req.qp_code
    declaration.status = "CONFIRMED"

    audit = AuditEvent(
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        actor_role=current_user.role,
        event_type="QUALIFICATION_CONFIRMED",
        record_type="DECLARATION",
        record_id=declaration.id,
        details=f"Candidate confirmed qualification preference for {req.qp_code}"
    )
    db.add(audit)
    db.commit()

    return {"success": True, "confirmed_qp_code": req.qp_code}
