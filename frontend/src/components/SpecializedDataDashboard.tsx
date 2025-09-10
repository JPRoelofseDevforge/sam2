import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import WomenHealthCalendar from './WomenHealthCalendar';
import GpsMapComponent from './GpsMapComponent';
import ApneaList from './ApneaList';
import AuthComponent from './AuthComponent';

const SpecializedDataDashboard: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('womenHealth');

  if (!isAuthenticated) {
    return <AuthComponent />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'womenHealth':
        return <WomenHealthCalendar />;
      case 'gps':
        return <GpsMapComponent />;
      case 'apnea':
        return <ApneaList />;
      default:
        return <WomenHealthCalendar />;
    }
  };

  return (
    <div className="specialized-data-dashboard">
      <h1>Specialized Data Dashboard</h1>
      <div className="tabs">
        <button
          className={activeTab === 'womenHealth' ? 'active' : ''}
          onClick={() => setActiveTab('womenHealth')}
        >
          Women Health Calendar
        </button>
        <button
          className={activeTab === 'gps' ? 'active' : ''}
          onClick={() => setActiveTab('gps')}
        >
          GPS Map
        </button>
        <button
          className={activeTab === 'apnea' ? 'active' : ''}
          onClick={() => setActiveTab('apnea')}
        >
          Apnea Events
        </button>
      </div>
      <div className="content">
        {renderContent()}
      </div>
    </div>
  );
};

export default SpecializedDataDashboard;