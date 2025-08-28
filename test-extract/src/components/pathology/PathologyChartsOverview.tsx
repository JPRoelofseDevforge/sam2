import React, { useState } from 'react';
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

interface PathologyChartsOverviewProps {
  bloodResults: BloodResults[];
}

export const PathologyChartsOverview: React.FC<PathologyChartsOverviewProps> = ({ bloodResults }) => {
  const [selectedChart, setSelectedChart] = useState<'hormonal' | 'metabolic' | 'inflammation' | 'comprehensive'>('hormonal');

  console.log('PathologyChartsOverview rendered with', bloodResults.length, 'blood results');

  if (bloodResults.length < 1) {
    return (
      <div className="text-center py-12 card-enhanced rounded-xl">
        <p className="text-gray-600 mb-2">📊 Insufficient data for chart analysis</p>
        <p className="text-sm text-gray-500">
          Need at least 1 blood test result. Current data points: {bloodResults.length}
        </p>
      </div>
    );
  }

  // Prepare data for all charts
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
  const inflammationData = chartData.filter(d => d.crp > 0);

  // Radar data for hormonal balance
  const radarData = hormoneData.length >= 2 ? [{
    subject: 'Cortisol',
    A: hormoneData[hormoneData.length - 1]?.cortisol > 0 ? Math.min((hormoneData[hormoneData.length - 1].cortisol / 550) * 100, 100) : 0,
    B: hormoneData[hormoneData.length - 2]?.cortisol > 0 ? Math.min((hormoneData[hormoneData.length - 2].cortisol / 550) * 100, 100) : 0,
    fullMark: 100
  }, {
    subject: 'Testosterone',
    A: hormoneData[hormoneData.length - 1]?.testosterone > 0 ? Math.min((hormoneData[hormoneData.length - 1].testosterone / 35) * 100, 100) : 0,
    B: hormoneData[hormoneData.length - 2]?.testosterone > 0 ? Math.min((hormoneData[hormoneData.length - 2].testosterone / 35) * 100, 100) : 0,
    fullMark: 100
  }, {
    subject: 'Balance',
    A: hormoneData[hormoneData.length - 1]?.cortisol > 0 && hormoneData[hormoneData.length - 1]?.testosterone > 0 ?
      Math.max(0, 100 - Math.abs(hormoneData[hormoneData.length - 1].cortisol/hormoneData[hormoneData.length - 1].testosterone - 0.03) * 1000) : 50,
    B: hormoneData[hormoneData.length - 2]?.cortisol > 0 && hormoneData[hormoneData.length - 2]?.testosterone > 0 ?
      Math.max(0, 100 - Math.abs(hormoneData[hormoneData.length - 2].cortisol/hormoneData[hormoneData.length - 2].testosterone - 0.03) * 1000) : 50,
    fullMark: 100
  }] : [];

  const chartTabs = [
    { id: 'hormonal' as const, label: 'Hormonal Balance', icon: '⚖️', description: 'Cortisol vs Testosterone analysis' },
    { id: 'metabolic' as const, label: 'Metabolic Health', icon: '⚡', description: 'Glucose and muscle stress correlation' },
    { id: 'inflammation' as const, label: 'Recovery Status', icon: '🔥', description: 'Inflammation and recovery markers' },
    { id: 'comprehensive' as const, label: 'Comprehensive View', icon: '📊', description: 'Multi-marker analysis' }
  ];

  const renderChart = () => {
    switch (selectedChart) {
      case 'hormonal':
        return (
          <div className="space-y-6">
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

            {radarData.length > 0 && (
              <div className="card-enhanced p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <span className="bg-purple-100 p-1.5 rounded-full text-purple-700 text-lg">🎯</span>
                  <span className="text-white">Hormonal Profile Comparison</span>
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 10 }} />
                    <Radar
                      name="Latest"
                      dataKey="A"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                      strokeWidth={3}
                    />
                    <Radar
                      name="Previous"
                      dataKey="B"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        );

      case 'metabolic':
        return (
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
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart data={metabolicData}>
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
                  data={metabolicData}
                  fill="#10b981"
                  fillOpacity={0.7}
                  stroke="#10b981"
                  strokeWidth={2}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        );

      case 'inflammation':
        return (
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
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={inflammationData}>
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
                  dataKey="crp"
                  name="Inflammation (CRP)"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#ef4444' }}
                />
                <Bar
                  yAxisId="right"
                  dataKey="ck"
                  name="Muscle Stress (CK)"
                  fill="#f59e0b"
                  opacity={0.7}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        );

      case 'comprehensive':
        return (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="card-enhanced p-6">
                <h4 className="text-lg font-semibold mb-3 text-black">Liver Function</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData.filter(d => d.alt > 0 || d.ast > 0)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '6px', color: '#f9fafb' }} />
                    <Line type="monotone" dataKey="alt" name="ALT" stroke="#f97316" strokeWidth={2} />
                    <Line type="monotone" dataKey="ast" name="AST" stroke="#ea580c" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="card-enhanced p-6">
                <h4 className="text-lg font-semibold mb-3 text-black">Kidney Function</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData.filter(d => d.creatinine > 0)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '6px', color: '#f9fafb' }} />
                    <Line type="monotone" dataKey="creatinine" name="Creatinine" stroke="#06b6d4" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card-enhanced p-6">
              <h4 className="text-lg font-semibold mb-3 text-black">Blood Count Trends</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData.filter(d => d.hemoglobin > 0 || d.wbc > 0)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" />
                  <YAxis yAxisId="left" stroke="#6b7280" />
                  <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
                  <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '6px', color: '#f9fafb' }} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="hemoglobin" name="Hemoglobin" stroke="#8b5cf6" strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="wbc" name="WBC" stroke="#a855f7" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Chart Selection Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex flex-col sm:flex-row sm:flex-wrap gap-1 sm:gap-0">
          {chartTabs.map((tab) => {
            const isActive = selectedChart === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedChart(tab.id)}
                className={`flex items-center justify-start sm:justify-center gap-2 px-4 py-3 sm:py-2 text-sm font-medium transition-all duration-200 relative group
                  ${isActive
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                  }`}
              >
                <span className="flex items-center gap-2">
                  <span>{tab.icon}</span>
                  <span className="sm:hidden">{tab.label}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </span>

                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Selected Chart */}
      <div className="transform hover:scale-[1.01] transition-all duration-300">
        {renderChart()}
      </div>
    </div>
  );
};