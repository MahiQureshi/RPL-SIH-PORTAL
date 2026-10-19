from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from collections import Counter, defaultdict
from app.db.session import get_db
from app.db.models import (
    User, Assignment, Assessment, EvidenceMetadata,
    InterAssessorEvaluation, Qualification
)

router = APIRouter(prefix="/api/analytics", tags=["Analytics and Quality Assurance"])

@router.get("/overview")
def get_operational_overview(db: Session = Depends(get_db)):
    total_workers = db.query(User).filter(User.role == "WORKER").count()
    total_assessors = db.query(User).filter(User.role == "ASSESSOR").count()
    total_assignments = db.query(Assignment).count()
    active_assessments = db.query(Assessment).filter(Assessment.status.in_(["IN_PROGRESS", "AWAITING_REVIEW"])).count()
    certified_count = db.query(Assessment).filter(Assessment.status == "CERTIFIED").count()
    total_evidence = db.query(EvidenceMetadata).count()
    total_qualifications = db.query(Qualification).count()

    # Breakdown by status
    status_counts = defaultdict(int)
    for a in db.query(Assignment).all():
        status_counts[a.status] += 1

    return {
        "metrics": {
            "total_workers": total_workers,
            "total_assessors": total_assessors,
            "total_assignments": total_assignments,
            "active_assessments": active_assessments,
            "certified_count": certified_count,
            "total_evidence": total_evidence,
            "total_qualifications": total_qualifications
        },
        "assignment_status_distribution": dict(status_counts)
    }

@router.get("/consistency")
def get_inter_assessor_consistency(db: Session = Depends(get_db)):
    """
    Computes Exact Agreement, Adjacent Agreement, and Cohen's Kappa
    across independent paired assessor ratings on standardized candidate trial evidence.
    """
    evals = db.query(InterAssessorEvaluation).all()
    if not evals:
        return {
            "sample_size": 0,
            "exact_agreement_pct": 0.0,
            "cohens_kappa": 0.0,
            "interpretation": "Insufficient paired ratings available.",
            "confusion_matrix": {}
        }

    categories = ["COMPETENT", "PARTIALLY_DEMONSTRATED", "NOT_DEMONSTRATED"]
    cat_order = {cat: i for i, cat in enumerate(categories)}

    n = len(evals)
    exact_matches = 0
    adjacent_matches = 0

    matrix = {c1: {c2: 0 for c2 in categories} for c1 in categories}
    rater1_counts = Counter()
    rater2_counts = Counter()

    for item in evals:
        s1 = item.assessor_1_score
        s2 = item.assessor_2_score

        if s1 in matrix and s2 in matrix[s1]:
            matrix[s1][s2] += 1

        rater1_counts[s1] += 1
        rater2_counts[s2] += 1

        if s1 == s2:
            exact_matches += 1
            adjacent_matches += 1
        elif abs(cat_order.get(s1, 0) - cat_order.get(s2, 0)) <= 1:
            adjacent_matches += 1

    # Exact and Adjacent percentage
    po = exact_matches / n
    exact_agreement_pct = round(po * 100, 1)
    adjacent_agreement_pct = round((adjacent_matches / n) * 100, 1)

    # Expected Agreement by Chance (Pe)
    pe = sum((rater1_counts[cat] / n) * (rater2_counts[cat] / n) for cat in categories)

    # Cohen's Kappa
    if (1 - pe) != 0:
        kappa = (po - pe) / (1 - pe)
    else:
        kappa = 1.0
    kappa = round(kappa, 3)

    # Landis & Koch Interpretation
    if kappa >= 0.81:
        interpretation = "Almost Perfect Agreement (Extremely High Inter-Assessor Reliability)"
    elif kappa >= 0.61:
        interpretation = "Substantial Agreement (Standard NCVET-Compliant Benchmark Met)"
    elif kappa >= 0.41:
        interpretation = "Moderate Agreement (Acceptable, Refresher Training Recommended)"
    else:
        interpretation = "Fair or Low Agreement (Requires Rubric Calibration)"

    return {
        "sample_size": n,
        "criteria_evaluated": len(set(e.criterion_code for e in evals)),
        "assessors_compared": ["Priya Sharma (Assessor 1)", "Rajesh Varma (Assessor 2)"],
        "exact_agreement_pct": exact_agreement_pct,
        "adjacent_agreement_pct": adjacent_agreement_pct,
        "cohens_kappa": kappa,
        "chance_expected_agreement_pct": round(pe * 100, 1),
        "interpretation": interpretation,
        "rubric_scale": "3-Level Ordinal (Competent, Partially Demonstrated, Not Demonstrated)",
        "confusion_matrix": matrix,
        "evaluation_dataset_note": "Calculated from controlled dual-assessor trial benchmarks on NCVET Domestic Electrician CON/Q0601 practical tasks."
    }
