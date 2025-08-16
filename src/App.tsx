import React, { useState } from 'react';
import { TeamOverview } from './components/TeamOverview';
import { AthleteProfile } from './components/AthleteProfile';

function App() {
  const [currentView, setCurrentView] = useState<'team' | 'athlete'>('team');
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);

  const handleAthleteClick = (athleteId: string) => {
    setSelectedAthleteId(athleteId);
    setCurrentView('athlete');
  };

  const handleBackToTeam = () => {
    setCurrentView('team');
    setSelectedAthleteId(null);
  };

return (
  <div className="app-container">
    {/* Full-Screen Purple Gradient Background (Soft Glow) */}
    <div className="background-gradient"></div>
    <div className="background-rings"></div>

    {/* Main Content Area with Glassmorphism */}
    <div className="main-content">
      {currentView === 'team' ? (
        <TeamOverview onAthleteClick={handleAthleteClick} />
      ) : (
        selectedAthleteId && (
          <AthleteProfile 
            athleteId={selectedAthleteId} 
            onBack={handleBackToTeam} 
          />
        )
      )}
    </div>
  </div>
);
}

export default App;