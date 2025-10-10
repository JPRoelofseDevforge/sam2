import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart,
  Bar,
  ScatterChart,
  Scatter,
} from 'recharts';
import type { BiometricData, GeneticProfile, BloodResults } from '../types';
import { bloodResultsService } from '../services/dataService';

type SeriesPoint = { date: string; dateLabel: string; [k: string]: number | string | null };

interface HighValueComparisonsProps {
  athleteId: number;
  biometricData: BiometricData[];
  geneticProfiles: GeneticProfile[];
  className?: string;
}

/**
 * Utility: format a YYYY-MM-DD or ISO string to short label
 */
const formatDateLabel = (date: string) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
};

const parseTimeToHour = (time?: string): number | null => {
  if (!time || time === '00:00') return null;
  const parts = time.split(':');
  if (parts.length < 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  return h + m / 60;
};

/**
 * Merge two time series by date
 */
const mergeSeriesByDate = (
  a: Array<{ date: string; value: number }>,
  b: Array<{ date: string; value: number }>,
  keyA: string,
  keyB: string
): SeriesPoint[] => {
  const map = new Map<string, SeriesPoint>();
  for (const p of a) {
    if (!p.date) continue;
    map.set(p.date, { date: p.date, dateLabel: formatDateLabel(p.date), [keyA]: p.value });
  }
  for (const p of b) {
    if (!p.date) continue;
    const existing = map.get(p.date);
    if (existing) {
      existing[keyB] = p.value;
    } else {
      map.set(p.date, { date: p.date, dateLabel: formatDateLabel(p.date), [keyB]: p.value });
    }
  }
  return Array.from(map.values()).sort((x, y) => new Date(x.date).getTime() - new Date(y.date).getTime());
};

export const HighValueComparisons: React.FC<HighValueComparisonsProps> = ({
  athleteId,
  biometricData,
  geneticProfiles,
  className = '',
}) => {
  const [bloodResults, setBloodResults] = useState<BloodResults[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await bloodResultsService.getBloodResultsByAthlete(athleteId);
        if (mounted) setBloodResults(Array.isArray(data) ? data : []);
      } catch {
        if (mounted) setBloodResults([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [athleteId]);

  // Genes helper
  const geneSet = useMemo(() => {
    const s = new Set<string>();
    for (const g of geneticProfiles || []) {
      if (g?.gene) s.add(g.gene.toUpperCase());
    }
    return s;
  }, [geneticProfiles]);

  const hasGene = (gene: string) => geneSet.has(gene.toUpperCase());

  const GeneBadges: React.FC<{ genes: string[] }> = ({ genes }) => (
    <div className="flex flex-wrap gap-2">
      {genes.map((g) => (
        <span
          key={g}
          className={`px-2 py-0.5 rounded-full text-xs border ${
            hasGene(g) ? 'bg-purple-100 text-purple-700 border-purple-300' : 'bg-gray-100 text-gray-500 border-gray-200'
          }`}
          title={hasGene(g) ? 'Detected in genetic profile' : 'Not detected in genetic profile'}
        >
          {g}
        </span>
      ))}
    </div>
  );

  // Sort and prepare blood series
  const bloodByDate = useMemo(() => {
    const arr = [...(bloodResults || [])].filter((r) => !!r?.date);
    arr.sort((a, b) => new Date(a.date || '').getTime() - new Date(b.date || '').getTime());
    return arr;
  }, [bloodResults]);

  const seriesFromBlood = (key: keyof BloodResults) =>
    bloodByDate
      .map((r) => ({ date: r.date || '', value: typeof r[key] === 'number' ? (r[key] as number) : NaN }))
      .filter((p) => p.date && Number.isFinite(p.value));

  // Biometric series helpers
  const biometricsSorted = useMemo(() => {
    return [...(biometricData || [])]
      .filter((d) => !!d?.date)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [biometricData]);

  const seriesFromBiometrics = (selector: (d: BiometricData) => number | null | undefined) =>
    biometricsSorted
      .map((d) => ({ date: d.date, value: Number(selector(d)) }))
      .filter((p) => p.date && Number.isFinite(p.value));

  // 1) Insulin Resistance Risk: TCF7L2 / FTO - HbA1c & Fasting Glucose
  const sHbA1c = seriesFromBlood('hba1c');
  const sFastingGlucose = seriesFromBlood('fasting_glucose');
  const insulinData = mergeSeriesByDate(sHbA1c, sFastingGlucose, 'hba1c', 'fasting_glucose');

  // 2) Inflammation Expression: IL6 / TNFα - CRP vs HRV (comparison)
  const sCRP = seriesFromBlood('c_reactive_protein');
  const sHRV = seriesFromBiometrics((d) => d.hrv_night ?? null);
  const inflammationData = mergeSeriesByDate(sCRP, sHRV, 'crp', 'hrv');

  // 3) Nutrient Utilization: VDR / MTHFR - Vitamin D (and B12 if available)
  const sVitD = seriesFromBlood('vitamin_d');
  // Optional fields not defined in types; if backend provides, add casting guard
  const sB12 = [] as Array<{ date: string; value: number }>; // Placeholder when unavailable
  const nutrientData = mergeSeriesByDate(sVitD, sB12, 'vitamin_d', 'b12');

  // 4) Power vs Endurance Alignment: ACTN3 / ACE - Training Load vs HRV
  const sLoad = seriesFromBiometrics((d) => d.training_load_pct ?? null);
  const loadVsHrv = mergeSeriesByDate(sLoad, sHRV, 'training_load_pct', 'hrv');

  // 5) Chronotype Match: CLOCK / PER3 - Sleep onset hour vs Deep Sleep %
  const chronotypeScatter = useMemo(() => {
    const points: Array<{ onsetHour: number; deep_pct: number; dateLabel: string }> = [];
    for (const d of biometricsSorted) {
      const onsetHour = parseTimeToHour(d.sleep_onset_time);
      const deep = typeof d.deep_sleep_pct === 'number' ? d.deep_sleep_pct : null;
      if (onsetHour !== null && deep !== null && Number.isFinite(onsetHour) && Number.isFinite(deep)) {
        points.push({ onsetHour, deep_pct: deep, dateLabel: formatDateLabel(d.date) });
      }
    }
    return points;
  }, [biometricsSorted]);

  // 6) Anabolic Balance: Testosterone / Cortisol ratio - vs HRV & Training Response
  const sTestosterone = seriesFromBlood('testosterone');
  const sCortisol = seriesFromBlood('cortisol_nmol_l');
  const ratioData = useMemo(() => {
    const mapT = new Map(sTestosterone.map((p) => [p.date, p.value]));
    const res: Array<{ date: string; dateLabel: string; tcratio: number }> = [];
    for (const c of sCortisol) {
      const t = mapT.get(c.date);
      if (Number.isFinite(t) && Number.isFinite(c.value) && c.value !== 0) {
        const ratio = (t as number) / c.value;
        res.push({ date: c.date, dateLabel: formatDateLabel(c.date), tcratio: ratio });
      }
    }
    return res.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [sTestosterone, sCortisol]);

  const ratioVsRecovery = mergeSeriesByDate(
    ratioData.map((x) => ({ date: x.date, value: x.tcratio })),
    sHRV,
    'tcratio',
    'hrv'
  );

  // 7) Oxygen-carrying efficiency: Hb / RBC - Resting HR & SpO₂
  const sHb = seriesFromBlood('hemoglobin');
  const sRBC = seriesFromBlood('erythrocyte_count');
  const sRHR = seriesFromBiometrics((d) => d.resting_hr ?? null);
  const sSpO2 = seriesFromBiometrics((d) => d.spo2_night ?? null);
  const oxygenData = mergeSeriesByDate(sHb, sRBC, 'hemoglobin', 'rbc');
  const oxygenVsVitals = mergeSeriesByDate(sRHR, sSpO2, 'resting_hr', 'spo2');

  // 8) Stress resilience: COMT / SLC6A4 - HRV trend (and derived stress index)
  const stressData = useMemo(() => {
    // derive stressIndex = normalized (80 - HRV) + normalized RHR
    const points: Array<{ date: string; dateLabel: string; hrv: number; rhr: number; stress_index: number }> = [];
    for (const d of biometricsSorted) {
      const hrv = Number(d.hrv_night ?? NaN);
      const rhr = Number(d.resting_hr ?? NaN);
      if (Number.isFinite(hrv) && Number.isFinite(rhr)) {
        // Normalization bounds
        const normHRV = Math.max(0, Math.min(1, (70 - hrv) / 40)); // lower HRV -> higher stress
        const normRHR = Math.max(0, Math.min(1, (rhr - 50) / 35)); // higher RHR -> higher stress
        const stressIdx = (normHRV + normRHR) / 2;
        points.push({
          date: d.date,
          dateLabel: formatDateLabel(d.date),
          hrv,
          rhr,
          stress_index: Number(stressIdx.toFixed(3)),
        });
      }
    }
    return points;
  }, [biometricsSorted]);

// Derived series for additional comparisons
const sDeep = seriesFromBiometrics((d) => d.deep_sleep_pct ?? null);
const inflammationRecoveryData = mergeSeriesByDate(sCRP, sDeep, 'crp', 'deep_sleep_pct');

const sSleepH = seriesFromBiometrics((d) => d.sleep_duration_h ?? null);
const nutrientSleepData = mergeSeriesByDate(sVitD, sSleepH, 'vitamin_d', 'sleep_h');

const cortisolVsHRV = mergeSeriesByDate(sCortisol, sHRV, 'cortisol', 'hrv');

const ratioVsLoad = mergeSeriesByDate(
  ratioData.map((x) => ({ date: x.date, value: x.tcratio })),
  sLoad,
  'tcratio',
  'training_load_pct'
);
  const card = (children: React.ReactNode) => (
    <div className="card-enhanced p-6">{children}</div>
  );

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {card(
          <div className="flex items-center justify-center text-gray-500 h-40">Loading high-value comparisons...</div>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-10 ${className}`}>
      {/* 1. Insulin Resistance Risk */}
      {card(
        <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Insulin Resistance Risk</h3>
              <p className="text-sm text-gray-600">TCF7L2 / FTO → HbA1c & Fasting Glucose</p>
            </div>
            <GeneBadges genes={['TCF7L2', 'FTO']} />
          </div>

          {insulinData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={insulinData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="dateLabel" stroke="#6b7280" />
                <YAxis yAxisId="left" stroke="#6b7280" label={{ value: 'HbA1c (%)', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" stroke="#6b7280" label={{ value: 'Glucose (mmol/L)', angle: 90, position: 'insideRight' }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="hba1c" name="HbA1c (%)" stroke="#8b5cf6" strokeWidth={3} dot />
                <Line yAxisId="right" type="monotone" dataKey="fasting_glucose" name="Fasting Glucose (mmol/L)" stroke="#ef4444" strokeWidth={3} dot />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-sm text-gray-500">No HbA1c / Fasting Glucose data found.</div>
          )}
        </>
      )}

      {/* 2. Inflammation Expression */}
      {card(
        <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Inflammation Expression</h3>
              <p className="text-sm text-gray-600">IL6 / TNFα → hs-CRP vs HRV</p>
            </div>
            <GeneBadges genes={['IL6', 'TNFA', 'TNF']} />
          </div>

          {inflammationData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={inflammationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="dateLabel" stroke="#6b7280" />
                <YAxis yAxisId="left" stroke="#6b7280" label={{ value: 'HRV (ms)', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" stroke="#6b7280" label={{ value: 'CRP (mg/L)', angle: 90, position: 'insideRight' }} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="right" dataKey="crp" name="CRP (mg/L)" fill="#f59e0b" />
                <Line yAxisId="left" type="monotone" dataKey="hrv" name="HRV (ms)" stroke="#10b981" strokeWidth={3} dot />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-sm text-gray-500">No CRP/HRV comparison data found.</div>
          )}
        </>
      )}

      {/* 3. Nutrient Utilization */}
      {card(
        <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Nutrient Utilization</h3>
              <p className="text-sm text-gray-600">VDR / MTHFR → Vitamin D & B12</p>
            </div>
            <GeneBadges genes={['VDR', 'MTHFR']} />
          </div>

          {nutrientData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={nutrientData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="dateLabel" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="vitamin_d" name="Vitamin D (nmol/L)" stroke="#3b82f6" strokeWidth={3} dot />
                {/* B12 optional (if present) */}
                {nutrientData.some((d) => Number.isFinite(d['b12'] as number)) && (
                  <Line type="monotone" dataKey="b12" name="Vitamin B12" stroke="#ef4444" strokeWidth={3} dot />
                )}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-sm text-gray-500">No Vitamin D/B12 data found.</div>
          )}
        </>
      )}

      {/* 4. Power vs Endurance Alignment */}
      {card(
        <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Power vs Endurance Alignment</h3>
              <p className="text-sm text-gray-600">ACTN3 / ACE → Training Load vs HRV</p>
            </div>
            <GeneBadges genes={['ACTN3', 'ACE']} />
          </div>

          {loadVsHrv.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={loadVsHrv}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="dateLabel" stroke="#6b7280" />
                <YAxis yAxisId="left" stroke="#6b7280" label={{ value: 'Load (%)', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" stroke="#6b7280" label={{ value: 'HRV (ms)', angle: 90, position: 'insideRight' }} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="training_load_pct" name="Training Load (%)" fill="#a78bfa" />
                <Line yAxisId="right" type="monotone" dataKey="hrv" name="HRV (ms)" stroke="#22c55e" strokeWidth={3} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-sm text-gray-500">No training load/HRV data found.</div>
          )}
        </>
      )}

      {/* 5. Chronotype Match */}
      {card(
        <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Chronotype Match</h3>
              <p className="text-sm text-gray-600">CLOCK / PER3 → Sleep timing & Deep Sleep %</p>
            </div>
            <GeneBadges genes={['CLOCK', 'PER3']} />
          </div>

          {chronotypeScatter.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" dataKey="onsetHour" name="Sleep Onset" unit="h" domain={[0, 24]} stroke="#6b7280" />
                <YAxis type="number" dataKey="deep_pct" name="Deep Sleep" unit="%" domain={[0, 100]} stroke="#6b7280" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Legend />
                <Scatter name="Onset vs Deep %" data={chronotypeScatter} fill="#f97316" />
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-sm text-gray-500">No sleep timing/deep sleep data found.</div>
          )}
        </>
      )}

      {/* 6. Anabolic Balance */}
      {card(
        <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Anabolic Balance</h3>
              <p className="text-sm text-gray-600">Testosterone / Cortisol ratio → HRV & training response</p>
            </div>
            <GeneBadges genes={['COMT', 'NR3C1']} />
          </div>

          {ratioVsRecovery.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={ratioVsRecovery}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="dateLabel" stroke="#6b7280" />
                <YAxis yAxisId="left" stroke="#6b7280" label={{ value: 'T/C Ratio', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" stroke="#6b7280" label={{ value: 'HRV (ms)', angle: 90, position: 'insideRight' }} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="tcratio" name="T/C Ratio" fill="#60a5fa" />
                <Line yAxisId="right" type="monotone" dataKey="hrv" name="HRV (ms)" stroke="#16a34a" strokeWidth={3} dot />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-sm text-gray-500">Insufficient testosterone/cortisol ratio data.</div>
          )}
        </>
      )}

      {/* 7. Oxygen-Carrying Efficiency */}
      {card(
        <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Oxygen-Carrying Efficiency</h3>
              <p className="text-sm text-gray-600">Hb / RBC → Resting HR & SpO₂</p>
            </div>
            <GeneBadges genes={['HFE']} />
          </div>

          {oxygenData.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={oxygenData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="dateLabel" stroke="#6b7280" />
                  <YAxis yAxisId="left" stroke="#6b7280" label={{ value: 'Hemoglobin (g/dL)', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#6b7280" label={{ value: 'RBC (x10^12/L)', angle: 90, position: 'insideRight' }} />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="hemoglobin" name="Hemoglobin" stroke="#ef4444" strokeWidth={3} dot />
                  <Line yAxisId="right" type="monotone" dataKey="rbc" name="RBC" stroke="#a855f7" strokeWidth={3} dot />
                </ComposedChart>
              </ResponsiveContainer>

              {oxygenVsVitals.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={oxygenVsVitals}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="dateLabel" stroke="#6b7280" />
                    <YAxis yAxisId="left" stroke="#6b7280" label={{ value: 'Resting HR (bpm)', angle: -90, position: 'insideLeft' }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#6b7280" label={{ value: 'SpO₂ (%)', angle: 90, position: 'insideRight' }} />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="resting_hr" name="Resting HR" fill="#fb7185" />
                    <Line yAxisId="right" type="monotone" dataKey="spo2" name="SpO₂" stroke="#0ea5e9" strokeWidth={3} dot />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-sm text-gray-500">No Resting HR/SpO₂ time series found.</div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-500">No Hb/RBC data found.</div>
          )}
        </>
      )}

      {/* 8. Stress Resilience */}
      {card(
        <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Stress Resilience</h3>
              <p className="text-sm text-gray-600">COMT / SLC6A4 → HRV & derived stress index</p>
            </div>
            <GeneBadges genes={['COMT', 'SLC6A4']} />
          </div>

          {stressData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={stressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
      {/* Micronutrient-Linked Recovery */}
      {card(
        <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Micronutrient-Linked Recovery</h3>
              <p className="text-sm text-gray-600">Ferritin / Vitamin D → Sleep quality &amp; fatigue</p>
            </div>
            <GeneBadges genes={['HFE', 'VDR', 'MTHFR']} />
          </div>

          {nutrientSleepData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={nutrientSleepData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="dateLabel" stroke="#6b7280" />
                <YAxis
                  yAxisId="left"
                  stroke="#6b7280"
                  label={{ value: 'Sleep (h)', angle: -90, position: 'insideLeft' }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#6b7280"
                  label={{ value: 'Vitamin D (nmol/L)', angle: 90, position: 'insideRight' }}
                />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="sleep_h" name="Sleep (hours)" fill="#06b6d4" />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="vitamin_d"
                  name="Vitamin D"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-sm text-gray-500">
              Ferritin not in current schema; charting Vitamin D vs Sleep hours as recovery proxy.
            </div>
          )}
        </>
      )}

      {/* Stress Load Integration */}
      {card(
        <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Stress Load Integration</h3>
              <p className="text-sm text-gray-600">Cortisol levels → Morning HRV trend</p>
            </div>
          </div>
          {cortisolVsHRV.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={cortisolVsHRV}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="dateLabel" stroke="#6b7280" />
                <YAxis
                  yAxisId="left"
                  stroke="#6b7280"
                  label={{ value: 'HRV (ms)', angle: -90, position: 'insideLeft' }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#6b7280"
                  label={{ value: 'Cortisol (nmol/L)', angle: 90, position: 'insideRight' }}
                />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="hrv"
                  name="HRV (ms)"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot
                />
                <Bar yAxisId="right" dataKey="cortisol" name="Cortisol (nmol/L)" fill="#ef4444" />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-sm text-gray-500">No Cortisol/HRV paired data found.</div>
          )}
        </>
      )}
                <XAxis dataKey="dateLabel" stroke="#6b7280" />
                <YAxis yAxisId="left" stroke="#6b7280" label={{ value: 'HRV (ms)', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" stroke="#6b7280" label={{ value: 'Stress Index (0-1)', angle: 90, position: 'insideRight' }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="hrv" name="HRV (ms)" stroke="#34d399" strokeWidth={3} dot={false} />
                <Bar yAxisId="right" dataKey="stress_index" name="Stress Index" fill="#f59e0b" />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-sm text-gray-500">No HRV/stress trend data found.</div>
          )}
        </>
      )}

      {/* 9. Cholesterol Efficiency (Placeholder if LDL/HDL not available) */}
      {card(
        <>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Cholesterol Efficiency (Data Availability)</h3>
              <p className="text-sm text-gray-600">APOE / LDLR → LDL & HDL levels</p>
            </div>
            <GeneBadges genes={['APOE', 'LDLR']} />
          </div>
          <p className="text-sm text-gray-500">
            LDL/HDL markers are not present in current blood results schema. When available, this section will chart LDL & HDL
            trends and relate them to training load and HRV.
          </p>
        </>
      )}

      {/* 10. Caffeine Sensitivity (Placeholder) */}
      {card(
        <>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Stimulant Sensitivity (Data Availability)</h3>
              <p className="text-sm text-gray-600">CYP1A2 → Caffeine use vs sleep latency</p>
            </div>
            <GeneBadges genes={['CYP1A2']} />
          </div>
          <p className="text-sm text-gray-500">
            Caffeine intake and sleep latency are not currently tracked. Once available, a scatter will compare reported caffeine
            timing/dose to measured sleep onset latency and deep sleep percentage.
          </p>
        </>
      )}
    </div>
  );
};

export default HighValueComparisons;