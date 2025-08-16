import React, { useState, useEffect } from 'react';
import { athletes, biometricData, geneticProfiles } from '../data/mockData';
import { generateAlert, calculateReadinessScore } from '../utils/analytics';
import { Athlete } from '../types';
import axios from 'axios';

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
        const response = await axios.get(
          `http://api.airvisual.com/v2/city?city=${encodeURIComponent(CITY)}&state=${encodeURIComponent(STATE)}&country=${encodeURIComponent(COUNTRY)}&key=${IQAIR_API_KEY}`
        );

        const data = response.data.data;
        const current = data.current;

        setAirQuality({
          temperature: current.weather.tp, // temp in °C
          humidity: current.weather.hu,
          aqi: current.pollution.aqius,
          co: current.pollution.co,
          pm25: current.pollution.pm25,
          pm10: current.pollution.pm10,
          lastUpdated: new Date(data.current.pollution.ts).toLocaleTimeString(),
        });
        setError(null);
      } catch (err: any) {
        console.error('AirQuality API Error:', err);
        setError(err.response?.data?.message || 'Failed to load air quality');
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
    <div className="min-h-screen text-white relative">
      {/* Beautiful Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-black to-purple-950/30 -z-10"></div>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(147,51,234,0.08),transparent),radial-gradient(circle_at_80%_20%,rgba(249,115,22,0.08),transparent)] -z-10"></div>

      <div className="relative z-10 px-4 py-8 max-w-7xl mx-auto space-y-10">

        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-purple-400 via-pink-300 to-orange-400 bg-clip-text text-transparent">
            🧬 SAM Recovery Intelligence
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 font-light tracking-wide">
            Precision Recovery Through Genetics × Biometrics × Environment
          </p>
        </div>

        
                {/* Live Air Quality Section - Slim & Elegant */}
                {/* Environmental Health - Glassmorphic Card */}
        <section className="bg-gradient-to-br from-gray-900/60 via-gray-800/50 to-gray-900/70 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"></div>
            <h2 className="text-lg font-semibold text-white">Environmental Health • {CITY}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Temperature */}
            <div className="p-5 bg-black/20 backdrop-blur-sm border border-gray-700/30 rounded-xl hover:bg-black/30 transition-all duration-300 group">
              <div className="text-center">
                <div className="text-2xl mb-2">🌡️</div>
                <div className="text-2xl font-bold text-orange-400 group-hover:text-orange-300 transition-colors">
                  {airQuality?.temperature}°C
                </div>
                <div className="text-xs text-gray-400 mt-1">Temperature</div>
              </div>
            </div>

            {/* Humidity */}
            <div className="p-5 bg-black/20 backdrop-blur-sm border border-gray-700/30 rounded-xl hover:bg-black/30 transition-all duration-300 group">
              <div className="text-center">
                <div className="text-2xl mb-2">💧</div>
                <div className="text-2xl font-bold text-blue-400 group-hover:text-blue-300 transition-colors">
                  {airQuality?.humidity}%
                </div>
                <div className="text-xs text-gray-400 mt-1">Humidity</div>
              </div>
            </div>

            {/* AQI */}
            <div className="p-5 bg-black/20 backdrop-blur-sm border border-gray-700/30 rounded-xl hover:bg-black/30 transition-all duration-300 group">
              <div className="text-center">
                <div className="text-2xl mb-2">🌫️</div>
                <div className={`text-2xl font-bold ${getAqiLevel(airQuality?.aqi || 0).color} group-hover:opacity-90 transition-opacity`}>
                  {airQuality?.aqi}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  AQI • {getAqiLevel(airQuality?.aqi || 0).label}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end mt-4 text-xs text-gray-500">
            <span>⏱️ Updated: {airQuality?.lastUpdated} • Refreshes every 5 min</span>
          </div>
        </section>

        {/* Team Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard label="Athletes" value={teamStats.totalAthletes} icon="👥" color="from-blue-500 to-cyan-400" />
          <StatCard label="Avg HRV" value={`${teamStats.avgHRV.toFixed(0)} ms`} icon="💓" color="from-purple-500 to-pink-400" />
          <StatCard label="Avg Sleep" value={`${teamStats.avgSleep.toFixed(1)}h`} icon="😴" color="from-indigo-500 to-blue-400" />
          <StatCard label="Readiness" value={`${teamStats.avgReadiness.toFixed(0)}%`} icon="⚡" color="from-orange-500 to-red-400" />
        </div>

        {/* Alert Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AlertCard
            title="High Priority"
            count={teamStats.alertCounts.high}
            icon="🔴"
            color="red"
            desc="Immediate attention needed"
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
        <section>
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
            👥 Athlete Status Dashboard
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamStats.athleteMetrics.map(({ athlete, latest, alert, readinessScore }) => (
              <div
                key={athlete.athlete_id}
                className={`group bg-gradient-to-br from-gray-900/70 to-gray-950/60 backdrop-blur-sm border p-6 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 hover:scale-105 ${getStatusColor(alert.type)} hover:border-opacity-70`}
                onClick={() => onAthleteClick(athlete.athlete_id)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-purple-300">{athlete.name}</h3>
                    <p className="text-sm text-gray-400">{athlete.sport} • {athlete.team}</p>
                  </div>
                  <div className="text-2xl">{getStatusIcon(alert.type)}</div>
                </div>

                {latest && (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <Metric label="HRV" value={`${latest.hrv_night.toFixed(0)} ms`} />
                    <Metric label="Sleep" value={`${latest.sleep_duration_h.toFixed(1)}h`} />
                    <Metric label="RHR" value={`${latest.resting_hr.toFixed(0)} bpm`} />
                    <Metric label="Ready" value={`${readinessScore.toFixed(0)}%`} />
                  </div>
                )}

                <div className="border-t border-gray-700 pt-3">
                  <p className="font-semibold text-white text-sm line-clamp-1">{alert.title.replace(/[\ emoji]/g, '').trim()}</p>
                  <p className="text-xs text-gray-400 line-clamp-2">{alert.cause}</p>
                </div>

                <button className="mt-5 w-full py-2.5 bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-md">
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
const EnvStat: React.FC<{
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  bg?: string;
  tooltip?: string;
}> = ({ label, value, sub, color = 'text-white', bg = 'bg-gray-800/50', tooltip }) => (
  <div className={`p-4 rounded-xl border border-gray-700/50 ${bg} text-center`} title={tooltip}>
    <div className="text-sm text-gray-300 mb-1">{label}</div>
    <div className={`text-2xl font-bold ${color}`}>{value}</div>
    {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
  </div>
);

const StatCard: React.FC<{ label: string; value: number | string; icon: string; color: string }> = ({ label, value, icon, color }) => (
  <div className="bg-gradient-to-br from-gray-900/70 to-gray-950/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 text-center shadow-xl hover:shadow-purple-500/10 transition-shadow">
    <div className={`text-5xl mb-2`}>{icon}</div>
    <div className={`text-3xl font-extrabold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
      {value}
    </div>
    <div className="text-gray-300 text-sm mt-1 font-medium">{label}</div>
  </div>
);

const AlertCard: React.FC<{ title: string; count: number; icon: string; color: string; desc: string }> = ({ title, count, icon, color, desc }) => (
  <div className={`bg-gradient-to-br from-${color}-900/15 to-transparent border border-${color}-500/30 rounded-2xl p-6 hover:shadow-lg transition-all`}>
    <div className="flex items-center gap-2 mb-3">
      <span className="text-2xl">{icon}</span>
      <h3 className={`text-lg font-bold text-${color}-400`}>{title}</h3>
    </div>
    <div className={`text-4xl font-bold text-${color}-400`}>{count}</div>
    <p className={`text-sm text-${color}-300 mt-2`}>{desc}</p>
  </div>
);

const Metric: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div>
    <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
    <div className="text-lg font-semibold text-white">{value}</div>
  </div>
);