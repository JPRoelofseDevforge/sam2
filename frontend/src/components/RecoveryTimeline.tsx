import React, { useEffect, useMemo, useState } from 'react';
import { apiGet } from '../utils/api';
import { biometricDataService, geneticProfileService } from '../services/dataService';
import type { BiometricData, GeneticProfile } from '../types';
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Area
} from 'recharts';

interface DailyLoad {
  date: string;
  zoneWeightedLoad: number;
  metabolicPowerLoad: number;
  compositeLoad: number;
  zoneWeightedPerMin?: number;
  metabolicPowerPerMin?: number;
  compositePerMin?: number;
}

interface RecoveryPoint {
  date: string;
  load: number;
  recovery: number;
  sleepHours: number;
  hrv: number;
  restingHr: number;
}

interface GeneticsModifiers {
  inflammationSensitive: boolean;
  stressSensitive: boolean;
  circadianSensitive: boolean;
  powerDominant: boolean;
}

interface Props {
  athleteId: string;
}

const clamp = (v:number, min:number, max:number) => Math.max(min, Math.min(max, v));

const toDateKey = (d: string) => {
  // robustly extract YYYY-MM-DD regardless of timezone or existing format
  const dt = new Date(d);
  if (!isNaN(dt.getTime())) {
    return new Date(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate())).toISOString().slice(0, 10);
  }
  // fallback: if it's already a date key, return as-is
  return String(d).slice(0, 10);
};

