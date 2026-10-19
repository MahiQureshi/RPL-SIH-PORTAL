import React, { useState } from 'react';
import { useAuth } from '../../services/authContext';
import ThemeToggle from './ThemeToggle';
import LanguageSelector from './LanguageSelector';
import StatusIndicator from './StatusIndicator';
import Button from './Button';
import Badge from './Badge';
import { Award, LogOut, User as UserIcon, Shield, CheckCircle, Zap } from 'lucide-react';
import './Header.css';

export default function Header({ currentPortal, onSelectPortal, onOpenAuthModal }) {
  const { user, role, logout, demoLogin } = useAuth();
  const [switching, setSwitching] = useState(false);

  const handleDemoSwitch = async (targetRole) => {
    setSwitching(true);
    try {
      await demoLogin(targetRole);
      onSelectPortal(targetRole.toLowerCase());
    } catch (e) {
      console.error(e);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <header className="glass-header">
      <div className="container header-container">
        {/* Brand & Gov-Tech Heading */}
        <div className="header-brand" onClick={() => onSelectPortal('landing')} role="button" tabIndex={0}>
          <div className="brand-emblem">
            <Award size={22} className="text-sky" />
          </div>
          <div className="brand-titles">
            <div className="brand-main">
              <span className="brand-name">RPL National Skill Portal</span>
              <span className="brand-tag">NCVET Aligned</span>
            </div>
            <div className="brand-sub">Skill Assessment & Recognition of Prior Learning</div>
          </div>
        </div>

        {/* Center Portal Tabs for Authenticated Users */}
        {user && (
          <nav className="portal-nav" aria-label="Portal Navigation">
            <button
              className={`portal-tab ${currentPortal === 'worker' ? 'active' : ''}`}
              onClick={() => onSelectPortal('worker')}
            >
              Worker Portal
            </button>
            <button
              className={`portal-tab ${currentPortal === 'assessor' ? 'active' : ''}`}
              onClick={() => onSelectPortal('assessor')}
            >
              Assessor Portal
            </button>
            <button
              className={`portal-tab ${currentPortal === 'admin' ? 'active' : ''}`}
              onClick={() => onSelectPortal('admin')}
            >
              Admin & QA
            </button>
          </nav>
        )}

        {/* Right Controls: Online Status, Theme, Language, Profile/Auth */}
        <div className="header-actions">
          <StatusIndicator />
          <ThemeToggle />
          <LanguageSelector />

          {user ? (
            <div className="user-profile-badge">
              <div className="user-info">
                <span className="user-name">{user.full_name}</span>
                <Badge
                  variant={role === 'ADMIN' ? 'crimson' : role === 'ASSESSOR' ? 'gold' : 'emerald'}
                  size="sm"
                >
                  {role}
                </Badge>
              </div>

              {/* Quick Demo Switcher for SIH Judges */}
              <div className="demo-switch-group" title="Quick Role Switcher for Hackathon Evaluation">
                <button
                  className={`demo-pill ${role === 'WORKER' ? 'active' : ''}`}
                  onClick={() => handleDemoSwitch('WORKER')}
                  disabled={switching}
                >
                  Worker
                </button>
                <button
                  className={`demo-pill ${role === 'ASSESSOR' ? 'active' : ''}`}
                  onClick={() => handleDemoSwitch('ASSESSOR')}
                  disabled={switching}
                >
                  Assessor
                </button>
                <button
                  className={`demo-pill ${role === 'ADMIN' ? 'active' : ''}`}
                  onClick={() => handleDemoSwitch('ADMIN')}
                  disabled={switching}
                >
                  Admin
                </button>
              </div>

              <button className="logout-btn" onClick={logout} title="Sign Out">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="auth-action-group">
              <Button variant="ghost" size="sm" onClick={() => onOpenAuthModal('WORKER')}>
                Sign In
              </Button>
              <Button variant="primary" size="sm" onClick={() => onOpenAuthModal('WORKER')}>
                Get Certified
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
