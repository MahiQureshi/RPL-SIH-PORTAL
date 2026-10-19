from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.auth import get_current_user
from app.db.models import User, Assessment, AssessmentReview, AuditEvent

router = APIRouter(prefix="/api/reviews", tags=["Human Review and Sign-Off"])

class SignOffRequest(BaseModel):
    assessment_id: str
    decision: str  # 'RECOMMENDED_FOR_CERTIFICATION', 'RETURN_FOR_CORRECTION', 'REQUEST_REASSESSMENT'
    decision_notes: str

@router.post("/sign-off")
def submit_sign_off(
    req: SignOffRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["ASSESSOR", "ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only authorized assessors or administrators may execute certification review sign-off."
        )

    a = db.query(Assessment).filter(Assessment.id == req.assessment_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Assessment record not found.")

    decision_normalized = req.decision.upper()
    valid_decisions = ["RECOMMENDED_FOR_CERTIFICATION", "RETURN_FOR_CORRECTION", "REQUEST_REASSESSMENT"]
    if decision_normalized not in valid_decisions:
        raise HTTPException(status_code=400, detail=f"Invalid decision. Must be one of: {', '.join(valid_decisions)}")

    review = db.query(AssessmentReview).filter(AssessmentReview.assessment_id == a.id).first()
    if review:
        review.reviewer_id = current_user.id
        review.decision = decision_normalized
        review.decision_notes = req.decision_notes
        review.reviewed_at = datetime.now(timezone.utc)
    else:
        review = AssessmentReview(
            assessment_id=a.id,
            reviewer_id=current_user.id,
            decision=decision_normalized,
            decision_notes=req.decision_notes,
            recommendation_status="RECOMMENDED" if decision_normalized == "RECOMMENDED_FOR_CERTIFICATION" else "PENDING_ACTION"
        )
        db.add(review)

    # Update assessment & assignment states accordingly
    if decision_normalized == "RECOMMENDED_FOR_CERTIFICATION":
        a.status = "CERTIFIED"
        if a.assignment:
            a.assignment.status = "COMPLETED"
    elif decision_normalized == "RETURN_FOR_CORRECTION":
        a.status = "IN_PROGRESS"
        if a.assignment:
            a.assignment.status = "IN_PROGRESS"
    elif decision_normalized == "REQUEST_REASSESSMENT":
        a.status = "REQUIRES_REASSESSMENT"
        if a.assignment:
            a.assignment.status = "AWAITING_REVIEW"

    audit = AuditEvent(
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        actor_role=current_user.role,
        event_type="HUMAN_SIGN_OFF",
        record_type="ASSESSMENT_REVIEW",
        record_id=review.id,
        details=f"Assessor {current_user.full_name} submitted review decision: {decision_normalized}. Note: {req.decision_notes}"
    )
    db.add(audit)
    db.commit()

    return {
        "success": True,
        "review_id": review.id,
        "decision": decision_normalized,
        "assessment_status": a.status,
        "recommendation_disclaimer": "This recommendation is recorded for official human review. In production, final National Certificate issuance is administered by the respective Sector Skill Council / NCVET."
    }
