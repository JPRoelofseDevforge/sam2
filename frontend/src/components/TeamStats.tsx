import React, { useMemo } from 'react';
import { Athlete, BiometricData, GeneticProfile } from '../types';
import { generateAlert, calculateReadinessScore } from '../utils/analytics';
import { getAthleteBiometricData } from '../utils/athleteUtils';
import { getStatusColorClass, getStatusIcon } from '../utils/athleteUtils';
import { heartRateService, biometricDataService } from '../services/dataService';

/**
 * Sleep helpers:
 * - Handles nights crossing midnight (previous night into morning)
 * - Handles morning-only sleep
 * - Sums multiple segments (naps) occurring on the same day
 */
const parseTimeToMinutesLocal = (time?: string): number | null => {
  if (!time || time === '00:00') return null;
  const parts = time.split(':');
  if (parts.length < 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
};

const computeDurationHours = (
  sleep_onset_time?: string,
  wake_time?: string,
  sleep_duration_h?: number | null
): number => {
  const start = parseTimeToMinutesLocal(sleep_onset_time);
  const end = parseTimeToMinutesLocal(wake_time);
  if (start !== null && end !== null) {
    let minutes = end - start;
    if (minutes < 0) minutes += 24 * 60; // crossed midnight
    return Math.max(0, minutes) / 60;
  }
  // Fallback to provided duration if timing data is incomplete
  return typeof sleep_duration_h === 'number' && sleep_duration_h > 0 ? sleep_duration_h : 0;
};

const computeSleepForDate = (entries: BiometricData[], targetDate?: string): number => {
  if (!Array.isArray(entries) || entries.length === 0 || !targetDate) return 0;

  // Sum all sleep duration entries for the target date
  // This matches how SleepMetrics.tsx calculates sleep duration
  return entries
    .filter(d => d.date === targetDate)
    .reduce((sum, d) => sum + (d.sleep_duration_h || 0), 0);
};

// Helpers to color entire sections based on "Last Synced" recency
const daysSince = (dateStr?: string | null): number | null => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  const toYMD = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate());
  return Math.floor((toYMD(today).getTime() - toYMD(d).getTime()) / (24 * 60 * 60 * 1000));
};

// Card-level background color (faded)
// - today: green-50
// - within 3 days: orange-50
// - >3 days: red-50
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

// Compute faded status classes for last synced date:
// - today: faded green
// - within 3 days: faded orange
// - more than 3 days: faded red
const getSyncStatusClasses = (dateStr?: string | null): string => {
  const base = 'inline-block px-2 py-0.5 rounded text-xs font-medium';
  if (!dateStr) return `${base} bg-gray-100 text-gray-600`;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return `${base} bg-gray-100 text-gray-600`;

  const today = new Date();
  const toYMD = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate());
  const days = Math.floor((toYMD(today).getTime() - toYMD(d).getTime()) / (24 * 60 * 60 * 1000));

  if (days <= 0) return `${base} bg-green-500 text-green-700`;   // today
  if (days <= 3) return `${base} bg-orange-100 text-orange-700`; // within 3 days
  return `${base} bg-red-100 text-red-700`;                       // more than 3 days
};

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
  computedSleepH: number;
  lastSyncedDate: string | null;
  rhr: number | null;
}

interface TeamStatsData {
  totalAthletes: number;
  avgHRV: number;
  avgSleep: number;
  avgReadiness: number;
  lastSyncedDate: string | null;
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
  const [heartRateData, setHeartRateData] = React.useState<Record<string, { measuredAt: Date; heartRateBPM: number; type: string }[]>>({});

  // Fetch heart rate data for all athletes
  React.useEffect(() => {
    const fetchHeartRateData = async () => {
      const hrData: Record<string, { measuredAt: Date; heartRateBPM: number; type: string }[]> = {};
      for (const athlete of athletes) {
        try {
          const data = await heartRateService.getHeartRateData(parseInt(athlete.athlete_id));
          hrData[athlete.athlete_id] = data;
        } catch (error) {
          hrData[athlete.athlete_id] = [];
        }
      }
      setHeartRateData(hrData);
    };
    fetchHeartRateData();
  }, [athletes]);

