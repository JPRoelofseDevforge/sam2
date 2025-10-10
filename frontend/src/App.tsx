import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './auth/Login';
import { useAuth } from './auth/AuthContext';
import { Navigation, ErrorBoundary } from './components';

// Lazy load components for better performance
const TeamOverview = lazy(() => import('./components/TeamOverview').then(module => ({ default: module.TeamOverview })));
const AthleteProfile = lazy(() => import('./components/AthleteProfile').then(module => ({ default: module.AthleteProfile })));
const TeamComparisonDashboard = lazy(() => import('./components/TeamComparisonDashboard').then(module => ({ default: module.TeamComparisonDashboard })));
const TrainingLoadHeatmap = lazy(() => import('./components/TrainingLoadHeatmap').then(module => ({ default: module.TrainingLoadHeatmap })));
const RecoveryTimeline = lazy(() => import('./components/RecoveryTimeline').then(module => ({ default: module.RecoveryTimeline })));
const PredictiveAnalytics = lazy(() => import('./components/PredictiveAnalytics').then(module => ({ default: module.PredictiveAnalytics })));
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const WeatherImpactTest = lazy(() => import('./components/WeatherImpactTest').then(module => ({ default: module.WeatherImpactTest })));
const BodyCompositionManagement = lazy(() => import('./components/BodyCompositionManagement').then(module => ({ default: module.BodyCompositionManagement })));
const PharmaCoWatchlist = lazy(() => import('./components/PharmaCoWatchlist'));

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-white text-2xl">Loading...</div>
  </div>
);

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Main App component
const AppContent: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="app-container">
      {/* Full-Screen Purple Gradient Background (Soft Glow) */}
      <div className="background-gradient"></div>
      <div className="background-rings"></div>

      <Navigation
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Main Content Area with Glassmorphism */}
      <div className="main-content">
        <ErrorBoundary>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<TeamOverview />} />
              <Route path="/comparison" element={<TeamComparisonDashboard />} />
              <Route path="/training-load" element={<TrainingLoadHeatmap />} />
              <Route path="/recovery-timeline" element={<RecoveryTimeline />} />
              <Route path="/predictive" element={<PredictiveAnalytics />} />
              <Route path="/user-management" element={<AdminDashboard />} />
              <Route path="/weather-test" element={<WeatherImpactTest />} />
              <Route path="/body-composition" element={<BodyCompositionManagement />} />
              <Route path="/pharma-watchlist" element={<PharmaCoWatchlist />} />
              <Route path="/athlete/:id" element={<AthleteProfile />} />
              <Route path="/login" element={<Login />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
};

// Root App component with Router
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <AppContent />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;