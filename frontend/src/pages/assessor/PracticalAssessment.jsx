import React, { useState, useEffect } from 'react';
import Card, { CardHeader, CardBody, CardFooter } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge, { StatusBadge } from '../../components/common/Badge';
import { api } from '../../services/api';
import { offlineStorage } from '../../services/indexedDB';
import {
  Compass,
  CheckCircle,
  AlertTriangle,
  Upload,
  Camera,
  Sparkles,
  ShieldCheck,
  FileText,
  Save,
  ArrowRight,
  Info,
  Check,
  X
} from 'lucide-react';
import './PracticalAssessment.css';

export default function PracticalAssessment({ assessmentId, onComplete }) {
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTaskIndex, setActiveTaskIndex] = useState(0);
  const [notesState, setNotesState] = useState({});
  const [scoringLoading, setScoringLoading] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(true);
  const [aiObservations, setAiObservations] = useState([
    {
      id: 1,
      targetCriterion: 'PC3.1',
      suggestion: 'Megger test display indicates 4.2 MΩ insulation resistance, complying with > 1.0 MΩ standard.',
      confidence: 0.94,
      status: 'PENDING'
    },
    {
      id: 2,
      targetCriterion: 'PC4.1',
      suggestion: 'Lockout padlock attached securely on main isolator; verify candidate completed logbook sign-off tag.',
      confidence: 0.88,
      status: 'PENDING'
    }
  ]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Load assessment from backend or fallback to first available
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
          // Cache in IndexedDB for offline evaluation
          await offlineStorage.cacheAssessment(data);
        }
      } catch (err) {
        console.warn('Backend unavailable, checking local offline cache:', err);
        const cached = await offlineStorage.getCachedAssessment(assessmentId);
        if (cached) setAssessment(cached);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [assessmentId]);

  const handleScoreCriterion = async (criterionId, scoreLevel, taskId) => {
    setScoringLoading(true);
    const notes = notesState[criterionId] || '';

    const payload = {
      criterion_id: criterionId,
      task_id: taskId,
      score_level: scoreLevel,
      assessor_notes: notes,
      evidence_reference: `EVD-2026-${criterionId.substring(0, 4)}`
    };

    // If offline, enqueue operation
    if (!navigator.onLine) {
      await offlineStorage.enqueueOperation({
        type: 'RECORD_SCORE',
        endpoint: `/api/assessments/${assessment.id}/score`,
        payload,
        idempotencyKey: `score_${assessment.id}_${criterionId}`
      });
      alert('Working Offline: Score queued locally and will sync when reconnected.');
      setScoringLoading(false);
      return;
    }

    try {
      await api.recordScore(assessment.id, payload);
      // Reload updated assessment
      const updated = await api.getAssessment(assessment.id);
      setAssessment(updated);
      await offlineStorage.cacheAssessment(updated);
    } catch (err) {
      alert(`Scoring error: ${err.message}`);
    } finally {
      setScoringLoading(false);
    }
  };

  const handleApplyAISuggestion = (obs) => {
    setNotesState((prev) => ({
      ...prev,
      [obs.targetCriterion]: obs.suggestion
    }));
    setAiObservations((prev) =>
      prev.map((o) => (o.id === obs.id ? { ...o, status: 'ACCEPTED' } : o))
    );
  };

  if (loading) {
    return (
      <div className="text-center p-12">
        <Compass size={36} className="text-sky sync-spinner mx-auto mb-4" />
        <p className="text-sm text-muted">Loading Guided Practical Assessment Workspace...</p>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="text-center p-8">
        <p className="text-muted">No assessment record found.</p>
      </div>
    );
  }

  const tasks = assessment.tasks || [];
  const activeTask = tasks[activeTaskIndex] || tasks[0];

  return (
    <div className="assessment-workspace-page animate-fade-in">
      {/* Top Header & Deterministic Progress */}
      <div className="assessment-top-bar glass-panel">
        <div className="candidate-summary">
          <Badge variant="sky">Active Candidate</Badge>
          <h2 className="top-cand-name">{assessment.candidate.name}</h2>
          <span className="top-cand-meta">
            Trade: <strong>{assessment.qualification.title} ({assessment.qualification.qp_code})</strong>
          </span>
        </div>

        <div className="deterministic-score-summary">
          <div className="metric-box">
            <span className="metric-val text-sky font-bold">{assessment.percentage}%</span>
            <span className="metric-lbl">Total Score ({assessment.total_score}/{assessment.max_possible_score} pts)</span>
          </div>

          <div className="metric-box">
            <Badge
              variant={
                assessment.competency_outcome === 'COMPETENT'
                  ? 'emerald'
                  : assessment.competency_outcome === 'PARTIALLY_DEMONSTRATED'
                  ? 'gold'
                  : 'neutral'
              }
              size="md"
            >
              {assessment.competency_outcome || 'PENDING EVALUATION'}
            </Badge>
            <span className="metric-lbl">Rubric Outcome</span>
          </div>
        </div>
      </div>

      {/* Task Tabs */}
      <div className="task-stepper-row">
        {tasks.map((task, idx) => (
          <button
            key={task.id}
            className={`task-step-tab ${idx === activeTaskIndex ? 'active' : ''}`}
            onClick={() => setActiveTaskIndex(idx)}
          >
            <span className="step-num-circle">{task.task_number}</span>
            <div className="step-tab-text">
              <span className="step-tab-title">{task.task_name}</span>
              <span className="step-tab-nos">{task.competency_nos_code}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Main Workspace Layout */}
      <div className="workspace-grid">
        {/* Left Column: Active Task Details & Standardized Rubric */}
        <div className="workspace-main">
          {activeTask && (
            <Card variant="solid" className="task-instructions-card">
              <CardHeader
                title={`Task ${activeTask.task_number}: ${activeTask.task_name}`}
                subtitle={`National Occupational Standard: ${activeTask.competency_nos_code}`}
                action={<Badge variant="gold">Guided Practical Task</Badge>}
              />
              <CardBody>
                <div className="task-instruction-text">
                  <p>{activeTask.instructions}</p>
                </div>

                <div className="task-prereqs-grid mt-4">
                  <div className="prereq-col">
                    <span className="prereq-label font-bold text-xs text-sky flex items-center gap-1">
                      <Wrench size={13} /> Required Tools & Equipment:
                    </span>
                    <ul className="prereq-list">
                      {activeTask.tools_required?.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="prereq-col">
                    <span className="prereq-label font-bold text-xs text-crimson flex items-center gap-1">
                      <AlertTriangle size={13} /> Safety Precautions:
                    </span>
                    <ul className="prereq-list">
                      {activeTask.safety_precautions?.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Criterion Scoring Rubric */}
          <div className="rubric-criteria-section mt-6">
            <h3 className="section-title-sm">
              Standardized Criterion Scoring Rubric ({activeTask?.competency_nos_code})
            </h3>
            <p className="section-sub-sm">
              Select the demonstrated level based on observable performance criteria.
            </p>

            <div className="criteria-cards-list mt-4">
              {assessment.competencies
                .filter((comp) => comp.nos_code === activeTask?.competency_nos_code)
                .map((comp) =>
                  comp.criteria.map((crit) => {
                    const currentScore = crit.score?.score_level || 'NOT_ASSESSED';
                    return (
                      <Card key={crit.id} variant="solid" className="criterion-eval-card">
                        <CardBody>
                          <div className="criterion-header-row">
                            <span className="crit-code-badge">{crit.pc_code}</span>
                            <span className="crit-desc-text">{crit.description}</span>
                            <span className="crit-max-pts">{crit.max_score} Pts</span>
                          </div>

                          <div className="observable-indicator-box mt-3">
                            <span className="obs-label">Observable Indicator:</span>
                            <p className="obs-text">{crit.observable_indicator}</p>
                          </div>

                          {/* 4-Level Rubric Level Selector */}
                          <div className="rubric-buttons-row mt-4">
                            <button
                              type="button"
                              className={`rubric-btn competent ${currentScore === 'COMPETENT' ? 'selected' : ''}`}
                              onClick={() => handleScoreCriterion(crit.id, 'COMPETENT', activeTask?.id)}
                              disabled={scoringLoading}
                            >
                              <CheckCircle size={15} />
                              <span>Competent (100%)</span>
                            </button>

                            <button
                              type="button"
                              className={`rubric-btn partial ${currentScore === 'PARTIALLY_DEMONSTRATED' ? 'selected' : ''}`}
                              onClick={() => handleScoreCriterion(crit.id, 'PARTIALLY_DEMONSTRATED', activeTask?.id)}
                              disabled={scoringLoading}
                            >
                              <AlertTriangle size={15} />
                              <span>Partially Demonstrated (50%)</span>
                            </button>

                            <button
                              type="button"
                              className={`rubric-btn not-dem ${currentScore === 'NOT_DEMONSTRATED' ? 'selected' : ''}`}
                              onClick={() => handleScoreCriterion(crit.id, 'NOT_DEMONSTRATED', activeTask?.id)}
                              disabled={scoringLoading}
                            >
                              <X size={15} />
                              <span>Not Demonstrated (0%)</span>
                            </button>

                            <button
                              type="button"
                              className={`rubric-btn not-assessed ${currentScore === 'NOT_ASSESSED' ? 'selected' : ''}`}
                              onClick={() => handleScoreCriterion(crit.id, 'NOT_ASSESSED', activeTask?.id)}
                              disabled={scoringLoading}
                            >
                              <span>Not Assessed</span>
                            </button>
                          </div>

                          {/* Notes & Evidence Linking */}
                          <div className="crit-notes-evidence-row mt-4">
                            <input
                              type="text"
                              className="crit-notes-input"
                              placeholder="Assessor observation notes..."
                              value={notesState[crit.pc_code] || crit.score?.assessor_notes || ''}
                              onChange={(e) =>
                                setNotesState({ ...notesState, [crit.pc_code]: e.target.value })
                              }
                            />
                            {crit.score?.evidence_reference && (
                              <span className="linked-evd-pill">
                                Linked: {crit.score.evidence_reference}
                              </span>
                            )}
                          </div>
                        </CardBody>
                      </Card>
                    );
                  })
                )}
            </div>
          </div>
        </div>

        {/* Right Column: AI Assistance Panel & Evidence Drawer */}
        <div className="workspace-side">
          {/* AI Assistance Panel (SCREEN 25) */}
          <Card variant="glass" className="ai-assist-card">
            <CardHeader
              title={
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-gold" />
                  <span>AI Assistance Observations</span>
                </div>
              }
              subtitle="Algorithmic suggestions from evidence photos."
            />
            <CardBody>
              <div className="ai-assist-notice">
                <Info size={14} className="text-sky flex-shrink-0" />
                <p className="text-xs text-muted">
                  AI suggestions do not score candidates. You must independently evaluate performance.
                </p>
              </div>

              <div className="ai-suggestions-list mt-3">
                {aiObservations.map((obs) => (
                  <div key={obs.id} className="ai-suggestion-item">
                    <div className="suggestion-top">
                      <span className="target-crit-tag">{obs.targetCriterion}</span>
                      <span className="conf-score">
                        Confidence: {Math.round(obs.confidence * 100)}%
                      </span>
                    </div>
                    <p className="suggestion-text">{obs.suggestion}</p>

                    <div className="suggestion-actions">
                      {obs.status === 'ACCEPTED' ? (
                        <span className="text-emerald text-xs font-bold flex items-center gap-1">
                          <Check size={13} /> Suggestion Applied
                        </span>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApplyAISuggestion(obs)}
                        >
                          Use in Assessor Notes
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Evidence Previews */}
          <Card variant="solid" className="mt-4">
            <CardHeader
              title="Verified Practical Evidence"
              subtitle="Photos captured during assessment"
            />
            <CardBody>
              <div className="evidence-thumbnails-grid">
                {assessment.evidence?.map((ev) => (
                  <div key={ev.id} className="ev-thumbnail-card">
                    <img
                      src={ev.file_path}
                      alt={ev.title}
                      className="ev-img"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=300';
                      }}
                    />
                    <div className="ev-info">
                      <span className="ev-title">{ev.title}</span>
                      <span className="ev-tag">{ev.review_status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
            <CardFooter>
              <Button
                variant="primary"
                className="w-full"
                onClick={() => onComplete && onComplete(assessment.id)}
              >
                Proceed to Sign-Off Review
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
