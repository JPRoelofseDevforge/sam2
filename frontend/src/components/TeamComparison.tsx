import React, { useEffect, useMemo, useState } from 'react';
import { dataService, injuryService } from '../services/dataService';
import { Athlete, BiometricData } from '../types';
import { calculateReadinessScore } from '../utils/analytics';
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
} from 'recharts';
import { apiGet } from '../utils/api';

type ViewMode = 'coach' | 'physio';

type NormalizedInjury = {
  id: number;
  athleteId: number;
  dateOfInjury?: string;
  diagnosis: string;
  bodyArea?: string;
  laterality?: string;
  mechanism?: string;
  severity?: string;
  isConcussion?: boolean;
  hIAFlag?: boolean;
  concussionStage?: string;
  rTPStage?: string;
  status?: string;
  returnDatePlanned?: string;
  returnDateActual?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
};

const metricOptions = [
  { id: 'readiness', label: 'Readiness Score' },
  { id: 'trainingLoad', label: 'Training Load' },
  { id: 'hrv', label: 'HRV (ms)' },
  { id: 'restingHr', label: 'Resting HR (bpm)' },
  { id: 'sleep', label: 'Sleep Duration (h)' },
] as const;

type CoachMetricId = typeof metricOptions[number]['id'];

export const TeamComparison: React.FC = () => {
  const [view, setView] = useState<ViewMode>('coach');
  const [metric, setMetric] = useState<CoachMetricId>('readiness');

  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [biometricData, setBiometricData] = useState<BiometricData[]>([]);
  const [injuries, setInjuries] = useState<NormalizedInjury[]>([]);

  const [selectedUnionIds, setSelectedUnionIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [injuriesLoading, setInjuriesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [compositeLoadByAthleteId, setCompositeLoadByAthleteId] = useState<Record<number, number>>({});

  // Helpers: round to 1 decimal and normalize SpO2 if fractional (e.g., 0.97 -> 97)
  const round1 = (n: number) => Math.round((Number(n) || 0) * 10) / 10;
  const normalizeSpo2 = (n: number) => {
    const v = Number(n) || 0;
    return v > 0 && v <= 1 ? v * 100 : v;
  };

  // Load core dashboard data (athletes + biometrics)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const dashboard = await dataService.getData(true);
        if (!mounted) return;

        setAthletes(dashboard.athletes || []);
        setBiometricData(dashboard.biometricData || []);
      } catch (err) {
        console.error('Failed to load team comparison data', err);
        if (mounted) setError('Failed to load team data');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Load injuries once (we will filter client-side by selected athletes)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setInjuriesLoading(true);
        const res = await injuryService.getInjuries({ page: 1, limit: 2000 });
        if (!mounted) return;
        setInjuries(res.items || []);
      } catch (err) {
        console.warn('Failed to load injuries, continuing with empty list');
        if (mounted) setInjuries([]);
      } finally {
        if (mounted) setInjuriesLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Helpful maps
  const nameByUnionId = useMemo(() => {
    const map: Record<string, string> = {};
    for (const a of athletes) {
      if (a.athlete_id) map[a.athlete_id] = a.name || `Athlete ${a.athlete_id}`;
    }
    return map;
  }, [athletes]);

  const dbIdByUnionId = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of athletes) {
      if (a.athlete_id && typeof a.id === 'number') {
        map[a.athlete_id] = a.id;
      }
    }
    return map;
  }, [athletes]);

  // Map latest SpO2 reported on athlete record (fallback), normalized
  const latestSpo2ByUnion = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of athletes) {
      if (!a.athlete_id) continue;
      const raw = Number(a.latestSpO2 ?? 0);
      map[a.athlete_id] = raw > 0 && raw <= 1 ? raw * 100 : raw;
    }
    return map;
  }, [athletes]);

  // Latest biometric per athlete (by athlete UnionId)
  const latestBiometricByUnion: Record<string, BiometricData | undefined> = useMemo(() => {
    const grouped: Record<string, BiometricData[]> = {};
    for (const d of biometricData) {
      const key = d.athlete_id || '';
      if (!key) continue;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(d);
    }
    const out: Record<string, BiometricData | undefined> = {};
    for (const [k, arr] of Object.entries(grouped)) {
      const sorted = arr
        .slice()
        .sort((a, b) => {
          const da = new Date(a.date || '').getTime();
          const db = new Date(b.date || '').getTime();
          return da - db;
        });
      out[k] = sorted[sorted.length - 1];
    }
    return out;
  }, [biometricData]);

 // Derived sleeping HR per athlete = average HR while asleep over last 7 nights (prefer avg_heart_rate on sleep nights)
 const derivedRhrByUnion: Record<string, number> = useMemo(() => {
   const out: Record<string, number> = {};
   const grouped: Record<string, BiometricData[]> = {};
   for (const d of biometricData) {
     const key = d.athlete_id || '';
     if (!key) continue;
     if (!grouped[key]) grouped[key] = [];
     grouped[key].push(d);
   }

   for (const [uid, arr] of Object.entries(grouped)) {
     const nightsWithAvg = arr
       .filter(x => (x.sleep_duration_h ?? 0) > 0 && (x.avg_heart_rate ?? 0) > 0)
       .sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime())
       .slice(0, 7);
     if (nightsWithAvg.length > 0) {
       const avg = nightsWithAvg.reduce((s, x) => s + (x.avg_heart_rate || 0), 0) / nightsWithAvg.length;
       out[uid] = avg;
       continue;
     }

     const nightsWithRhr = arr
       .filter(x => (x.sleep_duration_h ?? 0) > 0 && (x.resting_hr ?? 0) > 0)
       .sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime())
       .slice(0, 7);
     if (nightsWithRhr.length > 0) {
       const avg = nightsWithRhr.reduce((s, x) => s + (x.resting_hr || 0), 0) / nightsWithRhr.length;
       out[uid] = avg;
       continue;
     }

     // Fallback to latest resting_hr if no sleep nights present
     const latest = arr
       .slice()
       .sort((a, b) => new Date(a.date || '').getTime() - new Date(b.date || '').getTime())
       .pop();
     out[uid] = latest?.resting_hr || 0;
   }

   return out;
 }, [biometricData]);

 // Fetch composite training load from STATSports for selected athletes (aligns with Drills/Training Load tabs)
 useEffect(() => {
   const toFetch = selectedUnionIds
     .map(uid => dbIdByUnionId[uid])
     .filter((id): id is number => typeof id === 'number')
     .filter(id => compositeLoadByAthleteId[id] === undefined);

   if (toFetch.length === 0) return;

   let cancelled = false;
   (async () => {
     const entries = await Promise.all(
       toFetch.map(async (id) => {
         try {
           let resp: any = await apiGet<any>(`/athletes/${id}/training-load`, { days: 7, includeZeros: true });
           if (resp && typeof resp === 'object' && Array.isArray(resp.$values)) resp = resp.$values;
           const arr: any[] = Array.isArray(resp) ? resp : [];
           const lastWithLoad = [...arr].reverse().find(d => Number(d?.load ?? d?.compositeLoad) > 0);
           const loadVal = lastWithLoad ? Number(lastWithLoad.load ?? lastWithLoad.compositeLoad) : 0;
           return [id, loadVal] as const;
         } catch {
           return [id, 0] as const;
         }
       })
     );
     if (cancelled) return;
     setCompositeLoadByAthleteId(prev => {
       const next = { ...prev };
       entries.forEach(([id, load]) => { next[id] = load; });
       return next;
     });
   })();

   return () => { cancelled = true; };
 }, [selectedUnionIds, dbIdByUnionId, compositeLoadByAthleteId]);

 // Derived SpO2 per athlete (normalize fractional values; average last 7 non-zero)
 const derivedSpo2ByUnion: Record<string, number> = useMemo(() => {
   const out: Record<string, number> = {};
   const grouped: Record<string, BiometricData[]> = {};
   for (const d of biometricData) {
     const key = d.athlete_id || '';
     if (!key) continue;
     if (!grouped[key]) grouped[key] = [];
     grouped[key].push(d);
   }
   for (const [uid, arr] of Object.entries(grouped)) {
     const sorted = arr
       .slice()
       .sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime());
     const candidates = sorted
       .map((x: any) => normalizeSpo2(Number(x?.spo2_night ?? x?.SpO2 ?? x?.SPO2 ?? x?.SpO2Night ?? x?.Spo2Night ?? 0)))
       .filter((v: number) => Number(v) > 0);
     if (candidates.length > 0) {
       const recent = candidates.slice(0, 7);
       const avg = recent.reduce((s, v) => s + v, 0) / recent.length;
       out[uid] = avg;
     } else {
       out[uid] = 0;
     }
     // Fallback: use athlete.latestSpO2 if biometrics had no values
     if ((!out[uid] || out[uid] === 0) && latestSpo2ByUnion[uid] && latestSpo2ByUnion[uid] > 0) {
       out[uid] = latestSpo2ByUnion[uid];
     }
   }
   return out;
 }, [biometricData, latestSpo2ByUnion]);


  // Selection toggling
  const toggleSelection = (unionId: string) => {
    setSelectedUnionIds((prev) =>
      prev.includes(unionId) ? prev.filter((x) => x !== unionId) : [...prev, unionId]
    );
  };

  // Selected athletes present in our data
  const selectedWithData = useMemo(() => {
    return selectedUnionIds
      .map((uid) => ({
        unionId: uid,
        dbId: dbIdByUnionId[uid],
        name: nameByUnionId[uid] || uid,
        latest: latestBiometricByUnion[uid],
      }))
      .filter((x) => !!x);
  }, [selectedUnionIds, dbIdByUnionId, nameByUnionId, latestBiometricByUnion]);

  // Coach view chart data builder
  const coachChartData = useMemo(() => {
    return selectedWithData.map((a) => {
      const latest = a.latest;
      let value = 0;
      let label = 'Metric';

      switch (metric) {
        case 'readiness':
          value = latest ? calculateReadinessScore(latest) : 0;
          label = 'Readiness Score';
          break;
        case 'trainingLoad': {
          const comp = a.dbId ? compositeLoadByAthleteId[a.dbId] : undefined;
          value = typeof comp === 'number' ? comp : (latest?.training_load_pct || 0);
          label = 'Training Load';
          break;
        }
        case 'hrv':
          value = latest?.hrv_night || 0;
          label = 'HRV (ms)';
          break;
        case 'restingHr':
          value = (derivedRhrByUnion[a.unionId] ?? latest?.resting_hr ?? 0);
          label = 'Resting HR (bpm)';
          break;
        case 'sleep':
          value = latest?.sleep_duration_h || 0;
          label = 'Sleep (h)';
          break;
        case 'spo2':
          value = (derivedSpo2ByUnion[a.unionId] ?? latest?.spo2_night ?? 0);
          label = 'SpO2 (%)';
          break;
        default:
          value = latest ? calculateReadinessScore(latest) : 0;
          label = 'Readiness Score';
      }

      // Normalize and round values for chart display
      if (metric === 'sleep') {
        value = round1(Number(value) || 0);
      } else if (metric === 'spo2') {
        value = Math.ceil(normalizeSpo2(Number(value) || 0));
      } else {
        value = Math.ceil(Number(value) || 0);
      }
 
      return {
        name: a.name,
        value,
        label,
      };
    });
  }, [selectedWithData, metric, compositeLoadByAthleteId]);

  // Physio table data
  const physioRows = useMemo(() => {
    // Build a map of injuries by athleteId (DB numeric ID)
    const byAthlete: Record<number, NormalizedInjury[]> = {};
    for (const inj of injuries) {
      const aid = Number(inj.athleteId);
      if (!aid) continue;
      if (!byAthlete[aid]) byAthlete[aid] = [];
      byAthlete[aid].push(inj);
    }
    // For each selected athlete, get the most recent open injury if available, otherwise the most recent overall
    return selectedWithData.map((a) => {
      const dbId = a.dbId;
      const name = a.name;
      const latest = a.latest;

      let injury: NormalizedInjury | undefined;
      if (dbId && byAthlete[dbId] && byAthlete[dbId].length) {
        const list = byAthlete[dbId].slice().sort((x, y) => {
          const dx = new Date(x.updatedAt || x.dateOfInjury || '').getTime();
          const dy = new Date(y.updatedAt || y.dateOfInjury || '').getTime();
          return dy - dx;
        });
        injury = list.find((i) => (i.status || 'Open').toLowerCase() === 'open') || list[0];
      }

      const readiness = latest ? Math.round(calculateReadinessScore(latest)) : 0;
      const hrv = latest?.hrv_night ?? 0;
      const rhr = latest?.resting_hr ?? 0;
      const sleepH = latest?.sleep_duration_h ?? 0;

      return {
        name,
        readiness,
        hrv,
        rhr,
        sleepH,
        injury,
      };
    });
  }, [selectedWithData, injuries]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="card-enhanced p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading team comparison...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="card-enhanced p-6">
          <div className="text-center py-10">
            <div className="text-red-500 text-3xl mb-2">⚠️</div>
            <p className="text-gray-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="card-enhanced p-6">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Team Comparison</h2>
            <p className="text-gray-600">Compare multiple athletes with role-specific insights</p>
          </div>

          <div className="inline-flex rounded-full bg-gray-100 p-1">
            <button
              onClick={() => setView('coach')}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${view === 'coach' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
            >
              Coach View
            </button>
            <button
              onClick={() => setView('physio')}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${view === 'physio' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
            >
              Physio View
            </button>
          </div>
        </div>

        {/* Athlete selection */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Athletes</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {athletes.map((a) => {
              const uid = a.athlete_id || '';
              const selected = selectedUnionIds.includes(uid);
              const latest = latestBiometricByUnion[uid];
              const readiness = latest ? Math.round(calculateReadinessScore(latest)) : 0;
              return (
                <div
                  key={uid}
                  onClick={() => uid && toggleSelection(uid)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className="font-medium text-sm text-gray-900 truncate">{a.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{readiness}% ready</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* View content */}
        {selectedWithData.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-2">👥</div>
            <p className="text-gray-700">Choose athletes above to start comparing</p>
          </div>
        ) : view === 'coach' ? (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Metric</h3>
              <div className="flex flex-wrap gap-2">
                {metricOptions.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMetric(m.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${metric === m.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="card-enhanced p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {(coachChartData[0]?.label ?? 'Metric')} Comparison
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={coachChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#2563eb" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card-enhanced p-5 overflow-x-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Metrics</h3>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Athlete</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Readiness</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Training Load</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">HRV</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Resting HR</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Sleep (h)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">SpO2</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 text-black">
                  {selectedWithData.map((a) => {
                    const latest = a.latest;
                    const readiness = latest ? Math.round(calculateReadinessScore(latest)) : 0;
                    const loadVal = (a.dbId && compositeLoadByAthleteId[a.dbId] !== undefined)
                      ? Number(compositeLoadByAthleteId[a.dbId])
                      : Number(latest?.training_load_pct ?? 0);
                    const hrv = latest?.hrv_night ?? 0;
                    const rhr = (derivedRhrByUnion[a.unionId] ?? latest?.resting_hr ?? 0);
                    const sleepH = latest?.sleep_duration_h ?? 0;
                    const spo2 = (derivedSpo2ByUnion[a.unionId] ?? latest?.spo2_night ?? 0);

                    return (
                      <tr key={a.unionId}>
                        <td className="px-6 py-4 whitespace-nowrap">{a.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{Math.ceil(readiness)}%</td>
                        <td className="px-6 py-4 whitespace-nowrap">{Math.ceil(Number(loadVal))}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{Math.ceil(hrv)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{Math.ceil(rhr)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{round1(sleepH).toFixed(1)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{Math.ceil(normalizeSpo2(spo2))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="card-enhanced p-5 overflow-x-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Injury and Recovery Overview</h3>
                {injuriesLoading && (
                  <div className="text-sm text-gray-500">Loading injuries…</div>
                )}
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Athlete</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Diagnosis</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Severity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">HIA/Concussion</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">RTP Stage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Planned Return</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Readiness</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">HRV</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Resting HR</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Sleep (h)</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 text-black">
                  {physioRows.map((row) => {
                    const hia =
                      row.injury?.hIAFlag || row.injury?.isConcussion
                        ? 'Yes'
                        : 'No';
                    return (
                      <tr key={row.name}>
                        <td className="px-6 py-3 whitespace-nowrap">{row.name}</td>
                        <td className="px-6 py-3 whitespace-nowrap">{row.injury?.diagnosis || '-'}</td>
                        <td className="px-6 py-3 whitespace-nowrap">{row.injury?.severity || '-'}</td>
                        <td className="px-6 py-3 whitespace-nowrap">{hia}</td>
                        <td className="px-6 py-3 whitespace-nowrap">{row.injury?.rTPStage || row.injury?.concussionStage || '-'}</td>
                        <td className="px-6 py-3 whitespace-nowrap">{row.injury?.status || '-'}</td>
                        <td className="px-6 py-3 whitespace-nowrap">{row.injury?.returnDatePlanned || '-'}</td>
                        <td className="px-6 py-3 whitespace-nowrap">{Math.ceil(row.readiness)}%</td>
                        <td className="px-6 py-3 whitespace-nowrap">{Math.ceil(row.hrv)}</td>
                        <td className="px-6 py-3 whitespace-nowrap">{Math.ceil(row.rhr)}</td>
                        <td className="px-6 py-3 whitespace-nowrap">{round1(row.sleepH).toFixed(1)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamComparison;