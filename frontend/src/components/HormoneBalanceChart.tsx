import React, { useState, useEffect } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { dataService } from '../services/dataService';
import type { BloodResults } from '../types';
import { Activity, AlertTriangle } from 'lucide-react';

interface HormoneBalanceChartProps {
  athleteId: string | number;
}

interface ChartDataPoint {
  date: number; // timestamp for sorting
  dateString: string; // formatted date for display
  cortisol: number;
  testosterone: number;
  size: number; // scaled size for bubble
}

const HormoneBalanceChart: React.FC<HormoneBalanceChartProps> = ({ athleteId }) => {
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

        if (!athleteData.bloodResults || athleteData.bloodResults.length === 0) {
          setData([]);
          return;
        }

        // Filter blood results that have both cortisol and testosterone
        const filteredResults = athleteData.bloodResults.filter(
          (result: BloodResults) =>
            result.cortisol_nmol_l !== undefined &&
            result.cortisol_nmol_l !== null &&
            result.testosterone !== undefined &&
            result.testosterone !== null &&
            result.date
        );

        if (filteredResults.length === 0) {
          setData([]);
          return;
        }

        // Transform data for the chart
        const chartData: ChartDataPoint[] = filteredResults.map((result: BloodResults) => {
          const date = new Date(result.date!);
          const timestamp = date.getTime();

          // Scale testosterone for bubble size (min 20, max 100)
          const testosterone = result.testosterone!;
          const minTestosterone = Math.min(...filteredResults.map(r => r.testosterone!));
          const maxTestosterone = Math.max(...filteredResults.map(r => r.testosterone!));
          const size = 20 + ((testosterone - minTestosterone) / (maxTestosterone - minTestosterone)) * 80;

          return {
            date: timestamp,
            dateString: date.toLocaleDateString(),
            cortisol: result.cortisol_nmol_l!,
            testosterone: testosterone,
            size: size
          };
        });

        // Sort by date
        chartData.sort((a, b) => a.date - b.date);

        setData(chartData);
      } catch (error) {
        console.error('Failed to fetch hormone balance data:', error);
        setError('Failed to load hormone balance data. Please try again.');
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
          <p className="text-blue-400">{`Cortisol: ${data.cortisol.toFixed(1)} nmol/L`}</p>
          <p className="text-green-400">{`Testosterone: ${data.testosterone.toFixed(1)} nmol/L`}</p>
        </div>
      );
    }
    return null;
  };

  // Get color based on testosterone level
  const getColor = (testosterone: number) => {
    if (testosterone < 8.4) return '#ef4444'; // red - low
    if (testosterone > 28.7) return '#10b981'; // green - high
    return '#3b82f6'; // blue - normal
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl border border-slate-700/50 p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading hormone balance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl border border-slate-700/50 p-6">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 font-medium text-lg">Error loading hormone balance data</p>
          <p className="text-gray-400 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl border border-slate-700/50 p-6">
        <div className="text-center">
          <Activity className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400 font-medium text-lg">No hormone balance data available</p>
          <p className="text-gray-500 mt-2">
            Hormone balance data requires blood test results with both cortisol and testosterone measurements.
          </p>
        </div>
      </div>
    );
  }

  if (data.length < 2) {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl border border-slate-700/50 p-6">
        <div className="text-center">
          <Activity className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <p className="text-yellow-400 font-medium text-lg">Insufficient data for hormone balance chart</p>
          <p className="text-gray-500 mt-2">
            At least 2 data points with both cortisol and testosterone measurements are required.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl border border-slate-700/50 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Hormone Balance Chart</h2>
        <p className="text-gray-400 text-sm">
          Cortisol vs Testosterone levels over time. Bubble size represents testosterone concentration.
        </p>
        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Low Testosterone (&lt; 8.4 nmol/L)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Normal Testosterone</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>High Testosterone (&gt; 28.7 nmol/L)</span>
          </div>
        </div>
      </div>

      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
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
              dataKey="cortisol"
              domain={['dataMin - 10', 'dataMax + 10']}
              label={{ value: 'Cortisol (nmol/L)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9ca3af' } }}
              stroke="#9ca3af"
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter
              dataKey="cortisol"
              fill="#8884d8"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getColor(entry.testosterone)}
                  r={entry.size / 10} // Scale down for better visualization
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 text-center text-sm text-gray-500">
        {data.length} data point{data.length !== 1 ? 's' : ''} • Last updated: {data[data.length - 1]?.dateString}
      </div>
    </div>
  );
};

export { HormoneBalanceChart };