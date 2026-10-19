import React from 'react';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import {
  Award,
  CheckCircle2,
  Cpu,
  FileCheck,
  Shield,
  WifiOff,
  Users,
  ArrowRight,
  Sparkles,
  BookOpen,
  Scale,
  Compass
} from 'lucide-react';
import './LandingPage.css';

export default function LandingPage({ onOpenAuthModal, onSelectPortal }) {
  return (
    <div className="landing-page animate-fade-in">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container hero-container">
          <div className="hero-badge">
            <span className="badge-pulse" />
            <span className="hero-badge-text">National RPL Skill Assessment Initiative</span>
          </div>

          <h1 className="hero-title">
            Your Skills. Your Experience.{' '}
            <span className="text-gradient">Your Recognition.</span>
          </h1>

          <p className="hero-subtitle">
            Empowering India's informal workforce to declare prior hands-on experience, map practical competencies to verified NCVET-aligned NSQF qualifications, complete guided assessments, and earn authorized certification recommendations.
          </p>

          <div className="hero-cta-group">
            <Button
              variant="primary"
              size="lg"
              icon={ArrowRight}
              iconPosition="right"
              onClick={() => onOpenAuthModal('WORKER')}
            >
              Candidate / Worker Portal
            </Button>
            <Button
              variant="secondary"
              size="lg"
              icon={Shield}
              onClick={() => onOpenAuthModal('ASSESSOR')}
            >
              Assessor & Admin Access
            </Button>
          </div>

          {/* Quick Stats / Highlights */}
          <div className="hero-highlights">
            <div className="highlight-item">
              <CheckCircle2 size={16} className="text-emerald" />
              <span>Public NCVET Qualification Packs</span>
            </div>
            <div className="highlight-item">
              <Cpu size={16} className="text-sky" />
              <span>Transparent AI Semantic Matching</span>
            </div>
            <div className="highlight-item">
              <WifiOff size={16} className="text-gold" />
              <span>Offline-First Field Capability</span>
            </div>
            <div className="highlight-item">
              <Scale size={16} className="text-emerald" />
              <span>Inter-Assessor Cohen's Kappa QA</span>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Architecture Section */}
      <section className="workflow-section">
        <div className="container">
          <div className="section-header text-center">
            <Badge variant="sky">Structured RPL Pipeline</Badge>
            <h2 className="section-title">How Prior Learning is Recognized</h2>
            <p className="section-subtitle">
              A transparent, 5-stage standard aligning uncertified practical expertise with national qualification standards.
            </p>
          </div>

          <div className="workflow-grid">
            <div className="workflow-step-card">
              <div className="step-number">01</div>
              <div className="step-icon-box">
                <BookOpen size={24} className="text-sky" />
              </div>
              <h3 className="step-title">Skill Declaration</h3>
              <p className="step-desc">
                Worker declares years of experience, trade tools utilized, specific tasks performed, and informal apprenticeship history.
              </p>
            </div>

            <div className="workflow-step-card">
              <div className="step-number">02</div>
              <div className="step-icon-box">
                <Cpu size={24} className="text-gold" />
              </div>
              <h3 className="step-title">NCVET QP Matching</h3>
              <p className="step-desc">
                AI semantic engine evaluates declared tasks against official National Occupational Standards (NOS) and ranks relevance scores.
              </p>
            </div>

            <div className="workflow-step-card">
              <div className="step-number">03</div>
              <div className="step-icon-box">
                <Compass size={24} className="text-sky" />
              </div>
              <h3 className="step-title">Guided Assessment</h3>
              <p className="step-desc">
                Certified assessor guides candidate through practical trade tasks with safety checklists, required tools, and criterion prompts.
              </p>
            </div>

            <div className="workflow-step-card">
              <div className="step-number">04</div>
              <div className="step-icon-box">
                <FileCheck size={24} className="text-emerald" />
              </div>
              <h3 className="step-title">Evidence & Rubric Scoring</h3>
              <p className="step-desc">
                Criterion-level photographic/documentary evidence is linked to official rubric performance levels (Competent, Partial, Not Demonstrated).
              </p>
            </div>

            <div className="workflow-step-card">
              <div className="step-number">05</div>
              <div className="step-icon-box">
                <Shield size={24} className="text-gold" />
              </div>
              <h3 className="step-title">Human Sign-Off</h3>
              <p className="step-desc">
                Authorized assessor reviews evidence profile and signs off on the official certification recommendation. AI never replaces human decision.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Verified Trades Showcase Section */}
      <section className="trades-section">
        <div className="container">
          <div className="section-header">
            <Badge variant="gold">Verified NCVET Standards</Badge>
            <h2 className="section-title">Available Qualification Packs for Assessment</h2>
            <p className="section-subtitle">
              Public qualification packs mapped with real National Occupational Standards and criterion scoring keys.
            </p>
          </div>

          <div className="trades-grid">
            <Card variant="glass" className="trade-card">
              <CardBody>
                <div className="trade-card-top">
                  <Badge variant="nsqf">NSQF Level 4</Badge>
                  <span className="trade-code">CON/Q0601</span>
                </div>
                <h3 className="trade-title">General Electrician</h3>
                <p className="trade-awarding">
                  Construction Skill Development Council of India (CSDCI) / NCVET
                </p>
                <p className="trade-desc">
                  Planning, installation, conduit bending, DB wiring, insulation resistance testing (megger), and earthing verification.
                </p>
                <div className="trade-tags">
                  <span className="tag">5 NOS Units</span>
                  <span className="tag">Practical Tasks</span>
                  <span className="tag">Rubric Ready</span>
                </div>
              </CardBody>
            </Card>

            <Card variant="glass" className="trade-card">
              <CardBody>
                <div className="trade-card-top">
                  <Badge variant="nsqf">NSQF Level 4</Badge>
                  <span className="trade-code">ELE/Q3102</span>
                </div>
                <h3 className="trade-title">Field Technician - Home Appliances</h3>
                <p className="trade-awarding">
                  Electronics Sector Skills Council of India (ESSCI) / NCVET
                </p>
                <p className="trade-desc">
                  Diagnosis, preventive maintenance, motor troubleshooting, and electrical safety for domestic washing machines and microwaves.
                </p>
                <div className="trade-tags">
                  <span className="tag">4 NOS Units</span>
                  <span className="tag">Safety LOTO</span>
                  <span className="tag">Multi-meter Tested</span>
                </div>
              </CardBody>
            </Card>

            <Card variant="glass" className="trade-card">
              <CardBody>
                <div className="trade-card-top">
                  <Badge variant="nsqf">NSQF Level 4</Badge>
                  <span className="trade-code">ASC/Q1402</span>
                </div>
                <h3 className="trade-title">Automotive Service Technician</h3>
                <p className="trade-awarding">
                  Automotive Skills Development Council (ASDC) / NCVET
                </p>
                <p className="trade-desc">
                  Brake servicing, engine tuning, 12V electrical circuit diagnostics, and multi-point vehicle roadworthiness inspection.
                </p>
                <div className="trade-tags">
                  <span className="tag">6 NOS Units</span>
                  <span className="tag">OBD-II Scanners</span>
                  <span className="tag">Torque Wrench</span>
                </div>
              </CardBody>
            </Card>

            <Card variant="glass" className="trade-card">
              <CardBody>
                <div className="trade-card-top">
                  <Badge variant="nsqf">NSQF Level 4</Badge>
                  <span className="trade-code">CON/Q0102</span>
                </div>
                <h3 className="trade-title">Mason General</h3>
                <p className="trade-awarding">
                  Construction Skill Development Council of India (CSDCI) / NCVET
                </p>
                <p className="trade-desc">
                  Brick and block masonry, plumb line alignment, mortar mixing ratios, joint finishing, and structural scaffolding safety.
                </p>
                <div className="trade-tags">
                  <span className="tag">4 NOS Units</span>
                  <span className="tag">Plumb Bob</span>
                  <span className="tag">Spirit Level</span>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust & Governance Notice */}
      <section className="governance-section">
        <div className="container">
          <div className="governance-card glass-panel">
            <div className="gov-icon-box">
              <Shield size={32} className="text-gold" />
            </div>
            <div className="gov-content">
              <h3 className="gov-title">Human-in-the-Loop Governance Standards</h3>
              <p className="gov-desc">
                In strict adherence to NCVET assessment principles, artificial intelligence operates solely as an assistive tool for semantic matching and evidence organization. Official rubric scoring, safety compliance confirmation, and certification recommendations are exclusively conducted and signed off by authorized human evaluators.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container footer-container">
          <div className="footer-left">
            <div className="footer-brand">
              <Award size={18} className="text-sky" />
              <span>National RPL Assessment Platform</span>
            </div>
            <p className="footer-copy">
              Smart India Hackathon Prototype • Standardized Recognition of Prior Learning (RPL)
            </p>
          </div>
          <div className="footer-right">
            <div className="footer-links">
              <span>NCVET Guidelines</span>
              <span>NSQF Framework</span>
              <span>Privacy & Consent</span>
              <span>Audit Logging</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
