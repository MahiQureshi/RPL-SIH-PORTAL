import React, { useState, useEffect } from 'react';
import Card, { CardHeader, CardBody } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import AssignmentManager from './AssignmentManager';
import ConsistencyAnalytics from './ConsistencyAnalytics';
import { api } from '../../services/api';
import { offlineStorage } from '../../services/indexedDB';
import { syncManager } from '../../services/syncManager';
import {
  Users,
  ShieldCheck,
  Calendar,
  CheckCircle,
  FileText,
  Activity,
  Layers,
  WifiOff,
  RefreshCw,
  ExternalLink,
  BookOpen,
  Database
} from 'lucide-react';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'assignments' | 'consistency' | 'qualifications' | 'audit' | 'offline'
  const [metrics, setMetrics] = useState(null);
  const [auditEvents, setAuditEvents] = useState([]);
  const [qualifications, setQualifications] = useState([]);
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [overviewRes, auditRes, qpRes, queueRes] = await Promise.all([
        api.getOverviewMetrics(),
        api.getAuditTrail(25),
        api.getQualifications(),
        offlineStorage.getAllQueueItems()
      ]);
      setMetrics(overviewRes?.metrics || {});
      setAuditEvents(auditRes || []);
      setQualifications(qpRes || []);
      setOfflineQueue(queueRes || []);
    } catch (err) {
      console.error('Error loading admin overview data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleManualSync = async () => {
    setSyncing(true);
    await syncManager.flushQueue();
    const updatedQueue = await offlineStorage.getAllQueueItems();
    setOfflineQueue(updatedQueue);
    setSyncing(false);
  };

  return (
    <div className="admin-dashboard-page animate-fade-in">
      {/* Top Banner */}
      <div className="admin-banner glass-panel">
        <div className="admin-title-group">
          <Badge variant="crimson">Administrative Command & Quality Assurance</Badge>
          <h2 className="admin-main-title">National RPL Operations & Compliance</h2>
          <p className="admin-subtitle">
            Centralized monitoring of workforce declarations, assessor workload, NCVET qualification packs, and statistical agreement reliability.
          </p>
        </div>

        {/* Global Admin Tabs */}
        <div className="admin-nav-tabs">
          <button
            className={`admin-nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Activity size={15} />
            <span>Overview</span>
          </button>
          <button
            className={`admin-nav-tab ${activeTab === 'assignments' ? 'active' : ''}`}
            onClick={() => setActiveTab('assignments')}
          >
            <Calendar size={15} />
            <span>Assignments</span>
          </button>
          <button
            className={`admin-nav-tab ${activeTab === 'consistency' ? 'active' : ''}`}
            onClick={() => setActiveTab('consistency')}
          >
            <ShieldCheck size={15} />
            <span>Assessor Consistency</span>
          </button>
          <button
            className={`admin-nav-tab ${activeTab === 'qualifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('qualifications')}
          >
            <BookOpen size={15} />
            <span>Qualification Library</span>
          </button>
          <button
            className={`admin-nav-tab ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            <FileText size={15} />
            <span>Audit Trail</span>
          </button>
          <button
            className={`admin-nav-tab ${activeTab === 'offline' ? 'active' : ''}`}
            onClick={() => setActiveTab('offline')}
          >
            <Database size={15} />
            <span>Offline Sync Center</span>
          </button>
        </div>
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="overview-tab-content space-y-6">
          {/* Key Metrics Cards */}
          <div className="metrics-grid">
            <div className="metric-card glass-panel" onClick={() => setActiveTab('assignments')}>
              <span className="metric-label">Registered Workers</span>
              <span className="metric-value text-primary">{metrics?.total_workers || 0}</span>
              <span className="metric-sub text-sky">Candidate pool</span>
            </div>

            <div className="metric-card glass-panel" onClick={() => setActiveTab('assignments')}>
              <span className="metric-label">Authorized Assessors</span>
              <span className="metric-value text-gold">{metrics?.total_assessors || 0}</span>
              <span className="metric-sub">CSDCI / ESSCI certified</span>
            </div>

            <div className="metric-card glass-panel" onClick={() => setActiveTab('assignments')}>
              <span className="metric-label">Total Assignments</span>
              <span className="metric-value text-sky">{metrics?.total_assignments || 0}</span>
              <span className="metric-sub text-emerald">Active RPL drives</span>
            </div>

            <div className="metric-card glass-panel" onClick={() => setActiveTab('assignments')}>
              <span className="metric-label">In-Progress Evaluations</span>
              <span className="metric-value text-gold">{metrics?.active_assessments || 0}</span>
              <span className="metric-sub">Field booths</span>
            </div>

            <div className="metric-card glass-panel" onClick={() => setActiveTab('assignments')}>
              <span className="metric-label">Certified Candidates</span>
              <span className="metric-value text-emerald">{metrics?.certified_count || 0}</span>
              <span className="metric-sub text-emerald">Signed-off recommendations</span>
            </div>

            <div className="metric-card glass-panel" onClick={() => setActiveTab('qualifications')}>
              <span className="metric-label">Verified Qualifications</span>
              <span className="metric-value text-primary">{metrics?.total_qualifications || 0}</span>
              <span className="metric-sub">NCVET / NQR standards</span>
            </div>
          </div>

          {/* Quick Snapshot Rows */}
          <div className="grid grid-cols-1 grid-cols-2-sm gap-6">
            <Card variant="solid">
              <CardHeader
                title="Recent System Audit Events"
                subtitle="Live security and compliance log"
                action={
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('audit')}>
                    View All
                  </Button>
                }
              />
              <CardBody className="p-0">
                <div className="audit-feed">
                  {auditEvents.slice(0, 5).map((ev) => (
                    <div key={ev.id} className="audit-feed-item">
                      <div className="audit-feed-top">
                        <Badge variant="sky" size="sm">{ev.event_type}</Badge>
                        <span className="text-muted text-xs font-mono">{ev.timestamp?.substring(0, 16)}</span>
                      </div>
                      <p className="audit-feed-desc">{ev.details}</p>
                      <span className="text-muted text-xs">Actor: {ev.actor_name} ({ev.actor_role})</span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            <Card variant="solid">
              <CardHeader
                title="Active Qualification Packs"
                subtitle="Public NCVET benchmark trades"
                action={
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('qualifications')}>
                    Explore Library
                  </Button>
                }
              />
              <CardBody className="p-0">
                <div className="qp-feed">
                  {qualifications.map((qp) => (
                    <div key={qp.id} className="qp-feed-item">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-mono text-xs text-sky font-bold">{qp.qp_code}</span>
                        <Badge variant="nsqf" size="sm">NSQF Level {qp.nsqf_level}</Badge>
                      </div>
                      <div className="font-bold text-xs">{qp.title}</div>
                      <div className="text-muted text-xs">{qp.awarding_body}</div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {/* Tab: Assignments */}
      {activeTab === 'assignments' && <AssignmentManager />}

      {/* Tab: Consistency */}
      {activeTab === 'consistency' && <ConsistencyAnalytics />}

      {/* Tab: Qualification Library */}
      {activeTab === 'qualifications' && (
        <div className="qualifications-tab animate-fade-in space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold">NCVET Qualification Pack Repository</h3>
              <p className="text-xs text-muted">
                Official qualifications loaded directly from the National Qualifications Register.
              </p>
            </div>
            <Badge variant="emerald">NCVET / NQR Verified</Badge>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {qualifications.map((qp) => (
              <Card key={qp.id} variant="solid">
                <CardHeader
                  title={
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sky">{qp.qp_code}</span>
                      <span>—</span>
                      <span>{qp.title}</span>
                    </div>
                  }
                  subtitle={qp.awarding_body}
                  action={<Badge variant="nsqf">Level {qp.nsqf_level}</Badge>}
                />
                <CardBody>
                  <p className="text-xs text-secondary mb-3">{qp.description}</p>
                  <div className="flex gap-4 text-xs text-muted">
                    <span>Units: <strong>{qp.competency_count} NOS</strong></span>
                    <span>•</span>
                    <span>Guided Tasks: <strong>{qp.task_count} Practical Setups</strong></span>
                    <span>•</span>
                    <a href={qp.source_document || 'https://www.nqr.gov.in'} target="_blank" rel="noreferrer" className="text-sky flex items-center gap-1">
                      <span>Source Registry</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Audit Trail */}
      {activeTab === 'audit' && (
        <Card variant="solid" className="animate-fade-in">
          <CardHeader
            title="System Audit & Governance Trail"
            subtitle="Immutable chronological log of scoring, declaration, and human sign-off events"
          />
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Actor</th>
                    <th>Role</th>
                    <th>Event Type</th>
                    <th>Target Record</th>
                    <th>Event Description</th>
                  </tr>
                </thead>
                <tbody>
                  {auditEvents.map((ev) => (
                    <tr key={ev.id}>
                      <td className="font-mono text-xs">{ev.timestamp?.replace('T', ' ').substring(0, 19)}</td>
                      <td className="font-bold text-xs">{ev.actor_name}</td>
                      <td>
                        <Badge variant="neutral" size="sm">{ev.actor_role}</Badge>
                      </td>
                      <td>
                        <Badge variant="sky" size="sm">{ev.event_type}</Badge>
                      </td>
                      <td className="font-mono text-xs text-muted">{ev.record_type}</td>
                      <td className="text-xs text-secondary">{ev.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Tab: Offline Sync Center (SCREEN 37) */}
      {activeTab === 'offline' && (
        <div className="offline-tab animate-fade-in space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold">Offline & Synchronization Center</h3>
              <p className="text-xs text-muted">
                Monitor client-side IndexedDB outbox queue, local drafts, and trigger manual synchronization.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={RefreshCw}
              loading={syncing}
              onClick={handleManualSync}
            >
              Flush Sync Outbox
            </Button>
          </div>

          <div className="grid grid-cols-1 grid-cols-3-lg gap-4">
            <div className="kpi-card glass-panel">
              <span className="kpi-label">Queued Operations</span>
              <span className="kpi-val text-sky">
                {offlineQueue.filter((q) => q.status === 'PENDING').length}
              </span>
              <span className="kpi-meta">Awaiting server transmission</span>
            </div>

            <div className="kpi-card glass-panel">
              <span className="kpi-label">Successfully Synced</span>
              <span className="kpi-val text-emerald">
                {offlineQueue.filter((q) => q.status === 'SYNCED').length}
              </span>
              <span className="kpi-meta">Acknowledged by central DB</span>
            </div>

            <div className="kpi-card glass-panel">
              <span className="kpi-label">Local Storage Engine</span>
              <span className="kpi-val text-primary text-xl font-mono">IndexedDB</span>
              <span className="kpi-meta text-emerald">PWA Offline Cache Active</span>
            </div>
          </div>

          <Card variant="solid">
            <CardHeader title="Offline Outbox Log" subtitle="Transactions recorded while in the field" />
            <CardBody className="p-0">
              {offlineQueue.length === 0 ? (
                <div className="text-center p-8 text-muted text-xs">
                  All local changes are completely synchronized with the central server.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="audit-table">
                    <thead>
                      <tr>
                        <th>Queue ID</th>
                        <th>Action Type</th>
                        <th>Endpoint</th>
                        <th>Created At</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {offlineQueue.map((item) => (
                        <tr key={item.id}>
                          <td className="font-mono text-xs">#{item.id}</td>
                          <td>
                            <Badge variant="sky" size="sm">{item.type}</Badge>
                          </td>
                          <td className="font-mono text-xs">{item.endpoint}</td>
                          <td className="text-xs">{item.createdAt?.substring(0, 16)}</td>
                          <td>
                            <Badge
                              variant={item.status === 'SYNCED' ? 'emerald' : 'gold'}
                              size="sm"
                            >
                              {item.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
