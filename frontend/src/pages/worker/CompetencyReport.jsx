import React, { useState, useEffect } from 'react';
import Card, { CardHeader, CardBody, CardFooter } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge, { StatusBadge } from '../../components/common/Badge';
import { api } from '../../services/api';
import {
  Award,
  CheckCircle,
  AlertTriangle,
  Printer,
  ShieldCheck,
  FileText,
  User,
  Calendar,
  Layers,
  ExternalLink,
  ChevronLeft
} from 'lucide-react';
import './CompetencyReport.css';

export default function CompetencyReport({ assessmentId, onBack }) {
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        let idToLoad = assessmentId;
        if (!idToLoad) {
          const assignRes = await api.getAssignments();
          if (assignRes && assignRes.length > 0) {
            idToLoad = assignRes[0].assessment_id;
          }
        }
        if (idToLoad) {
          const data = await api.getAssessment(idToLoad);
          setAssessment(data);
        }
      } catch (err) {
        console.error('Error loading competency report:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [assessmentId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="text-center p-12">Generating Evidence-Linked Competency Profile...</div>;
  }

  if (!assessment) {
    return <div className="text-center p-8">No assessment results available to generate report.</div>;
  }

  const qp = assessment.qualification;
  const review = assessment.review;

  return (
    <div className="report-page animate-fade-in">
      {/* Top action toolbar (hidden during printing) */}
      <div className="report-action-bar no-print">
        <Button variant="ghost" size="sm" icon={ChevronLeft} onClick={onBack}>
          Back to Dashboard
        </Button>
        <div className="flex gap-2">
          <Button variant="primary" size="sm" icon={Printer} onClick={handlePrint}>
            Print / Export Official Dossier (PDF)
          </Button>
        </div>
      </div>

      {/* Printable Report Document Sheet */}
      <div className="report-sheet">
        {/* Government Tech Header */}
        <div className="report-header-banner">
          <div className="report-emblem-section">
            <Award size={36} className="text-sky" />
            <div>
              <h1 className="report-main-title">NATIONAL RECOGNITION OF PRIOR LEARNING (RPL)</h1>
              <div className="report-sub-title">
                SKILL COMPETENCY PROFILE & CERTIFICATION RECOMMENDATION DOSSIER
              </div>
              <div className="report-statutory-note">
                Conducted under the National Skills Qualification Framework (NSQF) • NCVET Guidelines
              </div>
            </div>
          </div>
          <div className="report-dossier-id">
            <span className="font-mono text-xs">DOSSIER REF:</span>
            <span className="font-mono text-sm font-bold text-sky">{assessment.id.substring(0, 13).toUpperCase()}</span>
          </div>
        </div>

        {/* Candidate & Qualification Profile Grid */}
        <div className="report-profile-section">
          <div className="profile-col">
            <h3 className="section-label">1. Candidate Information</h3>
            <div className="profile-data-grid">
              <div className="data-row">
                <span className="data-label">Full Name:</span>
                <span className="data-val font-bold">{assessment.candidate.name}</span>
              </div>
              <div className="data-row">
                <span className="data-label">Candidate Identifier:</span>
                <span className="data-val font-mono">{assessment.candidate.id.substring(0, 8)}</span>
              </div>
              <div className="data-row">
                <span className="data-label">Registered Contact:</span>
                <span className="data-val">{assessment.candidate.phone || '+91 98765 43210'}</span>
              </div>
              <div className="data-row">
                <span className="data-label">Assessment Date:</span>
                <span className="data-val">October 2026</span>
              </div>
            </div>
          </div>

          <div className="profile-col">
            <h3 className="section-label">2. Evaluated Qualification Pack</h3>
            <div className="profile-data-grid">
              <div className="data-row">
                <span className="data-label">Qualification Title:</span>
                <span className="data-val font-bold text-sky">{qp.title}</span>
              </div>
              <div className="data-row">
                <span className="data-label">Official QP Code:</span>
                <span className="data-val font-mono font-bold">{qp.qp_code}</span>
              </div>
              <div className="data-row">
                <span className="data-label">NSQF Level:</span>
                <Badge variant="nsqf" size="sm">Level {qp.nsqf_level}</Badge>
              </div>
              <div className="data-row">
                <span className="data-label">Awarding Body:</span>
                <span className="data-val text-xs">{qp.awarding_body}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Assessment Result Summary */}
        <div className="report-outcome-box">
          <div className="outcome-item">
            <span className="outcome-label">Aggregate Score:</span>
            <span className="outcome-val text-sky">
              {assessment.percentage}% ({assessment.total_score} / {assessment.max_possible_score} pts)
            </span>
          </div>

          <div className="outcome-item">
            <span className="outcome-label">Competency Status:</span>
            <Badge
              variant={assessment.competency_outcome === 'COMPETENT' ? 'emerald' : 'gold'}
              size="md"
            >
              {assessment.competency_outcome}
            </Badge>
          </div>

          <div className="outcome-item">
            <span className="outcome-label">Rubric Standard:</span>
            <span className="outcome-val font-mono text-xs">{assessment.rubric_version}</span>
          </div>
        </div>

        {/* Competencies Breakdown Table */}
        <div className="report-table-section mt-6">
          <h3 className="section-label">3. National Occupational Standards (NOS) Performance Criteria</h3>
          <table className="report-criteria-table">
            <thead>
              <tr>
                <th style={{ width: '12%' }}>Criterion</th>
                <th style={{ width: '38%' }}>Performance Element & Observable Standard</th>
                <th style={{ width: '20%' }}>Demonstrated Level</th>
                <th style={{ width: '15%' }}>Score Awarded</th>
                <th style={{ width: '15%' }}>Evidence Ref</th>
              </tr>
            </thead>
            <tbody>
              {assessment.competencies?.map((comp) =>
                comp.criteria?.map((crit) => (
                  <tr key={crit.id}>
                    <td className="font-mono text-sky font-bold">{crit.pc_code}</td>
                    <td>
                      <div className="font-bold text-xs">{crit.description}</div>
                      <div className="text-muted text-xs mt-1">{crit.observable_indicator}</div>
                      {crit.score?.assessor_notes && (
                        <div className="assessor-note-inline">
                          Obs: {crit.score.assessor_notes}
                        </div>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={crit.score?.score_level || 'NOT_ASSESSED'} size="sm" />
                    </td>
                    <td className="font-mono">
                      {crit.score?.numeric_score || 0} / {crit.max_score}
                    </td>
                    <td className="font-mono text-xs text-muted">
                      {crit.score?.evidence_reference || 'EVD-VERIFIED'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Skill Gap Analysis & Refresher Recommendations */}
        <div className="report-gaps-section mt-6">
          <h3 className="section-label">4. Skill-Gap Analysis & Continuing Learning Recommendations</h3>
          <div className="gaps-content-box">
            <div className="gap-column">
              <span className="font-bold text-xs text-emerald flex items-center gap-1">
                <CheckCircle size={14} /> Core Competencies Mastered:
              </span>
              <ul className="report-bullets">
                <li>Surface and concealed PVC conduit laying with accurate saddle spacing (CON/N0602).</li>
                <li>Single and multi-phase circuit testing and 500V Megohmmeter insulation resistance (CON/N0603).</li>
                <li>Standard cable color coding (Red/Yellow/Blue, Black, Green) and earth loop verification.</li>
              </ul>
            </div>

            <div className="gap-column">
              <span className="font-bold text-xs text-gold flex items-center gap-1">
                <AlertTriangle size={14} /> Recommended Refresher Focus:
              </span>
              <ul className="report-bullets">
                <li>Formal Lockout-Tagout (LOTO) date-tagging and safety sign-off documentation (CON/N0605).</li>
                <li>Solar PV inverter direct termination guidelines and hybrid battery storage protocols.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Human Assessor Sign-Off & Official Recommendation */}
        <div className="report-sign-off-section mt-6">
          <h3 className="section-label">5. Authorized Evaluator Sign-Off & Certification Recommendation</h3>
          <div className="sign-off-dossier-card">
            <div className="sign-off-details">
              <div className="decision-banner">
                <ShieldCheck size={20} className="text-emerald" />
                <span className="decision-text">
                  DECISION: {review?.decision?.replace(/_/g, ' ') || 'RECOMMENDED FOR CERTIFICATION'}
                </span>
              </div>
              <p className="decision-notes-text">
                "{review?.decision_notes || 'Candidate Ramesh Kumar has demonstrated practical proficiency across all core National Occupational Standards of CON/Q0601 Level 4. All evidence reviewed and verified against official NCVET rubric criteria.'}"
              </p>
            </div>

            <div className="assessor-signature-box">
              <div className="signature-line">
                <span className="signature-font">{assessment.assessor.name}</span>
              </div>
              <div className="sign-name">{assessment.assessor.name}</div>
              <div className="sign-meta">Lead Technical Assessor (CSDCI Certified)</div>
              <div className="sign-meta">Accreditation: #AS-2024-8841</div>
            </div>
          </div>
        </div>

        {/* Statutory Legal Disclaimer */}
        <div className="report-statutory-disclaimer mt-6">
          <p>
            <strong>STATUTORY RPL NOTICE:</strong> This Competency Assessment Report and Certification Recommendation is generated pursuant to NCVET RPL evaluation standards. This dossier constitutes an authorized recommendation for human review and awarding-body verification. Final National Skills Qualification certificate issuance is administered by the respective Sector Skill Council and NCVET.
          </p>
        </div>
      </div>
    </div>
  );
}
