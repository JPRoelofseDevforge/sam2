
import React, { useEffect, useMemo, useState } from 'react';
import { Athlete, BiometricData, CalendarEvent, AthleteNote } from '../types';
import {
  athleteService,
  athleteNotesService,
  biometricDataService,
  eventService,
  injuryService,
} from '../services/dataService';
import { useNavigate } from 'react-router-dom';

// Local Injury type aligned with normalizeInjury() in dataService
type Injury = {
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
  hIAFlagAlt?: boolean;
  concussionStage?: string;
  rTPStage?: string;
  status: string;
  returnDatePlanned?: string;
  returnDateActual?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
};

// Threshold constants (rugby-ready default)
const HRV_DROP_PCT = 0.15;     // ≥15%
const RHR_DELTA = 5;           // +5 bpm
const LOAD_SPIKE_PCT = 0.30;   // ≥30%
const SLEEP_MIN_HOURS = 6;     // <6h flags
const RECENT_WINDOW_HOURS = 48;

const pad2 = (n: number) => String(n).padStart(2, '0');
const toYMD = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const parseYMD = (s?: string) => (s ? new Date(s) : undefined);

const startOfLocalDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const endOfLocalDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

const hoursAgo = (h: number) => {
  const d = new Date();
  d.setHours(d.getHours() - h);
  return d;
};

const inLastHours = (iso?: string, hours: number = RECENT_WINDOW_HOURS) => {
  if (!iso) return false;
  const t = new Date(iso);
  if (isNaN(t.getTime())) return false;
  return t.getTime() >= hoursAgo(hours).getTime();
};

const fmt = (s?: string | number | boolean | null) => {
  if (s === null || s === undefined) return '';
  if (typeof s === 'boolean') return s ? 'Yes' : 'No';
  return String(s);
};

const badge = (text: string, cls: string) => (
  <span className={`px-2 py-1 rounded-full text-xs font-medium ${cls}`}>{text}</span>
);

