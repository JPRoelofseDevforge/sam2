import React, { useState } from 'react';
import { TeamOverview } from './components/TeamOverview';
import { AthleteProfile } from './components/AthleteProfile';
import { TeamComparisonDashboard } from './components/TeamComparisonDashboard';
import { TrainingLoadHeatmap } from './components/TrainingLoadHeatmap';
import { RecoveryTimeline } from './components/RecoveryTimeline';
import { PredictiveAnalytics } from './components/PredictiveAnalytics';
import { UserManagement } from './components/UserManagement';
import { AdminDashboard } from './components/AdminDashboard';
import { WeatherImpactTest } from './components/WeatherImpactTest';
import { Login } from './auth/Login';
import { useAuth } from './auth/AuthContext';

function App() {
  console.log('🔄 App: Component re-rendered');
  const [currentView, setCurrentView] = useState<'team' | 'athlete' | 'comparison' | 'trainingLoad' | 'recoveryTimeline' | 'predictive' | 'whoopStress' | 'userManagement' | 'admin' | 'weatherTest'>('team');
  const [selectedAthleteId, setSelectedAthleteId] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();

  console.log('🔄 App: Auth state', { isAuthenticated, currentView, selectedAthleteId });

  const handleAthleteClick = (athleteId: number) => {
    setSelectedAthleteId(athleteId);
    setCurrentView('athlete');
  };

  const handleBackToTeam = () => {
    setCurrentView('team');
    setSelectedAthleteId(null);
  };

  const handleNavClick = (view: 'team' | 'comparison' | 'trainingLoad' | 'recoveryTimeline' | 'predictive' | 'whoopStress' | 'userManagement' | 'admin' | 'weatherTest') => {
    setCurrentView(view);
  };

  // If not authenticated, show login page
  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="app-container">
      {/* Full-Screen Purple Gradient Background (Soft Glow) */}
      <div className="background-gradient"></div>
      <div className="background-rings"></div>

      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="mobile-menu-button inline-flex items-center justify-center p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {/* Hamburger icon when menu is closed */}
              <svg
                className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              {/* Close icon when menu is open */}
              <svg
                className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:space-x-8">
            <button
              onClick={() => handleNavClick('team')}
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                currentView === 'team'
                  ? 'border-blue-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Team Overview
            </button>
            <button
              onClick={() => handleNavClick('comparison')}
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                currentView === 'comparison'
                  ? 'border-blue-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Team Comparison
            </button>
            <button
              onClick={() => handleNavClick('trainingLoad')}
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                currentView === 'trainingLoad'
                  ? 'border-blue-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Training Load
            </button>
            <button
              onClick={() => handleNavClick('recoveryTimeline')}
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                currentView === 'recoveryTimeline'
                  ? 'border-blue-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Recovery Timeline
            </button>
            <button
              onClick={() => handleNavClick('predictive')}
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                currentView === 'predictive'
                  ? 'border-blue-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Predictive Analytics
            </button>
            <button
              onClick={() => handleNavClick('userManagement')}
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                currentView === 'userManagement'
                  ? 'border-blue-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              User Management
            </button>
            <button
              onClick={() => handleNavClick('admin')}
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                currentView === 'admin'
                  ? 'border-blue-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Admin Dashboard
            </button>
            <button
              onClick={() => handleNavClick('weatherTest')}
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                currentView === 'weatherTest'
                  ? 'border-blue-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Weather Test
            </button>
            <button
              onClick={logout}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden mobile-menu`}>
        <div className="pt-2 pb-3 space-y-1">
          <button
            onClick={() => {
              handleNavClick('team');
              setIsMobileMenuOpen(false);
            }}
            className={`mobile-menu-item block pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left ${
              currentView === 'team'
                ? 'mobile-menu-item active bg-blue-50 border-blue-500 text-blue-700'
                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
            }`}
          >
            Team Overview
          </button>
          <button
            onClick={() => {
              handleNavClick('comparison');
              setIsMobileMenuOpen(false);
            }}
            className={`mobile-menu-item block pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left ${
              currentView === 'comparison'
                ? 'mobile-menu-item active bg-blue-50 border-blue-500 text-blue-700'
                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
            }`}
          >
            Team Comparison
          </button>
          <button
            onClick={() => {
              handleNavClick('trainingLoad');
              setIsMobileMenuOpen(false);
            }}
            className={`mobile-menu-item block pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left ${
              currentView === 'trainingLoad'
                ? 'mobile-menu-item active bg-blue-50 border-blue-500 text-blue-700'
                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
            }`}
          >
            Training Load
          </button>
          <button
            onClick={() => {
              handleNavClick('recoveryTimeline');
              setIsMobileMenuOpen(false);
            }}
            className={`mobile-menu-item block pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left ${
              currentView === 'recoveryTimeline'
                ? 'mobile-menu-item active bg-blue-50 border-blue-500 text-blue-700'
                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
            }`}
          >
            Recovery Timeline
          </button>
          <button
            onClick={() => {
              handleNavClick('predictive');
              setIsMobileMenuOpen(false);
            }}
            className={`mobile-menu-item block pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left ${
              currentView === 'predictive'
                ? 'mobile-menu-item active bg-blue-50 border-blue-500 text-blue-700'
                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
            }`}
          >
            Predictive Analytics
          </button>
          <button
            onClick={() => {
              handleNavClick('userManagement');
              setIsMobileMenuOpen(false);
            }}
            className={`mobile-menu-item block pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left ${
              currentView === 'userManagement'
                ? 'mobile-menu-item active bg-blue-50 border-blue-500 text-blue-700'
                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
            }`}
          >
            User Management
          </button>
          <button
            onClick={() => {
              handleNavClick('admin');
              setIsMobileMenuOpen(false);
            }}
            className={`mobile-menu-item block pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left ${
              currentView === 'admin'
                ? 'mobile-menu-item active bg-blue-50 border-blue-500 text-blue-700'
                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
            }`}
          >
            Admin Dashboard
          </button>
          <button
            onClick={() => {
              handleNavClick('weatherTest');
              setIsMobileMenuOpen(false);
            }}
            className={`mobile-menu-item block pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left ${
              currentView === 'weatherTest'
                ? 'mobile-menu-item active bg-blue-50 border-blue-500 text-blue-700'
                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
            }`}
          >
            Weather Test
          </button>
          <button
            onClick={() => {
              logout();
              setIsMobileMenuOpen(false);
            }}
            className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-red-600 hover:bg-red-50 hover:border-red-300"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>

    {/* Main Content Area with Glassmorphism */}
    <div className="main-content">
      {currentView === 'team' ? (
        <TeamOverview onAthleteClick={handleAthleteClick} />
      ) : currentView === 'athlete' && selectedAthleteId ? (
        <AthleteProfile
          athleteId={selectedAthleteId}
          onBack={handleBackToTeam}
        />
      ) : currentView === 'comparison' ? (
        <TeamComparisonDashboard />
      ) : currentView === 'trainingLoad' ? (
        <TrainingLoadHeatmap />
      ) : currentView === 'recoveryTimeline' ? (
        <RecoveryTimeline />
      ) : currentView === 'predictive' ? (
        <PredictiveAnalytics />
      ) : currentView === 'whoopStress' ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-white mb-6">📊 WHOOP-Style Stress Metrics</h1>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <p className="text-white mb-4">WHOOP-style stress metrics are available within individual athlete profiles.</p>
            <p className="text-white/80 text-sm">
              Navigate to an athlete's profile and select the "WHOOP Stress" tab to view their stress metrics in the WHOOP style.
            </p>
          </div>
        </div>
      ) : currentView === 'userManagement' ? (
        <UserManagement />
      ) : currentView === 'admin' ? (
        <AdminDashboard />
      ) : currentView === 'weatherTest' ? (
        <WeatherImpactTest />
      ) : null}
    </div>
  </div>
);
}

export default App;