  const teamStats: TeamStatsData = useMemo(() => {
    const athleteMetrics = (athletes || []).map(athlete => {
      const { data, genetics } = getAthleteBiometricData(athlete.athlete_id, biometricData, geneticProfiles);
      console.log('Athlete Data:', athlete.name, data);
      console.log('Heart Rate Data:', heartRateData[athlete.athlete_id]);
      
      // API returns latest data first, so take the first item (most recent)
      const latest = data && data.length > 0 ? data[0] : null;

      const alert = generateAlert(athlete.athlete_id, data, genetics);
      // Use latest non-zero readiness (data is latest-first per API); fall back to 0 if none
      const readinessScore = (() => {
        for (const d of data) {
          const r = calculateReadinessScore(d as BiometricData);
          if (r > 0) return r;
        }
        return 0;
      })();

      // Get sleep duration from biometric data - use yesterday's record
      const computedSleepH = (() => {
        if (!Array.isArray(data) || data.length === 0) {
          return 0;
        }

        // Calculate yesterday's date in YYYY-MM-DD format
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // Find the record with yesterday's date
        const targetRecord = data.find(d => d.date === yesterdayStr);

        return targetRecord?.sleep_duration_h || 0;
      })();

      // Find last synced date for this athlete where heart rate is not 0
      const lastSyncedDate = data
        .filter(d => (d.avg_heart_rate && d.avg_heart_rate > 0) || (d.resting_hr && d.resting_hr > 0))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.date || null;

      // Calculate RHR based on closest heart rate data to the latest sleep time
      const rhr = (() => {
        const sleepData = data.filter(d => d.sleep_duration_h && d.sleep_duration_h > 0);
        if (sleepData.length === 0) return null;
        const latestSleep = sleepData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        const sleepDate = new Date(latestSleep.date);

        // Get heart rate data for this athlete
        const athleteHrData = heartRateData[athlete.athlete_id] || [];

        // Find heart rate data closest to the sleep time
        if (athleteHrData.length > 0) {
          const closestHr = athleteHrData
            .map(hr => ({
              ...hr,
              timeDiff: Math.abs(hr.measuredAt.getTime() - sleepDate.getTime())
            }))
            .sort((a, b) => a.timeDiff - b.timeDiff)[0];

          // Only use if within reasonable time window (e.g., 2 hours)
          if (closestHr.timeDiff < 2 * 60 * 60 * 1000) {
            return closestHr.heartRateBPM;
          }
        }

        // Fallback to existing data
        return latestSleep.avg_heart_rate || latestSleep.resting_hr || null;
      })();

      return {
        athlete,
        latest,
        alert,
        readinessScore,
        computedSleepH,
        lastSyncedDate,
        rhr,
      };
    });

    const validMetrics = athleteMetrics.filter(m => m.latest);

    const avgHRV = validMetrics.length > 0 ? validMetrics.reduce((sum, m) => sum + (m.latest?.hrv_night || 0), 0) / validMetrics.length : 0;
    const avgSleep = validMetrics.length > 0 ? validMetrics.reduce((sum, m) => sum + (m.computedSleepH || 0), 0) / validMetrics.length : 0;
    const avgReadiness = validMetrics.length > 0 ? validMetrics.reduce((sum, m) => sum + m.readinessScore, 0) / validMetrics.length : 0;

    const alertCounts = {
      high: athleteMetrics.filter(m => ['inflammation', 'airway'].includes(m.alert.type)).length,
      medium: athleteMetrics.filter(m => ['circadian', 'nutrition'].includes(m.alert.type)).length,
      optimal: athleteMetrics.filter(m => m.alert.type === 'green').length,
    };

    const lastSyncedDate = biometricData
      .filter(d => (d.avg_heart_rate && d.avg_heart_rate > 0) || (d.resting_hr && d.resting_hr > 0))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.date || null;

    return {
      totalAthletes: (athletes || []).length,
      avgHRV: avgHRV || 0,
      avgSleep: avgSleep || 0,
      avgReadiness: avgReadiness || 0,
      lastSyncedDate,
      alertCounts,
      athleteMetrics,
    };
  }, [athletes, biometricData, geneticProfiles, heartRateData]);

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
                  <span className="value">{latest?.hrv_night ? latest.hrv_night.toFixed(0) + ' ms' : 'N/A'}</span>
                </div>
                <div className="metric-pair">
                  <span className="label">Sleep</span>
                  <span className="value">{(computedSleepH && computedSleepH > 0) ? computedSleepH.toFixed(1) + 'h' : 'N/A'}</span>
                </div>
                <div className="metric-pair">
                  <span className="label">RHR</span>
                  <span className="value">
                    {rhr ? `${rhr.toFixed(0)} bpm` : 'N/A'}
                  </span>
                </div>
                <div className="metric-pair">
                  <span className="label">Ready</span>
                  <span className="value">{readinessScore.toFixed(0)}%</span>
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