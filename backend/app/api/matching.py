from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.auth import get_current_user
from app.db.models import User
from app.services.matching_engine import QualificationMatchingEngine

router = APIRouter(prefix="/api/matching", tags=["Qualification Matching"])

class MatchingEvaluationRequest(BaseModel):
    trade_category: str
    years_experience: float
    tools_used: List[str]
    tasks_performed: List[str]
    work_environment: Optional[str] = ""
    informal_training: Optional[str] = ""

@router.post("/evaluate")
def evaluate_matching(
    req: MatchingEvaluationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        results = QualificationMatchingEngine.evaluate(
            db=db,
            trade_category=req.trade_category,
            years_experience=req.years_experience,
            tools_used=req.tools_used,
            tasks_performed=req.tasks_performed,
            work_environment=req.work_environment,
            informal_training=req.informal_training
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compute qualification matches: {str(e)}")
