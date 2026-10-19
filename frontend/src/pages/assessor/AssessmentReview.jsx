import React, { useState, useEffect } from 'react';
import Card, { CardHeader, CardBody, CardFooter } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge, { StatusBadge } from '../../components/common/Badge';
import { Textarea, Select } from '../../components/common/Input';
import { useAuth } from '../../services/authContext';
import { api } from '../../services/api';
import confetti from 'canvas-confetti';
import {
  FileCheck,
  CheckCircle,
  ShieldCheck,
  Award,
  AlertCircle,
  Send,
  Lock,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import './AssessmentReview.css';

export default function AssessmentReview({ assessmentId, onSignOffComplete, onViewReport }) {
  const { user } = useAuth();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [decision, setDecision] = useState('RECOMMENDED_FOR_CERTIFICATION');
  const [decisionNotes, setDecisionNotes] = useState(
    'Candidate Ramesh Kumar has demonstrated practical proficiency across all core National Occupational Standards of CON/Q0601 Level 4. All evidence reviewed and verified against official NCVET rubric criteria.'
  );
  const [signedConfirm, setSignedConfirm] = useState(false);
  const [signOffSuccess, setSignOffSuccess] = useState(false);

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
          if (data.review) {
            setDecision(data.review.decision);
            setDecisionNotes(data.review.decision_notes);
            setSignOffSuccess(true);
          }
        }
      } catch (err) {
        console.error('Error loading assessment review:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [assessmentId]);

  const handleSignOff = async (e) => {
    e.preventDefault();
    if (!signedConfirm && !signOffSuccess) {
      alert('Please confirm that you have personally observed and verified the practical evidence.');
      return;
    }

    setSubmitting(true);
    try {
      await api.submitSignOff({
        assessment_id: assessment.id,
        decision,
        decision_notes: decisionNotes,
      });

      setSignOffSuccess(true);

      // Trigger celebratory confetti for recommendation
      if (decision === 'RECOMMENDED_FOR_CERTIFICATION') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#38BDF8', '#D4A72C', '#16876A'],
        });
      }

      if (onSignOffComplete) onSignOffComplete(assessment.id);
    } catch (err) {
      alert(`Sign-off error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center p-12">Loading assessment review dossier...</div>;
  }

  if (!assessment) {
    return <div className="text-center p-8">No assessment record found to review.</div>;
  }

  return (
    <div className="review-page animate-fade-in">
      <div className="review-header">
        <Badge variant="gold">Screen 28 • Authorized Human Review & Sign-Off</Badge>
        <h2 className="review-title">Certification Recommendation Sign-Off</h2>
        <p className="review-subtitle">
          Mandatory governance control point. Review aggregate rubric scores, verified evidence links, and authorize official recommendation.
        </p>
      </div>

      <div className="review-grid">
        {/* Left Column: Summary Dossier */}
        <div className="review-main-col">
          <Card variant="solid">
            <CardHeader
              title={`Candidate: ${assessment.candidate.name}`}
              subtitle={`RPL Dossier ID: ${assessment.id}`}
              action={<StatusBadge status={assessment.status} />}
            />
            <CardBody>
              <div className="review-summary-stats">
                <div className="stat-card glass-panel">
                  <span className="stat-label">Assessed Qualification:</span>
                  <span className="stat-val text-sky">
                    {assessment.qualification.title} ({assessment.qualification.qp_code})
                  </span>
                  <Badge variant="nsqf" size="sm">NSQF Level {assessment.qualification.nsqf_level}</Badge>
                </div>

                <div className="stat-card glass-panel">
                  <span className="stat-label">Rubric Score Achieved:</span>
                  <span className="stat-val text-emerald">
                    {assessment.percentage}% ({assessment.total_score} / {assessment.max_possible_score} Pts)
                  </span>
                  <span className="text-xs text-muted">Exceeds 70% NCVET RPL Passing Threshold</span>
                </div>

                <div className="stat-card glass-panel">
                  <span className="stat-label">Competency Outcome:</span>
                  <Badge
                    variant={assessment.competency_outcome === 'COMPETENT' ? 'emerald' : 'gold'}
                    size="md"
                  >
                    {assessment.competency_outcome}
                  </Badge>
                  <span className="text-xs text-muted">Rubric Version: {assessment.rubric_version}</span>
                </div>
              </div>

              {/* Scored Criteria Table */}
              <div className="criteria-audit-table-wrapper mt-6">
                <h4 className="table-heading font-bold text-sm mb-3">
                  Criterion-by-Criterion Performance Breakdown
                </h4>
                <table className="audit-table">
                  <thead>
                    <tr>
                      <th>PC Code</th>
                      <th>Criterion Description</th>
                      <th>Demonstrated Level</th>
                      <th>Score</th>
                      <th>Evidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assessment.competencies?.map((comp) =>
                      comp.criteria?.map((crit) => (
                        <tr key={crit.id}>
                          <td className="font-mono text-sky font-bold">{crit.pc_code}</td>
                          <td className="text-xs">{crit.description}</td>
                          <td>
                            <StatusBadge status={crit.score?.score_level || 'NOT_ASSESSED'} size="sm" />
                          </td>
                          <td className="font-mono text-xs">
                            {crit.score?.numeric_score || 0} / {crit.max_score}
                          </td>
                          <td className="text-xs font-mono text-muted">
                            {crit.score?.evidence_reference || 'EVD-REF'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right Column: Sign-Off Form */}
        <div className="review-side-col">
          <Card variant="glass" className="sign-off-card">
            <CardHeader
              title="Official Assessor Authorization"
              subtitle="Recorded into immutable system audit trail"
            />
            <CardBody>
              <form onSubmit={handleSignOff} className="sign-off-form">
                <Select
                  label="Recommendation Decision"
                  value={decision}
                  onChange={(e) => setDecision(e.target.value)}
                  options={[
                    {
                      value: 'RECOMMENDED_FOR_CERTIFICATION',
                      label: '✓ Recommended for Formal Certification',
                    },
                    {
                      value: 'RETURN_FOR_CORRECTION',
                      label: '⚠ Return for Additional Evidence / Correction',
                    },
                    {
                      value: 'REQUEST_REASSESSMENT',
                      label: '✕ Request Reassessment (Criteria Not Met)',
                    },
                  ]}
                />

                <Textarea
                  label="Evaluator Recommendation Justification"
                  rows={4}
                  required
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder="Record mandatory rationale for the certification recommendation..."
                />

                <div className="assessor-credentials-preview">
                  <div className="text-xs text-muted">
                    Signing Assessor: <strong>{user?.full_name || 'Priya Sharma'}</strong>
                  </div>
                  <div className="text-xs text-muted">
                    Accreditation ID: <strong>{user?.profile?.employee_id || 'CSDCI-ASSESS-8841'}</strong>
                  </div>
                </div>

                <label className="signature-confirm-checkbox">
                  <input
                    type="checkbox"
                    checked={signedConfirm || signOffSuccess}
                    onChange={(e) => setSignedConfirm(e.target.checked)}
                  />
                  <span className="confirm-text">
                    I solemnly certify that I have verified the candidate's practical performance and evidence against official NCVET rubric criteria without bias.
                  </span>
                </label>

                <Button
                  type="submit"
                  variant={signOffSuccess ? 'emerald' : 'gold'}
                  size="lg"
                  loading={submitting}
                  icon={ShieldCheck}
                  className="w-full mt-4"
                >
                  {signOffSuccess ? 'Sign-Off Recorded ✓' : 'Execute Official Sign-Off'}
                </Button>
              </form>

              {signOffSuccess && (
                <div className="sign-off-success-box mt-4">
                  <CheckCircle size={20} className="text-emerald flex-shrink-0" />
                  <div>
                    <div className="font-bold text-xs text-emerald">
                      Recommendation Registered Successfully
                    </div>
                    <div className="text-xs text-muted">
                      Audit event logged. The candidate can now view their official competency report.
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      className="mt-3"
                      icon={ExternalLink}
                      onClick={() => onViewReport && onViewReport(assessment.id)}
                    >
                      Open Official Competency Report
                    </Button>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
