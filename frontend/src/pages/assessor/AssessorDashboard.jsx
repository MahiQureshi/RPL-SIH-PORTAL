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
  Compass,
  FileCheck,
  MapPin,
  Search,
  ShieldCheck,
  User,
  AlertCircle,
  Eye,
  ArrowRight
} from 'lucide-react';
import './AssessorDashboard.css';

export default function AssessorDashboard({ onOpenAssessment, onOpenReview }) {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAssessorData() {
      setLoading(true);
      try {
        const res = await api.getAssignments();
        setAssignments(res || []);
      } catch (err) {
        console.error('Error fetching assessor assignments:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAssessorData();
  }, []);

  const filtered = assignments.filter((a) => {
    const matchesFilter = filter === 'ALL' || a.status === filter;
    const matchesSearch =
      a.candidate.name.toLowerCase().includes(search.toLowerCase()) ||
      a.qualification.title.toLowerCase().includes(search.toLowerCase()) ||
      a.qualification.qp_code.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="assessor-dashboard animate-fade-in">
      {/* Assessor Header Banner */}
      <div className="assessor-banner glass-panel">
        <div className="assessor-avatar">
          <ShieldCheck size={32} className="text-gold" />
        </div>
        <div className="assessor-info">
          <div className="flex items-center gap-2">
            <h2 className="assessor-name">{user?.full_name || 'Assessor Workspace'}</h2>
            <Badge variant="gold">Authorized Technical Assessor</Badge>
          </div>
          <p className="assessor-meta">
            Employee ID: <strong className="font-mono text-sky">{user?.profile?.employee_id || 'CSDCI-ASSESS-8841'}</strong> • Sector Skill Council:{' '}
            <span>{user?.profile?.organization || 'Construction Skill Development Council of India'}</span>
          </p>
        </div>

        <div className="assessor-stats">
          <div className="stat-pill">
            <span className="stat-num">{assignments.length}</span>
            <span className="stat-label">Assigned Candidates</span>
          </div>
          <div className="stat-pill">
            <span className="stat-num text-gold">
              {assignments.filter((a) => a.status === 'IN_PROGRESS').length}
            </span>
            <span className="stat-label">In Progress</span>
          </div>
          <div className="stat-pill">
            <span className="stat-num text-emerald">
              {assignments.filter((a) => a.status === 'COMPLETED').length}
            </span>
            <span className="stat-label">Evaluated</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-search-row">
        <div className="filter-pills">
          {['ALL', 'IN_PROGRESS', 'ASSIGNED', 'AWAITING_REVIEW', 'COMPLETED'].map((statusKey) => (
            <button
              key={statusKey}
              className={`filter-pill-btn ${filter === statusKey ? 'active' : ''}`}
              onClick={() => setFilter(statusKey)}
            >
              {statusKey === 'ALL' ? 'All Candidates' : statusKey.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search candidate name or QP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Candidate Queue */}
      <div className="candidate-queue-section">
        {loading ? (
          <div className="text-center p-8">Loading assigned candidates...</div>
        ) : filtered.length === 0 ? (
          <Card variant="solid">
            <CardBody className="text-center p-8">
              <p className="text-muted">No candidates found matching the selected filter.</p>
            </CardBody>
          </Card>
        ) : (
          <div className="assignments-grid">
            {filtered.map((item) => (
              <Card key={item.id} variant="solid" className="assignment-item-card">
                <CardHeader
                  title={
                    <div className="candidate-header-row">
                      <span className="cand-name">{item.candidate.name}</span>
                      <StatusBadge status={item.status} />
                    </div>
                  }
                  subtitle={
                    <div className="cand-sub">
                      <span>Candidate: {item.candidate.email}</span>
                      {item.candidate.phone && <span>• {item.candidate.phone}</span>}
                    </div>
                  }
                  action={
                    <Badge variant="nsqf">Level {item.qualification.nsqf_level}</Badge>
                  }
                />
                <CardBody>
                  <div className="qp-assigned-box">
                    <span className="qp-code-tag">{item.qualification.qp_code}</span>
                    <span className="qp-title-text">{item.qualification.title}</span>
                  </div>

                  <div className="meta-details-grid">
                    <div className="meta-row">
                      <Calendar size={14} className="text-muted" />
                      <span>Scheduled: <strong>{item.scheduled_date}</strong></span>
                    </div>
                    <div className="meta-row">
                      <MapPin size={14} className="text-muted" />
                      <span>Location: <strong>{item.location}</strong></span>
                    </div>
                  </div>

                  {item.instructions && (
                    <div className="assessor-notes-box">
                      <span className="notes-label">Assessment Focus:</span>
                      <p className="notes-text">{item.instructions}</p>
                    </div>
                  )}
                </CardBody>
                <CardFooter>
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Compass}
                      onClick={() => onOpenAssessment(item.assessment_id || item.id)}
                    >
                      Practical Assessment
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={FileCheck}
                      onClick={() => onOpenReview(item.assessment_id || item.id)}
                    >
                      Review & Sign-Off
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
