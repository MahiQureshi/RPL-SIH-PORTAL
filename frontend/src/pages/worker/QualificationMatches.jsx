import React, { useState, useEffect } from 'react';
import Card, { CardHeader, CardBody, CardFooter } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge, { StatusBadge } from '../../components/common/Badge';
import { api } from '../../services/api';
import {
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Award,
  Layers,
  Wrench,
  Check,
  ChevronRight,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import './QualificationMatches.css';

export default function QualificationMatches({ onConfirmed }) {
  const [matchingResult, setMatchingResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [confirmedQp, setConfirmedQp] = useState(null);

  useEffect(() => {
    async function loadMatches() {
      setLoading(true);
      try {
        const declRes = await api.getMyDeclaration();
        if (declRes.has_declaration && declRes.declaration) {
          const d = declRes.declaration;
          setConfirmedQp(d.confirmed_qp_code);
          const matchRes = await api.evaluateMatching({
            trade_category: d.trade_category,
            years_experience: d.years_experience,
            tools_used: d.tools_used || [],
            tasks_performed: d.tasks_performed || [],
            work_environment: d.work_environment || "",
            informal_training: d.informal_training || ""
          });
          setMatchingResult(matchRes);
        } else {
          // Default evaluation fallback
          const matchRes = await api.evaluateMatching({
            trade_category: "Electrical Installation & Repair",
            years_experience: 6.5,
            tools_used: ["Digital Multimeter", "Megger", "Combination Pliers", "Wire Stripper", "Conduit Bender"],
            tasks_performed: ["PVC conduit laying", "Distribution board mounting", "Insulation resistance testing"],
            work_environment: "Residential & Commercial",
            informal_training: "Apprenticed for 3 years"
          });
          setMatchingResult(matchRes);
        }
      } catch (err) {
        console.error('Error loading qualification matches:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMatches();
  }, []);

  const handleConfirm = async (qpCode) => {
    setConfirming(true);
    try {
      await api.confirmQualification(qpCode);
      setConfirmedQp(qpCode);
      if (onConfirmed) onConfirmed(qpCode);
    } catch (err) {
      alert(`Error confirming qualification: ${err.message}`);
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="matches-loading text-center p-12">
        <Sparkles size={36} className="text-sky sync-spinner mx-auto mb-4" />
        <h3 className="text-xl font-bold">Evaluating Skills Against Verified NCVET Database...</h3>
        <p className="text-sm text-muted mt-2">
          Mapping declared tools, task verbs, and duration to National Occupational Standards (NOS).
        </p>
      </div>
    );
  }

  const primary = matchingResult?.primary_recommendation;
  const alternatives = matchingResult?.alternative_qualifications || [];

  return (
    <div className="matches-page animate-fade-in">
      <div className="matches-header">
        <Badge variant="gold">Screen 11 • AI-Assisted Qualification Mapping</Badge>
        <h2 className="matches-title">Recommended NSQF Qualification Pack</h2>
        <p className="matches-subtitle">
          Based on your declared occupational experience and trade tools, the system identified source-backed qualifications registered with the National Qualifications Register (NQR).
        </p>
      </div>

      {primary && (
        <Card variant="glass" className="primary-match-card">
          <CardHeader
            title={
              <div className="primary-card-title-row">
                <span className="primary-qp-name">{primary.title}</span>
                <Badge variant="nsqf">NSQF Level {primary.nsqf_level}</Badge>
                <StatusBadge status={primary.status} />
              </div>
            }
            subtitle={
              <div className="primary-card-sub">
                <span>Code: <strong className="font-mono text-sky">{primary.qp_code}</strong></span>
                <span>•</span>
                <span>Awarding Body: <strong>{primary.awarding_body}</strong></span>
              </div>
            }
            action={
              <div className="relevance-score-badge">
                <div className="score-number">{primary.relevance_score}%</div>
                <div className="score-label">Relevance Score</div>
              </div>
            }
          />
          <CardBody>
            {/* Match Explanations */}
            <div className="match-reasons-box">
              <h4 className="box-heading">
                <Sparkles size={16} className="text-gold" />
                <span>Explainable Alignment Rationale:</span>
              </h4>
              <ul className="reasons-list">
                {primary.match_explanation?.map((reason, idx) => (
                  <li key={idx} className="reason-item">
                    <CheckCircle size={15} className="text-emerald" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Competency Mapping Details */}
            <div className="competencies-mapping-section mt-6">
              <h4 className="box-heading">
                <Layers size={16} className="text-sky" />
                <span>Mapped National Occupational Standards (NOS Units):</span>
              </h4>
              <div className="mapped-nos-grid">
                {primary.matched_competencies?.map((comp) => (
                  <div key={comp.nos_code} className="nos-item-card">
                    <div className="nos-header">
                      <span className="nos-code">{comp.nos_code}</span>
                      <span className="nos-match-badge">Aligned</span>
                    </div>
                    <div className="nos-title">{comp.title}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skill Gaps Identified */}
            {primary.skill_gaps && primary.skill_gaps.length > 0 && (
              <div className="skill-gaps-box mt-6">
                <h4 className="box-heading text-crimson">
                  <AlertTriangle size={16} className="text-crimson" />
                  <span>Identified Knowledge Gaps / Refresher Topics:</span>
                </h4>
                <ul className="gaps-list">
                  {primary.skill_gaps.map((gap, idx) => (
                    <li key={idx} className="gap-item">{gap}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardBody>
          <CardFooter>
            <div className="match-footer-left">
              <a
                href={primary.source_document || "https://www.nqr.gov.in"}
                target="_blank"
                rel="noreferrer"
                className="nqr-link"
              >
                <span>View NCVET Source Dossier</span>
                <ExternalLink size={14} />
              </a>
            </div>

            <Button
              variant={confirmedQp === primary.qp_code ? "emerald" : "primary"}
              size="lg"
              icon={confirmedQp === primary.qp_code ? Check : ChevronRight}
              iconPosition="right"
              loading={confirming}
              onClick={() => handleConfirm(primary.qp_code)}
            >
              {confirmedQp === primary.qp_code
                ? "Track Confirmed ✓"
                : "Confirm Qualification Track & Schedule Assessment"}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Alternative Matches */}
      {alternatives.length > 0 && (
        <div className="alternatives-section mt-10">
          <h3 className="alt-section-title">Alternative Qualification Options</h3>
          <p className="text-sm text-muted mb-4">
            If your day-to-day trade work relates more closely to another specialization, you can select an alternative verified pack:
          </p>
          <div className="grid grid-cols-1 grid-cols-2-sm grid-cols-3-lg gap-4">
            {alternatives.map((alt) => (
              <Card key={alt.qp_code} variant="solid" className="alt-card">
                <CardBody>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-mono text-xs text-sky">{alt.qp_code}</span>
                    <Badge variant="neutral">Level {alt.nsqf_level}</Badge>
                  </div>
                  <h4 className="font-bold text-sm mb-1">{alt.title}</h4>
                  <p className="text-xs text-muted mb-4">{alt.awarding_body}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted">Relevance: <strong>{alt.relevance_score}%</strong></span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleConfirm(alt.qp_code)}
                    >
                      Select Track
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="transparency-disclaimer mt-8">
        <ShieldCheck size={18} className="text-muted flex-shrink-0" />
        <p className="text-xs text-muted">
          {matchingResult?.disclaimer ||
            "Relevance scores represent algorithmic semantic alignment between declared experience and verified qualification packs. These scores do not guarantee or constitute official certification until evaluated by an authorized human assessor."}
        </p>
      </div>
    </div>
  );
}
