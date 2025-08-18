// src/components/TrendChart.tsx
import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// === TYPES ===
interface BiometricData {
  date: string;
  hrv_night?: number;
  resting_hr?: number;
  spo2_night?: number;
  resp_rate_night?: number;
  deep_sleep_pct?: number;
  rem_sleep_pct?: number;
  light_sleep_pct?: number;
  sleep_duration_h?: number;
  temp_trend_c?: number;
  training_load_pct?: number;
}

interface BodyComposition {
  date?: string;
  weight_kg: number;
  muscle_mass_kg: number;
  fat_mass_kg: number;
}

interface GeneticProfile {
  gene: string;
  genotype: string;
}

interface TrendChartProps {
  data: BiometricData[];
  bodyCompData?: BodyComposition[];
  geneticData?: GeneticProfile[];
}

// Utility: Parse date
const parseDate = (date: string) => new Date(date);

// Utility: Format short date
const formatDate = (date: string) =>
  parseDate(date).toLocaleDateString('en', { month: 'short', day: 'numeric' });

// Utility: Calculate Readiness Score (mock)
const calculateReadinessScore = (d: BiometricData): number => {
  const hrv = ((d.hrv_night || 0) - 40) / 30; // norm: 40–70 → 0–1
  const rhr = (70 - (d.resting_hr || 70)) / 20; // norm: 50–70 → 1–0
  const sleep = (d.sleep_duration_h || 6) / 9; // max 9h
  const spo2 = ((d.spo2_night || 95) - 90) / 10;
  return Math.max(0, Math.min(100, (hrv + rhr + sleep + spo2) * 25));
};

