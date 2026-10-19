import os
import uuid
import shutil
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.config import settings
from app.api.auth import get_current_user
from app.db.models import User, EvidenceMetadata, Assessment, AuditEvent

router = APIRouter(prefix="/api/evidence", tags=["Evidence Management"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "application/pdf"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

class ReviewEvidenceRequest(BaseModel):
    review_status: str  # 'ACCEPTED', 'REJECTED'
    notes: Optional[str] = None

@router.post("/upload")
async def upload_evidence(
    assessment_id: str = Form(...),
    task_id: Optional[str] = Form(None),
    title: Optional[str] = Form("Assessment Evidence"),
    description: Optional[str] = Form(""),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    a = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Assessment not found.")

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{file.content_type}'. Allowed: JPEG, PNG, WebP, PDF."
        )

    # Secure unique file name
    ext = Path(file.filename).suffix or ".jpg"
    safe_filename = f"evd_{uuid.uuid4().hex[:12]}{ext}"
    dest_path = settings.EVIDENCE_DIR / safe_filename

    # Read and validate size
    contents = await file.read()
    file_size = len(contents)
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds maximum allowed size of 10 MB.")

    with open(dest_path, "wb") as f:
        f.write(contents)

    # Lightweight visual quality check (flags files that are suspiciously tiny/empty)
    quality_flag = "VALID"
    if file_size < 1024:
        quality_flag = "INCOMPLETE"

    metadata = EvidenceMetadata(
        assessment_id=a.id,
        task_id=task_id,
        candidate_id=a.candidate_id,
        file_path=f"/storage/evidence/{safe_filename}",
        file_name=file.filename,
        file_type=file.content_type,
        file_size=file_size,
        title=title,
        description=description,
        review_status="PENDING" if current_user.role == "WORKER" else "ACCEPTED",
        ai_quality_flag=quality_flag
    )
    db.add(metadata)

    audit = AuditEvent(
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        actor_role=current_user.role,
        event_type="EVIDENCE_UPLOADED",
        record_type="EVIDENCE",
        record_id=metadata.id,
        details=f"Uploaded evidence '{file.filename}' ({file_size} bytes). Quality: {quality_flag}"
    )
    db.add(audit)
    db.commit()

    return {
        "success": True,
        "evidence_id": metadata.id,
        "file_path": metadata.file_path,
        "file_name": metadata.file_name,
        "review_status": metadata.review_status,
        "ai_quality_flag": metadata.ai_quality_flag
    }

@router.patch("/{id}/review")
def review_evidence(
    id: str,
    req: ReviewEvidenceRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ev = db.query(EvidenceMetadata).filter(EvidenceMetadata.id == id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence item not found.")

    if current_user.role not in ["ASSESSOR", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Only assessors or admins can review evidence.")

    ev.review_status = req.review_status.upper()
    if req.notes:
        ev.description = f"{ev.description or ''} [Assessor Review: {req.notes}]".strip()

    audit = AuditEvent(
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        actor_role=current_user.role,
        event_type="EVIDENCE_REVIEWED",
        record_type="EVIDENCE",
        record_id=ev.id,
        details=f"Assessor set evidence status to {ev.review_status}."
    )
    db.add(audit)
    db.commit()

    return {"success": True, "review_status": ev.review_status}
