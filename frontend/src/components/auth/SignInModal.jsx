import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { Input } from '../common/Input';
import { useAuth } from '../../services/authContext';
import { UserCheck, ShieldCheck, HardHat, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';
import './SignInModal.css';

export default function SignInModal({ isOpen, onClose, initialRole = 'WORKER', onLoginSuccess }) {
  const { login, demoLogin, register } = useAuth();
  const [tab, setTab] = useState(initialRole); // 'WORKER' | 'ASSESSOR' | 'REGISTER'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (tab === 'REGISTER') {
        await register({ email, password, full_name: fullName });
      } else {
        await login(email, password);
      }
      onClose();
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = async (role) => {
    setError('');
    setLoading(true);
    try {
      await demoLogin(role);
      onClose();
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        tab === 'REGISTER'
          ? 'Candidate Registration'
          : tab === 'WORKER'
          ? 'Worker / Candidate Sign In'
          : 'Assessor & Administrator Portal Access'
      }
      subtitle="Access your RPL declaration, assessment workspace, or compliance monitoring."
      maxWidth="520px"
    >
      <div className="signin-modal-content">
        {/* Role Selector Tabs */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${tab === 'WORKER' ? 'active' : ''}`}
            onClick={() => { setTab('WORKER'); setError(''); }}
          >
            <HardHat size={16} />
            <span>Worker / Candidate</span>
          </button>
          <button
            className={`auth-tab ${tab === 'ASSESSOR' ? 'active' : ''}`}
            onClick={() => { setTab('ASSESSOR'); setError(''); }}
          >
            <ShieldCheck size={16} />
            <span>Assessor / Admin</span>
          </button>
        </div>

        {error && <div className="auth-error-alert">{error}</div>}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {tab === 'REGISTER' && (
            <Input
              label="Full Name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Ramesh Kumar"
            />
          )}

          <Input
            label="Email Address"
            type="email"
            required
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={tab === 'WORKER' ? 'candidate@example.com' : 'evaluator@rpl.gov.in'}
          />

          <Input
            label="Password"
            type="password"
            required
            icon={Lock}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          <Button type="submit" variant="primary" loading={loading} className="w-full">
            {tab === 'REGISTER' ? 'Register & Begin Declaration' : 'Sign In'}
          </Button>
        </form>

        <div className="auth-toggle-text">
          {tab === 'REGISTER' ? (
            <p>
              Already have an account?{' '}
              <button className="link-btn" onClick={() => setTab('WORKER')}>
                Sign In here
              </button>
            </p>
          ) : tab === 'WORKER' ? (
            <p>
              New informal worker?{' '}
              <button className="link-btn" onClick={() => setTab('REGISTER')}>
                Create Candidate Account
              </button>
            </p>
          ) : null}
        </div>

        {/* Hackathon Evaluation Fast Demo Access */}
        <div className="demo-evaluator-card">
          <div className="demo-evaluator-header">
            <Sparkles size={14} className="text-gold" />
            <span>SIH Hackathon Evaluation Demo Logins</span>
          </div>
          <p className="demo-evaluator-desc">
            Instantly explore predefined personas loaded with verified NCVET data:
          </p>
          <div className="demo-buttons-grid">
            <button
              type="button"
              className="demo-card-btn"
              onClick={() => handleDemoAccess('WORKER')}
              disabled={loading}
            >
              <div className="demo-btn-title">Ramesh Kumar (Worker)</div>
              <div className="demo-btn-sub">6.5 yrs Electrical Experience</div>
            </button>
            <button
              type="button"
              className="demo-card-btn"
              onClick={() => handleDemoAccess('ASSESSOR')}
              disabled={loading}
            >
              <div className="demo-btn-title">Priya Sharma (Assessor)</div>
              <div className="demo-btn-sub">Lead CSDCI Evaluator</div>
            </button>
            <button
              type="button"
              className="demo-card-btn"
              onClick={() => handleDemoAccess('ADMIN')}
              disabled={loading}
            >
              <div className="demo-btn-title">Sanjay Gupta (Admin)</div>
              <div className="demo-btn-sub">National RPL Coordinator</div>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
