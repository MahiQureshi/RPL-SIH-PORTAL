"""
End-to-End Automated Test Suite for RPL SIH National Platform
Validates Authentication, RBAC, NCVET Qualification Packs, Matching,
Scoring Rubrics, Human Sign-Off, Consistency Analytics, and Audit Events.
"""

import urllib.request
import urllib.parse
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

def make_request(path, method="GET", data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    encoded_data = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=encoded_data, headers=headers, method=method)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def run_tests():
    print("=" * 70)
    print("STARTING RPL SIH NATIONAL PLATFORM E2E ACCEPTANCE TEST SUITE")
    print("=" * 70)

    # 1. Health check
    print("\n[TEST 1] Testing Health Endpoint...")
    health = make_request("/api/health")
    assert health["status"] == "healthy", "Health status must be healthy"
    print("[PASS] Health Check Passed:", health["service"], f"({health['mode']})")

    # 2. Authentication & Demo Logins
    print("\n[TEST 2] Testing Role-Based Authentication & Demo Logins...")
    worker_auth = make_request("/api/auth/demo-login", "POST", {"role": "WORKER"})
    assert worker_auth["user"]["role"] == "WORKER"
    worker_token = worker_auth["access_token"]
    print("[PASS] Worker Demo Login Passed: Logged in as", worker_auth["user"]["full_name"])

    assessor_auth = make_request("/api/auth/demo-login", "POST", {"role": "ASSESSOR"})
    assert assessor_auth["user"]["role"] == "ASSESSOR"
    assessor_token = assessor_auth["access_token"]
    print("[PASS] Assessor Demo Login Passed: Logged in as", assessor_auth["user"]["full_name"])

    admin_auth = make_request("/api/auth/demo-login", "POST", {"role": "ADMIN"})
    assert admin_auth["user"]["role"] == "ADMIN"
    admin_token = admin_auth["access_token"]
    print("[PASS] Admin Demo Login Passed: Logged in as", admin_auth["user"]["full_name"])

    # 3. NCVET Qualification Packs
    print("\n[TEST 3] Testing NCVET Qualification Packs Retrieval...")
    qps = make_request("/api/qualifications", token=worker_token)
    assert len(qps) >= 4, f"Expected at least 4 QPs, got {len(qps)}"
    electrician_qp = next((q for q in qps if q["qp_code"] == "CON/Q0601"), None)
    assert electrician_qp is not None, "CON/Q0601 must be present"
    print(f"[PASS] Found {len(qps)} NCVET Qualification Packs. Verified primary QP: {electrician_qp['title']} (NSQF Level {electrician_qp['nsqf_level']})")

    # 4. Worker Experience Declaration
    print("\n[TEST 4] Testing Worker Experience Declaration...")
    decl_payload = {
        "trade_category": "Electrical Installation & Repair",
        "years_experience": 6.5,
        "tools_used": ["Digital Multimeter", "Megger", "Wire Stripper", "Conduit Bender", "Combination Pliers"],
        "tasks_performed": [
            "Surface and concealed PVC conduit laying in new houses",
            "Distribution Board (DB) mounting and MCB circuit wiring",
            "Earth pit electrode connection and earth wire routing",
            "Troubleshooting household short-circuits"
        ],
        "informal_training": "Apprenticed for 3 years under Master Craftsman Ram Swaroop",
        "work_environment": "Residential & commercial renovation sites",
        "status": "SUBMITTED"
    }
    decl_res = make_request("/api/declarations", "POST", decl_payload, token=worker_token)
    assert decl_res["success"] is True
    print("[PASS] Worker declaration saved and submitted successfully.")

    # 5. AI-Assisted Qualification Matching
    print("\n[TEST 5] Testing AI-Assisted Qualification Matching Service...")
    match_req = {
        "trade_category": decl_payload["trade_category"],
        "years_experience": decl_payload["years_experience"],
        "tools_used": decl_payload["tools_used"],
        "tasks_performed": decl_payload["tasks_performed"],
        "work_environment": decl_payload["work_environment"],
        "informal_training": decl_payload["informal_training"]
    }
    matching = make_request("/api/matching/evaluate", "POST", match_req, token=worker_token)
    primary_match = matching["primary_recommendation"]
    assert primary_match["qp_code"] == "CON/Q0601", f"Expected CON/Q0601, got {primary_match['qp_code']}"
    assert primary_match["relevance_score"] > 50.0
    assert len(primary_match["matched_competencies"]) >= 2
    assert len(primary_match["match_explanation"]) >= 2
    print(f"[PASS] AI Matching Engine Succeeded: Primary Match = {primary_match['title']} ({primary_match['qp_code']})")
    print(f"  - Relevance Score: {primary_match['relevance_score']}%")
    print(f"  - Mapped NOS Units: {[m['nos_code'] for m in primary_match['matched_competencies']]}")
    print(f"  - Explainable Rationale: {primary_match['match_explanation'][0]}")

    # 6. Assignments Workspace
    print("\n[TEST 6] Testing Assignment Management & Scoping...")
    assignments = make_request("/api/assignments", token=assessor_token)
    assert len(assignments) >= 1, "Assessor must see assigned candidate"
    active_assignment = assignments[0]
    assessment_id = active_assignment["assessment_id"]
    print(f"[PASS] Assessor My Assignments: Found assignment for {active_assignment['candidate']['name']} ({active_assignment['qualification']['qp_code']})")

    # 7. Guided Practical Assessment & Rubric Scoring
    print("\n[TEST 7] Testing Guided Practical Assessment & Criterion-Level Rubric Scoring...")
    assessment = make_request(f"/api/assessments/{assessment_id}", token=assessor_token)
    assert len(assessment["tasks"]) >= 3, "Assessment must include guided practical tasks"
    assert len(assessment["competencies"]) >= 4, "Must include core NOS competencies"

    # Score criterion PC1.1 as COMPETENT
    target_comp = assessment["competencies"][0]
    target_crit = target_comp["criteria"][0]
    score_payload = {
        "criterion_id": target_crit["id"],
        "task_id": assessment["tasks"][0]["id"],
        "score_level": "COMPETENT",
        "assessor_notes": "Demonstrated full site hazard isolation and LOTO verification.",
        "evidence_reference": "EVD-2026-001"
    }
    score_res = make_request(f"/api/assessments/{assessment_id}/score", "POST", score_payload, token=assessor_token)
    assert score_res["success"] is True
    print(f"[PASS] Rubric Scoring Passed: Scored {target_crit['pc_code']} as COMPETENT. New Assessment Total: {score_res['percentage']}% ({score_res['competency_outcome']})")

    # 8. Human Assessor Review & Sign-Off
    print("\n[TEST 8] Testing Human Assessor Certification Sign-Off...")
    signoff_payload = {
        "assessment_id": assessment_id,
        "decision": "RECOMMENDED_FOR_CERTIFICATION",
        "decision_notes": "Candidate demonstrates exemplary hands-on practical competence across all CON/Q0601 criteria."
    }
    signoff_res = make_request("/api/reviews/sign-off", "POST", signoff_payload, token=assessor_token)
    assert signoff_res["success"] is True
    print("[PASS] Human Assessor Sign-Off Succeeded: Decision =", signoff_res["decision"])

    # 9. Inter-Assessor Consistency Analytics (Cohen's Kappa)
    print("\n[TEST 9] Testing Inter-Assessor Agreement & Cohen's Kappa Analytics...")
    consistency = make_request("/api/analytics/consistency", token=admin_token)
    assert consistency["sample_size"] >= 30, f"Expected at least 30 ratings, got {consistency['sample_size']}"
    assert consistency["cohens_kappa"] > 0.70, f"Expected high agreement Kappa > 0.70, got {consistency['cohens_kappa']}"
    assert consistency["exact_agreement_pct"] > 85.0
    print(f"[PASS] Inter-Assessor Agreement Analytics Passed:")
    print(f"  - Sample Size: {consistency['sample_size']} paired ratings")
    print(f"  - Exact Agreement: {consistency['exact_agreement_pct']}%")
    print(f"  - Adjacent Agreement: {consistency['adjacent_agreement_pct']}%")
    print(f"  - Cohen's Kappa: {consistency['cohens_kappa']} ({consistency['interpretation']})")

    # 10. Audit Trail
    print("\n[TEST 10] Testing System Audit Trail...")
    audit_events = make_request("/api/audit?limit=10", token=admin_token)
    assert len(audit_events) >= 3, "Audit trail must record system actions"
    print(f"[PASS] Audit Trail Verified: Recorded {len(audit_events)} chronological events (Latest: {audit_events[0]['event_type']})")

    print("\n" + "=" * 70)
    print("ALL 10 END-TO-END ACCEPTANCE TESTS PASSED WITH 100% SUCCESS!")
    print("=" * 70)

if __name__ == "__main__":
    try:
        run_tests()
    except Exception as e:
        print(f"\n[FAILED] Test suite failed: {e}")
        sys.exit(1)
