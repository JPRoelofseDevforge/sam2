import React, { useState, useEffect } from 'react';
import { athletes, biometricData, geneticProfiles } from '../data/mockData';
import { generateAlert, calculateReadinessScore } from '../utils/analytics';
import { Athlete } from '../types';

const date = new Date();
    // Format date as YYYY-MM-DD (or customize as needed)
    const formatted = date.toLocaleDateString("en-ZA", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

interface AirQualityData {
  temperature: number;
  humidity: number;
  aqi: number;
  co: number;
  pm25: number;
  pm10: number;
  lastUpdated: string;
}

interface TeamOverviewProps {
  onAthleteClick: (athleteId: string) => void;
}

const getStatusColorClass = (alertType: string): string => {
  switch (alertType) {
    case 'critical':
    case 'high':
      return 'status-critical';
    case 'warning':
    case 'medium':
      return 'status-warning';
    case 'optimal':
    case 'low':
      return 'status-optimal';
    default:
      return 'status-unknown';
  }
};

const getStatusColor = (alertType: string): string => {
  switch (alertType) {
    case 'critical':
    case 'high':
      return 'text-red-400';
    case 'warning':
    case 'medium':
      return 'text-yellow-400';
    case 'optimal':
    case 'low':
      return 'text-green-400';
    default:
      return 'text-gray-400';
  }
};

// 🔧 CONFIG: Replace with your actual location and IQAir API key
const IQAIR_API_KEY = import.meta.env.VITE_IQAIR_API_KEY || 'f8e6fb6c-6ec0-4064-a46b-a173e4137718';
const CITY = import.meta.env.VITE_CITY || 'Pretoria';
const STATE = import.meta.env.VITE_STATE || 'Gauteng';
const COUNTRY = import.meta.env.VITE_COUNTRY || 'South Africa';

export const TeamOverview: React.FC<TeamOverviewProps> = ({ onAthleteClick }) => {
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getAthleteData = (athleteId: string) => {
    const data = biometricData.filter(d => d.athlete_id === athleteId);
    const genetics = geneticProfiles.filter(g => g.athlete_id === athleteId);
    const alert = generateAlert(athleteId, data, genetics);
    const readinessScore = data.length > 0 ? calculateReadinessScore(data[data.length - 1]) : 0;

    return { data, genetics, alert, readinessScore };
  };

  const teamStats = React.useMemo(() => {
    const athleteMetrics = athletes.map(athlete => {
      const { data, alert, readinessScore } = getAthleteData(athlete.athlete_id);
      const latest = data[data.length - 1];
      return {
        athlete,
        latest,
        alert,
        readinessScore,
      };
    });

    const validMetrics = athleteMetrics.filter(m => m.latest);

    const avgHRV = validMetrics.reduce((sum, m) => sum + m.latest.hrv_night, 0) / validMetrics.length;
    const avgSleep = validMetrics.reduce((sum, m) => sum + m.latest.sleep_duration_h, 0) / validMetrics.length;
    const avgReadiness = validMetrics.reduce((sum, m) => sum + m.readinessScore, 0) / validMetrics.length;

    const alertCounts = {
      high: athleteMetrics.filter(m => ['inflammation', 'airway'].includes(m.alert.type)).length,
      medium: athleteMetrics.filter(m => ['circadian', 'nutrition'].includes(m.alert.type)).length,
      optimal: athleteMetrics.filter(m => m.alert.type === 'green').length,
    };

    return {
      totalAthletes: athletes.length,
      avgHRV: avgHRV || 0,
      avgSleep: avgSleep || 0,
      avgReadiness: avgReadiness || 0,
      alertCounts,
      athleteMetrics,
    };
  }, []);

  // Fetch Air Quality from IQAir
  useEffect(() => {
    const fetchAirQuality = async () => {
      try {
        setLoading(true);
        const url = new URL('https://api.airvisual.com/v2/city');
        url.searchParams.append('city', CITY);
        url.searchParams.append('state', STATE);
        url.searchParams.append('country', COUNTRY);
        url.searchParams.append('key', IQAIR_API_KEY);

        const res = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
        const json = await res.json();
        const current = json.data.current;

        setAirQuality({
          temperature: current.weather.tp,
          humidity: current.weather.hu,
          aqi: current.pollution.aqius,
          co: current.pollution.co,
          pm25: current.pollution.pm25,
          pm10: current.pollution.pm10,
          lastUpdated: new Date().toLocaleTimeString(),
        });
        setError(null);
      } catch (err: any) {
        console.error('AirQuality API Error:', err);
        setError(err.message || 'Failed to load air quality');
      } finally {
        setLoading(false);
      }
    };

    fetchAirQuality();
    const interval = setInterval(fetchAirQuality, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (type: string) => {
    switch (type) {
      case 'inflammation':
      case 'airway':
        return 'border-red-500/60 bg-gradient-to-br from-red-900/15 to-transparent';
      case 'circadian':
      case 'nutrition':
        return 'border-yellow-500/60 bg-gradient-to-br from-yellow-900/15 to-transparent';
      case 'green':
        return 'border-green-500/60 bg-gradient-to-br from-green-900/15 to-transparent';
      default:
        return 'border-gray-600/40 bg-gradient-to-br from-gray-800/10 to-transparent';
    }
  };

  const getStatusIcon = (type: string) => {
    switch (type) {
      case 'inflammation':
        return '🔥';
      case 'circadian':
        return '🌙';
      case 'nutrition':
        return '🥗';
      case 'airway':
        return '🌬️';
      case 'green':
        return '✅';
      default:
        return '📊';
    }
  };

  const getAqiLevel = (aqi: number) => {
    if (aqi <= 50) return { label: 'Good', color: 'text-green-400', bg: 'bg-green-500/10' };
    if (aqi <= 100) return { label: 'Moderate', color: 'text-yellow-400', bg: 'bg-yellow-500/10' };
    if (aqi <= 150) return { label: 'Unhealthy (S)', color: 'text-orange-400', bg: 'bg-orange-500/10' };
    if (aqi <= 200) return { label: 'Unhealthy', color: 'text-red-400', bg: 'bg-red-500/10' };
    return { label: 'Hazardous', color: 'text-purple-400', bg: 'bg-purple-500/10' };
  };


  
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
          🧬 SAM Recovery
        </h1>
        <p className="tagline">
          Precision Recovery Through Genetics × Biometrics × Environment
        </p>
      </header>

      {/* Environmental Health */}
      <section className="environment-card">
        <div className="card-header">
          <div className="indicator-dot"></div>
          <h2 className="card-title">
            Environmental Health • {CITY} • {formatted}
          </h2>
        </div>

        <div className="metrics-grid">
          <div className="metric-item">
            <div className="metric-icon">🌡️</div>
            <div className="metric-value temp-value">{airQuality?.temperature}°C</div>
            <div className="metric-label">Temp</div>
          </div>

          <div className="metric-item">
            <div className="metric-icon">💧</div>
            <div className="metric-value humidity-value">{airQuality?.humidity}%</div>
            <div className="metric-label">Humidity</div>
          </div>

          <div className="metric-item">
            <div className="metric-icon">🌫️</div>
            <div className={`metric-value aqi-value ${getAqiLevel(airQuality?.aqi || 0).class}`}>
              {airQuality?.aqi}
            </div>
            <div className="metric-label">
              AQI • {getAqiLevel(airQuality?.aqi || 0).label}
            </div>
          </div>
        </div>

        <div className="last-updated">
          ⏱️ Updated: {airQuality?.lastUpdated || '—'} • Every 5 min
        </div>
      </section>

      {/* Team Stats */}
      <div className="stats-grid-wide">
        <StatCard label="Athletes" value={teamStats.totalAthletes} icon="👥" color="blue" />
        <StatCard label="Avg HRV" value={`${teamStats.avgHRV.toFixed(0)} ms`} icon="💓" color="purple" />
        <StatCard label="Avg Sleep" value={`${teamStats.avgSleep.toFixed(1)}h`} icon="😴" color="indigo" />
        <StatCard label="Readiness" value={`${teamStats.avgReadiness.toFixed(0)}%`} icon="⚡" color="orange" />
      </div>

      {/* Alert Summary */}
      <div className="alerts-grid">
        <AlertCard
          title="High Priority"
          count={teamStats.alertCounts.high}
          icon="🔴"
          color="red"
          desc="Immediate attention"
        />
        <AlertCard
          title="Monitor"
          count={teamStats.alertCounts.medium}
          icon="🟡"
          color="yellow"
          desc="Potential issues"
        />
        <AlertCard
          title="Optimal"
          count={teamStats.alertCounts.optimal}
          icon="🟢"
          color="green"
          desc="Ready for training"
        />
      </div>

      {/* Athletes Grid */}
      <section className="athletes-section">
        <h2 className="section-title">👥 Athlete Status</h2>
        <div className="athletes-grid">
          {teamStats.athleteMetrics.map(({ athlete, latest, alert, readinessScore }) => (
            <div
              key={athlete.athlete_id}
              className={`athlete-card ${getStatusColorClass(alert.type)} card-hover`}
              onClick={() => onAthleteClick(athlete.athlete_id)}
            >
              <div className="athlete-header">
                <div className="athlete-info">
                  <h3 className="athlete-name">{athlete.name}</h3>
                  <p className="athlete-meta">{athlete.sport} • {athlete.team}</p>
                </div>
                <div className="alert-icon">{getStatusIcon(alert.type)}</div>
              </div>

              {latest && (
                <div className="athlete-metrics">
                  <div className="metric-pair">
                    <span className="label">HRV</span>
                    <span className="value">{latest.hrv_night.toFixed(0)} ms</span>
                  </div>
                  <div className="metric-pair">
                    <span className="label">Sleep</span>
                    <span className="value">{latest.sleep_duration_h.toFixed(1)}h</span>
                  </div>
                  <div className="metric-pair">
                    <span className="label">RHR</span>
                    <span className="value">{latest.resting_hr.toFixed(0)} bpm</span>
                  </div>
                  <div className="metric-pair">
                    <span className="label">Ready</span>
                    <span className="value">{readinessScore.toFixed(0)}%</span>
                  </div>
                </div>
              )}

              <div className="athlete-alert">
                <p className="alert-title">{alert.title.replace(/[\ emoji]/g, '').trim()}</p>
                <p className="alert-cause">{alert.cause}</p>
              </div>

              <button className="profile-button">
                📊 Open Profile
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  </div>
);
};

// Reusable Components
const StatCard: React.FC<{ label: string; value: number | string; icon: string; color: string }> = ({ label, value, icon, color }) => (
  <div className="bg-gradient-to-br from-gray-900/70 to-gray-950/60 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 text-center shadow-lg hover:shadow-purple-500/10 transition-shadow">
    <div className="text-3xl mb-1">{icon}</div>
    <div className={`text-xl sm:text-2xl font-extrabold bg-gradient-to-r ${color} bg-clip-text`}>
      {value}
    </div>
    <div className="text-gray-300 text-xs sm:text-sm mt-1 font-medium">{label}</div>
  </div>
);

const AlertCard: React.FC<{ title: string; count: number; icon: string; color: string; desc: string }> = ({ title, count, icon, color, desc }) => (
  <div className={`bg-gradient-to-br from-${color}-900/15 to-transparent border border-${color}-500/30 rounded-xl p-4 hover:shadow-lg transition-all`}>
    <div className="flex items-center gap-2 mb-2">
      <span className="text-xl">{icon}</span>
      <h3 className={`text-sm sm:text-lg font-bold text-${color}-400`}>{title}</h3>
    </div>
    <div className={`text-2xl sm:text-4xl font-bold text-${color}-400`}>{count}</div>
    <p className={`text-xs sm:text-sm text-${color}-300 mt-1`}>{desc}</p>
  </div>
);

const Metric: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div>
    <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
    <div className="text-sm font-semibold text-white">{value}</div>
  </div>
);