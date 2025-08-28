import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  ReferenceLine
} from 'recharts';
import { BloodResults } from '../../types';

interface PathologyTrendsProps {
  bloodResults: BloodResults[];
}

export const PathologyTrends: React.FC<PathologyTrendsProps> = ({ bloodResults }) => {
   if (bloodResults.length < 1) {
     return null;
   }

  // Prepare data for charts
  const chartData = bloodResults
    .sort((a, b) => new Date(a.date || '').getTime() - new Date(b.date || '').getTime())
    .map(result => ({
      date: new Date(result.date || '').toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      cortisol: result.cortisol_nmol_l || 0,
      testosterone: result.testosterone || 0,
      glucose: result.fasting_glucose || 0,
      ck: result.ck || 0,
      alt: result.s_alanine_transaminase || 0,
      ast: result.s_aspartate_transaminase || 0,
      creatinine: result.creatinine || 0,
      crp: result.c_reactive_protein || 0,
      hemoglobin: result.hemoglobin || 0,
      wbc: result.leucocyte_count || 0
    }));

  const hormoneData = chartData.filter(d => d.cortisol > 0 || d.testosterone > 0);
  const metabolicData = chartData.filter(d => d.glucose > 0 || d.ck > 0);
  const liverData = chartData.filter(d => d.alt > 0 || d.ast > 0);
  const kidneyData = chartData.filter(d => d.creatinine > 0);
  const inflammationData = chartData.filter(d => d.crp > 0);
  const bloodData = chartData.filter(d => d.hemoglobin > 0 || d.wbc > 0);

  // Prepare data for new charts
  const radarData = hormoneData.length >= 2 ? hormoneData.map(d => ({
    date: d.date,
    cortisol: d.cortisol > 0 ? Math.min((d.cortisol / 550) * 100, 100) : 0, // Normalize to 0-100 scale
    testosterone: d.testosterone > 0 ? Math.min((d.testosterone / 35) * 100, 100) : 0,
    ratio: d.cortisol > 0 && d.testosterone > 0 ? Math.max(0, 100 - Math.abs(d.cortisol/d.testosterone - 0.03) * 1000) : 50
  })) : [];

  const metabolicHealthData = metabolicData.map(d => ({
    date: d.date,
    glucose: d.glucose,
    ck: d.ck,
    healthScore: d.glucose > 0 && d.ck > 0 ?
      Math.max(0, 100 - ((d.glucose - 4.5) * 10 + (d.ck - 100) * 0.1)) : 0
  }));

  const recoveryData = chartData.filter(d => d.crp > 0 || d.ck > 0).map(d => ({
    date: d.date,
    inflammation: d.crp || 0,
    muscleStress: d.ck || 0,
    recoveryScore: d.crp > 0 && d.ck > 0 ?
      Math.max(0, 100 - (d.crp * 10 + (d.ck - 100) * 0.05)) : 50
  }));

  return (
    <div className="space-y-6">
      {/* Enhanced Cortisol vs Testosterone Chart */}
      {hormoneData.length >= 2 && (
        <div className="card-enhanced p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="bg-blue-100 p-1.5 rounded-full text-blue-700 text-lg">⚖️</span>
            <span className="text-black">Cortisol vs Testosterone Balance</span>
          </h3>
          <div className="mb-4 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
            <p className="text-sm text-blue-200">
              <strong>Insight:</strong> This chart shows the critical balance between stress hormone (cortisol) and anabolic hormone (testosterone).
              Optimal ratio is 1:30 to 1:50. Values outside this range may indicate overtraining or inadequate recovery.
            </p>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={hormoneData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis yAxisId="left" stroke="#6b7280" label={{ value: 'nmol/L', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" stroke="#6b7280" label={{ value: 'nmol/L', angle: 90, position: 'insideRight' }} />
              <Tooltip
                contentStyle={{
                  background: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  color: '#f9fafb'
                }}
                formatter={(value: any, name: string) => [
                  `${typeof value === 'number' && isFinite(value) ? value.toFixed(1) : value} nmol/L`,
                  name === 'cortisol' ? 'Cortisol (Stress)' : 'Testosterone (Anabolic)'
                ]}
              />
              <Legend />
              <ReferenceLine yAxisId="left" y={275} stroke="#fbbf24" strokeDasharray="5 5" label="Cortisol Optimal" />
              <ReferenceLine yAxisId="right" y={17.5} stroke="#10b981" strokeDasharray="5 5" label="Testosterone Optimal" />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="cortisol"
                name="Cortisol (Stress Hormone)"
                stroke="#3b82f6"
                strokeWidth={4}
                dot={{ r: 6, fill: '#3b82f6' }}
                activeDot={{ r: 8, fill: '#3b82f6' }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="testosterone"
                name="Testosterone (Anabolic Hormone)"
                stroke="#8b5cf6"
                strokeWidth={4}
                dot={{ r: 6, fill: '#8b5cf6' }}
                activeDot={{ r: 8, fill: '#8b5cf6' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Hormonal Balance Radar Chart */}
      {radarData.length >= 2 && (
        <div className="card-enhanced p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="bg-purple-100 p-1.5 rounded-full text-purple-700 text-lg">🎯</span>
            <span className="text-white">Hormonal Balance Profile</span>
          </h3>
          <div className="mb-4 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
            <p className="text-sm text-purple-200">
              <strong>Insight:</strong> This radar chart visualizes hormonal health across multiple dimensions.
              The closer the shape is to a perfect circle, the better the hormonal balance.
            </p>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={radarData.slice(-1)[0] ? [radarData.slice(-1)[0]] : []}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 12 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 10 }} />
              <Radar
                name="Cortisol Level (%)"
                dataKey="cortisol"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.3}
                strokeWidth={3}
              />
              <Radar
                name="Testosterone Level (%)"
                dataKey="testosterone"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.3}
                strokeWidth={3}
              />
              <Radar
                name="Balance Score (%)"
                dataKey="ratio"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.3}
                strokeWidth={3}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Metabolic Health Scatter Plot */}
      {metabolicHealthData.length >= 2 && (
        <div className="card-enhanced p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="bg-green-100 p-1.5 rounded-full text-green-700 text-lg">⚡</span>
            <span className="text-black">Metabolic Health Overview</span>
          </h3>
          <div className="mb-4 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
            <p className="text-sm text-green-200">
              <strong>Insight:</strong> This scatter plot correlates glucose levels with creatine kinase (muscle stress).
              Points in the bottom-left quadrant indicate optimal metabolic health.
            </p>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <ScatterChart data={metabolicHealthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="glucose"
                name="Glucose (mmol/L)"
                stroke="#6b7280"
                label={{ value: 'Glucose (mmol/L)', position: 'insideBottom', offset: -5 }}
              />
              <YAxis
                dataKey="ck"
                name="CK (U/L)"
                stroke="#6b7280"
                label={{ value: 'Creatine Kinase (U/L)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                contentStyle={{
                  background: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  color: '#f9fafb'
                }}
                formatter={(value: any, name: string) => [
                  `${value.toFixed(1)} ${name === 'Glucose (mmol/L)' ? 'mmol/L' : 'U/L'}`,
                  name
                ]}
              />
              <ReferenceLine x={5.6} stroke="#ef4444" strokeDasharray="5 5" label="High Glucose" />
              <ReferenceLine y={200} stroke="#f59e0b" strokeDasharray="5 5" label="High Muscle Stress" />
              <Scatter
                name="Metabolic Health"
                data={metabolicHealthData}
                fill="#10b981"
                fillOpacity={0.7}
                stroke="#10b981"
                strokeWidth={2}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Inflammation & Recovery Status */}
      {recoveryData.length >= 2 && (
        <div className="card-enhanced p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="bg-red-100 p-1.5 rounded-full text-red-700 text-lg">🔥</span>
            <span className="text-black">Inflammation & Recovery Status</span>
          </h3>
          <div className="mb-4 p-4 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-lg border border-red-500/20">
            <p className="text-sm text-red-200">
              <strong>Insight:</strong> This chart tracks inflammation (CRP) and muscle stress (CK) levels.
              Lower values indicate better recovery status and reduced injury risk.
            </p>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={recoveryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis yAxisId="left" stroke="#6b7280" label={{ value: 'CRP (mg/L)', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" stroke="#6b7280" label={{ value: 'CK (U/L)', angle: 90, position: 'insideRight' }} />
              <Tooltip
                contentStyle={{
                  background: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  color: '#f9fafb'
                }}
                formatter={(value: any, name: string) => [
                  `${value.toFixed(1)} ${name === 'Inflammation (CRP)' ? 'mg/L' : 'U/L'}`,
                  name
                ]}
              />
              <Legend />
              <ReferenceLine yAxisId="left" y={3} stroke="#ef4444" strokeDasharray="5 5" label="High Inflammation" />
              <ReferenceLine yAxisId="right" y={200} stroke="#f59e0b" strokeDasharray="5 5" label="High Muscle Stress" />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="inflammation"
                name="Inflammation (CRP)"
                stroke="#ef4444"
                strokeWidth={3}
                dot={{ r: 5, fill: '#ef4444' }}
              />
              <Bar
                yAxisId="right"
                dataKey="muscleStress"
                name="Muscle Stress (CK)"
                fill="#f59e0b"
                opacity={0.7}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Metabolic Trends */}
      {metabolicData.length >= 2 && (
        <div className="card-enhanced p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="bg-green-100 p-1.5 rounded-full text-green-700 text-lg">⚡</span>
            <span className="text-white">Metabolic Trends</span>
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={metabolicData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis yAxisId="left" stroke="#6b7280" />
              <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  color: '#1f2937'
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="glucose"
                name="Glucose (mmol/L)"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
              <Bar
                yAxisId="right"
                dataKey="ck"
                name="CK (U/L)"
                fill="#f59e0b"
                opacity={0.7}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Liver Function Trends */}
      {liverData.length >= 1 && (
        <div className="card-enhanced p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="bg-green-100 p-2 rounded-full text-green-700 text-lg">🫘</span>
            <span className="text-black">Liver Health Tracker</span>
          </h3>

          {/* Status Indicator */}
          <div className="mb-4 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-sm text-green-300">Normal Range</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <span className="text-sm text-yellow-300">Monitor</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <span className="text-sm text-red-300">High</span>
            </div>
          </div>

          <div className="mb-4 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
            <p className="text-sm text-green-200">
              <strong>What this means:</strong> These enzymes help detect liver health. Normal levels support recovery and performance.
              High levels may mean your liver needs extra care from intense training or other factors.
            </p>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={liverData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis
                dataKey="date"
                stroke="#9ca3af"
                fontSize={12}
                tick={{ fill: '#9ca3af' }}
              />
              <YAxis
                stroke="#9ca3af"
                fontSize={12}
                tick={{ fill: '#9ca3af' }}
                label={{ value: 'Enzyme Level', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9ca3af' } }}
              />
              <Tooltip
                contentStyle={{
                  background: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f9fafb'
                }}
                formatter={(value: any, name: string) => [
                  `${value} U/L`,
                  name === 'alt' ? 'ALT (Liver Enzyme)' : 'AST (Liver Enzyme)'
                ]}
                labelStyle={{ color: '#f9fafb' }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />
              <ReferenceLine y={40} stroke="#fbbf24" strokeDasharray="5 5" label="Upper Normal" />
              <Line
                type="monotone"
                dataKey="alt"
                name="ALT Enzyme"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 5, fill: '#10b981' }}
                activeDot={{ r: 7, fill: '#10b981' }}
              />
              <Line
                type="monotone"
                dataKey="ast"
                name="AST Enzyme"
                stroke="#34d399"
                strokeWidth={3}
                dot={{ r: 5, fill: '#34d399' }}
                activeDot={{ r: 7, fill: '#34d399' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Kidney Function Trends */}
      {kidneyData.length >= 1 && (
        <div className="card-enhanced p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="bg-blue-100 p-2 rounded-full text-blue-700 text-lg">🫑</span>
            <span className="text-black">Kidney Health Monitor</span>
          </h3>

          {/* Status Indicator */}
          <div className="mb-4 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-sm text-green-300">Good (under 100)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <span className="text-sm text-yellow-300">Monitor (100-110)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <span className="text-sm text-red-300">Check with Doctor (over 110)</span>
            </div>
          </div>

          <div className="mb-4 p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-500/20">
            <p className="text-sm text-blue-200">
              <strong>What this means:</strong> Creatinine shows how well your kidneys filter waste. Lower, stable levels are ideal for athletes.
              If levels rise, it might mean your kidneys need more recovery time or hydration.
            </p>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={kidneyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis
                dataKey="date"
                stroke="#9ca3af"
                fontSize={12}
                tick={{ fill: '#9ca3af' }}
              />
              <YAxis
                stroke="#9ca3af"
                fontSize={12}
                tick={{ fill: '#9ca3af' }}
                label={{ value: 'Creatinine Level', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9ca3af' } }}
              />
              <Tooltip
                contentStyle={{
                  background: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f9fafb'
                }}
                formatter={(value: any) => [`${value} µmol/L`, 'Creatinine Level']}
                labelStyle={{ color: '#f9fafb' }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />
              <ReferenceLine y={100} stroke="#fbbf24" strokeDasharray="5 5" label="Monitor Zone" />
              <ReferenceLine y={110} stroke="#ef4444" strokeDasharray="5 5" label="High Zone" />
              <Line
                type="monotone"
                dataKey="creatinine"
                name="Kidney Function"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 5, fill: '#3b82f6' }}
                activeDot={{ r: 7, fill: '#3b82f6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Inflammation Trends */}
      {inflammationData.length >= 2 && (
        <div className="card-enhanced p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="bg-red-100 p-1.5 rounded-full text-red-700 text-lg">🔥</span>
            <span className="text-white">Inflammation Trends</span>
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={inflammationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  color: '#1f2937'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="crp"
                name="CRP (mg/L)"
                stroke="#ef4444"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Blood Count Trends */}
      {bloodData.length >= 1 && (
        <div className="card-enhanced p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="bg-red-100 p-2 rounded-full text-red-700 text-lg">🩸</span>
            <span className="text-black">Blood Health & Energy</span>
          </h3>

          {/* Status Indicator */}
          <div className="mb-4 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-sm text-green-300">Optimal Performance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <span className="text-sm text-yellow-300">Getting Tired</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <span className="text-sm text-red-300">Needs Attention</span>
            </div>
          </div>

          <div className="mb-4 p-4 bg-gradient-to-r from-red-500/10 to-pink-500/10 rounded-lg border border-red-500/20">
            <p className="text-sm text-red-200">
              <strong>What this means:</strong> Hemoglobin carries oxygen for energy and performance. White blood cells fight infections.
              Good levels = better endurance and immunity. Low levels may cause fatigue or increased illness risk.
            </p>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={bloodData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis
                dataKey="date"
                stroke="#9ca3af"
                fontSize={12}
                tick={{ fill: '#9ca3af' }}
              />
              <YAxis
                yAxisId="left"
                stroke="#9ca3af"
                fontSize={12}
                tick={{ fill: '#9ca3af' }}
                label={{ value: 'Hemoglobin (g/dL)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9ca3af' } }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#9ca3af"
                fontSize={12}
                tick={{ fill: '#9ca3af' }}
                label={{ value: 'White Blood Cells', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#9ca3af' } }}
              />
              <Tooltip
                contentStyle={{
                  background: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f9fafb'
                }}
                formatter={(value: any, name: string) => [
                  name === 'hemoglobin' ? `${value} g/dL` : `${value} ×10⁹/L`,
                  name === 'hemoglobin' ? 'Oxygen Carrier' : 'Immune Cells'
                ]}
                labelStyle={{ color: '#f9fafb' }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />
              <ReferenceLine yAxisId="left" y={13} stroke="#10b981" strokeDasharray="5 5" label="Good Energy" />
              <ReferenceLine yAxisId="left" y={12} stroke="#fbbf24" strokeDasharray="5 5" label="Low Energy" />
              <ReferenceLine yAxisId="right" y={4} stroke="#10b981" strokeDasharray="5 5" label="Good Immunity" />
              <ReferenceLine yAxisId="right" y={11} stroke="#ef4444" strokeDasharray="5 5" label="High Infection Risk" />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="hemoglobin"
                name="Energy & Oxygen"
                stroke="#ef4444"
                strokeWidth={3}
                dot={{ r: 5, fill: '#ef4444' }}
                activeDot={{ r: 7, fill: '#ef4444' }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="wbc"
                name="Immune Defense"
                stroke="#f97316"
                strokeWidth={3}
                dot={{ r: 5, fill: '#f97316' }}
                activeDot={{ r: 7, fill: '#f97316' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};