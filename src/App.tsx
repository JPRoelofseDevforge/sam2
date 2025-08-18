import React, { useState } from 'react';
import { TeamOverview } from './components/TeamOverview';
import { AthleteProfile } from './components/AthleteProfile';
import { TeamComparisonDashboard } from './components/TeamComparisonDashboard';
import { TrainingLoadHeatmap } from './components/TrainingLoadHeatmap';
import { RecoveryTimeline } from './components/RecoveryTimeline';

function App() {
  const [currentView, setCurrentView] = useState<'team' | 'athlete' | 'comparison' | 'trainingLoad' | 'recoveryTimeline'>('team');
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);

  const handleAthleteClick = (athleteId: string) => {
    setSelectedAthleteId(athleteId);
    setCurrentView('athlete');
  };

  const handleBackToTeam = () => {
    setCurrentView('team');
    setSelectedAthleteId(null);
  };

  const handleNavClick = (view: 'team' | 'comparison' | 'trainingLoad' | 'recoveryTimeline') => {
    setCurrentView(view);
  };

return (
  <div className="app-container">
    {/* Full-Screen Purple Gradient Background (Soft Glow) */}
    <div className="background-gradient"></div>
    <div className="background-rings"></div>

    {/* Navigation */}
    <nav className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex space-x-8">
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
          </div>
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
      ) : null}
    </div>
  </div>
);
}

export default App;