// Sleep duration helpers (fallback when sleep_duration_h is missing)
function parseTimeToMinutesLocal(time?: string): number | null {
  if (!time || time === '00:00') return null;
  const parts = time.split(':');
  if (parts.length < 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

function computeSleepHoursRecord(b: Partial<BiometricData>): number {
  // accept number or numeric string for sleep_duration_h
  const raw = (b as any)?.sleep_duration_h as unknown;
  let duration = 0;
  if (typeof raw === 'number') {
    duration = raw;
  } else if (typeof raw === 'string') {
    const n = Number(raw);
    if (!isNaN(n) && isFinite(n)) duration = n;
  }
  if (duration && duration > 0) return duration;

  // fallback to onset/wake times if provided
  const start = parseTimeToMinutesLocal((b as any).sleep_onset_time);
  const end = parseTimeToMinutesLocal((b as any).wake_time);
  if (start !== null && end !== null) {
    let minutes = end - start;
    if (minutes < 0) minutes += 24 * 60; // crossed midnight
    return Math.max(0, minutes) / 60;
  }
  return 0;
}

function computeReadiness(b: Partial<BiometricData>): number {
  // Prefer provided recovery score if present (0–100)
  const provided = Number((b as any).recovery_score ?? 0);
  if (provided > 0 && provided <= 100) return Math.round(provided);

  // Compute composite readiness from biometrics
  const hrv = Number(b.hrv_night ?? 0);
  const rhr = Number(b.resting_hr ?? 0);
  const sleepH = Number((b as any).sleep_duration_h ?? 0);
  const spo2 = Number(b.spo2_night ?? 0);
  const deepPct = Number((b as any).deep_sleep_pct ?? 0);
  const remPct = Number((b as any).rem_sleep_pct ?? 0);

  // Factor normalization
  const hrvFactor = hrv > 0 ? clamp((hrv - 35) / (80 - 35), 0, 1) : 0;
  const rhrFactor = rhr > 0 ? clamp((75 - rhr) / (75 - 45), 0, 1) : 0;
  const sleepDurFactor = sleepH > 0 ? clamp((sleepH - 6.0) / (8.0 - 6.0), 0, 1) : 0;
  const spo2Factor = spo2 > 0 ? clamp((spo2 - 94) / (99 - 94), 0, 1) : 0;

  // Incorporate sleep stage quality modestly into the sleep component (keeps total weights constant)
  const deepTarget = 20; // %
  const remTarget = 18;  // %
  const deepFactor = deepPct > 0 ? clamp(deepPct / deepTarget, 0, 1) : 0;
  const remFactor = remPct > 0 ? clamp(remPct / remTarget, 0, 1) : 0;
  const stageComposite = (deepFactor + remFactor) / 2;

  // Sleep composite (70% duration, 30% stage quality)
  const sleepComposite = 0.7 * sleepDurFactor + 0.3 * stageComposite;

  const score =
    hrvFactor * 0.35 +
    rhrFactor * 0.25 +
    sleepComposite * 0.25 +
    spo2Factor * 0.15;

  return Math.round(score * 100);
}

function mean(values:number[]):number { return values.length? values.reduce((a,b)=>a+b,0)/values.length : 0; }
function std(values:number[]):number {
  if(values.length<2) return 0;
  const m=mean(values);
  const v=mean(values.map(x => (x-m)*(x-m)));
  return Math.sqrt(v);
}

function computeACWR(loads:number[]):number {
  const acute = mean(loads.slice(-7));
  const chronic = mean(loads.slice(-28));
  if(chronic <= 0) return 0;
  return acute / chronic;
}

function computeMonotony(loads:number[]):number {
  const last7 = loads.slice(-7);
  const m=mean(last7);
  const s=std(last7);
  if(s === 0) return m>0? 10 : 0;
  return m / s;
}

function computeStrain(loads:number[]):number {
  const last7 = loads.slice(-7);
  const m=mean(last7);
  const mono=computeMonotony(loads);
  return Math.round(m * mono);
}

function extractGeneticsModifiers(genetics: GeneticProfile[]): GeneticsModifiers {
  const dict = Object.fromEntries((genetics||[]).map(g => [String(g.gene).toUpperCase(), String(g.genotype)]));
  const inflammationSensitive = (dict.IL6?.includes('G') && dict.IL6?.includes('G')) || dict.TNF === 'AA' || dict.IL10 === 'CC';
  const stressSensitive = dict.ADRB1 === 'AA' || dict.COMT === 'AA';
  const circadianSensitive = dict.CLOCK === 'AA' || dict.PER3 === 'long';
  const powerDominant = dict.ACTN3 === 'RR';
  return { inflammationSensitive, stressSensitive, circadianSensitive, powerDominant };
}

function adjustRiskThresholds(base:{acwr:number, monotony:number, strain:number}, mods:GeneticsModifiers) {
  let {acwr, monotony, strain} = base;
  if(mods.inflammationSensitive) { acwr -= 0.1; strain -= 500; }
  if(mods.stressSensitive) { monotony -= 0.3; }
  if(mods.circadianSensitive) { /* encourage recovery on low sleep later */ }
  return {acwr, monotony, strain};
}

function planNext3Days(latestRecovery:number, risk:{acwr:number, monotony:number, strain:number}, mods:GeneticsModifiers) {
  const items: Array<{day:string; focus:string; intensity:'Low'|'Moderate'|'High'; notes:string}> = [];
  const today = new Date();
  const thresholds = adjustRiskThresholds({acwr:1.5, monotony:2.0, strain:6000}, mods);
  const highRisk = risk.acwr >= thresholds.acwr || risk.monotony >= thresholds.monotony || risk.strain >= thresholds.strain;
  const lowRecovery = latestRecovery < 60;
  for(let i=1;i<=3;i++){
    const d=new Date(today); d.setDate(d.getDate()+i);
    const dateStr=d.toLocaleDateString();
    if(highRisk || lowRecovery){
      items.push({day:dateStr, focus:'Active Recovery + Skills', intensity:'Low', notes:'Mobility, soft-tissue, passing drills, walkthroughs. Avoid heavy contact.'});
    } else if(latestRecovery < 75){
      items.push({day:dateStr, focus: mods.powerDominant ? 'Speed & Technical' : 'Aerobic Conditioning', intensity:'Moderate', notes: mods.powerDominant ? 'Short sprints, change-of-direction, limited contact' : 'Tempo runs, aerobic intervals'});
    } else {
      items.push({day:dateStr, focus:'Full Rugby Conditioning', intensity:'High', notes:'Game simulation blocks, controlled contact, scrums/lineouts with volume caps'});
    }
  }
  return items;
}

export const RecoveryTimeline: React.FC<Props> = ({ athleteId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  const [loads, setLoads] = useState<DailyLoad[]>([]);
  const [biometrics, setBiometrics] = useState<BiometricData[]>([]);
  const [genetics, setGenetics] = useState<GeneticProfile[]>([]);
  const [range, setRange] = useState<7|14|28>(28);

  useEffect(() => {
    let cancelled=false;
    (async() => {
      try{
        setLoading(true); setError(null);
        // training loads daily - 28 days
        let dl:any = await apiGet<any>(`/athletes/${athleteId}/training-load`, { days: 28, includeZeros: true });
        if(dl && dl.$values) dl = dl.$values;
        const daily:DailyLoad[] = (Array.isArray(dl)? dl: []).map((x:any) => ({
          date: x.date || x.Date,
          zoneWeightedLoad: Number(x.zoneWeightedLoad ?? x.ZoneWeightedLoad ?? 0),
          metabolicPowerLoad: Number(x.metabolicPowerLoad ?? x.MetabolicPowerLoad ?? 0),
          compositeLoad: Number(x.compositeLoad ?? x.CompositeLoad ?? x.load ?? 0),
          zoneWeightedPerMin: Number(x.zoneWeightedPerMin ?? x.ZoneWeightedPerMin ?? 0),
          metabolicPowerPerMin: Number(x.metabolicPowerPerMin ?? x.MetabolicPowerPerMin ?? 0),
          compositePerMin: Number(x.compositePerMin ?? x.CompositePerMin ?? 0)
        }));
        // biometrics - use aggregated wearable endpoint to ensure sleep_duration_h is populated like SleepMetrics
        const b = await biometricDataService.getAllBiometricData(Number(athleteId), undefined, undefined, 1, 200);
        // genetics
        const g = await geneticProfileService.getGeneticProfileByAthlete(Number(athleteId));
        if(!cancelled){ setLoads(daily); setBiometrics(b||[]); setGenetics(g||[]); }
      }catch(e:any){
        if(!cancelled) setError('Failed to load recovery data');
      }finally{
        if(!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled=true; }
  }, [athleteId]);

  const model = useMemo(() => {
    const byDate = new Map<string, DailyLoad>();
    loads.forEach(l => { byDate.set(toDateKey(l.date), l); });

    // Build biometric maps and nearest-day fallback (±1 day tolerance)
    const bioByDate = new Map<string, BiometricData>();
    const bioSorted = [...biometrics].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    bioSorted.forEach(b => bioByDate.set(toDateKey(b.date), b));
    const oneDayMs = 24 * 60 * 60 * 1000;
    function getNearestBio(dateKey:string): BiometricData | undefined {
      if (bioByDate.has(dateKey)) return bioByDate.get(dateKey);
      const target = new Date(dateKey).getTime();
      let best:BiometricData|undefined;
      let bestDiff = Infinity;
      for (const b of bioSorted) {
        const diff = Math.abs(new Date(b.date).getTime() - target);
        if (diff < bestDiff && diff <= oneDayMs) { best = b; bestDiff = diff; }
      }
      return best;
    }

    const points:RecoveryPoint[] = [];
    const allDates = Array.from(new Set([
      ...loads.map(l => toDateKey(l.date)),
      ...biometrics.map(b => toDateKey(b.date))
    ])).sort();

    for (const d of allDates) {
      const l = byDate.get(d);
      const bio = getNearestBio(d);
      const sleepH = bio ? computeSleepHoursRecord(bio) : 0;
      const recovery = bio ? computeReadiness({ ...bio, sleep_duration_h: sleepH }) : 0;

      points.push({
        date: d,
        load: l ? l.compositeLoad : 0,
        recovery,
        sleepHours: sleepH,
        hrv: Number(bio?.hrv_night ?? 0),
        restingHr: Number(bio?.resting_hr ?? 0)
      });
    }

    // select range
    const recent = points.slice(-range);
  
    // Risk metrics computed over the fullest window available
    const acwr = computeACWR(points.map(p => p.load));
    const monotony = computeMonotony(points.map(p => p.load));
    const strain = computeStrain(points.map(p => p.load));
    // Latest readiness: take the most recent non-zero value within the displayed window.
    // This avoids 0 when the latest day has load but no biometrics yet.
    let latestRecovery = 0;
    for (let i = recent.length - 1; i >= 0; i--) {
      const r = Number(recent[i].recovery || 0);
      if (r > 0) { latestRecovery = r; break; }
    }

    const mods = extractGeneticsModifiers(genetics);
    const thresholds = adjustRiskThresholds({ acwr: 1.5, monotony: 2.0, strain: 6000 }, mods);
    const plan = planNext3Days(latestRecovery, { acwr, monotony, strain }, mods);

    const flags: string[] = [];
    if (acwr >= thresholds.acwr) flags.push(`ACWR high (${acwr.toFixed(2)} ≥ ${thresholds.acwr.toFixed(2)})`);
    if (monotony >= thresholds.monotony) flags.push(`Monotony high (${monotony.toFixed(2)} ≥ ${thresholds.monotony.toFixed(2)})`);
    if (strain >= thresholds.strain) flags.push(`Strain high (${strain.toFixed(0)} ≥ ${thresholds.strain.toFixed(0)})`);
    if (latestRecovery < 60) flags.push('Low readiness (<60)');

    return { points: recent, acwr, monotony, strain, latestRecovery, mods, thresholds, plan, flags };
  }, [loads, biometrics, genetics, range]);

  if(loading){
    return <div className="card-enhanced p-6 text-gray-600">Loading recovery timeline...</div>;
  }
  if(error){
    return <div className="card-enhanced p-6 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="card-enhanced p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-black">Recovery Timeline & Coach Planner</h2>
            <p className="text-gray-800">Biometrics + Training Load + Genetics for rugby-specific decision support</p>
          </div>
          <div className="flex gap-2">
            {[7,14,28].map((d)=>(
              <button key={d} onClick={()=>setRange(d as any)}
                className={`px-3 py-1 rounded ${range===d?'bg-purple-700 text-white':'bg-gray-200 text-gray-800'}`}>
                {d}d
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-purple-50 p-4 rounded">
            <div className="text-xs text-gray-600">ACWR (7d/28d)</div>
            <div className="text-2xl font-bold text-purple-700">{model.acwr.toFixed(2)}</div>
            <div className="text-xs text-gray-500">Threshold: {model.thresholds.acwr.toFixed(2)}</div>
            <div className="text-xs text-gray-600 mt-1">
              Acute: avg last 7 days load. Chronic: avg last 28 days load. ACWR = Acute / Chronic. Aim ≈ 0.8–1.3; spikes ({'>'}1.5) increase injury risk.
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded">
            <div className="text-xs text-gray-600">Monotony (7d)</div>
            <div className="text-2xl font-bold text-blue-700">{model.monotony.toFixed(2)}</div>
            <div className="text-xs text-gray-500">Threshold: {model.thresholds.monotony.toFixed(2)}</div>
            <div className="text-xs text-gray-600 mt-1">
              Monotony = Mean(7d load) ÷ SD(7d load). Higher values mean repetitive loading; {'>'}2.0 suggests increased injury risk.
            </div>
          </div>
          <div className="bg-amber-50 p-4 rounded">
            <div className="text-xs text-gray-600">Strain (7d mean × monotony)</div>
            <div className="text-2xl font-bold text-amber-700">{model.strain.toFixed(0)}</div>
            <div className="text-xs text-gray-500">Threshold: {model.thresholds.strain.toFixed(0)}</div>
            <div className="text-xs text-gray-600 mt-1">
              Strain reflects total stress: Mean(7d load) × Monotony. High strain means high overall workload with low day-to-day variety.
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded">
            <div className="text-xs text-gray-600">Latest Readiness</div>
            <div className="text-2xl font-bold text-green-700">{model.latestRecovery}%</div>
            <div className="text-xs text-gray-500">Higher is better</div>
            <div className="text-xs text-gray-600 mt-1">
              Readiness combines HRV, Resting HR, Sleep hours, and SpO₂ into 0–100. Higher indicates better recovery capacity.
            </div>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={model.points}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              {/* Left axis for Load */}
              <YAxis yAxisId="left" orientation="left" />
              {/* Right axis for Recovery (0-100%) */}
              <YAxis yAxisId="recovery" orientation="right" domain={[0, 100]} tick={{ fill: '#0f766e' }} />
              {/* Second right axis for Sleep (hours) */}
              <YAxis yAxisId="sleep" orientation="right" domain={[0, 12]} tick={{ fill: '#4338ca' }} tickCount={7} width={40} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="load" name="Composite Load" fill="#ef4444" />
              <Area yAxisId="recovery" type="monotone" dataKey="recovery" name="Recovery %" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2}/>
              <Line yAxisId="sleep" type="monotone" dataKey="sleepHours" name="Sleep (h)" stroke="#6366f1" strokeWidth={2} dot={{ r: 2 }}/>
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {model.flags.length>0 && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded p-4">
            <div className="font-semibold text-red-700 mb-2">Risk Flags</div>
            <div className="flex flex-wrap gap-2">
              {model.flags.map((f,i)=>(
                <span key={i} className="px-2 py-1 bg-white border border-red-200 text-red-700 rounded text-sm">{f}</span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-2 bg-gray-50 rounded p-4">
            <div className="font-semibold text-gray-800 mb-2">Coach Plan: Next 3 Days</div>
            <div className="space-y-3">
              {model.plan.map((p,i)=>(
                <div key={i} className="bg-white rounded border p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-gray-800">{p.day}</div>
                    <div className={`px-2 py-0.5 rounded text-xs ${p.intensity==='High'?'bg-red-100 text-red-700':p.intensity==='Moderate'?'bg-yellow-100 text-yellow-700':'bg-green-100 text-green-700'}`}>
                      {p.intensity}
                    </div>
                  </div>
                  <div className="text-sm text-gray-700 mt-1">{p.focus}</div>
                  <div className="text-xs text-gray-500 mt-1">{p.notes}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded border p-4">
            <div className="font-semibold text-gray-800 mb-2">Genetic Modifiers</div>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>Inflammation sensitivity: {model.mods.inflammationSensitive ? 'Yes' : 'No'}</li>
              <li>Stress sensitivity: {model.mods.stressSensitive ? 'Yes' : 'No'}</li>
              <li>Circadian sensitivity: {model.mods.circadianSensitive ? 'Yes' : 'No'}</li>
              <li>Power-dominant (ACTN3 RR): {model.mods.powerDominant ? 'Yes' : 'No'}</li>
            </ul>
            <div className="mt-3 text-xs text-gray-500">
              Thresholds are automatically adjusted by genetics to personalize risk.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecoveryTimeline;