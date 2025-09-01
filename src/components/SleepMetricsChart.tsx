import React, { useState, useEffect } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { dataService } from '../services/dataService';
import type { BiometricData } from '../types';
import { Moon, AlertTriangle } from 'lucide-react';

interface SleepMetricsChartProps {
  athleteId: string | number;
}

interface ChartDataPoint {
  date: number; // timestamp for sorting
  dateString: string; // formatted date for display
  deep_sleep_pct: number;
  rem_sleep_pct: number;
  sleep_duration_h: number;
}

const SleepMetricsChart: React.FC<SleepMetricsChartProps> = ({ athleteId }) => {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const athleteIdNum = typeof athleteId === 'string' ? parseInt(athleteId, 10) : athleteId;
        const athleteData = await dataService.getAthleteData(athleteIdNum, true);

        if (!athleteData.biometricData || athleteData.biometricData.length === 0) {
          setData([]);
          return;
        }

        // Filter biometric data that have sleep metrics
        const filteredResults = athleteData.biometricData.filter(
          (result: BiometricData) =>
            result.deep_sleep_pct !== undefined &&
            result.deep_sleep_pct !== null &&
            result.rem_sleep_pct !== undefined &&
            result.rem_sleep_pct !== null &&
            result.sleep_duration_h !== undefined &&
            result.sleep_duration_h !== null &&
            result.date
        );

        if (filteredResults.length === 0) {
          setData([]);
          return;
        }

        // Transform data for the chart
        const chartData: ChartDataPoint[] = filteredResults.map((result: BiometricData) => {
          const date = new Date(result.date);
          const timestamp = date.getTime();

          return {
            date: timestamp,
            dateString: date.toLocaleDateString(),
            deep_sleep_pct: result.deep_sleep_pct,
            rem_sleep_pct: result.rem_sleep_pct,
            sleep_duration_h: result.sleep_duration_h
          };
        });

        // Sort by date
        chartData.sort((a, b) => a.date - b.date);

        setData(chartData);
      } catch (error) {
        console.error('Failed to fetch sleep metrics data:', error);
        setError('Failed to load sleep metrics data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [athleteId]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">{`Date: ${data.dateString}`}</p>
          <p className="text-blue-400">{`Deep Sleep: ${data.deep_sleep_pct.toFixed(1)}%`}</p>
          <p className="text-green-400">{`REM Sleep: ${data.rem_sleep_pct.toFixed(1)}%`}</p>
          <p className="text-purple-400">{`Sleep Duration: ${data.sleep_duration_h.toFixed(1)} hours`}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl border border-slate-700/50 p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading sleep metrics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl border border-slate-700/50 p-6">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 font-medium text-lg">Error loading sleep metrics data</p>
          <p className="text-gray-400 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl border border-slate-700/50 p-6">
        <div className="text-center">
          <Moon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400 font-medium text-lg">No sleep metrics data available</p>
          <p className="text-gray-500 mt-2">
            Sleep metrics data requires biometric measurements with deep sleep, REM sleep, and sleep duration values.
          </p>
        </div>
      </div>
    );
  }

  if (data.length < 2) {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl border border-slate-700/50 p-6">
        <div className="text-center">
          <Moon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <p className="text-yellow-400 font-medium text-lg">Insufficient data for sleep metrics chart</p>
          <p className="text-gray-500 mt-2">
            At least 2 data points with sleep metrics measurements are required.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl border border-slate-700/50 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Sleep Metrics Chart</h2>
        <p className="text-gray-400 text-sm">
          Deep sleep percentage, REM sleep percentage, and sleep duration over time.
        </p>
        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Deep Sleep %</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>REM Sleep %</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span>Sleep Duration (hours)</span>
          </div>
        </div>
      </div>

      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{
              top: 20,
              right: 20,
              bottom: 20,
              left: 20,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              type="number"
              dataKey="date"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(value) => new Date(value).toLocaleDateString()}
              stroke="#9ca3af"
            />
            <YAxis
              yAxisId="left"
              type="number"
              domain={[0, 100]}
              label={{ value: 'Sleep %', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9ca3af' } }}
              stroke="#9ca3af"
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              type="number"
              domain={['dataMin - 1', 'dataMax + 1']}
              label={{ value: 'Duration (hours)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#9ca3af' } }}
              stroke="#9ca3af"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              yAxisId="right"
              dataKey="sleep_duration_h"
              fill="#8b5cf6"
              name="Sleep Duration (hours)"
              opacity={0.6}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="deep_sleep_pct"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
              name="Deep Sleep %"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="rem_sleep_pct"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
              name="REM Sleep %"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 text-center text-sm text-gray-500">
        {data.length} data point{data.length !== 1 ? 's' : ''} • Last updated: {data[data.length - 1]?.dateString}
      </div>
    </div>
  );
};

export { SleepMetricsChart };