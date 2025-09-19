import React, { useMemo } from 'react';
import { Athlete, BiometricData, GeneticProfile } from '../types';
import { generateAlert, calculateReadinessScore } from '../utils/analytics';
import { getAthleteBiometricData } from '../utils/athleteUtils';
import { getStatusColorClass, getStatusIcon } from '../utils/athleteUtils';

interface TeamStatsProps {
  athletes: Athlete[];
  biometricData: BiometricData[];
  geneticProfiles: GeneticProfile[];
  onAthleteClick: (athleteId: string) => void;
}

interface AthleteMetric {
  athlete: Athlete;
  latest: BiometricData | null;
  alert: any;
  readinessScore: number;
}

interface TeamStatsData {
  totalAthletes: number;
  avgHRV: number;
  avgSleep: number;
  avgReadiness: number;
  alertCounts: {
    high: number;
    medium: number;
    optimal: number;
  };
  athleteMetrics: AthleteMetric[];
}

export const TeamStats: React.FC<TeamStatsProps> = ({
  athletes,
  biometricData,
  geneticProfiles,
  onAthleteClick
}) => {
  const teamStats: TeamStatsData = useMemo(() => {
    const athleteMetrics = (athletes || []).map(athlete => {
      const { data, genetics } = getAthleteBiometricData(athlete.athlete_id, biometricData, geneticProfiles);
      // API returns latest data first, so take the first item (most recent)
      const latest = data && data.length > 0 ? data[0] : null;

      const alert = generateAlert(athlete.athlete_id, data, genetics);
      const readinessScore = data.length > 0 ? calculateReadinessScore(data[data.length - 1]) : 0;

      return {
        athlete,
        latest,
        alert,
        readinessScore,
      };
    });

    const validMetrics = athleteMetrics.filter(m => m.latest);

    const avgHRV = validMetrics.length > 0 ? validMetrics.reduce((sum, m) => sum + (m.latest?.hrv_night || 0), 0) / validMetrics.length : 0;
    const avgSleep = validMetrics.length > 0 ? validMetrics.reduce((sum, m) => sum + (m.latest?.sleep_duration_h || 0), 0) / validMetrics.length : 0;
    const avgReadiness = validMetrics.length > 0 ? validMetrics.reduce((sum, m) => sum + m.readinessScore, 0) / validMetrics.length : 0;

    const alertCounts = {
      high: athleteMetrics.filter(m => ['inflammation', 'airway'].includes(m.alert.type)).length,
      medium: athleteMetrics.filter(m => ['circadian', 'nutrition'].includes(m.alert.type)).length,
      optimal: athleteMetrics.filter(m => m.alert.type === 'green').length,
    };

    return {
      totalAthletes: (athletes || []).length,
      avgHRV: avgHRV || 0,
      avgSleep: avgSleep || 0,
      avgReadiness: avgReadiness || 0,
      alertCounts,
      athleteMetrics,
    };
  }, [athletes, biometricData, geneticProfiles]);

  return (
    <>
      {/* Team Stats */}
      <div className="stats-grid-wide">
        <StatCard label="Athletes" value={teamStats.totalAthletes} icon="👥" color="blue" />
        <StatCard label="Avg HRV" value={`${teamStats.avgHRV.toFixed(0)} ms`} icon="❤️" color="purple" />
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
        <h2 className="section-title text-white">👥 Athlete Status</h2>
        <div className="athletes-grid">
          {teamStats.athleteMetrics?.map(({ athlete, latest, alert, readinessScore }, index) => (
            <div
              key={athlete.id || index}
              className={`athlete-card ${getStatusColorClass(alert.type)} card-hover`}
              onClick={() => onAthleteClick(athlete.id.toString())}
            >
              <div className="athlete-header">
                <div className="athlete-info">
                  <h3 className="athlete-name">{athlete.name}</h3>
                  <p className="athlete-meta">{athlete.sport} • {athlete.age} • {athlete.team}</p>
                </div>
                <div className="alert-icon">{getStatusIcon(alert.type)}</div>
              </div>

              <div className="athlete-metrics">
                <div className="metric-pair">
                  <span className="label">HRV</span>
                  <span className="value">{latest?.hrv_night ? latest.hrv_night.toFixed(0) + ' ms' : 'N/A'}</span>
                </div>
                <div className="metric-pair">
                  <span className="label">Sleep</span>
                  <span className="value">{latest?.sleep_duration_h ? latest.sleep_duration_h.toFixed(1) + 'h' : 'N/A'}</span>
                </div>
                <div className="metric-pair">
                  <span className="label">RHR</span>
                  <span className="value">{latest?.resting_hr ? latest.resting_hr.toFixed(0) + ' bpm' : 'N/A'}</span>
                </div>
                <div className="metric-pair">
                  <span className="label">Ready</span>
                  <span className="value">{readinessScore.toFixed(0)}%</span>
                </div>
              </div>

              <div className="athlete-alert">
                <p className="alert-title">{alert.title.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim()}</p>
                <p className="alert-cause">{alert.cause}</p>
              </div>

              <button className="profile-button">
                📊 Open Profile
              </button>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

// Reusable Components
const StatCard: React.FC<{ label: string; value: number | string; icon: string; color: string }> = ({ label, value, icon, color }) => (
  <div className="card-enhanced p-5 text-center">
    <div className="text-3xl mb-2">{icon}</div>
    <div className={`text-2xl font-bold text-black`}>
      {value}
    </div>
    <div className="text-gray-700 text-sm mt-1 font-medium">{label}</div>
  </div>
);

const AlertCard: React.FC<{ title: string; count: number; icon: string; color: string; desc: string }> = ({ title, count, icon, color, desc }) => (
  <div className={`card-enhanced border-${color}-200 bg-${color}-50 p-5 hover:shadow-lg transition-all`}>
    <div className="flex items-center gap-2 mb-3">
      <span className="text-2xl">{icon}</span>
      <h3 className={`text-lg font-bold text-${color}-700`}>{title}</h3>
    </div>
    <div className={`text-3xl font-bold text-${color}-700 mb-2`}>{count}</div>
    <p className={`text-sm text-${color}-600`}>{desc}</p>
  </div>
);