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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="container mx-auto px-4 py-8">
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