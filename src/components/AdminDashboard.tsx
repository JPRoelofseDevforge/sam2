import React, { useState } from 'react';
import { OrganizationsAdmin } from './admin/OrganizationsAdmin';
import { SportsAdmin } from './admin/SportsAdmin';
import { AthletesAdmin } from './admin/AthletesAdmin';
import { AlertTypesAdmin } from './admin/AlertTypesAdmin';
import { GeneticTestTypesAdmin } from './admin/GeneticTestTypesAdmin';
import { UserRolesAdmin } from './admin/UserRolesAdmin';
import { UserOrganizationRolesAdmin } from './admin/UserOrganizationRolesAdmin';
import { AthleteOrganizationHistoryAdmin } from './admin/AthleteOrganizationHistoryAdmin';
import { GeneticTestResultsAdmin } from './admin/GeneticTestResultsAdmin';
import { GeneticProfilesAdmin } from './admin/GeneticProfilesAdmin';
import { BiometricDataAdmin } from './admin/BiometricDataAdmin';
import { BodyCompositionAdmin } from './admin/BodyCompositionAdmin';
import { BodySymmetryAdmin } from './admin/BodySymmetryAdmin';
import { AthleteAlertsAdmin } from './admin/AthleteAlertsAdmin';
import { ReadinessScoresAdmin } from './admin/ReadinessScoresAdmin';
import { TrainingLoadTrendsAdmin } from './admin/TrainingLoadTrendsAdmin';

type AdminView = 'overview' | 'organizations' | 'sports' | 'athletes' | 'alertTypes' | 'geneticTestTypes' | 'userRoles' | 'userOrganizationRoles' | 'athleteOrganizationHistory' | 'geneticTestResults' | 'geneticProfiles' | 'biometricData' | 'bodyComposition' | 'bodySymmetry' | 'athleteAlerts' | 'readinessScores' | 'trainingLoadTrends';

// Define the type for the navigation function
type NavigateFunction = (view: AdminView) => void;

// Define the props for admin components
interface AdminComponentProps {
  onNavigate?: NavigateFunction;
}

export const AdminDashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<AdminView>('overview');

  const renderContent = () => {
    switch (currentView) {
      case 'organizations':
        return <OrganizationsAdmin onNavigate={setCurrentView} />;
      case 'sports':
        return <SportsAdmin onNavigate={setCurrentView} />;
      case 'athletes':
        return <AthletesAdmin onNavigate={setCurrentView} />;
      case 'alertTypes':
        return <AlertTypesAdmin onNavigate={setCurrentView} />;
      case 'geneticTestTypes':
        return <GeneticTestTypesAdmin onNavigate={setCurrentView} />;
      case 'userRoles':
        return <UserRolesAdmin onNavigate={setCurrentView} />;
      case 'userOrganizationRoles':
        return <UserOrganizationRolesAdmin onNavigate={setCurrentView} />;
      case 'athleteOrganizationHistory':
        return <AthleteOrganizationHistoryAdmin onNavigate={setCurrentView} />;
      case 'geneticTestResults':
        return <GeneticTestResultsAdmin onNavigate={setCurrentView} />;
      case 'geneticProfiles':
        return <GeneticProfilesAdmin onNavigate={setCurrentView} />;
      case 'biometricData':
        return <BiometricDataAdmin onNavigate={setCurrentView} />;
      case 'bodyComposition':
        return <BodyCompositionAdmin onNavigate={setCurrentView} />;
      case 'bodySymmetry':
        return <BodySymmetryAdmin onNavigate={setCurrentView} />;
      case 'athleteAlerts':
        return <AthleteAlertsAdmin onNavigate={setCurrentView} />;
      case 'readinessScores':
        return <ReadinessScoresAdmin onNavigate={setCurrentView} />;
      case 'trainingLoadTrends':
        return <TrainingLoadTrendsAdmin onNavigate={setCurrentView} />;
      default:
        return <AdminOverview onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Top Bar Navigation */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            </div>
           
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button className="text-white hover:bg-white/20 p-2 rounded-md">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <p className="text-white/80">Manage system data and configurations</p>
        </div>

        {/* Content Area */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

const AdminOverview: React.FC<{ onNavigate: (view: AdminView) => void }> = ({ onNavigate }) => {
  const adminSections = [
    {
      title: 'Organizations',
      description: 'Manage teams, clubs, and organizations',
      view: 'organizations' as AdminView,
      icon: '🏢'
    },
    {
      title: 'Sports',
      description: 'Manage sports and disciplines',
      view: 'sports' as AdminView,
      icon: '⚽'
    },
    {
      title: 'Athletes',
      description: 'Manage athlete profiles and data',
      view: 'athletes' as AdminView,
      icon: '🏃'
    },
    {
      title: 'Alert Types',
      description: 'Configure system alert types and severities',
      view: 'alertTypes' as AdminView,
      icon: '⚠️'
    },
    {
      title: 'Genetic Test Types',
      description: 'Manage genetic test configurations',
      view: 'geneticTestTypes' as AdminView,
      icon: '🧪'
    },
    {
      title: 'User Roles',
      description: 'Manage user roles and permissions',
      view: 'userRoles' as AdminView,
      icon: '👤'
    },
    {
      title: 'User Org Roles',
      description: 'Manage user organization roles',
      view: 'userOrganizationRoles' as AdminView,
      icon: '👥'
    },
    {
      title: 'Athlete Org History',
      description: 'Manage athlete organization history',
      view: 'athleteOrganizationHistory' as AdminView,
      icon: '📋'
    },
    {
      title: 'Genetic Test Results',
      description: 'Manage genetic test results',
      view: 'geneticTestResults' as AdminView,
      icon: '🧬'
    },
    {
      title: 'Genetic Profiles',
      description: 'Manage genetic profiles',
      view: 'geneticProfiles' as AdminView,
      icon: '🧬'
    },
    {
      title: 'Biometric Data',
      description: 'Manage biometric data',
      view: 'biometricData' as AdminView,
      icon: '📊'
    },
    {
      title: 'Body Composition',
      description: 'Manage body composition data',
      view: 'bodyComposition' as AdminView,
      icon: '⚖️'
    },
    {
      title: 'Body Symmetry',
      description: 'Manage body symmetry data',
      view: 'bodySymmetry' as AdminView,
      icon: '⚖️'
    },
    {
      title: 'Athlete Alerts',
      description: 'Manage athlete alerts',
      view: 'athleteAlerts' as AdminView,
      icon: '🔔'
    },
    {
      title: 'Readiness Scores',
      description: 'Manage readiness scores',
      view: 'readinessScores' as AdminView,
      icon: '📈'
    },
    {
      title: 'Training Load Trends',
      description: 'Manage training load trends',
      view: 'trainingLoadTrends' as AdminView,
      icon: '🏋️'
    }
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">System Administration</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminSections.map((section) => (
          <div
            key={section.view}
            onClick={() => onNavigate(section.view)}
            className="bg-white/20 rounded-lg p-6 border border-white/30 cursor-pointer hover:bg-white/30 transition-colors"
          >
            <div className="text-3xl mb-3">{section.icon}</div>
            <h3 className="text-xl font-semibold text-white mb-2">{section.title}</h3>
            <p className="text-white/80">{section.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};