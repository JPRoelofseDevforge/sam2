// components/MetricCard.tsx
import React from 'react';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';

interface MetricDataPoint {
  date: string;
  value: number;
}

interface MetricCardProps {
  title: string;
  value: number;
  unit: string;
  icon: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  data: MetricDataPoint[];
  teamAverage?: number;
  goalValue?: number;
  goalLabel?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  icon,
  subtitle,
  trend,
  data = [],
  teamAverage,
  goalValue,
  goalLabel = 'Goal',
}) => {
  // Handle undefined/null values by providing defaults
  const safeValue = value ?? 0;
  const trendColor =
    trend === 'up'
      ? 'text-green-600'
      : trend === 'down'
      ? 'text-red-600'
      : 'text-gray-500';

  const sortedData = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const chartData = sortedData.map((d, i) => ({
    ...d,
    index: i,
    name: new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
  }));

  // Determine domain for Y-axis
  const allValues = [...sortedData.map(d => d.value), safeValue, teamAverage, goalValue].filter(Boolean) as number[];
  const minValue = Math.min(...allValues) * 0.98;
  const maxValue = Math.max(...allValues) * 1.02;

const getStatus = () => {
  if (safeValue >= goalValue!) return 'good';
  if (safeValue >= goalValue! * 0.85) return 'warning';
  return 'alert';
};

const status = getStatus();
const dotColor =
  status === 'good' ? 'bg-green-500' :
  status === 'warning' ? 'bg-yellow-500' :
  'bg-red-500';

  return (
    <div className="card-enhanced p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-2xl">{icon}</div>
        <div className={`w-3 h-3 rounded-full ${dotColor}`} title={`Status: ${status}`} />
      </div>

      {/* Value */}
      <div className="flex items-baseline mb-2">
        <span className="text-2xl font-bold text-gray-900">{safeValue.toFixed(1)}</span>
        <span className="text-sm text-gray-500 ml-1">{unit}</span>
      </div>
      
      {/* Title */}
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>

      {/* Sparkline Chart */}
      <div className="flex-1 min-h-[70px] mb-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <XAxis hide dataKey="name" />
            <YAxis hide domain={[minValue, maxValue]} />
            <Tooltip
              contentStyle={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px' }}
              itemStyle={{ color: '#1a202c' }}
              formatter={(val: number, name: string) => {
                const unitMap: Record<string, string> = {
                  'HRV (Night)': 'ms',
                  'Resting HR': 'bpm',
                  'SpO₂ (Night)': '%',
                  'Sleep Duration': 'h',
                  'Deep Sleep': '%',
                  'REM Sleep': '%',
                  'Respiratory Rate': '/min',
                  'Body Temp': '°C',
                  'Training Load': '%',
                };
                const u = unitMap[name] || '';
                return [`${val.toFixed(1)} ${u}`, name];
              }}
              labelFormatter={(label) => `Date: ${label}`}
            />

            {/* Goal Line */}
            {goalValue && (
              <ReferenceLine
                y={goalValue}
                stroke="#6c00ff"
                strokeDasharray="3 3"
                label={{
                  value: goalLabel,
                  position: 'left',
                  fill: '#6c00ff',
                  fontSize: 10,
                  offset: 5,
                }}
              />
            )}

            {/* Team Average Line */}
            {teamAverage && (
              <ReferenceLine
                y={teamAverage}
                stroke="#38bdf8"
                strokeDasharray="4 2"
                label={{
                  value: 'Team Avg',
                  position: 'right',
                  fill: '#38bdf8',
                  fontSize: 10,
                  offset: 5,
                }}
              />
            )}

            {/* Main Data Line */}
            <Line
              type="monotone"
              dataKey="value"
              stroke={
                trend === 'up'
                  ? '#10b981'
                  : trend === 'down'
                  ? '#ef4444'
                  : '#6b7280'
              }
              strokeWidth={2}
              dot={false}
              animationDuration={600}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

{/* Legend */}
{((goalValue && goalLabel) || teamAverage) && (
  <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-1">
    {goalValue && (
      <div className="flex items-center">
        <div className="w-3 h-0.5 bg-[#6c00ff] mr-1 border-dashed"></div>
        <span>{goalLabel}</span>
      </div>
    )}
    {teamAverage && (
      <div className="flex items-center">
        <div className="w-3 h-0.5 bg-[#38bdf8] mr-1 border-dashed border-0.5"></div>
        <span>Team Avg</span>
      </div>
    )}
  </div>
)}

      {/* Subtitle */}
      {subtitle && (
        <p className={`text-xs ${trendColor} flex items-center mt-auto`}>
          {trend === 'up' && <span>↑</span>}
          {trend === 'down' && <span>↓</span>}
          {trend === 'neutral' && <span>•</span>}
          <span className="ml-1">{subtitle}</span>
        </p>
      )}
    </div>
  );
};