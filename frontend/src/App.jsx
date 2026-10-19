import React, { useState } from 'react';
import { AuthProvider, useAuth } from './services/authContext';
import Header from './components/common/Header';
import SignInModal from './components/auth/SignInModal';
import LandingPage from './pages/LandingPage';
import WorkerDashboard from './pages/worker/WorkerDashboard';
import SkillDeclaration from './pages/worker/SkillDeclaration';
import QualificationMatches from './pages/worker/QualificationMatches';
import CompetencyReport from './pages/worker/CompetencyReport';
import AssessorDashboard from './pages/assessor/AssessorDashboard';
import PracticalAssessment from './pages/assessor/PracticalAssessment';
import AssessmentReview from './pages/assessor/AssessmentReview';
import AdminDashboard from './pages/admin/AdminDashboard';
import './styles/globals.css';

function MainApp() {
  const { user, role } = useAuth();
  const [currentPortal, setCurrentPortal] = useState('landing');
  const [workerView, setWorkerView] = useState('dashboard'); // 'dashboard' | 'declaration' | 'matching' | 'report'
  const [assessorView, setAssessorView] = useState('dashboard'); // 'dashboard' | 'assessment' | 'review' | 'report'
  const [activeAssessmentId, setActiveAssessmentId] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalRole, setAuthModalRole] = useState('WORKER');

  const handleOpenAuthModal = (targetRole = 'WORKER') => {
    setAuthModalRole(targetRole);
    setIsAuthModalOpen(true);
  };

  const handleSelectPortal = (portal) => {
    if (portal === 'landing') {
      setCurrentPortal('landing');
      return;
    }
    setCurrentPortal(portal);
    if (portal === 'worker') setWorkerView('dashboard');
    if (portal === 'assessor') setAssessorView('dashboard');
  };

  return (
    <div className="app-root">
      {/* Top National Header */}
      <Header
        currentPortal={currentPortal}
        onSelectPortal={handleSelectPortal}
        onOpenAuthModal={handleOpenAuthModal}
      />

      {/* Main Content Area */}
      <main className="container main-content-wrapper">
        {currentPortal === 'landing' && (
          <LandingPage
            onOpenAuthModal={handleOpenAuthModal}
            onSelectPortal={handleSelectPortal}
          />
        )}

        {/* Worker Portal */}
        {currentPortal === 'worker' && (
          <div className="portal-container">
            {workerView === 'dashboard' && (
              <WorkerDashboard onNavigate={(view) => setWorkerView(view)} />
            )}
            {workerView === 'declaration' && (
              <SkillDeclaration
                onDeclarationSubmitted={() => setWorkerView('matching')}
              />
            )}
            {workerView === 'matching' && (
              <QualificationMatches
                onConfirmed={() => setWorkerView('dashboard')}
              />
            )}
            {workerView === 'report' && (
              <CompetencyReport
                assessmentId={activeAssessmentId}
                onBack={() => setWorkerView('dashboard')}
              />
            )}
          </div>
        )}

        {/* Assessor Portal */}
        {currentPortal === 'assessor' && (
          <div className="portal-container">
            {assessorView === 'dashboard' && (
              <AssessorDashboard
                onOpenAssessment={(id) => {
                  setActiveAssessmentId(id);
                  setAssessorView('assessment');
                }}
                onOpenReview={(id) => {
                  setActiveAssessmentId(id);
                  setAssessorView('review');
                }}
              />
            )}
            {assessorView === 'assessment' && (
              <PracticalAssessment
                assessmentId={activeAssessmentId}
                onComplete={() => setAssessorView('review')}
              />
            )}
            {assessorView === 'review' && (
              <AssessmentReview
                assessmentId={activeAssessmentId}
                onSignOffComplete={() => {}}
                onViewReport={(id) => {
                  setActiveAssessmentId(id);
                  setAssessorView('report');
                }}
              />
            )}
            {assessorView === 'report' && (
              <CompetencyReport
                assessmentId={activeAssessmentId}
                onBack={() => setAssessorView('dashboard')}
              />
            )}
          </div>
        )}

        {/* Admin Portal */}
        {currentPortal === 'admin' && (
          <div className="portal-container">
            <AdminDashboard />
          </div>
        )}
      </main>

      {/* Authentication Modal */}
      <SignInModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialRole={authModalRole}
        onLoginSuccess={() => {
          if (authModalRole === 'ADMIN') setCurrentPortal('admin');
          else if (authModalRole === 'ASSESSOR') setCurrentPortal('assessor');
          else setCurrentPortal('worker');
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
