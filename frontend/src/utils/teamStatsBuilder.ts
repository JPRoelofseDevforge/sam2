import { Athlete, BiometricData, GeneticProfile } from '../types';
import { calculateReadinessScore, generateAlert } from './analytics';
import {
  filterValidBiometricData,
  getLatestBiometricRecord,
  getSortedBiometricDataForCharts,
} from './athleteUtils';
import { biometricDataService } from '../services/dataService';

export interface AthleteMetric {
  athlete: Athlete;
  latest: BiometricData | null;
  alert: any;
  readinessScore: number;
  computedSleepH: number;
  lastSyncedDate: string | null;
  rhr: number | null;
}

export interface TeamStatsData {
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

/**
 * Compute readiness exactly like AthleteProfile:
 * - Calculate per-record readiness via calculateReadinessScore
 * - Pick the latest non-zero from the series; fallback to latest day's readiness
 */
function computeDisplayReadiness(series: BiometricData[]): number {
  if (!Array.isArray(series) || series.length === 0) return 0;
  const sorted = getSortedBiometricDataForCharts([...series]);
  for (let i = sorted.length - 1; i >= 0; i--) {
    const r = calculateReadinessScore(sorted[i]);
    if (r > 0) return r;
  }
  const latest = getLatestBiometricRecord(series);
  return latest ? calculateReadinessScore(latest) : 0;
}

/**
 * Find the most recent date with meaningful heart rate present
 */
function findLastSyncedDate(valid: BiometricData[]): string | null {
  if (!Array.isArray(valid) || valid.length === 0) return null;
  const sorted = [...valid].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const withHr = sorted.find(
    (d) =>
      (typeof d.avg_heart_rate === 'number' && d.avg_heart_rate > 0) ||
      (typeof d.resting_hr === 'number' && d.resting_hr > 0)
  );
  return withHr?.date || null;
}

/**
 * Choose an RHR proxy similar to TeamStats fallback:
 * prefer avg_heart_rate, then resting_hr from the latest sleep-bearing record
 */
function computeRhr(valid: BiometricData[]): number | null {
  if (!Array.isArray(valid) || valid.length === 0) return null;
  const sleepBearing = valid
    .filter((d) => (d.sleep_duration_h || 0) > 0)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const latestSleep = sleepBearing[0] || null;
  if (!latestSleep) return null;
  const avg = Number(latestSleep.avg_heart_rate ?? 0);
  const rhr = Number(latestSleep.resting_hr ?? 0);
  if (avg > 0) return avg;
  if (rhr > 0) return rhr;
  return null;
}

/**
 * Prepare team-level stats by fetching per-athlete daily biometrics from the wearable endpoint
 * to ensure the same data shape AthleteProfile uses, then computing readiness with the same rules.
 *
 * This avoids inconsistencies from aggregated "all athletes" feeds that may omit/fragment fields.
 */
export async function prepareTeamStatsData(
  athletes: Athlete[],
  geneticProfiles: GeneticProfile[]
): Promise<TeamStatsData> {
  const athleteMetrics: AthleteMetric[] = [];
  const teamDates: string[] = [];

  for (const athlete of athletes || []) {
    try {
      // Use the database Id for the wearable endpoint (backend maps to UnionId internally)
      const perAthlete = await biometricDataService.getAllBiometricData(
        Number(athlete.id),
        undefined,
        undefined,
        1,
        200
      );

      const valid = filterValidBiometricData(perAthlete || []);
      const latest = getLatestBiometricRecord(valid);
      const displayReadiness = computeDisplayReadiness(valid);

      // Genetics for this athlete
      const genetics = (geneticProfiles || []).filter(
        (g) => g.athlete_id === athlete.athlete_id
      );

      const alert = generateAlert(athlete.athlete_id, valid, genetics);

      // Sleep: prefer latest day's sleep hours if present, else 0
      const computedSleepH =
        typeof latest?.sleep_duration_h === 'number' && (latest.sleep_duration_h as number) > 0
          ? Number(latest!.sleep_duration_h)
          : 0;

      const lastSyncedDate = findLastSyncedDate(valid);
      if (lastSyncedDate) teamDates.push(lastSyncedDate);

      const rhr = computeRhr(valid);

      athleteMetrics.push({
        athlete,
        latest,
        alert,
        readinessScore: displayReadiness,
        computedSleepH,
        lastSyncedDate,
        rhr,
      });
    } catch {
      athleteMetrics.push({
        athlete,
        latest: null,
        alert: { type: 'no_data', title: '📊 No Data', cause: 'No recent biometric data available', rec: 'Please ensure data collection is active.' },
        readinessScore: 0,
        computedSleepH: 0,
        lastSyncedDate: null,
        rhr: null,
      });
    }
  }

  const validForAvg = athleteMetrics.filter((m) => m.latest && m.readinessScore > 0);

  const avgHRV =
    validForAvg.length > 0
      ? validForAvg.reduce((sum, m) => sum + (Number(m.latest?.hrv_night ?? 0) || 0), 0) /
        validForAvg.length
      : 0;

  const avgSleep =
    validForAvg.length > 0
      ? validForAvg.reduce((sum, m) => sum + (Number(m.computedSleepH ?? 0) || 0), 0) /
        validForAvg.length
      : 0;

  const avgReadiness =
    validForAvg.length > 0
      ? validForAvg.reduce((sum, m) => sum + Number(m.readinessScore || 0), 0) /
        validForAvg.length
      : 0;

  const lastSyncedDate =
    teamDates.length > 0
      ? teamDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
      : null;

  const alertCounts = {
    high: athleteMetrics.filter((m) => ['inflammation', 'airway'].includes(m.alert?.type)).length,
    medium: athleteMetrics.filter((m) => ['circadian', 'nutrition'].includes(m.alert?.type)).length,
    optimal: athleteMetrics.filter((m) => m.alert?.type === 'green').length,
  };

  return {
    totalAthletes: (athletes || []).length,
    avgHRV: Number.isFinite(avgHRV) ? avgHRV : 0,
    avgSleep: Number.isFinite(avgSleep) ? avgSleep : 0,
    avgReadiness: Number.isFinite(avgReadiness) ? avgReadiness : 0,
    lastSyncedDate,
    alertCounts,
    athleteMetrics,
  };
}