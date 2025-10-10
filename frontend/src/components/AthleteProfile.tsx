import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  generateAlert,
  calculateReadinessScore,
  getGeneticInsights,
  getTeamAverage
} from '../utils/analytics';
import { useIndividualAthleteData, useTeamData } from '../hooks/useAthleteData';
import { geneticProfileService } from '../services/dataService';
import { MetricCard } from './MetricCard';
import { TrendChart } from './TrendChart';
import ScaleReport from './ScaleReport';
import { ArrowLeft } from 'lucide-react';
import { DigitalTwin3D } from './DigitalTwin';
import { TrainingLoadHeatmap } from './TrainingLoadHeatmap';
import { RecoveryTimeline } from './RecoveryTimeline';
import { Pharmacogenomics } from './Pharmacogenomics';
import { Nutrigenomics } from './Nutrigenomics';
import { RecoveryGenePanel } from './RecoveryGenePanel';
import { SleepMetrics } from './SleepMetrics';
import { StressManagement } from './StressManagement';
import { WeatherImpact } from './WeatherImpact';
import { BloodResults } from './BloodResults';
import { CircadianRhythm } from './CircadianRhythm';
import { ChatWithAI } from './ChatWithAI';
import { HormoneBalanceChart } from './HormoneBalanceChart';
import { PredictiveAnalytics } from './PredictiveAnalytics';
import { filterValidBiometricData, getLatestBiometricRecord, getSortedBiometricDataForCharts } from '../utils/athleteUtils';
import ComprehensiveGeneticAnalysis from './athleteProfile/ComprehensiveGeneticAnalysis';
import GeneticSummaryView from './athleteProfile/GeneticSummaryView';
import type { BiometricData } from '../types';
import HighValueComparisons from './HighValueComparisons';

