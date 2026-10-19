import React, { useState, useEffect } from 'react';
import Card, { CardHeader, CardBody, CardFooter } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge, { StatusBadge } from '../../components/common/Badge';
import { useAuth } from '../../services/authContext';
import { api } from '../../services/api';
import {
  Calendar,
  CheckCircle,
  Clock,
  Cpu,
  FileText,
  HardHat,
  MapPin,
  Sparkles,
  User,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import './WorkerDashboard.css';

export default function WorkerDashboard({ onNavigate }) {
  const { user } = useAuth();
  const [declaration, setDeclaration] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWorkerData() {
      try {
        const declRes = await api.getMyDeclaration();
        if (declRes.has_declaration) {
          setDeclaration(declRes.declaration);
        }

        const assignRes = await api.getAssignments();
        if (assignRes && assignRes.length > 0) {
          setAssignment(assignRes[0]);
        }
      } catch (err) {
        console.error('Error loading worker data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadWorkerData();
  }, []);

  return (
    <div className="worker-dashboard-container animate-fade-in">
      {/* Welcome Banner */}
      <div className="welcome-banner glass-panel">
        <div className="welcome-avatar">
          <HardHat size={28} className="text-sky" />
        </div>
        <div className="welcome-text">
          <h2 className="welcome-title">Welcome back, {user?.full_name || 'Candidate'}!</h2>
          <p className="welcome-sub">
            RPL Candidate ID: <span className="font-mono text-sky">{user?.id?.substring(0, 8) || 'CAND-2026'}</span> • Trade Track:{' '}
            <span className="font-semibold">{declaration?.trade_category || 'General Electrician (CON/Q0601)'}</span>
          </p>
        </div>
        <div className="welcome-actions">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('declaration')}
          >
            Update Declaration
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={ArrowRight}
            iconPosition="right"
            onClick={() => onNavigate('matching')}
          >
            View AI Matches
          </Button>
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="stepper-card glass-panel">
        <h3 className="stepper-title">Assessment Journey Progress</h3>
        <div className="stepper-grid">
          <div className="step-node completed">
            <div className="step-circle"><CheckCircle size={16} /></div>
            <div className="step-info">
              <span className="step-name">Experience Declaration</span>
              <span className="step-status">Completed (6.5 Yrs)</span>
            </div>
          </div>

          <div className="step-node completed">
            <div className="step-circle"><CheckCircle size={16} /></div>
            <div className="step-info">
              <span className="step-name">AI Qualification Match</span>
              <span className="step-status">Confirmed CON/Q0601</span>
            </div>
          </div>

          <div className="step-node current">
            <div className="step-circle">3</div>
            <div className="step-info">
              <span className="step-name">Practical Assessment</span>
              <span className="step-status">In Progress (80%)</span>
            </div>
          </div>

          <div className="step-node pending">
            <div className="step-circle">4</div>
            <div className="step-info">
              <span className="step-name">Review & Sign-Off</span>
              <span className="step-status">Awaiting Verification</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Assignment / Appointment Card */}
      <div className="dashboard-columns">
        <div className="dashboard-main-col">
          {assignment ? (
            <Card variant="solid" className="appointment-card">
              <CardHeader
                title="Active Assessment Appointment"
                subtitle="Official In-Person Guided RPL Practical Evaluation"
                action={<StatusBadge status={assignment.status} />}
              />
              <CardBody>
                <div className="appointment-details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Qualification Pack:</span>
                    <span className="detail-value text-sky font-bold">
                      {assignment.qualification.title} ({assignment.qualification.qp_code})
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">NSQF Level:</span>
                    <Badge variant="nsqf">Level {assignment.qualification.nsqf_level}</Badge>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label"><Calendar size={14} /> Scheduled Date & Time:</span>
                    <span className="detail-value font-semibold">{assignment.scheduled_date}</span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label"><MapPin size={14} /> Assessment Location:</span>
                    <span className="detail-value">{assignment.location}</span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label"><User size={14} /> Assigned Evaluator:</span>
                    <span className="detail-value font-semibold">{assignment.assessor.name}</span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label"><Clock size={14} /> Assessment Mode:</span>
                    <Badge variant="neutral">{assignment.assessment_mode}</Badge>
                  </div>
                </div>

                <div className="appointment-instructions">
                  <div className="inst-header">
                    <AlertCircle size={14} className="text-gold" />
                    <span>Candidate Instructions from Assessor:</span>
                  </div>
                  <p className="inst-body">{assignment.instructions}</p>
                </div>
              </CardBody>
              <CardFooter>
                <Button
                  variant="primary"
                  onClick={() => onNavigate('report')}
                >
                  View Competency Results & Report
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onNavigate('matching')}
                >
                  View Mapped Criteria
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card variant="solid">
              <CardBody className="text-center p-8">
                <p>No active assessment appointment found. Please complete your skill declaration to begin.</p>
                <Button variant="primary" className="mt-4" onClick={() => onNavigate('declaration')}>
                  Begin Declaration
                </Button>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Right Sidebar: Quick Summary & Readiness */}
        <div className="dashboard-side-col">
          <Card variant="glass">
            <CardHeader title="Assessment Readiness Checklist" />
            <CardBody>
              <ul className="checklist">
                <li className="check-item done">
                  <CheckCircle size={16} className="text-emerald" />
                  <span>Mandatory PPE (Safety Shoes, Helmet, Insulated 1000V Gloves)</span>
                </li>
                <li className="check-item done">
                  <CheckCircle size={16} className="text-emerald" />
                  <span>Calibrated Hand Tools (Multimeter, Wire Stripper, Pliers)</span>
                </li>
                <li className="check-item done">
                  <CheckCircle size={16} className="text-emerald" />
                  <span>Government Photo ID Proof (Aadhaar / Voter ID)</span>
                </li>
                <li className="check-item pending">
                  <Clock size={16} className="text-gold" />
                  <span>Submit final Lockout-Tagout sign-off evidence</span>
                </li>
              </ul>
            </CardBody>
          </Card>

          <Card variant="solid" className="mt-4">
            <CardHeader title="Need Assessment Support?" />
            <CardBody>
              <p className="text-xs text-muted leading-relaxed">
                Field assessors can assist in your preferred regional language (Hindi, Marathi, Bengali, Tamil). Voice assistance and offline draft persistence are supported.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
