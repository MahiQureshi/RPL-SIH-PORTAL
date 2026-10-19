import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base

def generate_uuid():
    return str(uuid.uuid4())

def get_utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)  # 'WORKER', 'ASSESSOR', 'ADMIN'
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=get_utc_now)

    worker_profile = relationship("WorkerProfile", back_populates="user", uselist=False)
    assessor_profile = relationship("AssessorProfile", back_populates="user", uselist=False)
    declarations = relationship("Declaration", back_populates="worker")


class WorkerProfile(Base):
    __tablename__ = "worker_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    phone = Column(String(20), nullable=True)
    aadhaar_masked = Column(String(20), nullable=True)  # e.g. "XXXX-XXXX-4912"
    preferred_language = Column(String(10), default="en")
    years_experience = Column(Float, default=0.0)
    trade_preference = Column(String(100), nullable=True)
    address = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=get_utc_now)

    user = relationship("User", back_populates="worker_profile")


class AssessorProfile(Base):
    __tablename__ = "assessor_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    employee_id = Column(String(50), unique=True, nullable=False)
    authorized_trades = Column(JSON, default=list)  # e.g. ["CON/Q0601", "ELE/Q3102"]
    accreditation_number = Column(String(100), nullable=True)
    organization = Column(String(255), nullable=True)
    active_status = Column(Boolean, default=True)

    user = relationship("User", back_populates="assessor_profile")


class Qualification(Base):
    __tablename__ = "qualifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    qp_code = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    nsqf_level = Column(Integer, nullable=False)
    awarding_body = Column(String(255), nullable=False)
    version = Column(String(20), default="1.0")
    source_document = Column(String(255), nullable=True)
    status = Column(String(50), default="VERIFIED")  # 'VERIFIED', 'PROTOTYPE'
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)

    competencies = relationship("Competency", back_populates="qualification", cascade="all, delete-orphan")
    assessment_tasks = relationship("AssessmentTask", back_populates="qualification", cascade="all, delete-orphan")


