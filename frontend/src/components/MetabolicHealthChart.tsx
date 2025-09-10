import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from 'recharts';
import { dataService } from '../services/dataService';
import type { BloodResults } from '../types';
import { Activity, AlertTriangle } from 'lucide-react';

interface MetabolicHealthChartProps {
  athleteId: string | number;
}

interface ChartDataPoint {
  date: number;
  dateString: string;
  glucose: number;
  hba1c: number;
  estimatedGlucose?: number;
}

const MetabolicHealthChart: React.FC<MetabolicHealthChartProps> = ({ athleteId }) => {
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

        // Filter blood results that have glucose or HbA1c data
        const filteredResults = athleteData.bloodResults.filter(
          (result: BloodResults) =>
            (result.fasting_glucose !== undefined && result.fasting_glucose !== null) ||
            (result.hba1c !== undefined && result.hba1c !== null) ||
            (result.estimated_average_glucose !== undefined && result.estimated_average_glucose !== null)
        );

        if (filteredResults.length === 0) {
          setData([]);
          return;
        }

        // Transform data for the chart
        const chartData: ChartDataPoint[] = filteredResults
          .filter((result: BloodResults) => result.date)
          .map((result: BloodResults) => {
            const date = new Date(result.date!);
            const timestamp = date.getTime();

            return {
              date: timestamp,
              dateString: date.toLocaleDateString(),
              glucose: result.fasting_glucose || 0,
              hba1c: result.hba1c || 0,
              estimatedGlucose: result.estimated_average_glucose
            };
          });

        // Sort by date
        chartData.sort((a, b) => a.date - b.date);

        setData(chartData);
      } catch (error) {
        console.error('Failed to fetch metabolic health data:', error);
        setError('Failed to load metabolic health data. Please try again.');
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
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value?.toFixed(1)} ${entry.dataKey === 'glucose' ? 'mmol/L' : '%'}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl border border-slate-700/50 p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading metabolic health data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl border border-slate-700/50 p-6">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 font-medium text-lg">Error loading metabolic health data</p>
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
          <p className="text-gray-400 font-medium text-lg">No metabolic health data available</p>
          <p className="text-gray-500 mt-2">
            Metabolic health data requires blood test results with glucose or HbA1c measurements.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl border border-slate-700/50 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Metabolic Health Trends</h2>
        <p className="text-gray-400 text-sm">
          Glucose and HbA1c levels over time. Monitor metabolic health and diabetes risk.
        </p>
        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Fasting Glucose (3.9-5.6 mmol/L)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>HbA1c (4.0-6.0%)</span>
          </div>
        </div>
      </div>

      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 20,
              right: 30,
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
              yAxisId="glucose"
              orientation="left"
              domain={['dataMin - 0.5', 'dataMax + 0.5']}
              label={{ value: 'Glucose (mmol/L)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9ca3af' } }}
              stroke="#3b82f6"
            />
            <YAxis
              yAxisId="hba1c"
              orientation="right"
              domain={['dataMin - 0.2', 'dataMax + 0.2']}
              label={{ value: 'HbA1c (%)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#9ca3af' } }}
              stroke="#10b981"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <ReferenceLine yAxisId="glucose" y={3.9} stroke="#ef4444" strokeDasharray="5 5" label="Low Glucose" />
            <ReferenceLine yAxisId="glucose" y={5.6} stroke="#ef4444" strokeDasharray="5 5" label="High Glucose" />
            <ReferenceLine yAxisId="hba1c" y={4.0} stroke="#f59e0b" strokeDasharray="5 5" label="Low HbA1c" />
            <ReferenceLine yAxisId="hba1c" y={6.0} stroke="#f59e0b" strokeDasharray="5 5" label="High HbA1c" />
            <Line
              yAxisId="glucose"
              type="monotone"
              dataKey="glucose"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              name="Fasting Glucose"
              connectNulls={false}
            />
            <Line
              yAxisId="hba1c"
              type="monotone"
              dataKey="hba1c"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              name="HbA1c"
              connectNulls={false}
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

export { MetabolicHealthChart };