const severityBadgeClass = (sev?: string) => {
  switch (sev) {
    case 'Severe':
      return 'bg-red-100 text-red-800';
    case 'Moderate':
      return 'bg-yellow-100 text-yellow-800';
    case 'Minor':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

type Availability = 'Healthy' | 'Modified' | 'Out';

const getAvailability = (injuries: Injury[]): Availability => {
  if (!injuries || injuries.length === 0) return 'Healthy';

  // Out rules
  const anyHia = injuries.some((i) => i.hIAFlag || i.hIAFlagAlt || i.isConcussion);
  const anyOffField = injuries.some((i) => (i.rTPStage || '').toLowerCase() === 'offfield');
  const anySevere = injuries.some((i) => (i.severity || '').toLowerCase() === 'severe');

  if (anyHia || anyOffField || anySevere) return 'Out';

  // Modified rules
  const anyModified =
    injuries.some((i) => {
      const r = (i.rTPStage || '').toLowerCase();
      return r === 'modified' || r === 'non-contact' || r === 'noncontact' || r === 'non_contact';
    }) || injuries.some((i) => (i.severity || '').toLowerCase() === 'moderate');

  if (anyModified) return 'Modified';

  return 'Healthy';
};

// Very simple unit mapper placeholder (Forwards/Backs); extend with your real mapping if available.
const getUnit = (_athlete: Athlete): 'Forwards' | 'Backs' | 'Team' => {
  // Without a position field, default to Team. Replace with real mapping if you have positions.
  return 'Team';
};

type BioFlags = {
  hrvDrop: boolean;
  rhrRise: boolean;
  loadSpike: boolean;
  lowSleep: boolean;
  latest?: {
    hrv?: number;
    rhr?: number;
    load?: number;
    sleep?: number;
    date?: string;
  };
  baselines?: {
    hrvMean7?: number;
    rhrMean7?: number;
    loadMean7?: number;
    sleepMean7?: number;
  };
};

function computeBiometricFlags(history: BiometricData[]): BioFlags {
  // Expect dates as YYYY-MM-DD; sort ascending
  const data = [...history].filter(d => d.date).sort((a, b) => a.date.localeCompare(b.date));
  if (data.length === 0) return { hrvDrop: false, rhrRise: false, loadSpike: false, lowSleep: false };

  const latest = data[data.length - 1];
  // 7-day mean excluding latest
  const prev7 = data.slice(0, Math.max(0, data.length - 1)).slice(-7);

  const mean = (arr: number[]) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0);

  const hrvMean7 = mean(prev7.map(d => Number(d.hrv_night || 0)));
  const rhrMean7 = mean(prev7.map(d => Number(d.resting_hr || 0)));
  const loadMean7 = mean(prev7.map(d => Number(d.training_load_pct || 0)));
  const sleepMean7 = mean(prev7.map(d => Number(d.sleep_duration_h || 0)));

  const latestHrv = Number(latest.hrv_night || 0);
  const latestRhr = Number(latest.resting_hr || 0);
  const latestLoad = Number(latest.training_load_pct || 0);
  const latestSleep = Number(latest.sleep_duration_h || 0);

  const hrvDrop = hrvMean7 > 0 ? (hrvMean7 - latestHrv) / hrvMean7 >= HRV_DROP_PCT : false;
  const rhrRise = rhrMean7 > 0 ? (latestRhr - rhrMean7) >= RHR_DELTA : false;
  const loadSpike = loadMean7 > 0 ? (latestLoad - loadMean7) / loadMean7 >= LOAD_SPIKE_PCT : false;
  const lowSleep = latestSleep > 0 ? latestSleep < SLEEP_MIN_HOURS : false;

  return {
    hrvDrop,
    rhrRise,
    loadSpike,
    lowSleep,
    latest: {
      hrv: latestHrv || undefined,
      rhr: latestRhr || undefined,
      load: latestLoad || undefined,
      sleep: latestSleep || undefined,
      date: latest.date,
    },
    baselines: {
      hrvMean7: hrvMean7 || undefined,
      rhrMean7: rhrMean7 || undefined,
      loadMean7: loadMean7 || undefined,
      sleepMean7: sleepMean7 || undefined,
    }
  };
}

function computeRiskScore(injuries: Injury[], bio: BioFlags, notesNegCountRecent: number): number {
  let score = 0;

  // Concussion/HIA
  if (injuries.some(i => i.hIAFlag || i.hIAFlagAlt || i.isConcussion)) score += 40;

  // Injury severity
  for (const i of injuries) {
    const sev = (i.severity || '').toLowerCase();
    if (sev === 'severe') score += 40;
    else if (sev === 'moderate') score += 20;
    else if (sev === 'minor') score += 10;
  }

  // RTP
  for (const i of injuries) {
    const r = (i.rTPStage || '').toLowerCase();
    if (r === 'offfield') score += 30;
    else if (r === 'modified') score += 20;
    else if (r === 'non-contact' || r === 'noncontact' || r === 'non_contact') score += 10;
    else if (r === 'contact') score += 5;
  }

  // Negative notes (cap at +20)
  score += Math.min(20, notesNegCountRecent * 10);

  // Biometrics
  if (bio.hrvDrop) score += 15;
  if (bio.rhrRise) score += 10;
  if (bio.loadSpike) score += 15;
  if (bio.lowSleep) score += 10;

  return score;
}

const MorningOverview: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [injuriesOpen, setInjuriesOpen] = useState<Injury[]>([]);
  const [injuriesRecent, setInjuriesRecent] = useState<Injury[]>([]);
  const [notesNegativeRecent, setNotesNegativeRecent] = useState<AthleteNote[]>([]);
  const [eventsToday, setEventsToday] = useState<CalendarEvent[]>([]);
  const [biometrics, setBiometrics] = useState<BiometricData[]>([]);

  // Date windows
  const now = new Date();
  const start48h = hoursAgo(RECENT_WINDOW_HOURS);
  const startYMD = toYMD(startOfLocalDay(start48h)); // inclusive start day
  const endYMD = toYMD(endOfLocalDay(now));

  const todayYMD = toYMD(now);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        // Athletes
        const aRes = await athleteService.getAllAthletes(1, 2000);
        const a = aRes?.athletes || [];

        // Injuries - open
        const injOpenRes = await injuryService.getInjuries({ status: 'Open', page: 1, limit: 500 });

        // Injuries - recent (start/end by date)
        const injRecentRes = await injuryService.getInjuries({
          startDate: startYMD,
          endDate: endYMD,
          page: 1,
          limit: 500,
        });

        // Notes - negative in last 48h
        const notesRes = await athleteNotesService.list({
          category: 'Negative',
          start: startYMD,
          end: endYMD,
          page: 1,
          limit: 500,
        });

        // Events - today only
        const evRes = await eventService.getEvents({
          start: todayYMD,
          end: todayYMD,
          page: 1,
          limit: 500,
        });

        // Biometrics - last ~8 days for all athletes
        const bioStart = toYMD(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 8));
        const bioRes = await biometricDataService.getAllAthletesBiometricData(bioStart, todayYMD, 1, 1000);

        if (!mounted) return;
        setAthletes(a);
        setInjuriesOpen((injOpenRes.items || []) as Injury[]);
        setInjuriesRecent((injRecentRes.items || []) as Injury[]);
        setNotesNegativeRecent((notesRes.items || []) as AthleteNote[]);
        setEventsToday((evRes.items || []) as CalendarEvent[]);
        setBiometrics(Array.isArray(bioRes) ? bioRes : []);
      } catch {
        if (!mounted) return;
        setAthletes([]);
        setInjuriesOpen([]);
        setInjuriesRecent([]);
        setNotesNegativeRecent([]);
        setEventsToday([]);
        setBiometrics([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const athleteById = useMemo(() => {
    const m = new Map<number, Athlete>();
    for (const a of athletes) m.set(a.id, a);
    return m;
  }, [athletes]);

  const numericIdByUnionId = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of athletes) {
      if (a.athlete_id) m.set(a.athlete_id, a.id);
    }
    return m;
  }, [athletes]);

  // Group biometrics per numeric athlete id
  const biometricsByAthleteId = useMemo(() => {
    const m = new Map<number, BiometricData[]>();
    for (const b of biometrics) {
      const n = numericIdByUnionId.get(String(b.athlete_id || ''));
      if (!n) continue;
      if (!m.has(n)) m.set(n, []);
      m.get(n)!.push(b);
    }
    return m;
  }, [biometrics, numericIdByUnionId]);

  // Group open injuries per athlete
  const openInjuriesByAthlete = useMemo(() => {
    const m = new Map<number, Injury[]>();
    for (const i of injuriesOpen) {
      if (!m.has(i.athleteId)) m.set(i.athleteId, []);
      m.get(i.athleteId)!.push(i);
    }
    return m;
  }, [injuriesOpen]);

  // Negative notes count in window per athlete
  const negNotesCountByAthlete = useMemo(() => {
    const m = new Map<number, number>();
    for (const n of notesNegativeRecent) {
      const id = n.athleteId;
      m.set(id, (m.get(id) || 0) + 1);
    }
    return m;
  }, [notesNegativeRecent]);

  // KPI computations
  const kpis = useMemo(() => {
    // Active injuries by severity
    const sevCounts = { Minor: 0, Moderate: 0, Severe: 0, Unknown: 0 };
    for (const i of injuriesOpen) {
      const s = (i.severity || 'Unknown') as keyof typeof sevCounts;
      if (sevCounts[s] !== undefined) sevCounts[s]++;
      else sevCounts.Unknown++;
    }
    // Concussions/HIA (and by stage)
    let concussionCount = 0;
    const hiaStageCounts = new Map<string, number>();
    for (const i of injuriesOpen) {
      const hia = i.isConcussion || i.hIAFlag || i.hIAFlagAlt;
      if (hia) {
        concussionCount++;
        const stage = (i.concussionStage || 'Unknown').trim();
        hiaStageCounts.set(stage, (hiaStageCounts.get(stage) || 0) + 1);
      }
    }
    // RTP pipeline
    const rtpCounts = new Map<string, number>();
    for (const i of injuriesOpen) {
      const r = (i.rTPStage || 'Unknown').trim();
      rtpCounts.set(r, (rtpCounts.get(r) || 0) + 1);
    }
    // Availability totals
    let healthy = 0, modified = 0, out = 0;
    for (const a of athletes) {
      const al = getAvailability(openInjuriesByAthlete.get(a.id) || []);
      if (al === 'Healthy') healthy++;
      else if (al === 'Modified') modified++;
      else out++;
    }
    return { sevCounts, concussionCount, hiaStageCounts, rtpCounts, healthy, modified, out };
  }, [injuriesOpen, athletes, openInjuriesByAthlete]);

  // Alerts (injury updates, negative notes, biometrics anomalies)
  type AlertItem = {
    type: 'Injury' | 'Note' | 'Biometric';
    athleteId?: number;
    title: string;
    detail?: string;
    when?: string;
    badgeColor?: string;
  };

  const biometricAlerts: AlertItem[] = useMemo(() => {
    const alerts: AlertItem[] = [];
    for (const a of athletes) {
      const history = biometricsByAthleteId.get(a.id) || [];
      if (history.length < 2) continue; // need some baseline
      const flags = computeBiometricFlags(history);
      if (flags.hrvDrop || flags.rhrRise || flags.loadSpike || flags.lowSleep) {
        const issues: string[] = [];
        if (flags.hrvDrop) issues.push('HRV drop');
        if (flags.rhrRise) issues.push('RHR rise');
        if (flags.loadSpike) issues.push('Load spike');
        if (flags.lowSleep) issues.push('Low sleep');
        alerts.push({
          type: 'Biometric',
          athleteId: a.id,
          title: `${a.name}`,
          detail: issues.join(' • '),
          when: flags.latest?.date,
          badgeColor: 'bg-indigo-100 text-indigo-800',
        });
      }
    }
    return alerts;
  }, [athletes, biometricsByAthleteId]);

  const injuryAlerts: AlertItem[] = useMemo(() => {
    const items: AlertItem[] = [];
    for (const i of injuriesRecent) {
      const isRecent = inLastHours(i.createdAt, RECENT_WINDOW_HOURS) || inLastHours(i.updatedAt, RECENT_WINDOW_HOURS);
      if (!isRecent) continue;
      const a = athleteById.get(i.athleteId);
      const changes: string[] = [];
      if (i.hIAFlag || i.hIAFlagAlt || i.isConcussion) {
        changes.push('HIA/Concussion');
        if (i.concussionStage) changes.push(`Stage ${i.concussionStage}`);
      }
      if (i.rTPStage) changes.push(`RTP ${i.rTPStage}`);
      if (i.severity) changes.push(`Severity ${i.severity}`);
      items.push({
        type: 'Injury',
        athleteId: i.athleteId,
        title: `${a?.name || `Athlete ${i.athleteId}`}: ${i.diagnosis}`,
        detail: changes.join(' • '),
        when: i.updatedAt || i.createdAt,
        badgeColor: 'bg-amber-100 text-amber-800',
      });
    }
    return items;
  }, [injuriesRecent, athleteById]);

  const noteAlerts: AlertItem[] = useMemo(() => {
    const items: AlertItem[] = [];
    for (const n of notesNegativeRecent) {
      const a = athleteById.get(n.athleteId);
      items.push({
        type: 'Note',
        athleteId: n.athleteId,
        title: `${a?.name || `Athlete ${n.athleteId}`}: Negative note`,
        detail: (n.title ? `${n.title} — ` : '') + (n.content || ''),
        when: n.createdAt,
        badgeColor: 'bg-rose-100 text-rose-800',
      });
    }
    return items;
  }, [notesNegativeRecent, athleteById]);

  const alerts = useMemo<AlertItem[]>(() => {
    // Merge and limit to a reasonable number (e.g., 12)
    const merged = [...injuryAlerts, ...noteAlerts, ...biometricAlerts];
    // Sort recent first
    merged.sort((a, b) => {
      const ta = a.when ? new Date(a.when).getTime() : 0;
      const tb = b.when ? new Date(b.when).getTime() : 0;
      return tb - ta;
    });
    return merged.slice(0, 12);
  }, [injuryAlerts, noteAlerts, biometricAlerts]);

  // Risk list
  const topRisk = useMemo(() => {
    const items: Array<{
      athlete: Athlete;
      score: number;
      reasons: string[];
    }> = [];
  
    for (const a of athletes) {
      const inj = openInjuriesByAthlete.get(a.id) || [];
      const bioFlags = computeBiometricFlags(biometricsByAthleteId.get(a.id) || []);
      const negCount = negNotesCountByAthlete.get(a.id) || 0;
      const score = computeRiskScore(inj, bioFlags, negCount);
      if (score <= 0) continue;
  
      const reasons: string[] = [];
      if (inj.some(i => i.hIAFlag || i.hIAFlagAlt || i.isConcussion)) reasons.push('HIA/Concussion');
      const sevSet = new Set(inj.map(i => (i.severity || '').toLowerCase()).filter(Boolean));
      if (sevSet.has('severe')) reasons.push('Severe injury');
      else if (sevSet.has('moderate')) reasons.push('Moderate injury');
      else if (sevSet.has('minor')) reasons.push('Minor injury');
      const rtpStages = Array.from(new Set(inj.map(i => (i.rTPStage || '').trim()).filter(Boolean)));
      if (rtpStages.length) reasons.push(`RTP: ${rtpStages.join(', ')}`);
      if (negCount > 0) reasons.push(`Negative notes: ${negCount}`);
      if (bioFlags.hrvDrop) reasons.push('HRV drop');
      if (bioFlags.rhrRise) reasons.push('RHR rise');
      if (bioFlags.loadSpike) reasons.push('Load spike');
      if (bioFlags.lowSleep) reasons.push('Low sleep');
  
      items.push({ athlete: a, score, reasons });
    }
  
    items.sort((a, b) => b.score - a.score);
    return items.slice(0, 5);
  }, [athletes, openInjuriesByAthlete, biometricsByAthleteId, negNotesCountByAthlete]);
  
  // Derived render helpers
  const hiaStagesList = useMemo(() => {
    const list: Array<{ stage: string; count: number }> = [];
    kpis.hiaStageCounts.forEach((count, stage) => list.push({ stage, count }));
    list.sort((a, b) => b.count - a.count);
    return list.slice(0, 6);
  }, [kpis.hiaStageCounts]);
  
  const rtpStageList = useMemo(() => {
    const list: Array<{ stage: string; count: number }> = [];
    kpis.rtpCounts.forEach((count, stage) => list.push({ stage, count }));
    list.sort((a, b) => b.count - a.count);
    return list.slice(0, 6);
  }, [kpis.rtpCounts]);
  
  const severityTotals = kpis.sevCounts;
  
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="card-enhanced p-6">
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-400">Loading morning overview...</span>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-enhanced p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-black">☀️ Morning Overview</h2>
            <p className="text-sm text-gray-700 mt-1">48h scan for HPC and Physio: injuries, HIA, RTP, availability, alerts, and today’s schedule.</p>
          </div>
        </div>
      </div>
  
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-enhanced p-6">
          <div className="text-sm font-medium text-gray-700 mb-2">Active Injuries</div>
          <div className="text-3xl font-bold text-gray-900">{injuriesOpen.length}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {severityTotals.Severe ? badge(`Severe ${severityTotals.Severe}`, 'bg-red-100 text-red-800') : null}
            {severityTotals.Moderate ? badge(`Moderate ${severityTotals.Moderate}`, 'bg-yellow-100 text-yellow-800') : null}
            {severityTotals.Minor ? badge(`Minor ${severityTotals.Minor}`, 'bg-green-100 text-green-800') : null}
            {severityTotals.Unknown ? badge(`Unknown ${severityTotals.Unknown}`, 'bg-gray-100 text-gray-800') : null}
          </div>
        </div>
  
        <div className="card-enhanced p-6">
          <div className="text-sm font-medium text-gray-700 mb-2">Concussions / HIA</div>
          <div className="text-3xl font-bold text-gray-900">{kpis.concussionCount}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {hiaStagesList.map(s => (
              <span key={s.stage} className="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800">
                {s.stage}: {s.count}
              </span>
            ))}
          </div>
        </div>
  
        <div className="card-enhanced p-6">
          <div className="text-sm font-medium text-gray-700 mb-2">RTP Pipeline</div>
          <div className="text-3xl font-bold text-gray-900">{injuriesOpen.length}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {rtpStageList.map(s => (
              <span key={s.stage} className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                {s.stage || 'Unknown'}: {s.count}
              </span>
            ))}
          </div>
        </div>
  
        <div className="card-enhanced p-6">
          <div className="text-sm font-medium text-gray-700 mb-2">Availability Today</div>
          <div className="text-3xl font-bold text-gray-900">{athletes.length}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {badge(`Healthy ${kpis.healthy}`, 'bg-emerald-100 text-emerald-800')}
            {badge(`Modified ${kpis.modified}`, 'bg-yellow-100 text-yellow-800')}
            {badge(`Out ${kpis.out}`, 'bg-red-100 text-red-800')}
          </div>
        </div>
      </div>
  
      {/* Alerts + Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-enhanced p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-700">Red-flag Alerts (48h)</div>
            <div className="text-xs text-gray-500">{alerts.length} items</div>
          </div>
          {alerts.length === 0 ? (
            <div className="text-gray-400 text-sm">No alerts in the last 48 hours.</div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {alerts.map((al, idx) => {
                const athlete = al.athleteId ? athleteById.get(al.athleteId) : undefined;
                const typeColor =
                  al.type === 'Injury' ? 'bg-amber-100 text-amber-800' :
                  al.type === 'Note' ? 'bg-rose-100 text-rose-800' :
                  'bg-indigo-100 text-indigo-800';
                return (
                  <li key={idx} className="py-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${typeColor}`}>{al.type}</span>
                        <button
                          className="text-sm text-blue-600 hover:underline truncate"
                          onClick={() => athlete?.id && navigate(`/athlete/${athlete.id}`)}
                          title="Open athlete profile"
                        >
                          {al.title}
                        </button>
                      </div>
                      {al.detail ? <div className="text-xs text-gray-600 mt-1 truncate">{al.detail}</div> : null}
                      {al.when ? <div className="text-[11px] text-gray-400 mt-1">{new Date(al.when).toLocaleString()}</div> : null}
                    </div>
                    <div className="shrink-0">
                      {al.type === 'Injury' ? (
                        <button className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-700 hover:bg-amber-100"
                          onClick={() => navigate('/injuries')}
                        >Injuries</button>
                      ) : al.type === 'Note' ? (
                        <button className="text-xs px-2 py-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100"
                          onClick={() => navigate('/athlete-notes')}
                        >Notes</button>
                      ) : (
                        <button className="text-xs px-2 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                          onClick={() => navigate('/team-comparison')}
                        >Biometrics</button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
  
        <div className="card-enhanced p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-700">Today’s Schedule</div>
            <div className="text-xs text-gray-500">{eventsToday.length} events</div>
          </div>
          {eventsToday.length === 0 ? (
            <div className="text-gray-400 text-sm">No events scheduled for today.</div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {eventsToday.slice(0, 12).map(ev => {
                const a = ev.athleteId ? athleteById.get(ev.athleteId) : undefined;
                const t = (ev.type || 'Other');
                const cls =
                  t === 'Training' ? 'bg-blue-100 text-blue-800' :
                  t === 'Travel' ? 'bg-amber-100 text-amber-800' :
                  t === 'Meeting' ? 'bg-emerald-100 text-emerald-800' :
                  t === 'Competition' ? 'bg-rose-100 text-rose-800' :
                  'bg-gray-100 text-gray-800';
                const timeRange = (() => {
                  const s = ev.startUtc ? new Date(ev.startUtc) : null;
                  const e = ev.endUtc ? new Date(ev.endUtc) : null;
                  if (!s) return '';
                  const fmt = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  return `${fmt(s)}${e ? ' - ' + fmt(e) : ''}`;
                })();
                return (
                  <li key={ev.id} className="py-3 flex items-start gap-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${cls}`}>{t}</span>
                    <div className="min-w-0">
                      <div className="text-sm text-gray-900 font-medium truncate">{ev.title}</div>
                      <div className="text-xs text-gray-600 truncate">
                        {timeRange} {ev.location ? `• ${ev.location}` : ''} {a ? `• ${a.name}` : '• Team/Global'}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
  
      {/* Injuries + Top Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card-enhanced p-6 lg:col-span-2">
          <div className="mb-4 text-sm font-medium text-gray-700">Active Injuries</div>
          {injuriesOpen.length === 0 ? (
            <div className="text-gray-400 text-sm">No active injuries.</div>
          ) : (
            <div className="w-full overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-[900px] w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left">
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Athlete</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Diagnosis</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">HIA</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">RTP</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {injuriesOpen.map(i => {
                    const a = athleteById.get(i.athleteId);
                    const hia =
                      (i.hIAFlag || i.hIAFlagAlt) ? 'HIA' : (i.isConcussion ? 'Concussion' : 'No');
                    return (
                      <tr key={i.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <button className="text-blue-600 hover:underline font-medium"
                            onClick={() => navigate(`/athlete/${i.athleteId}`)}
                          >{a?.name || `Athlete ${i.athleteId}`}</button>
                          <div className="text-xs text-gray-500">{a?.sport || 'Rugby'}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-gray-900 font-medium">{i.diagnosis || '-'}</div>
                          {i.notes ? <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">{i.notes}</div> : null}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {badge(i.severity || 'Unknown', severityBadgeClass(i.severity))}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-gray-900 font-medium">{hia}</div>
                          {i.concussionStage ? <div className="text-xs text-gray-500">{i.concussionStage}</div> : null}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-900">{i.rTPStage || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-900">{i.returnDatePlanned || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
  
        <div className="card-enhanced p-6">
          <div className="mb-2 text-sm font-medium text-gray-700">Top 5 Risk Athletes</div>
          {topRisk.length === 0 ? (
            <div className="text-gray-400 text-sm">No risk signals.</div>
          ) : (
            <ul className="space-y-3">
              {topRisk.map(({ athlete, score, reasons }) => (
                <li key={athlete.id} className="p-3 rounded border border-gray-200 bg-white">
                  <div className="flex items-center justify-between">
                    <button className="text-sm text-blue-700 font-medium hover:underline"
                      onClick={() => navigate(`/athlete/${athlete.id}`)}
                    >{athlete.name}</button>
                    <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-800">Score {score}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {reasons.slice(0, 6).map((r, idx) => (
                      <span key={idx} className="px-2 py-1 rounded-full text-[11px] bg-gray-100 text-gray-800">{r}</span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
  
      {/* Negative Notes */}
      <div className="card-enhanced p-6">
        <div className="mb-4 text-sm font-medium text-gray-700">Negative Notes (48h)</div>
        {notesNegativeRecent.length === 0 ? (
          <div className="text-gray-400 text-sm">No negative notes in window.</div>
        ) : (
          <div className="w-full overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-[900px] w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Athlete</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Title / Content</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">When</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {notesNegativeRecent.map(n => {
                  const a = athleteById.get(n.athleteId);
                  return (
                    <tr key={n.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <button className="text-blue-600 hover:underline font-medium"
                          onClick={() => navigate(`/athlete/${n.athleteId}`)}
                        >{a?.name || `Athlete ${n.athleteId}`}</button>
                        <div className="text-xs text-gray-500">{a?.sport || 'Rugby'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-900 font-medium truncate max-w-xs">{n.title || '-'}</div>
                        {n.content ? <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">{n.content}</div> : null}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-900">{n.tags || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-900">
                        {n.createdAt ? new Date(n.createdAt).toLocaleString() : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
  
export { MorningOverview };
export default MorningOverview;