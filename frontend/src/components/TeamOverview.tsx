import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTeamData } from '../hooks/useAthleteData';
import { useWeatherData } from '../hooks/useWeatherData';
import { WeatherCard } from './WeatherCard';
import { TeamStats } from './TeamStats';
import { getFormattedDate, WEATHER_CONFIG } from '../constants';

export const TeamOverview: React.FC = () => {
  
  const navigate = useNavigate();

  // Use custom hooks for data fetching
  const { athletes, biometricData, geneticProfiles, loading: dataLoading } = useTeamData(true);
  const { airQuality } = useWeatherData();

  const formattedDate = getFormattedDate();

  const handleAthleteClick = (athleteId: string) => {
    navigate(`/athlete/${athleteId}`);
  };

  // Show loading state while fetching data
  if (dataLoading) {
    return (
      <div className="app-container">
        <div className="background-gradient"></div>
        <div className="background-rings"></div>
        <div className="main-content">
          <div className="flex items-center justify-center h-screen">
            <div className="text-white text-2xl">Loading athlete data...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Full Screen Gradient Background */}
      <div className="background-gradient"></div>
      <div className="background-rings"></div>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className="header-section">
          <h1 className="logo-text">
            <img
              src="/SAMLogo.png"
              alt="SAM Recovery Logo"
              className="h-8 md:h-10 lg:h-12 w-auto object-contain"
            />
          </h1>
          <p className="tagline">
            Precision Recovery Through Genetics × Biometrics × Environment
          </p>
        </header>

        {/* Environmental Health */}
        <WeatherCard
          airQuality={airQuality}
          city={WEATHER_CONFIG.CITY}
          formattedDate={formattedDate}
        />

        {/* Team Stats and Athletes */}
        <TeamStats
          athletes={athletes}
          biometricData={biometricData}
          geneticProfiles={geneticProfiles}
          onAthleteClick={handleAthleteClick}
        />
      </div>
    </div>
  );
};