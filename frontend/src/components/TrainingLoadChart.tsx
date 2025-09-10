import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { dataService } from '../services/dataService';
import type { BiometricData } from '../types';
import { TrendingUp, AlertTriangle } from 'lucide-react';
import { calculateReadinessScore } from '../utils/analytics';

interface TrainingLoadChartProps {
  athleteId: string | number;
}

interface ChartDataPoint {
  date: number; // timestamp for sorting
  dateString: string; // formatted date for display
  training_load_pct: number;
  recovery_score: number;
  hrv_night: number;
  resting_hr: number;
  sleep_duration_h: number;
  spo2_night: number;
}

const TrainingLoadChart: React.FC<TrainingLoadChartProps> = ({ athleteId }) => {
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

        // Filter biometric data that have training_load_pct and required recovery metrics
        const filteredResults = athleteData.biometricData.filter(
          (result: BiometricData) =>
            result.training_load_pct !== undefined &&
            result.training_load_pct !== null &&
            result.hrv_night !== undefined &&
            result.hrv_night !== null &&
            result.resting_hr !== undefined &&
            result.resting_hr !== null &&
            result.sleep_duration_h !== undefined &&
            result.sleep_duration_h !== null &&
            result.spo2_night !== undefined &&
            result.spo2_night !== null &&
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
            training_load_pct: result.training_load_pct,
            recovery_score: calculateReadinessScore(result),
            hrv_night: result.hrv_night,
            resting_hr: result.resting_hr,
            sleep_duration_h: result.sleep_duration_h,
            spo2_night: result.spo2_night
          };
        });

        // Sort by date
        chartData.sort((a, b) => a.date - b.date);

        setData(chartData);
      } catch (error) {
        console.error('Failed to fetch training load data:', error);
        setError('Failed to load training load data. Please try again.');
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
          <p className="text-orange-400">{`Training Load: ${data.training_load_pct.toFixed(1)}%`}</p>
          <p className="text-green-400">{`Recovery Score: ${data.recovery_score.toFixed(0)}%`}</p>
          <p className="text-blue-400">{`HRV: ${data.hrv_night} ms`}</p>
          <p className="text-red-400">{`Resting HR: ${data.resting_hr} bpm`}</p>
          <p className="text-purple-400">{`Sleep Duration: ${data.sleep_duration_h.toFixed(1)} hours`}</p>
          <p className="text-cyan-400">{`SpO₂: ${data.spo2_night}%`}</p>
        </div>
      );
    }
    return null;
  };

  // Get color based on training load percentage
  const getBarColor = (load: number) => {
    if (load < 30) return '#10b981'; // green - low load
    if (load < 70) return '#f59e0b'; // yellow - moderate load
    return '#ef4444'; // red - high load
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl border border-slate-700/50 p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading training load data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl border border-slate-700/50 p-6">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 font-medium text-lg">Error loading training load data</p>
          <p className="text-gray-400 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl border border-slate-700/50 p-6">
        <div className="text-center">
          <TrendingUp className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400 font-medium text-lg">No training load data available</p>
          <p className="text-gray-500 mt-2">
            Training load data requires biometric measurements with training load percentage and recovery metrics (HRV, resting HR, sleep duration, SpO₂).
          </p>
        </div>
      </div>
    );
  }

  if (data.length < 2) {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl border border-slate-700/50 p-6">
        <div className="text-center">
          <TrendingUp className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <p className="text-yellow-400 font-medium text-lg">Insufficient data for training load chart</p>
          <p className="text-gray-500 mt-2">
            At least 2 data points with training load and recovery metrics are required.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl border border-slate-700/50 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Training Load & Recovery Chart</h2>
        <p className="text-gray-400 text-sm">
          Training load percentage and recovery metrics over time. Hover for detailed recovery information.
        </p>
        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Low Load (&lt; 30%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>Moderate Load (30-70%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>High Load (&gt; 70%)</span>
          </div>
        </div>
      </div>

      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
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
              type="number"
              domain={[0, 100]}
              label={{ value: 'Training Load %', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9ca3af' } }}
              stroke="#9ca3af"
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="training_load_pct"
              fill="#f59e0b"
              radius={[4, 4, 0, 0]}
            >
              {data.map((entry, index) => (
                <Bar
                  key={`bar-${index}`}
                  fill={getBarColor(entry.training_load_pct)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 text-center text-sm text-gray-500">
        {data.length} data point{data.length !== 1 ? 's' : ''} • Last updated: {data[data.length - 1]?.dateString}
      </div>
    </div>
  );
};

export { TrainingLoadChart };