class Competency(Base):
    __tablename__ = "competencies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    qualification_id = Column(String(36), ForeignKey("qualifications.id"), nullable=False)
    nos_code = Column(String(50), index=True, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    scope = Column(Text, nullable=True)
    weightage = Column(Float, default=20.0)

    qualification = relationship("Qualification", back_populates="competencies")
    criteria = relationship("AssessmentCriterion", back_populates="competency", cascade="all, delete-orphan")


class AssessmentCriterion(Base):
    __tablename__ = "assessment_criteria"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    competency_id = Column(String(36), ForeignKey("competencies.id"), nullable=False)
    pc_code = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    required_performance = Column(Text, nullable=True)
    observable_indicator = Column(Text, nullable=True)
    max_score = Column(Float, default=10.0)

    competency = relationship("Competency", back_populates="criteria")


class AssessmentTask(Base):
    __tablename__ = "assessment_tasks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    qualification_id = Column(String(36), ForeignKey("qualifications.id"), nullable=False)
    task_number = Column(Integer, nullable=False)
    task_name = Column(String(255), nullable=False)
    competency_nos_code = Column(String(50), nullable=False)
    instructions = Column(Text, nullable=False)
    tools_required = Column(JSON, default=list)
    safety_precautions = Column(JSON, default=list)
    evidence_required = Column(Text, nullable=True)

    qualification = relationship("Qualification", back_populates="assessment_tasks")


class Declaration(Base):
    __tablename__ = "declarations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    worker_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    trade_category = Column(String(100), nullable=False)
    years_experience = Column(Float, nullable=False)
    tools_used = Column(JSON, default=list)
    tasks_performed = Column(JSON, default=list)
    informal_training = Column(Text, nullable=True)
    work_environment = Column(String(100), nullable=True)
    status = Column(String(50), default="SUBMITTED")  # 'DRAFT', 'SUBMITTED', 'CONFIRMED'
    confirmed_qp_code = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    worker = relationship("User", back_populates="declarations")


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    candidate_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    assessor_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    qualification_id = Column(String(36), ForeignKey("qualifications.id"), nullable=False)
    scheduled_date = Column(String(50), nullable=False)
    due_date = Column(String(50), nullable=False)
    location = Column(String(255), default="Regional Skill Assessment Centre")
    assessment_mode = Column(String(50), default="IN_PERSON")  # 'IN_PERSON', 'HYBRID'
    priority = Column(String(20), default="NORMAL")  # 'NORMAL', 'HIGH', 'URGENT'
    status = Column(String(50), default="ASSIGNED")  # 'DRAFT', 'ASSIGNED', 'IN_PROGRESS', 'AWAITING_REVIEW', 'COMPLETED'
    instructions = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    candidate = relationship("User", foreign_keys=[candidate_id])
    assessor = relationship("User", foreign_keys=[assessor_id])
    qualification = relationship("Qualification")
    assessment = relationship("Assessment", back_populates="assignment", uselist=False)


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    assignment_id = Column(String(36), ForeignKey("assignments.id"), unique=True, nullable=False)
    candidate_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    assessor_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    qualification_id = Column(String(36), ForeignKey("qualifications.id"), nullable=False)
    rubric_version = Column(String(20), default="1.0-NCVET")
    status = Column(String(50), default="IN_PROGRESS")  # 'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'CERTIFIED'
    total_score = Column(Float, default=0.0)
    max_possible_score = Column(Float, default=100.0)
    percentage = Column(Float, default=0.0)
    competency_outcome = Column(String(50), default="PENDING")  # 'COMPETENT', 'PARTIALLY_DEMONSTRATED', 'NOT_YET_DEMONSTRATED'
    assessor_summary_notes = Column(Text, nullable=True)
    started_at = Column(DateTime, default=get_utc_now)
    completed_at = Column(DateTime, nullable=True)

    assignment = relationship("Assignment", back_populates="assessment")
    candidate = relationship("User", foreign_keys=[candidate_id])
    assessor = relationship("User", foreign_keys=[assessor_id])
    qualification = relationship("Qualification")
    scores = relationship("CriterionScore", back_populates="assessment", cascade="all, delete-orphan")
    evidence_items = relationship("EvidenceMetadata", back_populates="assessment", cascade="all, delete-orphan")
    review = relationship("AssessmentReview", back_populates="assessment", uselist=False)


class CriterionScore(Base):
    __tablename__ = "criterion_scores"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    assessment_id = Column(String(36), ForeignKey("assessments.id"), nullable=False)
    task_id = Column(String(36), ForeignKey("assessment_tasks.id"), nullable=True)
    criterion_id = Column(String(36), ForeignKey("assessment_criteria.id"), nullable=False)
    score_level = Column(String(50), nullable=False)  # 'COMPETENT', 'PARTIALLY_DEMONSTRATED', 'NOT_DEMONSTRATED', 'NOT_ASSESSED'
    numeric_score = Column(Float, default=0.0)
    assessor_notes = Column(Text, nullable=True)
    evidence_reference = Column(String(255), nullable=True)
    assessed_at = Column(DateTime, default=get_utc_now)

    assessment = relationship("Assessment", back_populates="scores")
    criterion = relationship("AssessmentCriterion")
    task = relationship("AssessmentTask")


class EvidenceMetadata(Base):
    __tablename__ = "evidence_metadata"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    assessment_id = Column(String(36), ForeignKey("assessments.id"), nullable=False)
    task_id = Column(String(36), ForeignKey("assessment_tasks.id"), nullable=True)
    candidate_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    file_path = Column(String(255), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)
    file_size = Column(Integer, default=0)
    title = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    review_status = Column(String(50), default="ACCEPTED")  # 'PENDING', 'ACCEPTED', 'REJECTED'
    ai_quality_flag = Column(String(50), default="VALID")  # 'VALID', 'BLURRY_FLAG', 'INCOMPLETE'
    uploaded_at = Column(DateTime, default=get_utc_now)

    assessment = relationship("Assessment", back_populates="evidence_items")


class AssessmentReview(Base):
    __tablename__ = "assessment_reviews"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    assessment_id = Column(String(36), ForeignKey("assessments.id"), unique=True, nullable=False)
    reviewer_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    decision = Column(String(50), nullable=False)  # 'RECOMMENDED_FOR_CERTIFICATION', 'RETURN_FOR_CORRECTION', 'REQUEST_REASSESSMENT'
    decision_notes = Column(Text, nullable=False)
    recommendation_status = Column(String(50), default="RECOMMENDED")
    reviewed_at = Column(DateTime, default=get_utc_now)

    assessment = relationship("Assessment", back_populates="review")
    reviewer = relationship("User")


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    actor_id = Column(String(36), nullable=False)
    actor_name = Column(String(255), nullable=False)
    actor_role = Column(String(50), nullable=False)
    event_type = Column(String(100), nullable=False)
    record_type = Column(String(50), nullable=False)
    record_id = Column(String(36), nullable=False)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=get_utc_now)


class InterAssessorEvaluation(Base):
    __tablename__ = "inter_assessor_evaluations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    candidate_code = Column(String(50), nullable=False)
    criterion_code = Column(String(50), nullable=False)
    criterion_title = Column(String(255), nullable=False)
    assessor_1_name = Column(String(100), nullable=False)
    assessor_1_score = Column(String(50), nullable=False)  # 'COMPETENT', 'PARTIALLY_DEMONSTRATED', 'NOT_DEMONSTRATED'
    assessor_2_name = Column(String(100), nullable=False)
    assessor_2_score = Column(String(50), nullable=False)
    evaluation_mode = Column(String(50), default="STANDARDIZED_RUBRIC_ASSISTED")
    trial_date = Column(String(50), nullable=False)
