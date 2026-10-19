from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.auth import get_current_user, require_role
from app.db.models import User, Assignment, Assessment, Qualification, AuditEvent

router = APIRouter(prefix="/api/assignments", tags=["Assignments"])

class CreateAssignmentRequest(BaseModel):
    candidate_id: str
    assessor_id: str
    qualification_id: str
    scheduled_date: str
    due_date: str
    location: Optional[str] = "Regional Skill Assessment Centre"
    assessment_mode: Optional[str] = "IN_PERSON"
    priority: Optional[str] = "NORMAL"
    instructions: Optional[str] = None

class UpdateStatusRequest(BaseModel):
    status: str
    reason: Optional[str] = None

@router.get("")
def list_assignments(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Assignment)

    # RBAC Scoping
    if current_user.role == "ASSESSOR":
        query = query.filter(Assignment.assessor_id == current_user.id)
    elif current_user.role == "WORKER":
        query = query.filter(Assignment.candidate_id == current_user.id)
    # Admin sees all

    if status_filter:
        query = query.filter(Assignment.status == status_filter.upper())

    assignments = query.order_by(Assignment.created_at.desc()).all()
    results = []

    for a in assignments:
        cand = a.candidate
        assess = a.assessor
        qp = a.qualification
        results.append({
            "id": a.id,
            "candidate": {
                "id": cand.id,
                "name": cand.full_name,
                "email": cand.email,
                "phone": cand.worker_profile.phone if cand.worker_profile else None
            },
            "assessor": {
                "id": assess.id,
                "name": assess.full_name,
                "email": assess.email,
                "employee_id": assess.assessor_profile.employee_id if assess.assessor_profile else None
            },
            "qualification": {
                "id": qp.id,
                "qp_code": qp.qp_code,
                "title": qp.title,
                "nsqf_level": qp.nsqf_level
            },
            "scheduled_date": a.scheduled_date,
            "due_date": a.due_date,
            "location": a.location,
            "assessment_mode": a.assessment_mode,
            "priority": a.priority,
            "status": a.status,
            "instructions": a.instructions,
            "has_assessment": a.assessment is not None,
            "assessment_id": a.assessment.id if a.assessment else None,
            "created_at": a.created_at.isoformat() if a.created_at else None
        })
    return results

@router.get("/{id}")
def get_assignment(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    a = db.query(Assignment).filter(Assignment.id == id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Assignment not found.")

    # Access control
    if current_user.role == "ASSESSOR" and a.assessor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized access to this assignment.")
    if current_user.role == "WORKER" and a.candidate_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized access to this assignment.")

    return {
        "id": a.id,
        "candidate": {
            "id": a.candidate.id,
            "name": a.candidate.full_name,
            "email": a.candidate.email,
            "phone": a.candidate.worker_profile.phone if a.candidate.worker_profile else None
        },
        "assessor": {
            "id": a.assessor.id,
            "name": a.assessor.full_name,
            "email": a.assessor.email
        },
        "qualification": {
            "id": a.qualification.id,
            "qp_code": a.qualification.qp_code,
            "title": a.qualification.title,
            "nsqf_level": a.qualification.nsqf_level
        },
        "scheduled_date": a.scheduled_date,
        "due_date": a.due_date,
        "location": a.location,
        "assessment_mode": a.assessment_mode,
        "priority": a.priority,
        "status": a.status,
        "instructions": a.instructions,
        "assessment_id": a.assessment.id if a.assessment else None
    }

@router.post("")
def create_assignment(
    req: CreateAssignmentRequest,
    current_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    # Verify candidate exists
    candidate = db.query(User).filter(User.id == req.candidate_id, User.role == "WORKER").first()
    if not candidate:
        raise HTTPException(status_code=400, detail="Valid candidate not found.")

    # Verify assessor exists
    assessor = db.query(User).filter(User.id == req.assessor_id, User.role == "ASSESSOR").first()
    if not assessor:
        raise HTTPException(status_code=400, detail="Valid assessor not found.")

    # Verify qualification exists
    qp = db.query(Qualification).filter(Qualification.id == req.qualification_id).first()
    if not qp:
        raise HTTPException(status_code=400, detail="Valid qualification not found.")

    assignment = Assignment(
        candidate_id=req.candidate_id,
        assessor_id=req.assessor_id,
        qualification_id=req.qualification_id,
        scheduled_date=req.scheduled_date,
        due_date=req.due_date,
        location=req.location or "Regional Skill Assessment Centre",
        assessment_mode=req.assessment_mode or "IN_PERSON",
        priority=req.priority or "NORMAL",
        status="ASSIGNED",
        instructions=req.instructions
    )
    db.add(assignment)
    db.flush()

    # Automatically initialize linked assessment workspace
    assessment = Assessment(
        assignment_id=assignment.id,
        candidate_id=assignment.candidate_id,
        assessor_id=assignment.assessor_id,
        qualification_id=assignment.qualification_id,
        rubric_version=f"{qp.version}-NCVET",
        status="NOT_STARTED"
    )
    db.add(assessment)

    audit = AuditEvent(
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        actor_role=current_user.role,
        event_type="ASSIGNMENT_CREATED",
        record_type="ASSIGNMENT",
        record_id=assignment.id,
        details=f"Admin assigned candidate {candidate.full_name} to assessor {assessor.full_name} for QP {qp.qp_code}"
    )
    db.add(audit)
    db.commit()

    return {
        "success": True,
        "assignment_id": assignment.id,
        "assessment_id": assessment.id,
        "status": assignment.status
    }

@router.patch("/{id}/status")
def update_assignment_status(
    id: str,
    req: UpdateStatusRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    a = db.query(Assignment).filter(Assignment.id == id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Assignment not found.")

    # Assessors can accept or start assignments; Admins can do anything
    if current_user.role == "ASSESSOR" and a.assessor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized.")

    old_status = a.status
    a.status = req.status.upper()

    # If status becomes IN_PROGRESS, also update assessment status
    if a.status == "IN_PROGRESS" and a.assessment and a.assessment.status == "NOT_STARTED":
        a.assessment.status = "IN_PROGRESS"

    audit = AuditEvent(
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        actor_role=current_user.role,
        event_type="ASSIGNMENT_STATUS_UPDATED",
        record_type="ASSIGNMENT",
        record_id=a.id,
        details=f"Status transitioned from {old_status} to {a.status}. Reason: {req.reason or 'Normal workflow'}"
    )
    db.add(audit)
    db.commit()

    return {"success": True, "status": a.status}
