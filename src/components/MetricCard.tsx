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
  const allValues = [...sortedData.map(d => d.value), teamAverage, goalValue].filter(Boolean);
  const minValue = Math.min(...allValues) * 0.98;
  const maxValue = Math.max(...allValues) * 1.02;

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border hover:shadow transition-shadow duration-200 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <span className="text-lg" role="img" aria-label={title}>
          {icon}
        </span>
      </div>

      {/* Value */}
      <div className="flex items-baseline mb-2">
        <span className="text-2xl font-bold text-gray-900">{value.toFixed(1)}</span>
        <span className="text-sm text-gray-500 ml-1">{unit}</span>
      </div>

      {/* Sparkline Chart */}
      <div className="flex-1 min-h-[70px] mb-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <XAxis hide dataKey="name" />
            <YAxis hide domain={[minValue, maxValue]} />
            <Tooltip
              contentStyle={{ background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '6px' }}
              itemStyle={{ color: '#fff' }}
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
                stroke="#8884d8"
                strokeDasharray="3 3"
                label={{
                  value: goalLabel,
                  position: 'left',
                  fill: '#8884d8',
                  fontSize: 10,
                  offset: 5,
                }}
              />
            )}

            {/* Team Average Line */}
            {teamAverage && (
              <ReferenceLine
                y={teamAverage}
                stroke="#82ca9d"
                strokeDasharray="4 2"
                label={{
                  value: 'Team Avg',
                  position: 'right',
                  fill: '#82ca9d',
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