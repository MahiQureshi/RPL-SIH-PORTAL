from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.auth import get_current_user
from app.db.models import (
    User, Assessment, CriterionScore, AssessmentCriterion,
    AssessmentTask, EvidenceMetadata, AuditEvent, AssessmentReview
)

router = APIRouter(prefix="/api/assessments", tags=["Assessments"])

class CriterionScoreSubmit(BaseModel):
    task_id: Optional[str] = None
    criterion_id: str
    score_level: str  # 'COMPETENT', 'PARTIALLY_DEMONSTRATED', 'NOT_DEMONSTRATED', 'NOT_ASSESSED'
    assessor_notes: Optional[str] = ""
    evidence_reference: Optional[str] = ""

class AssessmentSummarySubmit(BaseModel):
    assessor_summary_notes: str
    status: Optional[str] = "COMPLETED"  # 'IN_PROGRESS' or 'COMPLETED'

@router.get("/{id}")
def get_assessment(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    a = db.query(Assessment).filter(Assessment.id == id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Assessment workspace not found.")

    # Access control: Candidate, Assessor, or Admin
    if current_user.role == "ASSESSOR" and a.assessor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized access to this assessment.")
    if current_user.role == "WORKER" and a.candidate_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized access to this assessment.")

    qp = a.qualification
    tasks = sorted(qp.assessment_tasks, key=lambda x: x.task_number)

    # Format competencies & criteria
    competencies_data = []
    total_criteria_count = 0
    scored_criteria_count = 0

    scores_map = {s.criterion_id: s for s in a.scores}

    for comp in qp.competencies:
        comp_criteria = []
        for crit in comp.criteria:
            total_criteria_count += 1
            existing_score = scores_map.get(crit.id)
            if existing_score and existing_score.score_level != "NOT_ASSESSED":
                scored_criteria_count += 1

            comp_criteria.append({
                "id": crit.id,
                "pc_code": crit.pc_code,
                "description": crit.description,
                "required_performance": crit.required_performance,
                "observable_indicator": crit.observable_indicator,
                "max_score": crit.max_score,
                "score": {
                    "id": existing_score.id,
                    "score_level": existing_score.score_level,
                    "numeric_score": existing_score.numeric_score,
                    "assessor_notes": existing_score.assessor_notes,
                    "evidence_reference": existing_score.evidence_reference,
                    "assessed_at": existing_score.assessed_at.isoformat() if existing_score.assessed_at else None
                } if existing_score else None
            })

        competencies_data.append({
            "id": comp.id,
            "nos_code": comp.nos_code,
            "title": comp.title,
            "description": comp.description,
            "weightage": comp.weightage,
            "criteria": comp_criteria
        })

    tasks_data = []
    for t in tasks:
        tasks_data.append({
            "id": t.id,
            "task_number": t.task_number,
            "task_name": t.task_name,
            "competency_nos_code": t.competency_nos_code,
            "instructions": t.instructions,
            "tools_required": t.tools_required,
            "safety_precautions": t.safety_precautions,
            "evidence_required": t.evidence_required
        })

    evidence_data = []
    for ev in a.evidence_items:
        evidence_data.append({
            "id": ev.id,
            "task_id": ev.task_id,
            "file_path": ev.file_path,
            "file_name": ev.file_name,
            "file_type": ev.file_type,
            "file_size": ev.file_size,
            "title": ev.title,
            "description": ev.description,
            "review_status": ev.review_status,
            "ai_quality_flag": ev.ai_quality_flag,
            "uploaded_at": ev.uploaded_at.isoformat() if ev.uploaded_at else None
        })

    review_data = None
    if a.review:
        review_data = {
            "id": a.review.id,
            "reviewer_name": a.review.reviewer.full_name,
            "decision": a.review.decision,
            "decision_notes": a.review.decision_notes,
            "recommendation_status": a.review.recommendation_status,
            "reviewed_at": a.review.reviewed_at.isoformat() if a.review.reviewed_at else None
        }

    return {
        "id": a.id,
        "assignment_id": a.assignment_id,
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
            "id": qp.id,
            "qp_code": qp.qp_code,
            "title": qp.title,
            "nsqf_level": qp.nsqf_level,
            "awarding_body": qp.awarding_body,
            "version": qp.version
        },
        "rubric_version": a.rubric_version,
        "status": a.status,
        "total_score": a.total_score,
        "max_possible_score": a.max_possible_score,
        "percentage": a.percentage,
        "competency_outcome": a.competency_outcome,
        "assessor_summary_notes": a.assessor_summary_notes,
        "progress": {
            "total_criteria": total_criteria_count,
            "scored_criteria": scored_criteria_count,
            "completion_percentage": round((scored_criteria_count / total_criteria_count * 100), 1) if total_criteria_count > 0 else 0
        },
        "tasks": tasks_data,
        "competencies": competencies_data,
        "evidence": evidence_data,
        "review": review_data
    }

@router.post("/{id}/score")
def record_criterion_score(
    id: str,
    req: CriterionScoreSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    a = db.query(Assessment).filter(Assessment.id == id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Assessment not found.")

    if current_user.role != "ADMIN" and a.assessor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only assigned assessor or admin can score.")

    criterion = db.query(AssessmentCriterion).filter(AssessmentCriterion.id == req.criterion_id).first()
    if not criterion:
        raise HTTPException(status_code=404, detail="Assessment criterion not found.")

    # Deterministic Rubric Point Calculation
    max_pts = criterion.max_score or 10.0
    level = req.score_level.upper()
    if level == "COMPETENT":
        pts = max_pts
    elif level == "PARTIALLY_DEMONSTRATED":
        pts = round(max_pts * 0.5, 1)
    elif level == "NOT_DEMONSTRATED":
        pts = 0.0
    else:  # 'NOT_ASSESSED'
        pts = 0.0

    score_record = (
        db.query(CriterionScore)
        .filter(CriterionScore.assessment_id == a.id, CriterionScore.criterion_id == req.criterion_id)
        .first()
    )

    if score_record:
        score_record.score_level = level
        score_record.numeric_score = pts
        score_record.assessor_notes = req.assessor_notes
        score_record.evidence_reference = req.evidence_reference
        score_record.task_id = req.task_id
        score_record.assessed_at = datetime.now(timezone.utc)
    else:
        score_record = CriterionScore(
            assessment_id=a.id,
            task_id=req.task_id,
            criterion_id=req.criterion_id,
            score_level=level,
            numeric_score=pts,
            assessor_notes=req.assessor_notes,
            evidence_reference=req.evidence_reference
        )
        db.add(score_record)

    db.flush()

    # Recalculate deterministic assessment totals
    all_scores = db.query(CriterionScore).filter(CriterionScore.assessment_id == a.id).all()
    total_awarded = sum(s.numeric_score for s in all_scores if s.score_level != "NOT_ASSESSED")
    
    # Calculate max possible score from all criteria under this qualification
    all_criteria = []
    for c in a.qualification.competencies:
        all_criteria.extend(c.criteria)
    max_score = sum(crit.max_score for crit in all_criteria) or 100.0

    a.total_score = total_awarded
    a.max_possible_score = max_score
    a.percentage = round((total_awarded / max_score) * 100, 1) if max_score > 0 else 0.0

    # Determine Competency Outcome according to NCVET RPL rules (threshold >= 70%)
    if a.percentage >= 70.0:
        a.competency_outcome = "COMPETENT"
    elif a.percentage >= 40.0:
        a.competency_outcome = "PARTIALLY_DEMONSTRATED"
    else:
        a.competency_outcome = "NOT_YET_DEMONSTRATED"

    if a.status == "NOT_STARTED":
        a.status = "IN_PROGRESS"

    audit = AuditEvent(
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        actor_role=current_user.role,
        event_type="CRITERION_SCORED",
        record_type="CRITERION_SCORE",
        record_id=score_record.id,
        details=f"Scored {criterion.pc_code} as {level} ({pts}/{max_pts} pts). Notes: {req.assessor_notes}"
    )
    db.add(audit)
    db.commit()

    return {
        "success": True,
        "score_id": score_record.id,
        "score_level": level,
        "numeric_score": pts,
        "total_score": a.total_score,
        "percentage": a.percentage,
        "competency_outcome": a.competency_outcome
    }

@router.post("/{id}/summary")
def submit_assessment_summary(
    id: str,
    req: AssessmentSummarySubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    a = db.query(Assessment).filter(Assessment.id == id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Assessment not found.")

    if current_user.role != "ADMIN" and a.assessor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized.")

    a.assessor_summary_notes = req.assessor_summary_notes
    a.status = req.status.upper()
    if a.status == "COMPLETED":
        a.completed_at = datetime.now(timezone.utc)
        if a.assignment:
            a.assignment.status = "AWAITING_REVIEW"

    audit = AuditEvent(
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        actor_role=current_user.role,
        event_type="ASSESSMENT_COMPLETED",
        record_type="ASSESSMENT",
        record_id=a.id,
        details=f"Assessor submitted final assessment summary. Outcome: {a.competency_outcome} ({a.percentage}%)"
    )
    db.add(audit)
    db.commit()

    return {
        "success": True,
        "status": a.status,
        "competency_outcome": a.competency_outcome,
        "percentage": a.percentage
    }