export const TrendChart: React.FC<TrendChartProps> = ({
  data,
  bodyCompData = [],
  geneticData = [],
}) => {
  if (!data || data.length === 0) {
    return <div className="text-center py-8 text-gray-600">No biometric data available</div>;
  }

  const sortedBiometrics = [...data]
    .filter(d => d.date && !isNaN(parseDate(d.date).getTime()))
    .sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime())
    .map(d => ({
      ...d,
      readiness: calculateReadinessScore(d),
      dateLabel: formatDate(d.date),
      dayOfWeek: parseDate(d.date).getDay(), // 0=Sun
    }));

  const hasBodyComp = bodyCompData && bodyCompData.length > 0;
  const sortedBodyComp = hasBodyComp
    ? [...bodyCompData].sort((a, b) => parseDate(a.date!).getTime() - parseDate(b.date!).getTime())
    : [];

  // 🧬 Genetic Radar Data
  const geneScores: Record<string, number> = {
    ACTN3: 0, // Power
    PPARGC1A: 0, // Endurance
    PER3: 0, // Chronotype
    CLOCK: 0, // Circadian
    BDNF: 0, // Neuroplasticity
    ADRB2: 0, // Fat metabolism
  };

  geneticData.forEach(g => {
    switch (g.gene) {
      case 'ACTN3':
        geneScores[g.gene] = g.genotype === 'RR' ? 1 : g.genotype === 'RX' ? 0.6 : 0.3;
        break;
      case 'PPARGC1A':
        geneScores[g.gene] = g.genotype.includes('Gly') ? 0.9 : 0.4;
        break;
      case 'PER3':
        geneScores[g.gene] = g.genotype === 'long' ? 0.8 : 0.3; // long = morning type
        break;
      case 'CLOCK':
        geneScores[g.gene] = g.genotype === 'AA' ? 0.9 : g.genotype === 'AG' ? 0.6 : 0.3;
        break;
      case 'BDNF':
        geneScores[g.gene] = g.genotype === 'Val66Val' ? 0.9 : g.genotype === 'Val/Met' ? 0.6 : 0.3;
        break;
      case 'ADRB2':
        geneScores[g.gene] = g.genotype === 'Arg16Arg' ? 0.9 : g.genotype === 'Gly16Gly' ? 0.4 : 0.6;
        break;
    }
  });

  const radarData = Object.entries(geneScores).map(([gene, score]) => ({
    subject: gene,
    A: score,
    fullMark: 1,
  }));

  // 📅 Readiness Calendar Data (7 weeks)
  const today = new Date();
  const calendarData = Array.from({ length: 49 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - 48 + i);
    const dateString = date.toISOString().split('T')[0];
    const entry = sortedBiometrics.find(d => d.date === dateString);
    const score = entry ? Math.round(calculateReadinessScore(entry)) : null;
    return { date: dateString, value: score };
  });

  const getColor = (value: number | null) => {
    if (value === null) return 'bg-gray-200';
    if (value > 75) return 'bg-green-500';
    if (value > 50) return 'bg-yellow-400';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-12 py-6 px-2">
      {/* 1. Key Performance Metrics */}
      <section className="card-enhanced p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Key Performance Metrics</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={sortedBiometrics} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="dateLabel" stroke="#6b7280" />
            <YAxis yAxisId="left" stroke="#6b7280" />
            <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
            <Tooltip 
              contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#1f2937' }}
            />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="hrv_night" name="HRV (ms)" stroke="#6366f1" strokeWidth={3} />
            <Line yAxisId="left" type="monotone" dataKey="resting_hr" name="RHR (bpm)" stroke="#10b981" strokeWidth={3} />
            <Line yAxisId="right" type="monotone" dataKey="sleep_duration_h" name="Sleep (h)" stroke="#3b82f6" strokeWidth={3} />
            <Line yAxisId="left" type="monotone" dataKey="spo2_night" name="SpO₂ (%)" stroke="#f97316" strokeWidth={3} />
            <Line yAxisId="right" type="monotone" dataKey="training_load_pct" name="Load (%)" stroke="#8b5cf6" strokeWidth={3} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </section>

      {/* 2. Sleep Architecture */}
      <section className="card-enhanced p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🌙 Sleep Stage Breakdown</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={sortedBiometrics}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="dateLabel" stroke="#6b7280" />
            <YAxis domain={[0, 100]} stroke="#6b7280" />
            <Tooltip 
              formatter={(v: number) => `${v.toFixed(1)}%`} 
              contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#1f2937' }}
            />
            <Legend />
            <Line type="monotone" dataKey="deep_sleep_pct" name="Deep Sleep" stroke="#059669" strokeWidth={4} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="rem_sleep_pct" name="REM Sleep" stroke="#7c3aed" strokeWidth={4} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="light_sleep_pct" name="Light Sleep" stroke="#d97706" strokeWidth={4} strokeDasharray="5 5" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </section>

      {/* 3. Recovery vs Training Load */}
      <section className="card-enhanced p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🔁 Recovery vs. Training Load</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={sortedBiometrics}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <Bar yAxisId="left" dataKey="training_load_pct" name="Training Load" fill="#e74c3c" />
            <Line yAxisId="right" type="monotone" dataKey="hrv_night" name="HRV (Recovery)" stroke="#2ecc71" strokeWidth={4} />
          </ComposedChart>
        </ResponsiveContainer>
      </section>

      {/* 4. HRV vs Resting HR Scatter */}
      <section className="card-enhanced p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">🔄 HRV vs. Resting HR (Recovery State)</h3>
        <ResponsiveContainer width="100%" height={350}>
          <ScatterChart margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid />
            <XAxis type="number" dataKey="hrv_night" name="HRV" unit="ms" domain={[30, 70]} />
            <YAxis type="number" dataKey="resting_hr" name="RHR" unit="bpm" reversed domain={[40, 80]} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="Recovery State" data={sortedBiometrics} fill="#3498db" shape="circle" />
          </ScatterChart>
        </ResponsiveContainer>
        <div className="mt-4 text-sm text-gray-600">
          <p className="mb-2">This chart shows the relationship between Heart Rate Variability (HRV) and Resting Heart Rate (RHR):</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Higher HRV (right) indicates better recovery and parasympathetic nervous system activity</li>
            <li>Lower RHR (top) indicates better cardiovascular fitness and recovery</li>
            <li>Points in the top-right quadrant represent optimal recovery state</li>
            <li>Points in the bottom-left quadrant may indicate fatigue or overtraining</li>
          </ul>
        </div>
      </section>

      {/* 5. Body Composition Trend */}
      {hasBodyComp && (
        <section>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">⚖️ Body Composition Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={sortedBodyComp}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => formatDate(date)}
              />
              <YAxis yAxisId="left" label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" label={{ value: 'Mass (kg)', angle: 90, position: 'insideRight' }} />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="weight_kg" name="Weight" stroke="#3498db" strokeWidth={3} />
              <Line yAxisId="right" type="monotone" dataKey="muscle_mass_kg" name="Muscle Mass" stroke="#2ecc71" strokeWidth={3} />
              <Line yAxisId="right" type="monotone" dataKey="fat_mass_kg" name="Fat Mass" stroke="#e67e22" strokeWidth={3} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </section>
      )}

      {/* 6. Readiness Calendar */}
      <section className="card-enhanced p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📅 Readiness Calendar (Last 7 Weeks)</h3>
        <div className="grid grid-cols-7 gap-1 max-w-md mx-auto mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-600 py-1">
              {day}
            </div>
          ))}
          {calendarData.map((d, i) => (
            <div
              key={i}
              className={`w-full aspect-square flex items-center justify-center text-xs text-white font-bold rounded-md transition-all ${getColor(d.value)}`}
              title={d.value ? `${d.value}% ready` : 'No data'}
            >
              {d.value !== null ? Math.round(d.value / 10) : ''}
            </div>
          ))}
        </div>
        <div className="text-sm text-gray-600">
          <p className="mb-2">This calendar shows your daily readiness scores over the past 7 weeks:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>🟢 Green (76-100%): Optimal recovery state</li>
            <li>🟡 Yellow (51-75%): Moderate recovery, monitor trends</li>
            <li>🔴 Red (0-50%): Fatigue detected, prioritize recovery</li>
            <li>⚪ Gray: No data available for this date</li>
          </ul>
        </div>
      </section>

      {/* 7. Genetic Predisposition Radar */}
      {geneticData.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">🧬 Genetic Predisposition Profile</h3>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart outerRadius="80%" data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis angle={30} domain={[0, 1]} tickFormatter={(v) => v.toFixed(1)} />
              <Radar name="Athlete" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              <Tooltip formatter={(v: number) => [`${(v * 100).toFixed(0)}%`, 'Predisposition']} />
            </RadarChart>
          </ResponsiveContainer>
        </section>
      )}
    </div>
  );
};