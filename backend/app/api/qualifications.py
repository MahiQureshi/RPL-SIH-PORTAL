from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Qualification, Competency, AssessmentCriterion, AssessmentTask

router = APIRouter(prefix="/api/qualifications", tags=["Qualifications"])

@router.get("")
def list_qualifications(query: str = None, nsqf_level: int = None, db: Session = Depends(get_db)):
    q = db.query(Qualification)
    if query:
        search_pattern = f"%{query}%"
        q = q.filter(
            (Qualification.title.ilike(search_pattern)) |
            (Qualification.qp_code.ilike(search_pattern)) |
            (Qualification.description.ilike(search_pattern))
        )
    if nsqf_level:
        q = q.filter(Qualification.nsqf_level == nsqf_level)
    
    qualifications = q.all()
    results = []
    for item in qualifications:
        results.append({
            "id": item.id,
            "qp_code": item.qp_code,
            "title": item.title,
            "nsqf_level": item.nsqf_level,
            "awarding_body": item.awarding_body,
            "version": item.version,
            "source_document": item.source_document,
            "status": item.status,
            "description": item.description,
            "competency_count": len(item.competencies),
            "task_count": len(item.assessment_tasks)
        })
    return results

@router.get("/{id}")
def get_qualification(id: str, db: Session = Depends(get_db)):
    qp = db.query(Qualification).filter(Qualification.id == id).first()
    if not qp:
        qp = db.query(Qualification).filter(Qualification.qp_code == id).first()
    if not qp:
        raise HTTPException(status_code=404, detail="Qualification record not found.")

    competencies_data = []
    for comp in qp.competencies:
        criteria_data = []
        for crit in comp.criteria:
            criteria_data.append({
                "id": crit.id,
                "pc_code": crit.pc_code,
                "description": crit.description,
                "required_performance": crit.required_performance,
                "observable_indicator": crit.observable_indicator,
                "max_score": crit.max_score
            })
        competencies_data.append({
            "id": comp.id,
            "nos_code": comp.nos_code,
            "title": comp.title,
            "description": comp.description,
            "weightage": comp.weightage,
            "criteria": criteria_data
        })

    tasks_data = []
    for t in sorted(qp.assessment_tasks, key=lambda x: x.task_number):
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

    return {
        "id": qp.id,
        "qp_code": qp.qp_code,
        "title": qp.title,
        "nsqf_level": qp.nsqf_level,
        "awarding_body": qp.awarding_body,
        "version": qp.version,
        "source_document": qp.source_document,
        "status": qp.status,
        "description": qp.description,
        "competencies": competencies_data,
        "assessment_tasks": tasks_data
    }
