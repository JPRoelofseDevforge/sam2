import React from 'react';
import { Athlete, GeneticProfile } from '../types';
import { getStatusColorClass, getStatusIcon } from '../utils/athleteUtils';
import { prepareTeamStatsData, TeamStatsData } from '../utils/teamStatsBuilder';

interface TeamStatsProps {
  athletes: Athlete[];
  biometricData: any[]; // not used here; builder fetches accurate per-athlete data
  geneticProfiles: GeneticProfile[];
  onAthleteClick: (athleteId: string) => void;
}

// Helpers to color sections based on "Last Synced" recency
const daysSince = (dateStr?: string | null): number | null => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  const toYMD = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate());
  return Math.floor((toYMD(today).getTime() - toYMD(d).getTime()) / (24 * 60 * 60 * 1000));
};

// Card-level background color (faded)
const getSyncCardBgClass = (dateStr?: string | null): string => {
  const d = daysSince(dateStr);
  if (d === null) return '!bg-gray-50';
  if (d <= 0) return '!bg-green-100';
  if (d <= 3) return '!bg-orange-50';
  return '!bg-red-50';
};

// Metric-pair container classes
const getSyncMetricPairClasses = (dateStr?: string | null): string => {
  const d = daysSince(dateStr);
  if (d === null) return '!bg-gray-50 text-gray-700 px-2 py-1';
  if (d <= 0) return '!bg-green-200 !text-green-800 px-2 py-1';
  if (d <= 3) return '!bg-orange-200 !text-orange-800 px-2 py-1';
  return '!bg-red-300 !text-red-800 px-2 py-1';
};

export const TeamStats: React.FC<TeamStatsProps> = ({
  athletes,
  biometricData, // unused; kept for prop compatibility
  geneticProfiles,
  onAthleteClick
}) => {
  const [teamStats, setTeamStats] = React.useState<TeamStatsData>({
    totalAthletes: (athletes || []).length,
    avgHRV: 0,
    avgSleep: 0,
    avgReadiness: 0,
    lastSyncedDate: null,
    alertCounts: { high: 0, medium: 0, optimal: 0 },
    athleteMetrics: [],
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await prepareTeamStatsData(athletes || [], geneticProfiles || []);
        if (!cancelled) setTeamStats(data);
      } catch {
        if (!cancelled) {
          setTeamStats({
            totalAthletes: (athletes || []).length,
            avgHRV: 0,
            avgSleep: 0,
            avgReadiness: 0,
            lastSyncedDate: null,
            alertCounts: { high: 0, medium: 0, optimal: 0 },
            athleteMetrics: [],
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    // Recompute when inputs structurally change
    return () => { cancelled = true; };
  }, [JSON.stringify(athletes), JSON.stringify(geneticProfiles)]);

  if (loading) {
    return (
      <div className="card-enhanced p-6 text-gray-600 flex items-center gap-3">
        <svg className="animate-spin h-5 w-5 text-purple-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
        <span>Loading team stats...</span>
      </div>
    );
  }
  return (
    <>
      {/* Team Stats */}
      <div className="stats-grid-wide">
        <StatCard label="Athletes" value={teamStats.totalAthletes} icon="👥" color="blue" />
        <StatCard label="Avg HRV" value={`${teamStats.avgHRV.toFixed(0)} ms`} icon="❤️" color="purple" />
        <StatCard label="Avg Sleep" value={`${teamStats.avgSleep.toFixed(1)}h`} icon="😴" color="indigo" />
        <StatCard label="Readiness" value={`${teamStats.avgReadiness.toFixed(0)}%`} icon="⚡" color="orange" />
        <StatCard
          label="Last Synced"
          value={teamStats.lastSyncedDate ? new Date(teamStats.lastSyncedDate).toLocaleDateString() : 'N/A'}
          icon="🔄"
          color="green"
          containerClassName={getSyncCardBgClass(teamStats.lastSyncedDate)}
        />
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
        <div className="athletes-grid">
          {teamStats.athleteMetrics?.map(({ athlete, latest, alert, readinessScore, computedSleepH, lastSyncedDate, rhr }, index) => (
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
                  <span className="value">{latest?.hrv_night ? (Number(latest.hrv_night) || 0).toFixed(0) + ' ms' : 'N/A'}</span>
                </div>
                <div className="metric-pair">
                  <span className="label">Sleep</span>
                  <span className="value">{(computedSleepH && computedSleepH > 0) ? computedSleepH.toFixed(1) + 'h' : 'N/A'}</span>
                </div>
                <div className="metric-pair">
                  <span className="label">RHR</span>
                  <span className="value">
                    {typeof rhr === 'number' && rhr > 0 ? `${rhr.toFixed(0)} bpm` : 'N/A'}
                  </span>
                </div>
                <div className="metric-pair">
                  <span className="label">Ready</span>
                  <span className="value">{latest ? `${readinessScore.toFixed(0)}%` : 'N/A'}</span>
                </div>
                <div className={`metric-pair rounded-md ${getSyncMetricPairClasses(lastSyncedDate)}`}>
                  <span className="label">Last Synced</span>
                  <span className="value">{lastSyncedDate ? new Date(lastSyncedDate).toLocaleDateString() : 'N/A'}</span>
                </div>
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
const StatCard: React.FC<{ label: string; value: React.ReactNode; icon: string; color: string; containerClassName?: string }> = ({ label, value, icon, color, containerClassName }) => (
  <div className={`card-enhanced p-5 text-center ${containerClassName || ''}`}>
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