/**
 * Sleep helpers for accurate duration:
 * - Handles over-midnight sleep (previous night into morning)
 * - Handles morning-only sleep
 * - Sums multiple sleep segments (including naps) per report date
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
  // Sum all segments (including naps) associated to the same report date
  return entries
    .filter(d => d.date === targetDate)
    .reduce((sum, d) => sum + computeDurationHours(d.sleep_onset_time, d.wake_time, d.sleep_duration_h), 0);
};

const aggregateSleepByDate = (entries: BiometricData[]): Array<{ date: string; totalHours: number }> => {
  const map = new Map<string, number>();
  for (const d of entries || []) {
    if (!d?.date) continue;
    const hours = computeDurationHours(d.sleep_onset_time, d.wake_time, d.sleep_duration_h);
    map.set(d.date, (map.get(d.date) || 0) + hours);
  }
  return Array.from(map.entries())
    .map(([date, totalHours]) => ({ date, totalHours }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const AthleteProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const athleteId = parseInt(id || '0');
  const [activeTab, setActiveTab] = useState<
    | 'metrics'
    | 'trends'
    | 'insights'
    | 'digitalTwin'
    | 'trainingLoad'
    | 'recoveryTimeline'
    | 'pharmacogenomics'
    | 'nutrigenomics'
    | 'recoveryGenes'
    | 'predictive'
    | 'sleep'
    | 'stress'
    | 'weather'
    | 'scaleReport'
    | 'bloodResults'
    | 'circadian'
    | 'chatAI'
    | 'geneticSummary'
    | 'geneticAnalysis'
    | 'highValue'
  >('metrics');
  const tabContentRef = useRef<HTMLDivElement>(null);

  const [geneticSummary, setGeneticSummary] = useState<any[]>([]);

  // Use custom hooks for data fetching
  const {
    athlete,
    biometricData: athleteBiometrics,
    geneticProfiles: athleteGenetics,
    loading: dataLoading
  } = useIndividualAthleteData(athleteId, true);
  const { biometricData: allBiometricData } = useTeamData(true);

  // Fetch genetic summary data
  useEffect(() => {
    const fetchGeneticSummary = async () => {
      try {
        const summaryData = await geneticProfileService.getGeneticSummaryByAthlete(athleteId);
        setGeneticSummary(summaryData);
      } catch {
        // silent
      }
    };
    if (athleteId) fetchGeneticSummary();
  }, [athleteId]);

  // Show loading state while fetching data
  if (dataLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading athlete data...</p>
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Athlete not found</p>
        <button onClick={() => navigate('/')} className="mt-4 text-blue-600 hover:text-blue-800">
          ← Back to Team Overview
        </button>
      </div>
    );
  }

  const alert = generateAlert(athlete?.athlete_id || athleteId.toString(), athleteBiometrics, athleteGenetics);

  // Process biometric data using utility functions
  const validBiometricData = filterValidBiometricData(athleteBiometrics);
  const latest = getLatestBiometricRecord(validBiometricData);
  const sortedBiometricData = getSortedBiometricDataForCharts(athleteBiometrics);
  const readinessScore = latest ? calculateReadinessScore(latest) : 0;
  const geneticInsights = getGeneticInsights(athleteGenetics);

  // Accurate sleep computation for tabs (latest day + recent series)
  const computedSleepHLatest = latest ? computeSleepForDate(athleteBiometrics, latest.date) : 0;

  const aggregatedSleepByDate = aggregateSleepByDate(athleteBiometrics);
  const sleepDurationSeries7 = aggregatedSleepByDate.slice(-7).map(d => ({ date: d.date, value: d.totalHours }));

  // Team average of computed sleep across other athletes (latest date per athlete)
  const teamAvgComputedSleep = (() => {
    try {
      const groups = new Map<string, BiometricData[]>();
      for (const d of allBiometricData || []) {
        if (!d?.athlete_id) continue;
        if (String(d.athlete_id) === String(athlete?.athlete_id || athleteId.toString())) continue;
        const key = String(d.athlete_id);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(d);
      }
      const vals: number[] = [];
      groups.forEach((arr) => {
        if (!arr || arr.length === 0) return;
        const latestDate = arr.reduce((acc: string | null, cur) => {
          if (!acc) return cur.date;
          return new Date(cur.date).getTime() > new Date(acc).getTime() ? cur.date : acc;
        }, null as string | null);
        if (!latestDate) return;
        const v = computeSleepForDate(arr, latestDate);
        if (v > 0) vals.push(v);
      });
      if (vals.length === 0) return 0;
      return vals.reduce((a, b) => a + b, 0) / vals.length;
    } catch {
      return 0;
    }
  })();

  const tabs = [
    { id: 'metrics' as const, label: 'Current Metrics', icon: '📊', count: athleteBiometrics.length > 0 ? 9 : 0 },
    { id: 'bloodResults' as const, label: 'Blood Results', icon: '🩸', count: 1 },
    { id: 'circadian' as const, label: 'Circadian Rhythm', icon: '⏰', count: 1 },
    { id: 'trends' as const, label: 'Trends & Analysis', icon: '📈', count: athleteBiometrics.length },
    { id: 'highValue' as const, label: 'High-Value Comparisons', icon: '🧠', count: athleteBiometrics.length },
    { id: 'geneticSummary' as const, label: 'Genetic Summary', icon: '🧬', count: geneticSummary.length },
    { id: 'geneticAnalysis' as const, label: 'Genetic Analysis', icon: '🔬', count: geneticSummary.length },
    { id: 'scaleReport' as const, label: 'Scale Report', icon: '⚖️', count: 1 },
    { id: 'digitalTwin' as const, label: 'Digital Twin', icon: '🌐', count: 1 },
    { id: 'trainingLoad' as const, label: 'Training Load', icon: '🔥', count: athleteBiometrics.length },
    { id: 'recoveryTimeline' as const, label: 'Recovery Timeline', icon: '📅', count: athleteBiometrics.length },
    {
      id: 'pharmacogenomics' as const,
      label: 'Pharmacogenomics',
      icon: '💊',
      count:
        geneticSummary.filter((g) => (g.Category || g.category) === 'pharmacogenomics').length || athleteGenetics.length
    },
    {
      id: 'nutrigenomics' as const,
      label: 'Nutrigenomics',
      icon: '🥗',
      count: geneticSummary.filter((g) => (g.Category || g.category) === 'nutrigenomics').length || athleteGenetics.length
    },
    {
      id: 'recoveryGenes' as const,
      label: 'Recovery Genes',
      icon: '🧬',
      count: geneticSummary.filter((g) => (g.Category || g.category) === 'recovery').length || athleteGenetics.length
    },
    { id: 'sleep' as const, label: 'Sleep Metrics', icon: '🌙', count: athleteBiometrics.length },
    { id: 'stress' as const, label: 'Stress Management', icon: '🧘', count: athleteBiometrics.length },
    { id: 'weather' as const, label: 'Weather Impact', icon: '🌤️', count: 1 },
    { id: 'chatAI' as const, label: 'Chat With AI', icon: '🤖', count: 1 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-enhanced p-6">
        <div className="flex items-start justify-between mb-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-700 hover:text-gray-900 transition-colors duration-200 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Team Overview
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-gray-900">{athlete.name}</h1>
            <p className="text-xl text-gray-700 mb-1">{athlete.sport}</p>
            <p className="text-gray-600">
              Age {athlete.age} | {athlete.team}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900">🧬 Genetic Profile</h3>
            {geneticSummary.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  {geneticSummary.slice(0, 8).map((summary, summaryIndex) => {
                    let genesData = summary.Genes || summary.genes || {};
                    if (typeof genesData === 'string') {
                      try {
                        genesData = JSON.parse(genesData);
                      } catch {
                        genesData = {};
                      }
                    }
                    let gene = 'Unknown';
                    let genotype = 'Unknown';
                    if (Array.isArray(genesData) && genesData.length > 0) {
                      if (typeof genesData[0] === 'object' && genesData[0] !== null) {
                        const firstGene = genesData[0];
                        gene = firstGene.gene || firstGene.Gene || firstGene.rsid || firstGene.RSID || 'Unknown';
                        genotype = firstGene.genotype || firstGene.Genotype || 'Unknown';
                      } else {
                        genesData = genesData.reduce((acc: any, item: any) => {
                          acc[item.Key || item.key] = item.Value || item.value;
                          return acc;
                        }, {});
                        const entries = Object.entries(genesData);
                        if (entries.length > 0) {
                          gene = entries[0][0] as string;
                          genotype = entries[0][1] as string;
                        }
                      }
                    } else if (typeof genesData === 'object' && genesData !== null) {
                      const entries = Object.entries(genesData).filter(([key]) => !String(key).startsWith('$'));
                      if (entries.length > 0) {
                        gene = entries[0][0] as string;
                        genotype = entries[0][1] as string;
                      }
                    }
                    return (
                      <div key={summaryIndex} className="text-sm text-gray-700">
                        <strong>{String(gene || 'Unknown')}:</strong> {String(genotype || 'Unknown')}
                        <div className="text-xs text-gray-500">{summary.Category || summary.category || 'Unknown'}</div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-sm text-gray-500">No genetic data available</div>
            )}
          </div>

          <div className="text-center">
            <div className="text-4xl font-bold mb-2 text-gray-900">{latest ? `${readinessScore.toFixed(0)}%` : 'N/A'}</div>
            <div className="text-gray-600">Readiness Score</div>
            <div className="text-sm text-gray-500 mt-1">
              {latest ? 'Based on HRV, RHR, Sleep & SpO₂' : 'No biometric data available'}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex flex-col sm:flex-row sm:flex-wrap gap-1 sm:gap-0">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tabContentRef.current) {
                    tabContentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className={`flex items-center justify-start sm:justify-center gap-2 px-4 py-3 sm:py-2 text-sm font-medium transition-all duration-200 relative group ${
                  isActive ? 'text-white bg-purple-900' : 'text-gray-600 hover:text-purple-700 hover:bg-purple-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>{tab.icon}</span>
                  <span className="sm:hidden text-white">{tab.label}</span>
                  <span className="hidden sm:inline text-white">{tab.label}</span>
                </span>

                {tab.count > 0 && (
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 text-xs font-semibold rounded-full ${
                      isActive ? 'bg-purple-700 text-white' : 'bg-purple-200 text-gray-700 group-hover:bg-gray-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}

                {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-700"></span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div ref={tabContentRef} className="mt-6">
        {activeTab === 'bloodResults' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">🩸 Blood Results</h2>
            <BloodResults athleteId={athleteId} />
            <div className="mt-8">
              <HormoneBalanceChart athleteId={athleteId} />
            </div>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
              <h2 className="text-2xl font-bold text-white">📊 Current Readiness Metrics</h2>
              {latest && (
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      readinessScore > 75 ? 'bg-green-500' : readinessScore > 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                  ></span>
                  {athlete.name.split(' ')[0]} is {readinessScore > 75 ? 'ready' : readinessScore > 50 ? 'recovering' : 'fatigued'}
                </div>
              )}
            </div>

            {latest ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <MetricCard
                    title="HRV (Night)"
                    value={latest.hrv_night || 0}
                    unit="ms"
                    icon="❤️"
                    subtitle={readinessScore > 75 ? 'Excellent recovery' : 'Moderate recovery'}
                    trend={readinessScore > 75 ? 'up' : 'down'}
                    data={sortedBiometricData.slice(-7).map((d) => ({ date: d.date, value: d.hrv_night || 0 }))}
                    teamAverage={getTeamAverage('hrv_night', athlete?.athlete_id || '', allBiometricData)}
                    goalValue={50}
                    goalLabel="Target"
                  />
                  <MetricCard
                    title="Resting HR (Sleeping HR)"
                    value={latest.resting_hr || 0}
                    unit="bpm"
                    icon="❤️"
                    subtitle={(latest.resting_hr || 0) < 60 ? 'Optimal' : (latest.resting_hr || 0) < 65 ? 'Good' : 'Elevated'}
                    trend={(latest.resting_hr || 0) < 60 ? 'up' : 'down'}
                    data={sortedBiometricData.slice(-7).map((d) => ({ date: d.date, value: d.resting_hr || 0 }))}
                    teamAverage={getTeamAverage('resting_hr', athlete?.athlete_id || '', allBiometricData)}
                    goalValue={60}
                    goalLabel="Ideal"
                  />
                  <MetricCard
                    title="Avg Heart Rate"
                    value={latest.avg_heart_rate || 0}
                    unit="bpm"
                    icon="❤️"
                    subtitle={(latest.avg_heart_rate || 0) < 60 ? 'Optimal' : (latest.avg_heart_rate || 0) < 65 ? 'Good' : 'Elevated'}
                    trend={(latest.avg_heart_rate || 0) < 60 ? 'up' : 'down'}
                    data={sortedBiometricData.slice(-7).map((d) => ({ date: d.date, value: d.avg_heart_rate || 0 }))}
                    teamAverage={getTeamAverage('avg_heart_rate', athlete?.athlete_id || '', allBiometricData)}
                    goalValue={60}
                    goalLabel="Target"
                  />
                  <MetricCard
                    title="Deep Sleep"
                    value={latest.deep_sleep_pct || 0}
                    unit="%"
                    icon="💤"
                    subtitle={(latest.deep_sleep_pct || 0) > 20 ? 'Restorative' : 'Low'}
                    trend={(latest.deep_sleep_pct || 0) > 20 ? 'up' : 'down'}
                    data={sortedBiometricData.slice(-7).map((d) => ({ date: d.date, value: d.deep_sleep_pct || 0 }))}
                    teamAverage={getTeamAverage('deep_sleep_pct', athlete?.athlete_id || '', allBiometricData)}
                    goalValue={20}
                    goalLabel="Min"
                  />
                  <MetricCard
                    title="REM Sleep"
                    value={latest.rem_sleep_pct || 0}
                    unit="%"
                    icon="🧠"
                    subtitle={(latest.rem_sleep_pct || 0) > 18 ? 'Cognitive recovery' : 'Below ideal'}
                    trend={(latest.rem_sleep_pct || 0) > 18 ? 'up' : 'down'}
                    data={sortedBiometricData.slice(-7).map((d) => ({ date: d.date, value: d.rem_sleep_pct || 0 }))}
                    teamAverage={getTeamAverage('rem_sleep_pct', athlete?.athlete_id || '', allBiometricData)}
                    goalValue={18}
                    goalLabel="Target"
                  />
                  <MetricCard
                    title="Sleep Duration"
                    value={computedSleepHLatest || 0}
                    unit="h"
                    icon="🌙"
                    subtitle={(computedSleepHLatest || 0) >= 7 ? 'Adequate' : 'Short'}
                    trend={(computedSleepHLatest || 0) >= 7 ? 'up' : 'down'}
                    data={sleepDurationSeries7}
                    teamAverage={Number.isFinite(teamAvgComputedSleep) ? Number(teamAvgComputedSleep.toFixed(1)) : 0}
                    goalValue={7}
                    goalLabel="Recommended"
                  />
                  <MetricCard
                    title="SpO₂ (Night)"
                    value={latest.spo2_night || 0}
                    unit="%"
                    icon="🫁"
                    subtitle={(latest.spo2_night || 0) > 96 ? 'Normal' : 'Monitor'}
                    trend={(latest.spo2_night || 0) > 96 ? 'up' : 'down'}
                    data={sortedBiometricData.slice(-7).map((d) => ({ date: d.date, value: d.spo2_night || 0 }))}
                    teamAverage={getTeamAverage('spo2_night', athlete?.athlete_id || '', allBiometricData)}
                    goalValue={96}
                    goalLabel="Healthy"
                  />
                  <MetricCard
                    title="Respiratory Rate"
                    value={latest.resp_rate_night || 0}
                    unit="/min"
                    icon="🌬️"
                    subtitle={(latest.resp_rate_night || 0) <= 16 ? 'Normal' : 'Elevated'}
                    trend={(latest.resp_rate_night || 0) <= 16 ? 'up' : 'down'}
                    data={sortedBiometricData.slice(-7).map((d) => ({ date: d.date, value: d.resp_rate_night || 0 }))}
                    teamAverage={getTeamAverage('resp_rate_night', athlete?.athlete_id || '', allBiometricData)}
                    goalValue={16}
                    goalLabel="Max"
                  />
                  <MetricCard
                    title="Body Temp"
                    value={latest.temp_trend_c || 0}
                    unit="°C"
                    icon="🌡️"
                    subtitle={Math.abs((latest.temp_trend_c || 0) - 36.8) < 0.3 ? 'Stable' : 'Elevated'}
                    trend={Math.abs((latest.temp_trend_c || 0) - 36.8) < 0.3 ? 'up' : 'down'}
                    data={sortedBiometricData.slice(-7).map((d) => ({ date: d.date, value: d.temp_trend_c || 0 }))}
                    teamAverage={getTeamAverage('temp_trend_c', athlete?.athlete_id || '', allBiometricData)}
                    goalValue={36.8}
                    goalLabel="Normal"
                  />
                  <MetricCard
                    title="Training Load"
                    value={latest.training_load_pct || 0}
                    unit="%"
                    icon="💪"
                    subtitle={(latest.training_load_pct || 0) > 85 ? 'High' : 'Moderate'}
                    trend="neutral"
                    data={sortedBiometricData.slice(-7).map((d) => ({ date: d.date, value: d.training_load_pct || 0 }))}
                    teamAverage={getTeamAverage('training_load_pct', athlete?.athlete_id || '', allBiometricData)}
                    goalValue={85}
                    goalLabel="Optimal"
                  />
                </div>

                <div className="mt-8 card-enhanced p-5">
                  <h3 className="font-semibold text-gray-900 mb-2">📋 Readiness Summary</h3>
                  <p className="text-gray-700 text-sm">
                    {readinessScore > 75
                      ? `${athlete.name.split(' ')[0]} shows strong recovery markers. Ready for high-intensity training.`
                      : readinessScore > 50
                      ? `Recovery is moderate. Consider active recovery or technique work.`
                      : `Fatigue detected. Prioritize sleep, hydration, and low-intensity sessions.`}
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-12 card-enhanced rounded-xl">
                <p className="text-gray-600 mb-2">📊 No biometric data available</p>
                <p className="text-sm text-gray-500">
                  Biometric data is required to display readiness metrics. Please ensure wearable data is being collected and
                  synced.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'circadian' && (
          <CircadianRhythm biometricData={athleteBiometrics} geneticData={geneticSummary} athleteId={athleteId.toString()} />
        )}

        {activeTab === 'trends' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Performance Trends</h2>
            {athleteBiometrics.length >= 2 ? (
              <TrendChart
                data={athleteBiometrics.map((d) => ({
                  ...d,
                  hrv_night: d.hrv_night || 0,
                  resting_hr: d.resting_hr || 0,
                  spo2_night: d.spo2_night || 0,
                  resp_rate_night: d.resp_rate_night || 0,
                  deep_sleep_pct: d.deep_sleep_pct || 0,
                  rem_sleep_pct: d.rem_sleep_pct || 0,
                  light_sleep_pct: d.light_sleep_pct || 0,
                  sleep_duration_h: d.sleep_duration_h || 0,
                  temp_trend_c: d.temp_trend_c || 0,
                  training_load_pct: d.training_load_pct || 0
                }))}
              />
            ) : (
              <div className="text-center py-12 card-enhanced rounded-xl">
                <p className="text-gray-600 mb-2">📊 Insufficient data for trend analysis</p>
                <p className="text-sm text-gray-500">Need at least 2 days of data. Current data points: {athleteBiometrics.length}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'highValue' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">🧠 High-Value Comparisons</h2>
            <HighValueComparisons
              athleteId={athleteId}
              biometricData={athleteBiometrics}
              geneticProfiles={athleteGenetics}
            />
          </div>
        )}
        {activeTab === 'geneticSummary' && <GeneticSummaryView geneticSummary={geneticSummary} />}

        {activeTab === 'geneticAnalysis' && (
          <ComprehensiveGeneticAnalysis athlete={athlete} geneticSummary={geneticSummary} athleteId={athleteId} />
        )}

        {activeTab === 'scaleReport' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">⚖️ Scale Report</h2>
            <ScaleReport athleteId={athleteId.toString()} />
          </div>
        )}

        {activeTab === 'digitalTwin' && <DigitalTwin3D athleteId={athleteId.toString()} />}

        {activeTab === 'trainingLoad' && <TrainingLoadHeatmap />}

        {activeTab === 'recoveryTimeline' && <RecoveryTimeline athleteId={athleteId.toString()} />}

        {activeTab === 'pharmacogenomics' && <Pharmacogenomics athleteId={athleteId.toString()} />}

        {activeTab === 'nutrigenomics' && <Nutrigenomics athleteId={athleteId.toString()} />}

        {activeTab === 'recoveryGenes' && <RecoveryGenePanel athleteId={athleteId.toString()} />}

        {activeTab === 'predictive' && <PredictiveAnalytics athleteId={athleteId.toString()} />}

        {activeTab === 'sleep' && <SleepMetrics biometricData={athleteBiometrics} athleteId={athleteId.toString()} />}

        {activeTab === 'stress' && (
          <StressManagement athleteId={athleteId.toString()} biometricData={athleteBiometrics} />
        )}

        {activeTab === 'weather' && <WeatherImpact athleteId={athleteId.toString()} geneticData={geneticSummary} />}

        {activeTab === 'chatAI' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">🤖 Chat With AI</h2>
            <div className="mb-4 p-4 bg-gray-100 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Data Status:</h3>
              <p className="text-sm text-gray-600">Athlete: {athlete?.name}</p>
              <p className="text-sm text-gray-600">Biometric Data Count: {athleteBiometrics.length}</p>
              <p className="text-sm text-gray-600">Genetic Profiles Count: {athleteGenetics.length}</p>
              <p className="text-sm text-gray-600">Genetic Summary Count: {geneticSummary.length}</p>
              <p className="text-sm text-gray-600">Athlete ID: {athlete?.athlete_id}</p>
              <p className="text-sm text-gray-600">Latest Biometric Date: {getLatestBiometricRecord(athleteBiometrics)?.date || 'None'}</p>
              {athleteBiometrics.length === 0 && (
                <p className="text-xs text-yellow-600 mt-2">⚠️ No biometric data available. Check Current Metrics tab for data.</p>
              )}
            </div>
            <ChatWithAI
              athlete={athlete}
              biometricData={athleteBiometrics}
              geneticProfiles={athleteGenetics}
              geneticSummary={geneticSummary}
            />
          </div>
        )}
      </div>
    </div>
  );
};
