import re
import math
from collections import Counter
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.db.models import Qualification, Competency

def tokenize(text: str) -> List[str]:
    """Tokenize and normalize text into clean words."""
    if not text:
        return []
    words = re.findall(r'\b[a-zA-Z0-9]{2,}\b', text.lower())
    stop_words = {
        'the', 'and', 'for', 'with', 'that', 'this', 'from', 'are', 'was',
        'has', 'have', 'had', 'been', 'will', 'etc', 'under', 'into', 'such',
        'work', 'works', 'working', 'repair', 'repairs', 'general', 'other'
    }
    return [w for w in words if w not in stop_words]

def compute_cosine_similarity(vec1: Counter, vec2: Counter) -> float:
    intersection = set(vec1.keys()) & set(vec2.keys())
    numerator = sum([vec1[x] * vec2[x] for x in intersection])
    sum1 = sum([val ** 2 for val in vec1.values()])
    sum2 = sum([val ** 2 for val in vec2.values()])
    denominator = math.sqrt(sum1) * math.sqrt(sum2)
    if not denominator:
        return 0.0
    return float(numerator) / denominator

class QualificationMatchingEngine:
    @staticmethod
    def evaluate(
        db: Session,
        trade_category: str,
        years_experience: float,
        tools_used: List[str],
        tasks_performed: List[str],
        work_environment: str = "",
        informal_training: str = ""
    ) -> Dict[str, Any]:
        """
        Ranks verified NCVET Qualification Packs against declared worker profile.
        Produces explainable relevance scores, matched competencies, and skill gaps.
        """
        # Combine all worker evidence into weighted token stream
        worker_text = f"{trade_category} {trade_category} " + \
                      " ".join(tools_used * 2) + " " + \
                      " ".join(tasks_performed * 2) + " " + \
                      f"{work_environment} {informal_training}"
        
        worker_tokens = tokenize(worker_text)
        worker_vec = Counter(worker_tokens)

        qualifications = db.query(Qualification).all()
        ranked_matches = []

        for qp in qualifications:
            # Build QP corpus text including title, description, and all NOS competencies & criteria
            qp_tokens_list = tokenize(f"{qp.title} {qp.title} {qp.description}")
            
            nos_matched = []
            nos_unmatched = []
            matched_tools = []

            for comp in qp.competencies:
                comp_text = f"{comp.title} {comp.description}"
                for crit in comp.criteria:
                    comp_text += f" {crit.description} {crit.observable_indicator or ''}"
                
                comp_tokens = tokenize(comp_text)
                qp_tokens_list.extend(comp_tokens)

                # Check NOS level overlap
                comp_vec = Counter(comp_tokens)
                sim = compute_cosine_similarity(worker_vec, comp_vec)
                
                if sim > 0.08 or any(t.lower() in comp_text.lower() for t in tools_used):
                    nos_matched.append({
                        "nos_code": comp.nos_code,
                        "title": comp.title,
                        "nos_relevance_score": round(min(sim * 1.5, 0.98), 2)
                    })
                else:
                    nos_unmatched.append({
                        "nos_code": comp.nos_code,
                        "title": comp.title
                    })

            # Check tool overlap
            for tool in tools_used:
                tool_lower = tool.lower()
                for task in qp.assessment_tasks:
                    if any(tool_lower in str(t).lower() for t in (task.tools_required or [])):
                        if tool not in matched_tools:
                            matched_tools.append(tool)

            qp_vec = Counter(qp_tokens_list)
            base_sim = compute_cosine_similarity(worker_vec, qp_vec)

            # Experience duration multiplier (years of practical experience strengthens match)
            exp_bonus = min(years_experience * 0.02, 0.12)
            tool_bonus = min(len(matched_tools) * 0.03, 0.15)
            
            relevance_score = min(round((base_sim + exp_bonus + tool_bonus) * 100, 1), 98.5)

            # Generate natural explanation
            reasons = []
            if len(matched_tools) > 0:
                reasons.append(f"Identified {len(matched_tools)} verified trade tools ({', '.join(matched_tools[:3])}) matching official practical task requirements.")
            if len(nos_matched) > 0:
                reasons.append(f"Direct mapping established with {len(nos_matched)} National Occupational Standards (e.g., {nos_matched[0]['nos_code']}).")
            if years_experience >= 3.0:
                reasons.append(f"Declared practical duration ({years_experience} years) satisfies NCVET RPL Level {qp.nsqf_level} prerequisite experience guidelines.")

            # Identify gaps/recommendations
            skill_gaps = []
            if len(nos_unmatched) > 0:
                for gap in nos_unmatched[:2]:
                    skill_gaps.append(f"Limited evidence recorded for standard {gap['nos_code']}: {gap['title']}.")

            ranked_matches.append({
                "id": qp.id,
                "qp_code": qp.qp_code,
                "title": qp.title,
                "nsqf_level": qp.nsqf_level,
                "awarding_body": qp.awarding_body,
                "version": qp.version,
                "status": qp.status,
                "source_document": qp.source_document,
                "relevance_score": relevance_score,
                "match_explanation": reasons,
                "matched_competencies": nos_matched,
                "skill_gaps": skill_gaps,
                "matched_tools": matched_tools
            })

        # Sort descending by relevance score
        ranked_matches.sort(key=lambda x: x["relevance_score"], reverse=True)

        return {
            "primary_recommendation": ranked_matches[0] if ranked_matches else None,
            "alternative_qualifications": ranked_matches[1:] if len(ranked_matches) > 1 else [],
            "disclaimer": "Relevance scores indicate semantic and tool alignment based on declared experience and are subject to authorized human assessor evaluation. These scores do not constitute formal certification."
        }
