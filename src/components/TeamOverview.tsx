import React from 'react';
import { athletes, biometricData, geneticProfiles } from '../data/mockData';
import { generateAlert, calculateReadinessScore } from '../utils/analytics';
import { Athlete } from '../types';

interface TeamOverviewProps {
  onAthleteClick: (athleteId: string) => void;
}

export const TeamOverview: React.FC<TeamOverviewProps> = ({ onAthleteClick }) => {
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
        readinessScore
      };
    });

    const validMetrics = athleteMetrics.filter(m => m.latest);
    
    const avgHRV = validMetrics.reduce((sum, m) => sum + m.latest.hrv_night, 0) / validMetrics.length;
    const avgSleep = validMetrics.reduce((sum, m) => sum + m.latest.sleep_duration_h, 0) / validMetrics.length;
    const avgReadiness = validMetrics.reduce((sum, m) => sum + m.readinessScore, 0) / validMetrics.length;

    const alertCounts = {
      high: athleteMetrics.filter(m => ['inflammation', 'airway'].includes(m.alert.type)).length,
      medium: athleteMetrics.filter(m => ['circadian', 'nutrition'].includes(m.alert.type)).length,
      optimal: athleteMetrics.filter(m => m.alert.type === 'green').length
    };

    return {
      totalAthletes: athletes.length,
      avgHRV: avgHRV || 0,
      avgSleep: avgSleep || 0,
      avgReadiness: avgReadiness || 0,
      alertCounts,
      athleteMetrics
    };
  }, []);

  const getStatusColor = (type: string) => {
    switch (type) {
      case 'inflammation':
      case 'airway':
        return 'border-red-500/50 bg-red-900/10';
      case 'circadian':
      case 'nutrition':
        return 'border-yellow-500/50 bg-yellow-900/10';
      case 'green':
        return 'border-green-500/50 bg-green-900/10';
      default:
        return 'border-gray-600 bg-gray-800/50';
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          🧬 SAM Recovery Intelligence
        </h1>
        <p className="text-xl text-gray-300">
          Precision Recovery Through Genetics × Biometrics × AI
        </p>
      </div>

      {/* Team Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 p-6 text-center shadow-lg">
          <div className="text-3xl font-bold text-purple-400 mb-2">
            {teamStats.totalAthletes}
          </div>
          <div className="text-gray-300">Total Athletes</div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 p-6 text-center shadow-lg">
          <div className="text-3xl font-bold text-orange-400 mb-2">
            {teamStats.avgHRV.toFixed(0)} ms
          </div>
          <div className="text-gray-300">Avg HRV</div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 p-6 text-center shadow-lg">
          <div className="text-3xl font-bold text-purple-400 mb-2">
            {teamStats.avgSleep.toFixed(1)}h
          </div>
          <div className="text-gray-300">Avg Sleep</div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 p-6 text-center shadow-lg">
          <div className="text-3xl font-bold text-orange-400 mb-2">
            {teamStats.avgReadiness.toFixed(0)}%
          </div>
          <div className="text-gray-300">Team Readiness</div>
        </div>
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-red-900/20 to-red-800/20 rounded-xl border border-red-500/30 p-6">
          <div className="flex items-center mb-3">
            <div className="text-2xl mr-3">🔴</div>
            <h3 className="text-lg font-semibold text-red-400">High Priority</h3>
          </div>
          <div className="text-3xl font-bold text-red-400 mb-1">
            {teamStats.alertCounts.high}
          </div>
          <p className="text-red-300 text-sm">Athletes requiring immediate attention</p>
        </div>
        
        <div className="bg-gradient-to-br from-yellow-900/20 to-yellow-800/20 rounded-xl border border-yellow-500/30 p-6">
          <div className="flex items-center mb-3">
            <div className="text-2xl mr-3">🟡</div>
            <h3 className="text-lg font-semibold text-yellow-400">Monitor Closely</h3>
          </div>
          <div className="text-3xl font-bold text-yellow-400 mb-1">
            {teamStats.alertCounts.medium}
          </div>
          <p className="text-yellow-300 text-sm">Athletes may need intervention</p>
        </div>
        
        <div className="bg-gradient-to-br from-green-900/20 to-green-800/20 rounded-xl border border-green-500/30 p-6">
          <div className="flex items-center mb-3">
            <div className="text-2xl mr-3">🟢</div>
            <h3 className="text-lg font-semibold text-green-400">Optimal</h3>
          </div>
          <div className="text-3xl font-bold text-green-400 mb-1">
            {teamStats.alertCounts.optimal}
          </div>
          <p className="text-green-300 text-sm">Athletes ready for training</p>
        </div>
      </div>

      {/* Individual Athletes */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6 border-b border-gray-700 pb-3">
          👥 Individual Athlete Status
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamStats.athleteMetrics.map(({ athlete, latest, alert, readinessScore }) => (
            <div
              key={athlete.athlete_id}
              className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border-2 p-6 cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-105 ${getStatusColor(alert.type)}`}
              onClick={() => onAthleteClick(athlete.athlete_id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {athlete.name}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {athlete.sport} | Age {athlete.age} | {athlete.team}
                  </p>
                </div>
                <div className="text-2xl">
                  {getStatusIcon(alert.type)}
                </div>
              </div>
              
              {latest && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wide">HRV</div>
                    <div className="text-lg font-semibold text-white">
                      {latest.hrv_night.toFixed(0)} ms
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wide">Sleep</div>
                    <div className="text-lg font-semibold text-white">
                      {latest.sleep_duration_h.toFixed(1)}h
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wide">RHR</div>
                    <div className="text-lg font-semibold text-white">
                      {latest.resting_hr.toFixed(0)} bpm
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wide">Readiness</div>
                    <div className="text-lg font-semibold text-white">
                      {readinessScore.toFixed(0)}%
                    </div>
                  </div>
                </div>
              )}
              
              <div className="border-t border-gray-700 pt-3">
                <p className="text-sm font-medium text-white mb-1">
                  {alert.title.replace(/[🔴🟡🟢❌📊⚠️🌙🥗🌬️✅]/g, '').trim()}
                </p>
                <p className="text-xs text-gray-400 line-clamp-2">
                  {alert.cause}
                </p>
              </div>
              
              <div className="mt-4">
                <button className="w-full bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200">
                  📊 View Dashboard
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};