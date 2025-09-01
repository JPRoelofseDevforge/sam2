import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { dataService } from '../services/dataService';
import type { BiometricData } from '../types';
import { Heart, AlertTriangle } from 'lucide-react';

interface HeartRateTrendChartProps {
  athleteId: string | number;
}

interface ChartDataPoint {
  date: number; // timestamp for sorting
  dateString: string; // formatted date for display
  resting_hr: number;
}

const HeartRateTrendChart: React.FC<HeartRateTrendChartProps> = ({ athleteId }) => {
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

        // Filter biometric data that have resting_hr
        const filteredResults = athleteData.biometricData.filter(
          (result: BiometricData) =>
            result.resting_hr !== undefined &&
            result.resting_hr !== null &&
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
            resting_hr: result.resting_hr
          };
        });

        // Sort by date
        chartData.sort((a, b) => a.date - b.date);

        setData(chartData);
      } catch (error) {
        console.error('Failed to fetch heart rate trend data:', error);
        setError('Failed to load heart rate trend data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [athleteId]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">{`Date: ${data.dateString}`}</p>
          <p className="text-red-400">{`Resting HR: ${data.resting_hr} bpm`}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl border border-slate-700/50 p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading heart rate trend data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl border border-slate-700/50 p-6">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 font-medium text-lg">Error loading heart rate trend data</p>
          <p className="text-gray-400 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl border border-slate-700/50 p-6">
        <div className="text-center">
          <Heart className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400 font-medium text-lg">No heart rate trend data available</p>
          <p className="text-gray-500 mt-2">
            Heart rate trend data requires biometric measurements with resting heart rate values.
          </p>
        </div>
      </div>
    );
  }

  if (data.length < 2) {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl border border-slate-700/50 p-6">
        <div className="text-center">
          <Heart className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <p className="text-yellow-400 font-medium text-lg">Insufficient data for heart rate trend chart</p>
          <p className="text-gray-500 mt-2">
            At least 2 data points with resting heart rate measurements are required.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl border border-slate-700/50 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Heart Rate Trend Chart</h2>
        <p className="text-gray-400 text-sm">
          Resting heart rate over time. Lower values generally indicate better cardiovascular fitness.
        </p>
      </div>

      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
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
              dataKey="resting_hr"
              domain={['dataMin - 5', 'dataMax + 5']}
              label={{ value: 'Resting HR (bpm)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9ca3af' } }}
              stroke="#9ca3af"
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="resting_hr"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 text-center text-sm text-gray-500">
        {data.length} data point{data.length !== 1 ? 's' : ''} • Last updated: {data[data.length - 1]?.dateString}
      </div>
    </div>
  );
};

export { HeartRateTrendChart };