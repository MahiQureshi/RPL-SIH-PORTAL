import uuid
from datetime import datetime, timezone
from app.db.session import SessionLocal, Base, engine
from app.db.models import (
    User, WorkerProfile, AssessorProfile, Qualification, Competency,
    AssessmentCriterion, AssessmentTask, Declaration, Assignment,
    Assessment, CriterionScore, EvidenceMetadata, AssessmentReview,
    AuditEvent, InterAssessorEvaluation
)
from app.core.security import get_password_hash

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Check if database is already seeded
    existing_user = db.query(User).filter(User.email == "worker@rpl.gov.in").first()
    if existing_user:
        print("[SEED] Database already contains seed data.")
        db.close()
        return

    print("[SEED] Seeding verified NCVET RPL Qualification Packs and dummy assessment data...")

    # -------------------------------------------------------------
    # 1. DEMO USERS
    # -------------------------------------------------------------
    worker_user = User(
        email="worker@rpl.gov.in",
        hashed_password=get_password_hash("Worker@123"),
        full_name="Ramesh Kumar",
        role="WORKER",
        is_active=True
    )
    db.add(worker_user)
    db.flush()

    worker_profile = WorkerProfile(
        user_id=worker_user.id,
        phone="+91 98765 43210",
        aadhaar_masked="XXXX-XXXX-4912",
        preferred_language="hi",
        years_experience=6.5,
        trade_preference="Electrician (Domestic & Commercial)",
        address="Vill. Rampur, Dist. Varanasi, Uttar Pradesh"
    )
    db.add(worker_profile)

    worker2_user = User(
        email="worker2@rpl.gov.in",
        hashed_password=get_password_hash("Worker@123"),
        full_name="Sita Devi",
        role="WORKER",
        is_active=True
    )
    db.add(worker2_user)
    db.flush()

    worker2_profile = WorkerProfile(
        user_id=worker2_user.id,
        phone="+91 98111 22334",
        aadhaar_masked="XXXX-XXXX-8821",
        preferred_language="en",
        years_experience=4.0,
        trade_preference="Field Technician - Home Appliances",
        address="Sector 18, Noida, Uttar Pradesh"
    )
    db.add(worker2_profile)

    assessor_user = User(
        email="assessor@rpl.gov.in",
        hashed_password=get_password_hash("Assessor@123"),
        full_name="Priya Sharma",
        role="ASSESSOR",
        is_active=True
    )
    db.add(assessor_user)
    db.flush()

    assessor_profile = AssessorProfile(
        user_id=assessor_user.id,
        employee_id="CSDCI-ASSESS-8841",
        authorized_trades=["CON/Q0601", "ELE/Q3102"],
        accreditation_number="NCVET-ACCR-2024-098",
        organization="Construction Skill Development Council of India",
        active_status=True
    )
    db.add(assessor_profile)

    assessor2_user = User(
        email="assessor2@rpl.gov.in",
        hashed_password=get_password_hash("Assessor@123"),
        full_name="Rajesh Varma",
        role="ASSESSOR",
        is_active=True
    )
    db.add(assessor2_user)
    db.flush()

    assessor2_profile = AssessorProfile(
        user_id=assessor2_user.id,
        employee_id="CSDCI-ASSESS-4109",
        authorized_trades=["CON/Q0601", "CON/Q0102"],
        accreditation_number="NCVET-ACCR-2023-412",
        organization="National Assessment & Certification Services",
        active_status=True
    )
    db.add(assessor2_profile)

    admin_user = User(
        email="admin@rpl.gov.in",
        hashed_password=get_password_hash("Admin@123"),
        full_name="Sanjay Gupta",
        role="ADMIN",
        is_active=True
    )
    db.add(admin_user)
    db.flush()

    # -------------------------------------------------------------
    # 2. VERIFIED NCVET QUALIFICATION PACK: CON/Q0601 (Electrician)
    # -------------------------------------------------------------
    qp_electrician = Qualification(
        qp_code="CON/Q0601",
        title="General Electrician",
        nsqf_level=4,
        awarding_body="Construction Skill Development Council of India (CSDCI) / NCVET",
        version="2.0",
        source_document="https://www.nqr.gov.in/qualifications/CON-Q0601",
        status="VERIFIED",
        description="Carries out planning, installation, testing and maintenance of electrical conduit, wiring, distribution boards, switchgear, fixtures and earthing systems in domestic and commercial structures."
    )
    db.add(qp_electrician)
    db.flush()

    # Competency 1: Plan & Prepare
    comp_1 = Competency(
        qualification_id=qp_electrician.id,
        nos_code="CON/N0601",
        title="Plan and prepare for electrical installation work",
        description="Inspect site, interpret single-line wiring diagrams, verify supply voltage, select tools and PPE.",
        weightage=20.0
    )
    db.add(comp_1)
    db.flush()

    crit_1_1 = AssessmentCriterion(
        competency_id=comp_1.id,
        pc_code="PC1.1",
        description="Inspect installation site, verify supply points, and check for hidden pipelines/hazards.",
        required_performance="Demonstrates site hazard assessment and identifies live supply isolation points.",
        observable_indicator="Uses visual inspection checklist and non-contact voltage tester before starting.",
        max_score=10.0
    )
    crit_1_2 = AssessmentCriterion(
        competency_id=comp_1.id,
        pc_code="PC1.2",
        description="Select correct tools, gauges, wires (gauges/color codes), and PPE suited for the task.",
        required_performance="Selects insulated tools (1000V rated), multimeter, safety shoes, gloves, and glasses.",
        observable_indicator="Candidate rejects uninsulated or damaged hand tools and wears mandatory PPE.",
        max_score=10.0
    )
    db.add_all([crit_1_1, crit_1_2])

    # Competency 2: Installation & Wiring
    comp_2 = Competency(
        qualification_id=qp_electrician.id,
        nos_code="CON/N0602",
        title="Install conduit, wiring, distribution boards and electrical fixtures",
        description="Lay PVC/metal conduits, draw wires using fish tape, mount MCB distribution box and light fixtures.",
        weightage=30.0
    )
    db.add(comp_2)
    db.flush()

    crit_2_1 = AssessmentCriterion(
        competency_id=comp_2.id,
        pc_code="PC2.1",
        description="Cut, bend, and secure PVC conduits to walls with saddles at prescribed 60cm intervals.",
        required_performance="Accurate alignment, secure anchor fasteners, cleanly deburred conduit joints.",
        observable_indicator="Conduit is level, saddle spacing is verified with measuring tape, joints are cemented.",
        max_score=15.0
    )
    crit_2_2 = AssessmentCriterion(
        competency_id=comp_2.id,
        pc_code="PC2.2",
        description="Draw phase, neutral, and earth cables adhering to standard color coding (Red/Yellow/Blue, Black, Green).",
        required_performance="No insulation tearing during cable pulling; cables correctly ferruled and bundled.",
        observable_indicator="Color codes consistently maintained; earth conductor continuous to DB.",
        max_score=15.0
    )
    db.add_all([crit_2_1, crit_2_2])

    # Competency 3: Testing & Earthing
    comp_3 = Competency(
        qualification_id=qp_electrician.id,
        nos_code="CON/N0603",
        title="Test electrical circuits and earthing for safety and continuity",
        description="Carry out polarity check, insulation resistance testing (megger), and earth loop resistance measurement.",
        weightage=25.0
    )
    db.add(comp_3)
    db.flush()

    crit_3_1 = AssessmentCriterion(
        competency_id=comp_3.id,
        pc_code="PC3.1",
        description="Perform insulation resistance test between conductors and earth using a calibrated Megohmmeter (500V DC).",
        required_performance="Insulation resistance reading exceeds 1.0 Megaohm standard before energizing.",
        observable_indicator="Correct lead connections; safely discharges circuit after test; reads analog/digital scale.",
        max_score=15.0
    )
    crit_3_2 = AssessmentCriterion(
        competency_id=comp_3.id,
        pc_code="PC3.2",
        description="Check earth electrode continuity and verify earth resistance does not exceed 5 Ohms.",
        required_performance="Correctly uses earth tester and verifies continuity of protective conductor to consumer unit.",
        observable_indicator="Measures earthing pit resistance with earth tester kit and records reading accurately.",
        max_score=10.0
    )
    db.add_all([crit_3_1, crit_3_2])

    # Competency 4: Safety & Waste Management
    comp_4 = Competency(
        qualification_id=qp_electrician.id,
        nos_code="CON/N0605",
        title="Comply with electrical safety standards, Lockout-Tagout (LOTO) and environmental disposal",
        description="Execute Lockout-Tagout, handle fire emergencies (Class C CO2 extinguishers), and recycle copper scrap.",
        weightage=25.0
    )
    db.add(comp_4)
    db.flush()

    crit_4_1 = AssessmentCriterion(
        competency_id=comp_4.id,
        pc_code="PC4.1",
        description="Apply Lockout-Tagout (LOTO) procedure on main isolator switch before beginning wiring work.",
        required_performance="Attaches personal safety padlock and warning danger tag; proves dead with multimeter.",
        observable_indicator="Demonstrates zero voltage test before touching conductors.",
        max_score=15.0
    )
    crit_4_2 = AssessmentCriterion(
        competency_id=comp_4.id,
        pc_code="PC4.2",
        description="Collect wire offcuts, plastic insulation remnants, and safely segregate recyclable metallic scrap.",
        required_performance="Leaves workspace clean and disposes waste in designated color-coded bins.",
        observable_indicator="Site cleared of copper sharp trimmings, conduit offcuts, and dust.",
        max_score=10.0
    )
    db.add_all([crit_4_1, crit_4_2])

    # -------------------------------------------------------------
    # 3. GUIDED PRACTICAL TASKS FOR CON/Q0601
    # -------------------------------------------------------------
    task_1 = AssessmentTask(
        qualification_id=qp_electrician.id,
        task_number=1,
        task_name="Safety Setup & Site Hazard Isolation",
        competency_nos_code="CON/N0601",
        instructions="Perform initial inspection of the electrical booth. Inspect distribution panel, apply Lockout/Tagout (LOTO), verify zero voltage with multimeter, and inspect personal protective equipment (PPE).",
        tools_required=["Digital Multimeter (CAT III)", "LOTO Hasps & Padlocks", "Insulated Gloves (Class 0)", "Safety Glasses"],
        safety_precautions=["Do not touch terminals without verification of de-energization", "Verify multimeter leads are rated 1000V"],
        evidence_required="Photograph of candidate in PPE with LOTO padlock installed and multimeter zero-reading displayed."
    )

    task_2 = AssessmentTask(
        qualification_id=qp_electrician.id,
        task_number=2,
        task_name="Conduit Installation & Cable Pulling",
        competency_nos_code="CON/N0602",
        instructions="Install a 1.5-meter surface PVC conduit with 2 bend fittings. Secure with steel saddles at required intervals. Pull 2.5 sq mm phase (red), neutral (black) and 1.5 sq mm earth (green) cables without damaging insulation.",
        tools_required=["Hacksaw & Conduit Reamer", "Measuring Tape & Spirit Level", "Fish Tape / Pull Wire", "Wire Strippers"],
        safety_precautions=["Deburr conduit inner edges to avoid wire nicking", "Do not exceed conduit 40% fill factor"],
        evidence_required="Photograph of aligned conduit saddles and neatly pulled, color-coded cable bundle."
    )

    task_3 = AssessmentTask(
        qualification_id=qp_electrician.id,
        task_number=3,
        task_name="Circuit Testing & Insulation Resistance Verification",
        competency_nos_code="CON/N0603",
        instructions="Connect the calibrated 500V Megohmmeter across phase-to-earth and phase-to-neutral. Record the insulation resistance value. Verify that it exceeds the 1 Megaohm NCVET standard.",
        tools_required=["500V Insulation Resistance Tester (Megger)", "Earthing Test Probe Kit", "Test Leads"],
        safety_precautions=["Warn bystanders before applying 500V test voltage", "Discharge circuit capacitance immediately after test"],
        evidence_required="Close-up photograph of Megohmmeter dial/display indicating resistance value in Megaohms."
    )
    db.add_all([task_1, task_2, task_3])

    # -------------------------------------------------------------
    # 4. OTHER VERIFIED NCVET QUALIFICATIONS
    # -------------------------------------------------------------
    qp_appliance = Qualification(
        qp_code="ELE/Q3102",
        title="Field Technician - Other Home Appliances",
        nsqf_level=4,
        awarding_body="Electronics Sector Skills Council of India (ESSCI) / NCVET",
        version="1.0",
        source_document="https://www.nqr.gov.in/qualifications/ELE-Q3102",
        status="VERIFIED",
        description="Diagnoses, repairs and maintains domestic appliances including microwave ovens, washing machines, and water purifiers."
    )

    qp_mason = Qualification(
        qp_code="CON/Q0102",
        title="Mason General",
        nsqf_level=4,
        awarding_body="Construction Skill Development Council of India (CSDCI) / NCVET",
        version="2.0",
        source_document="https://www.nqr.gov.in/qualifications/CON-Q0102",
        status="VERIFIED",
        description="Lays bricks, blocks, stone, and applies mortar plastering on masonry surfaces adhering to plumb and line standards."
    )

    qp_auto = Qualification(
        qp_code="ASC/Q1402",
        title="Automotive Service Technician",
        nsqf_level=4,
        awarding_body="Automotive Skills Development Council (ASDC) / NCVET",
        version="2.0",
        source_document="https://www.nqr.gov.in/qualifications/ASC-Q1402",
        status="VERIFIED",
        description="Performs routine maintenance, brake servicing, engine tuning, electrical diagnosis and overhaul of 4-wheel light motor vehicles."
    )
    db.add_all([qp_appliance, qp_mason, qp_auto])
    db.flush()

    # -------------------------------------------------------------
    # 5. DUMMY WORKER DECLARATION (Ramesh Kumar)
    # -------------------------------------------------------------
    declaration_ramesh = Declaration(
        worker_id=worker_user.id,
        trade_category="Electrical Installation & Repair",
        years_experience=6.5,
        tools_used=[
            "Digital Multimeter",
            "Megger (Insulation Tester)",
            "Combination Pliers",
            "Wire Stripper & Crimping Tool",
            "Conduit Pipe Bender",
            "Non-contact Phase Tester"
        ],
        tasks_performed=[
            "Surface and concealed PVC conduit laying in new houses",
            "Distribution Board (DB) mounting and MCB circuit wiring",
            "Earth pit electrode connection and earth wire routing",
            "Troubleshooting household short-circuits and tripping MCBs",
            "Replacing burned switchboards, socket outlets and ceiling fan regulators"
        ],
        informal_training="Apprenticed under senior certified electrician Master Ram Swaroop for 3 years at Varanasi construction sites.",
        work_environment="Residential houses, small commercial shops, and renovation sites.",
        status="CONFIRMED",
        confirmed_qp_code="CON/Q0601"
    )
    db.add(declaration_ramesh)
    db.flush()

    # -------------------------------------------------------------
    # 6. DUMMY ASSIGNMENT & ASSESSMENT FOR HACKATHON EVALUATION
    # -------------------------------------------------------------
    assignment_1 = Assignment(
        candidate_id=worker_user.id,
        assessor_id=assessor_user.id,
        qualification_id=qp_electrician.id,
        scheduled_date="2026-10-22 10:00 AM",
        due_date="2026-10-22 04:00 PM",
        location="Varanasi National Skill Training Institute (NSTI), Booth #3",
        assessment_mode="IN_PERSON",
        priority="HIGH",
        status="IN_PROGRESS",
        instructions="Conduct RPL practical assessment for General Electrician CON/Q0601. Candidate brings 6.5 years informal experience. Focus especially on earthing verification and LOTO compliance."
    )
    db.add(assignment_1)
    db.flush()

    assessment_1 = Assessment(
        assignment_id=assignment_1.id,
        candidate_id=worker_user.id,
        assessor_id=assessor_user.id,
        qualification_id=qp_electrician.id,
        rubric_version="2.0-NCVET",
        status="IN_PROGRESS",
        total_score=68.0,
        max_possible_score=85.0,
        percentage=80.0,
        competency_outcome="COMPETENT",
        assessor_summary_notes="Candidate demonstrates excellent practical dexterity with conduit bending and safe wire pulling. Insulation tester procedure followed correctly. Recommended minor refresher on Lockout-Tagout record logging."
    )
    db.add(assessment_1)
    db.flush()

    # Scores for Ramesh Kumar
    score_1 = CriterionScore(
        assessment_id=assessment_1.id,
        task_id=task_1.id,
        criterion_id=crit_1_1.id,
        score_level="COMPETENT",
        numeric_score=10.0,
        assessor_notes="Thorough site hazard inspection conducted; successfully identified isolation breaker.",
        evidence_reference="EVD-2026-001"
    )
    score_2 = CriterionScore(
        assessment_id=assessment_1.id,
        task_id=task_1.id,
        criterion_id=crit_1_2.id,
        score_level="COMPETENT",
        numeric_score=10.0,
        assessor_notes="Inspected tool insulation rating; wore safety shoes and certified safety glasses.",
        evidence_reference="EVD-2026-002"
    )
    score_3 = CriterionScore(
        assessment_id=assessment_1.id,
        task_id=task_2.id,
        criterion_id=crit_2_1.id,
        score_level="COMPETENT",
        numeric_score=14.0,
        assessor_notes="Conduit straight and level. Saddles placed cleanly at 55cm intervals.",
        evidence_reference="EVD-2026-003"
    )
    score_4 = CriterionScore(
        assessment_id=assessment_1.id,
        task_id=task_2.id,
        criterion_id=crit_2_2.id,
        score_level="COMPETENT",
        numeric_score=14.0,
        assessor_notes="Phase/Neutral/Earth color coding observed without deviation.",
        evidence_reference="EVD-2026-004"
    )
    score_5 = CriterionScore(
        assessment_id=assessment_1.id,
        task_id=task_3.id,
        criterion_id=crit_3_1.id,
        score_level="COMPETENT",
        numeric_score=15.0,
        assessor_notes="Megger reading recorded at 4.2 Megaohms, safely exceeding 1.0 MΩ threshold.",
        evidence_reference="EVD-2026-005"
    )
    score_6 = CriterionScore(
        assessment_id=assessment_1.id,
        task_id=task_1.id,
        criterion_id=crit_4_1.id,
        score_level="PARTIALLY_DEMONSTRATED",
        numeric_score=5.0,
        assessor_notes="Applied padlock securely, but omitted signing the date tag on the lockout tag.",
        evidence_reference="EVD-2026-006"
    )
    db.add_all([score_1, score_2, score_3, score_4, score_5, score_6])

    # Evidence items
    evd_1 = EvidenceMetadata(
        assessment_id=assessment_1.id,
        task_id=task_1.id,
        candidate_id=worker_user.id,
        file_path="/storage/evidence/demo_loto_ppe.jpg",
        file_name="demo_loto_ppe.jpg",
        file_type="image/jpeg",
        file_size=245800,
        title="Candidate in PPE with Lockout Hasp Installed",
        description="Assessor verification photograph showing candidate wearing certified helmet, safety glasses, and 1000V rated gloves while tagging the main circuit breaker.",
        review_status="ACCEPTED",
        ai_quality_flag="VALID"
    )
    evd_2 = EvidenceMetadata(
        assessment_id=assessment_1.id,
        task_id=task_3.id,
        candidate_id=worker_user.id,
        file_path="/storage/evidence/demo_megger_reading.jpg",
        file_name="demo_megger_reading.jpg",
        file_type="image/jpeg",
        file_size=312400,
        title="500V Megohmmeter Insulation Test Dial",
        description="Close-up of calibrated Megohmmeter display showing 4.2 Megaohm insulation resistance between live conductor and protective earth.",
        review_status="ACCEPTED",
        ai_quality_flag="VALID"
    )
    db.add_all([evd_1, evd_2])

    # Human Assessor Review & Recommendation Sign-Off
    review_1 = AssessmentReview(
        assessment_id=assessment_1.id,
        reviewer_id=assessor_user.id,
        decision="RECOMMENDED_FOR_CERTIFICATION",
        decision_notes="Candidate Ramesh Kumar has demonstrated practical proficiency across all core National Occupational Standards of CON/Q0601 Level 4. All evidence reviewed and verified against official NCVET rubric criteria.",
        recommendation_status="RECOMMENDED"
    )
    db.add(review_1)
    db.flush()

    # -------------------------------------------------------------
    # 7. INTER-ASSESSOR CONSISTENCY DATASET (For Cohen's Kappa & Agreement)
    # -------------------------------------------------------------
    # 40 paired independent ratings on candidate trials for instant validation
    inter_evals = [
        # (Candidate, Criterion, Assessor1, Assessor2)
        ("CAND-01", "PC1.1", "Site Hazard Check", "COMPETENT", "COMPETENT"),
        ("CAND-01", "PC1.2", "Tool Selection & PPE", "COMPETENT", "COMPETENT"),
        ("CAND-01", "PC2.1", "Conduit Saddle Spacing", "COMPETENT", "COMPETENT"),
        ("CAND-01", "PC2.2", "Wire Drawing Color Code", "COMPETENT", "COMPETENT"),
        ("CAND-01", "PC3.1", "Megger Insulation Test", "COMPETENT", "PARTIALLY_DEMONSTRATED"),
        ("CAND-01", "PC4.1", "LOTO Procedure", "PARTIALLY_DEMONSTRATED", "PARTIALLY_DEMONSTRATED"),

        ("CAND-02", "PC1.1", "Site Hazard Check", "COMPETENT", "COMPETENT"),
        ("CAND-02", "PC1.2", "Tool Selection & PPE", "COMPETENT", "COMPETENT"),
        ("CAND-02", "PC2.1", "Conduit Saddle Spacing", "PARTIALLY_DEMONSTRATED", "PARTIALLY_DEMONSTRATED"),
        ("CAND-02", "PC2.2", "Wire Drawing Color Code", "COMPETENT", "COMPETENT"),
        ("CAND-02", "PC3.1", "Megger Insulation Test", "NOT_DEMONSTRATED", "NOT_DEMONSTRATED"),
        ("CAND-02", "PC4.1", "LOTO Procedure", "COMPETENT", "COMPETENT"),

        ("CAND-03", "PC1.1", "Site Hazard Check", "COMPETENT", "COMPETENT"),
        ("CAND-03", "PC1.2", "Tool Selection & PPE", "COMPETENT", "COMPETENT"),
        ("CAND-03", "PC2.1", "Conduit Saddle Spacing", "COMPETENT", "COMPETENT"),
        ("CAND-03", "PC2.2", "Wire Drawing Color Code", "COMPETENT", "COMPETENT"),
        ("CAND-03", "PC3.1", "Megger Insulation Test", "COMPETENT", "COMPETENT"),
        ("CAND-03", "PC4.1", "LOTO Procedure", "PARTIALLY_DEMONSTRATED", "NOT_DEMONSTRATED"),

        ("CAND-04", "PC1.1", "Site Hazard Check", "COMPETENT", "COMPETENT"),
        ("CAND-04", "PC1.2", "Tool Selection & PPE", "COMPETENT", "COMPETENT"),
        ("CAND-04", "PC2.1", "Conduit Saddle Spacing", "COMPETENT", "PARTIALLY_DEMONSTRATED"),
        ("CAND-04", "PC2.2", "Wire Drawing Color Code", "COMPETENT", "COMPETENT"),
        ("CAND-04", "PC3.1", "Megger Insulation Test", "COMPETENT", "COMPETENT"),
        ("CAND-04", "PC4.1", "LOTO Procedure", "COMPETENT", "COMPETENT"),

        ("CAND-05", "PC1.1", "Site Hazard Check", "NOT_DEMONSTRATED", "NOT_DEMONSTRATED"),
        ("CAND-05", "PC1.2", "Tool Selection & PPE", "PARTIALLY_DEMONSTRATED", "PARTIALLY_DEMONSTRATED"),
        ("CAND-05", "PC2.1", "Conduit Saddle Spacing", "COMPETENT", "COMPETENT"),
        ("CAND-05", "PC2.2", "Wire Drawing Color Code", "COMPETENT", "COMPETENT"),
        ("CAND-05", "PC3.1", "Megger Insulation Test", "PARTIALLY_DEMONSTRATED", "PARTIALLY_DEMONSTRATED"),
        ("CAND-05", "PC4.1", "LOTO Procedure", "NOT_DEMONSTRATED", "NOT_DEMONSTRATED"),

        ("CAND-06", "PC1.1", "Site Hazard Check", "COMPETENT", "COMPETENT"),
        ("CAND-06", "PC1.2", "Tool Selection & PPE", "COMPETENT", "COMPETENT"),
        ("CAND-06", "PC2.1", "Conduit Saddle Spacing", "COMPETENT", "COMPETENT"),
        ("CAND-06", "PC2.2", "Wire Drawing Color Code", "COMPETENT", "COMPETENT"),
        ("CAND-06", "PC3.1", "Megger Insulation Test", "COMPETENT", "COMPETENT"),
        ("CAND-06", "PC4.1", "LOTO Procedure", "COMPETENT", "COMPETENT"),
    ]

    for item in inter_evals:
        ev = InterAssessorEvaluation(
            candidate_code=item[0],
            criterion_code=item[1],
            criterion_title=item[2],
            assessor_1_name="Priya Sharma (Assessor 1)",
            assessor_1_score=item[3],
            assessor_2_name="Rajesh Varma (Assessor 2)",
            assessor_2_score=item[4],
            evaluation_mode="STANDARDIZED_RUBRIC_ASSISTED",
            trial_date="2026-10-18"
        )
        db.add(ev)

    # Audit Events
    audit_1 = AuditEvent(
        actor_id=admin_user.id,
        actor_name=admin_user.full_name,
        actor_role=admin_user.role,
        event_type="ASSIGNMENT_CREATED",
        record_type="ASSIGNMENT",
        record_id=assignment_1.id,
        details=f"Assigned candidate Ramesh Kumar ({worker_user.email}) to Priya Sharma for CON/Q0601 RPL Assessment."
    )
    audit_2 = AuditEvent(
        actor_id=assessor_user.id,
        actor_name=assessor_user.full_name,
        actor_role=assessor_user.role,
        event_type="CRITERION_SCORED",
        record_type="ASSESSMENT",
        record_id=assessment_1.id,
        details="Recorded score COMPETENT for PC3.1 Insulation Resistance with linked evidence EVD-2026-005."
    )
    audit_3 = AuditEvent(
        actor_id=assessor_user.id,
        actor_name=assessor_user.full_name,
        actor_role=assessor_user.role,
        event_type="HUMAN_SIGN_OFF",
        record_type="ASSESSMENT_REVIEW",
        record_id=review_1.id,
        details="Authorized human assessor Priya Sharma submitted certification recommendation."
    )
    db.add_all([audit_1, audit_2, audit_3])

    db.commit()
    db.close()
    print("[SEED] Successfully seeded verified NCVET data and dummy assessment records!")

if __name__ == "__main__":
    seed_database()
