import React, { useState, useEffect, useRef } from 'react';
import { apiGet } from '../utils/api';
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
import { Supplements } from './Supplements';

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
    | 'drills'
    | 'recoveryTimeline'
    | 'pharmacogenomics'
    | 'nutrigenomics'
    | 'supplements'
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



  const alert = generateAlert(athlete?.athlete_id || athleteId.toString(), athleteBiometrics, athleteGenetics);

  // Process biometric data using utility functions
  const validBiometricData = filterValidBiometricData(athleteBiometrics);
  const latest = getLatestBiometricRecord(validBiometricData);
  const sortedBiometricData = getSortedBiometricDataForCharts(athleteBiometrics);
  const readinessScore = latest ? calculateReadinessScore(latest) : 0;

  // Latest non-zero readiness within recent records (aligns with RecoveryTimeline logic)
  const readinessRecent = (() => {
    const arr = [...sortedBiometricData];
    for (let i = arr.length - 1; i >= 0; i--) {
      const r = calculateReadinessScore(arr[i] as BiometricData);
      if (r > 0) return r;
    }
    return 0;
  })();

  const displayReadiness = readinessRecent > 0 ? readinessRecent : readinessScore;
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

  // Composite load for Trends tab (align with Training Load)
  const [trendsTrainingLoad, setTrendsTrainingLoad] = useState<Array<{ date: string; compositeLoad: number }>>([]);

  // Training Load (STATSports) - 7-day window via backend endpoint
  const [dailyTrainingLoad, setDailyTrainingLoad] = useState<any[]>([]);
  const [drills, setDrills] = useState<Array<{
    name: string;
    sessionType?: string;
    start?: string;
    end?: string;
    durationMin?: number;
    sRPE?: number;
    zoneWeightedLoad?: number;
    zoneWeightedPerMin?: number;
    metabolicPowerLoad?: number;
    metabolicPowerPerMin?: number;
    compositeLoad?: number;
    compositePerMin?: number;
  }>>([]);
  const [tlLoading, setTlLoading] = useState(false);
  const [tlError, setTlError] = useState<string | null>(null);
  const [drillsLoading, setDrillsLoading] = useState(false);
  const [drillsError, setDrillsError] = useState<string | null>(null);

  const extractDrills = (payload: any): Array<{ name: string; sessionType?: string; start?: string; end?: string; sRPE?: number; durationMin?: number }> => {
    const out: Array<{ name: string; sessionType?: string; start?: string; end?: string; sRPE?: number; durationMin?: number }> = [];
    const visit = (node: any) => {
      if (!node) return;
      if (Array.isArray(node)) {
        node.forEach(visit);
        return;
      }
      if (typeof node === 'object') {
        const name = node.drillName || node.DrillName;
        const start = node.startTime || node.StartTime;
        const end = node.endTime || node.EndTime;
        const sessionType = node.sessionType || node.SessionType;
        const kpi = node.drillKpi || node.DrillKpi || node.kpi || node.Kpi;
        if (name && (start || end)) {
          let sRPE: number | undefined;
          let durationMin: number | undefined;
          if (kpi) {
            const cm = (kpi as any).customMetrics || (kpi as any).CustomMetrics;
            if (cm && typeof cm === 'object') {
              for (const key of Object.keys(cm)) {
                const lower = String(key).toLowerCase();
                if (lower === 'srpe' || lower === 'rpe') sRPE = Number((cm as any)[key]);
                if (lower === 'durationmin' || lower === 'duration') durationMin = Number((cm as any)[key]);
              }
            }
          }
          out.push({ name: String(name), sessionType: sessionType ? String(sessionType) : undefined, start: start ? String(start) : undefined, end: end ? String(end) : undefined, sRPE, durationMin });
        }
        Object.values(node).forEach(visit);
      }
    };
    visit(payload);
    return out
      .map(d => ({ ...d, startTs: d.start ? Date.parse(d.start) : 0 }))
      .sort((a, b) => (b.startTs || 0) - (a.startTs || 0))
      .slice(0, 10);
  };

  // Fetch composite training load for Trends tab so the chart can use STATSports composite values
  useEffect(() => {
    if (activeTab !== 'trends') return;
    let cancelled = false;
    (async () => {
      try {
        // Span similar to what the trends view displays; cap to 28 days
        const days = Math.min(28, Math.max(7, athleteBiometrics.length || 7));
        let loads: any = await apiGet<any>(`/athletes/${athleteId}/training-load`, { days, includeZeros: true });
        if (loads && typeof loads === 'object' && loads.$values && Array.isArray(loads.$values)) {
          loads = loads.$values;
        }
        const normalized: Array<{ date: string; compositeLoad: number }> = Array.isArray(loads)
          ? loads
              .map((x: any) => ({
                date: x.date || x.Date,
                compositeLoad: Number(x.compositeLoad ?? x.CompositeLoad ?? x.load ?? x.Load ?? 0),
              }))
              .filter((x: any) => !!x.date)
              .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
          : [];
        if (!cancelled) setTrendsTrainingLoad(normalized);
      } catch {
        if (!cancelled) setTrendsTrainingLoad([]);
      }
    })();
    return () => { cancelled = true; };
  }, [athleteId, activeTab, athleteBiometrics.length]);


  useEffect(() => {
    if (activeTab !== 'trainingLoad') return;
    let cancelled = false;
    (async () => {
      try {
        setTlLoading(true);
        setTlError(null);
        // Daily training load (7 days, include zeros)
        let loads: any = await apiGet<any>(`/athletes/${athleteId}/training-load`, { days: 7, includeZeros: true });
        if (loads && typeof loads === 'object' && loads.$values && Array.isArray(loads.$values)) {
          loads = loads.$values;
        }
        const normalized = Array.isArray(loads)
          ? loads
              .map((x: any) => ({
                date: x.date || x.Date,
                zoneWeightedLoad: Number(x.zoneWeightedLoad ?? x.ZoneWeightedLoad ?? 0),
                zoneWeightedPerMin: Number(x.zoneWeightedPerMin ?? x.ZoneWeightedPerMin ?? 0),
                metabolicPowerLoad: Number(x.metabolicPowerLoad ?? x.MetabolicPowerLoad ?? 0),
                metabolicPowerPerMin: Number(x.metabolicPowerPerMin ?? x.MetabolicPowerPerMin ?? 0),
                compositeLoad: Number(x.compositeLoad ?? x.CompositeLoad ?? x.load ?? x.Load ?? 0),
                compositePerMin: Number(x.compositePerMin ?? x.CompositePerMin ?? 0),
                // Back-compat for existing UI using `load`: use composite
                load: Number(x.compositeLoad ?? x.CompositeLoad ?? x.load ?? x.Load ?? 0),
              }))
              .filter((x: any) => !!x.date)
              .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
          : [];
        if (!cancelled) setDailyTrainingLoad(normalized);

        // Detailed drills (7 days)
        let drillsResp: any = await apiGet<any>(`/athletes/${athleteId}/drills`, { days: 7, limit: 25 });
        if (drillsResp && typeof drillsResp === 'object' && Array.isArray(drillsResp.$values)) {
          drillsResp = drillsResp.$values;
        }
        const mappedDrills = Array.isArray(drillsResp)
          ? drillsResp.map((d: any) => ({
              name: d.name ?? d.Name,
              sessionType: d.sessionType ?? d.SessionType,
              start: d.startUtc ?? d.StartUtc,
              end: d.endUtc ?? d.EndUtc,
              durationMin: Number(d.durationMin ?? d.DurationMin ?? 0),
              zoneWeightedLoad: Number(d.zoneWeightedLoad ?? d.ZoneWeightedLoad ?? 0),
              zoneWeightedPerMin: Number(d.zoneWeightedPerMin ?? d.ZoneWeightedPerMin ?? 0),
              metabolicPowerLoad: Number(d.metabolicPowerLoad ?? d.MetabolicPowerLoad ?? 0),
              metabolicPowerPerMin: Number(d.metabolicPowerPerMin ?? d.MetabolicPowerPerMin ?? 0),
              compositeLoad: Number(d.compositeLoad ?? d.CompositeLoad ?? 0),
              compositePerMin: Number(d.compositePerMin ?? d.CompositePerMin ?? 0),
            }))
          : [];
        if (!cancelled) setDrills(mappedDrills);
      } catch (e) {
        if (!cancelled) setTlError('Failed to load training load');
      } finally {
        if (!cancelled) setTlLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [athleteId, activeTab]);

  useEffect(() => {
    if (activeTab !== 'drills') return;
    let cancelled = false;
    (async () => {
      try {
        setDrillsLoading(true);
        setDrillsError(null);
        let drillsResp: any = await apiGet<any>(`/athletes/${athleteId}/drills`, { days: 7, limit: 50 });
        if (drillsResp && typeof drillsResp === 'object' && Array.isArray(drillsResp.$values)) {
          drillsResp = drillsResp.$values;
        }
        const mappedDrills = Array.isArray(drillsResp)
          ? drillsResp.map((d: any) => ({
              name: d.name ?? d.Name,
              sessionType: d.sessionType ?? d.SessionType,
              start: d.startUtc ?? d.StartUtc,
              end: d.endUtc ?? d.EndUtc,
              durationMin: Number(d.durationMin ?? d.DurationMin ?? 0),
              sRPE: Number(d.sRPE ?? d.srpe ?? d.SRPE ?? d.RPE ?? d.rpe ?? 0),
              zoneWeightedLoad: Number(d.zoneWeightedLoad ?? d.ZoneWeightedLoad ?? 0),
              zoneWeightedPerMin: Number(d.zoneWeightedPerMin ?? d.ZoneWeightedPerMin ?? 0),
              metabolicPowerLoad: Number(d.metabolicPowerLoad ?? d.MetabolicPowerLoad ?? 0),
              metabolicPowerPerMin: Number(d.metabolicPowerPerMin ?? d.MetabolicPowerPerMin ?? 0),
              compositeLoad: Number(d.compositeLoad ?? d.CompositeLoad ?? 0),
              compositePerMin: Number(d.compositePerMin ?? d.CompositePerMin ?? 0),
            }))
          : [];
        if (!cancelled) setDrills(mappedDrills);
      } catch (e) {
        if (!cancelled) setDrillsError('Failed to load drills');
      } finally {
        if (!cancelled) setDrillsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [athleteId, activeTab]);

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
    { id: 'drills' as const, label: 'Drills', icon: '🏋️', count: drills.length },
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
      id: 'supplements' as const,
      label: 'Supplements',
      icon: '💊',
      count: geneticSummary.filter((g) => (g.Category || g.category) === 'supplements').length || athleteGenetics.length
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
            <div className="text-4xl font-bold mb-2 text-gray-900">{latest ? `${displayReadiness.toFixed(0)}%` : 'N/A'}</div>
            <div className="text-gray-600">Readiness</div>
            <div className="text-sm text-gray-500 mt-1">
              {latest ? 'HRV, RHR, Sleep (duration + stages), SpO₂' : 'No biometric data available'}
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
                      displayReadiness > 75 ? 'bg-green-500' : displayReadiness > 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                  ></span>
                  {athlete.name.split(' ')[0]} is {displayReadiness > 75 ? 'ready' : displayReadiness > 50 ? 'recovering' : 'fatigued'}
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
                    title="Skin Temp"
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
                trainingLoadDaily={trendsTrainingLoad}
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

        {activeTab === 'trainingLoad' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">🔥 Training Load (Last 7 days)</h2>

            {tlLoading && (
              <div className="card-enhanced p-6 text-gray-600">Loading training load...</div>
            )}
            {tlError && (
              <div className="card-enhanced p-6 text-red-500">Error: {tlError}</div>
            )}

            {!tlLoading && !tlError && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">7-day Total</div>
                    <div className="text-2xl font-bold text-purple-700">
                      {dailyTrainingLoad.reduce((sum, d) => sum + (Number(d.load) || 0), 0).toFixed(1)}
                    </div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Daily Average</div>
                    <div className="text-2xl font-bold text-blue-700">
                      {dailyTrainingLoad.length > 0
                        ? (dailyTrainingLoad.reduce((sum, d) => sum + (Number(d.load) || 0), 0) / dailyTrainingLoad.length).toFixed(1)
                        : '0.0'}
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Most Recent Day</div>
                    <div className="text-2xl font-bold text-green-700">
                      {dailyTrainingLoad.length > 0 ? Number(dailyTrainingLoad[dailyTrainingLoad.length - 1].load).toFixed(1) : '0.0'}
                    </div>
                  </div>
                </div>

                <div className="card-enhanced p-6">
                  <div className="mb-3 text-gray-600 text-sm">Training Load per day</div>
                  {dailyTrainingLoad.length === 0 ? (
                    <div className="text-gray-500">No training load available</div>
                  ) : (
                    <div className="grid grid-cols-7 gap-3">
                      {dailyTrainingLoad.map((d, idx) => {
                        const val = Number(d.load) || 0;
                        const height = Math.min(100, Math.round(val)); // simple scale
                        const color =
                          val >= 300 ? 'bg-red-500'
                          : val >= 200 ? 'bg-orange-500'
                          : val >= 100 ? 'bg-yellow-500'
                          : 'bg-green-500';
                        return (
                          <div key={idx} className="flex flex-col items-center">
                            <div className="text-xs text-gray-500 mb-1">{d.date?.slice(5)}</div>
                            <div className="w-8 h-32 bg-gray-100 rounded flex items-end">
                              <div className={`${color} w-8 rounded`} style={{ height: `${Math.max(4, (height/100)*100)}%` }} title={`${d.date}: ${val.toFixed(1)}`} />
                            </div>
                            <div className="text-xs text-gray-600 mt-1">{val.toFixed(0)}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="card-enhanced p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">Drills</h3>
                  </div>
                  <div className="text-sm text-gray-600">
                    Detailed drill analytics are available in the Drills tab.
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'drills' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">🏋️ Training Drills (Last 7 days)</h2>

            {drillsLoading && (
              <div className="card-enhanced p-6 text-gray-600">Loading drill data...</div>
            )}
            {drillsError && (
              <div className="card-enhanced p-6 text-red-500">Error: {drillsError}</div>
            )}

            {!drillsLoading && !drillsError && (
              <>
                {(() => {
                  const dateKey = (s?: string) => {
                    if (!s) return null;
                    const d = new Date(s);
                    if (isNaN(d.getTime())) return null;
                    return d.toISOString().slice(0, 10);
                  };
                  const today = new Date();
                  const days7 = Array.from({ length: 7 }, (_, i) => {
                    const d = new Date(today);
                    d.setUTCDate(today.getUTCDate() - (6 - i));
                    return d.toISOString().slice(0, 10);
                  });
                  const byDay = new Map<string, { count: number; totalComposite: number; totalDuration: number }>();
                  days7.forEach((k) => byDay.set(k, { count: 0, totalComposite: 0, totalDuration: 0 }));
                  for (const dr of drills || []) {
                    const k = dateKey(dr.start || dr.end);
                    if (k && byDay.has(k)) {
                      const cur = byDay.get(k)!;
                      cur.count += 1;
                      cur.totalComposite += Number(dr.compositeLoad || 0);
                      cur.totalDuration += typeof dr.durationMin === 'number' ? dr.durationMin : 0;
                    }
                  }
                  const daily = days7.map((k) => ({ date: k, ...(byDay.get(k)!) }));
                  const totalComposite7 = daily.reduce((a, b) => a + b.totalComposite, 0);
                  const totalDuration7 = daily.reduce((a, b) => a + b.totalDuration, 0);
                  const drillsCount7 = (drills || []).length;
                  const avgCompositePerDay = totalComposite7 / 7;
                  const avgCompositePerDrill = drillsCount7 ? totalComposite7 / drillsCount7 : 0;

                  return (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <div className="text-sm text-gray-600">Drills (7 days)</div>
                          <div className="text-2xl font-bold text-purple-700">{drillsCount7}</div>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="text-sm text-gray-600">Total Composite</div>
                          <div className="text-2xl font-bold text-blue-700">{totalComposite7.toFixed(1)}</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="text-sm text-gray-600">Total Duration</div>
                          <div className="text-2xl font-bold text-green-700">{Math.round(totalDuration7)} min</div>
                        </div>
                        <div className="bg-amber-50 p-4 rounded-lg">
                          <div className="text-sm text-gray-600">Avg Composite / day</div>
                          <div className="text-2xl font-bold text-amber-700">{avgCompositePerDay.toFixed(1)}</div>
                        </div>
                        <div className="bg-rose-50 p-4 rounded-lg">
                          <div className="text-sm text-gray-600">Avg Intensity (comp/min)</div>
                          <div className="text-2xl font-bold text-rose-700">{(totalDuration7 > 0 ? (totalComposite7 / totalDuration7) : 0).toFixed(2)}</div>
                        </div>
                      </div>

                      <div className="card-enhanced p-6">
                        <div className="mb-3 text-gray-600 text-sm">Composite Load per day</div>
                        <div className="grid grid-cols-7 gap-3">
                          {daily.map((d, idx) => {
                            const val = Number(d.totalComposite) || 0;
                            const height = Math.min(100, Math.round(val));
                            const color =
                              val >= 300 ? 'bg-red-500'
                              : val >= 200 ? 'bg-orange-500'
                              : val >= 100 ? 'bg-yellow-500'
                              : 'bg-green-500';
                            return (
                              <div key={idx} className="flex flex-col items-center">
                                <div className="text-xs text-gray-500 mb-1">{d.date.slice(5)}</div>
                                <div className="w-8 h-32 bg-gray-100 rounded flex items-end">
                                  <div className={`${color} w-8 rounded`} style={{ height: `${Math.max(4, (height/100)*100)}%` }} title={`${d.date}: ${val.toFixed(1)}`} />
                                </div>
                                <div className="text-xs text-gray-600 mt-1">{val.toFixed(0)}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {(() => {
                        // Session type breakdown
                        const byType = new Map<string, { count: number; totalComposite: number; totalDuration: number }>();
                        for (const dr of drills || []) {
                          const t = (dr.sessionType || 'Session');
                          const cur = byType.get(t) || { count: 0, totalComposite: 0, totalDuration: 0 };
                          cur.count += 1;
                          cur.totalComposite += Number(dr.compositeLoad || 0);
                          cur.totalDuration += typeof dr.durationMin === 'number' ? dr.durationMin : 0;
                          byType.set(t, cur);
                        }
                        const types = Array.from(byType.entries());

                        const toIntensity = (d: any) => Number(d.compositePerMin) || ((Number(d.compositeLoad) || 0) / Math.max(1, Number(d.durationMin) || 0));
                        const topByComposite = [...(drills || [])]
                          .filter(d => Number(d.compositeLoad) > 0)
                          .sort((a, b) => (Number(b.compositeLoad) || 0) - (Number(a.compositeLoad) || 0))
                          .slice(0, 5);
                        const topByIntensity = [...(drills || [])]
                          .map(d => ({ ...d, __intensity: toIntensity(d) }))
                          .filter(d => d.__intensity > 0)
                          .sort((a, b) => b.__intensity - a.__intensity)
                          .slice(0, 5);

                        const grouped = new Map<string, any[]>();
                        for (const dr of drills || []) {
                          const k = dateKey(dr.start || dr.end);
                          if (!k) continue;
                          if (!grouped.has(k)) grouped.set(k, []);
                          grouped.get(k)!.push(dr);
                        }

                        const fmtMin = (m: number) => {
                          const h = Math.floor(m / 60);
                          const mm = Math.round(m % 60);
                          return h > 0 ? `${h}h ${mm}m` : `${mm}m`;
                        };

                        return (
                          <>
                            <div className="card-enhanced p-6">
                              <h3 className="text-lg font-semibold text-gray-900 mb-3">By Session Type</h3>
                              {types.length === 0 ? (
                                <div className="text-sm text-gray-600">No drills categorized by session type.</div>
                              ) : (
                                <div className="w-full overflow-x-auto">
                                  <div className="min-w-[560px]">
                                    <div className="grid grid-cols-5 gap-2 text-xs text-gray-500 mb-2 px-1">
                                      <div>Type</div>
                                      <div className="text-right">Sessions</div>
                                      <div className="text-right">Composite</div>
                                      <div className="text-right">Duration</div>
                                      <div className="text-right">Avg Intensity</div>
                                    </div>
                                    <div className="space-y-1">
                                      {types.map(([type, v], i) => (
                                        <div key={i} className="grid grid-cols-5 gap-2 bg-gray-50 rounded px-2 py-2 text-sm">
                                          <div className="font-medium text-gray-900">{type}</div>
                                          <div className="text-right text-gray-800">{v.count}</div>
                                          <div className="text-right text-gray-800">{v.totalComposite.toFixed(1)}</div>
                                          <div className="text-right text-gray-800">{fmtMin(v.totalDuration)}</div>
                                          <div className="text-right text-gray-800">
                                            {(v.totalDuration > 0 ? (v.totalComposite / v.totalDuration) : 0).toFixed(2)}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="card-enhanced p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Top Drills by Composite</h3>
                                {topByComposite.length === 0 ? (
                                  <div className="text-sm text-gray-600">No drills in the last 7 days.</div>
                                ) : (
                                  <div className="space-y-2">
                                    {topByComposite.map((d, i) => (
                                      <div key={i} className="bg-gray-50 rounded p-3">
                                        <div className="flex items-center justify-between">
                                          <div className="font-medium text-gray-900">{d.name}</div>
                                          <div className="text-xs text-gray-500">{new Date((d.start || d.end || '')).toLocaleString()}</div>
                                        </div>
                                        <div className="text-xs text-gray-500">{d.sessionType || 'Session'}</div>
                                        <div className="flex flex-wrap gap-2 text-sm mt-2">
                                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">Composite: {Number(d.compositeLoad || 0).toFixed(1)}</span>
                                          <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded">Intensity: {(Number(d.compositePerMin) || ((Number(d.compositeLoad) || 0)/Math.max(1, Number(d.durationMin)||0))).toFixed(2)}</span>
                                          {typeof d.durationMin === 'number' && d.durationMin > 0 && (
                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">{fmtMin(d.durationMin)}</span>
                                          )}
                                          {typeof d.sRPE === 'number' && d.sRPE > 0 && (
                                            <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded">sRPE: {Number(d.sRPE).toFixed(0)}</span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="card-enhanced p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Top Drills by Intensity</h3>
                                {topByIntensity.length === 0 ? (
                                  <div className="text-sm text-gray-600">No drills in the last 7 days.</div>
                                ) : (
                                  <div className="space-y-2">
                                    {topByIntensity.map((d, i) => (
                                      <div key={i} className="bg-gray-50 rounded p-3">
                                        <div className="flex items-center justify-between">
                                          <div className="font-medium text-gray-900">{d.name}</div>
                                          <div className="text-xs text-gray-500">{new Date((d.start || d.end || '')).toLocaleString()}</div>
                                        </div>
                                        <div className="text-xs text-gray-500">{d.sessionType || 'Session'}</div>
                                        <div className="flex flex-wrap gap-2 text-sm mt-2">
                                          <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded">Intensity: {Number((d as any).__intensity || 0).toFixed(2)}</span>
                                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">Composite: {Number(d.compositeLoad || 0).toFixed(1)}</span>
                                          {typeof d.durationMin === 'number' && d.durationMin > 0 && (
                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">{fmtMin(d.durationMin)}</span>
                                          )}
                                          {typeof d.sRPE === 'number' && d.sRPE > 0 && (
                                            <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded">sRPE: {Number(d.sRPE).toFixed(0)}</span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold text-white">Drills by Day</h3>
                              {days7.map((day) => {
                                const items = grouped.get(day) || [];
                                if (items.length === 0) return null;
                                const sumComp = items.reduce((a, b) => a + (Number(b.compositeLoad) || 0), 0);
                                const sumDur = items.reduce((a, b) => a + (typeof b.durationMin === 'number' ? b.durationMin : 0), 0);
                                return (
                                  <div key={day} className="card-enhanced p-4">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="font-semibold text-gray-900">{day}</div>
                                      <div className="text-xs text-gray-500">{items.length} drills • {sumComp.toFixed(1)} comp • {fmtMin(sumDur)}</div>
                                    </div>
                                    <div className="space-y-2">
                                      {items
                                        .sort((a, b) => new Date(a.start || a.end || '').getTime() - new Date(b.start || b.end || '').getTime())
                                        .map((dr, i) => (
                                          <div key={i} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gray-50 rounded p-3">
                                            <div className="flex-1">
                                              <div className="font-medium text-gray-900">{dr.name}</div>
                                              <div className="text-xs text-gray-500">
                                                {dr.sessionType || 'Session'} • {new Date((dr.start || dr.end || '')).toLocaleTimeString()}
                                                {dr.end ? ` - ${new Date(dr.end).toLocaleTimeString()}` : ''}
                                              </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2 text-sm mt-2 sm:mt-0">
                                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                                                Composite: {Number(dr.compositeLoad || 0).toFixed(1)}
                                              </span>
                                              <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded">
                                                Intensity: {(Number(dr.compositePerMin) || ((Number(dr.compositeLoad) || 0)/Math.max(1, Number(dr.durationMin)||0))).toFixed(2)}
                                              </span>
                                              <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded">
                                                Zone/min: {Number(dr.zoneWeightedPerMin || 0).toFixed(2)}
                                              </span>
                                              <span className="px-2 py-1 bg-teal-100 text-teal-700 rounded">
                                                Metabolic/min: {Number(dr.metabolicPowerPerMin || 0).toFixed(2)}
                                              </span>
                                              {typeof dr.durationMin === 'number' && dr.durationMin > 0 && (
                                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                                  {fmtMin(dr.durationMin)}
                                                </span>
                                              )}
                                              {typeof dr.sRPE === 'number' && dr.sRPE > 0 && (
                                                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                                                  sRPE: {Number(dr.sRPE).toFixed(0)}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        );
                      })()}
                    </>
                  );
                })()}

                <div className="card-enhanced p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Drills</h3>
                    <div className="text-sm text-gray-500">{drills.length} items</div>
                  </div>
                  <div className="text-sm text-gray-600">
                    See detailed per-day drill breakdown above, including session types and intensity leaders.
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'recoveryTimeline' && <RecoveryTimeline athleteId={athleteId.toString()} />}

        {activeTab === 'pharmacogenomics' && <Pharmacogenomics athleteId={athleteId.toString()} />}

        {activeTab === 'nutrigenomics' && <Nutrigenomics athleteId={athleteId.toString()} />}

        {activeTab === 'supplements' && <Supplements athleteId={athleteId.toString()} />}

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
