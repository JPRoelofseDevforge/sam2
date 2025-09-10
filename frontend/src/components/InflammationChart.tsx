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
  ReferenceLine
} from 'recharts';
import { dataService } from '../services/dataService';
import type { BloodResults } from '../types';
import { Activity, AlertTriangle } from 'lucide-react';

interface InflammationChartProps {
  athleteId: string | number;
}

interface ChartDataPoint {
  date: number;
  dateString: string;
  crp: number;
  esr: number;
  wbc: number;
  nlr: number;
}

const InflammationChart: React.FC<InflammationChartProps> = ({ athleteId }) => {
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

        // Filter blood results that have inflammation markers
        const filteredResults = athleteData.bloodResults.filter(
          (result: BloodResults) =>
            (result.c_reactive_protein !== undefined && result.c_reactive_protein !== null) ||
            (result.esr !== undefined && result.esr !== null) ||
            (result.leucocyte_count !== undefined && result.leucocyte_count !== null) ||
            (result.nlr !== undefined && result.nlr !== null)
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
              crp: result.c_reactive_protein || 0,
              esr: result.esr || 0,
              wbc: result.leucocyte_count || 0,
              nlr: result.nlr || 0
            };
          });

        // Sort by date
        chartData.sort((a, b) => a.date - b.date);

        setData(chartData);
      } catch (error) {
        console.error('Failed to fetch inflammation data:', error);
        setError('Failed to load inflammation data. Please try again.');
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
          {payload.map((entry: any, index: number) => {
            let unit = '';
            if (entry.dataKey === 'crp') unit = ' mg/L';
            else if (entry.dataKey === 'esr') unit = ' mm/hr';
            else if (entry.dataKey === 'wbc') unit = ' ×10⁹/L';
            else if (entry.dataKey === 'nlr') unit = '';

            return (
              <p key={index} style={{ color: entry.color }}>
                {`${entry.name}: ${entry.value?.toFixed(1)}${unit}`}
              </p>
            );
          })}
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
          <p className="text-gray-400 text-lg">Loading inflammation data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl border border-slate-700/50 p-6">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 font-medium text-lg">Error loading inflammation data</p>
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
          <p className="text-gray-400 font-medium text-lg">No inflammation data available</p>
          <p className="text-gray-500 mt-2">
            Inflammation data requires blood test results with CRP, ESR, WBC, or NLR measurements.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl border border-slate-700/50 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Inflammation & Immune Response</h2>
        <p className="text-gray-400 text-sm">
          Track inflammation markers and immune system activity over time.
        </p>
        <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>CRP (&lt;3.0 mg/L)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span>ESR (&lt;20 mm/hr)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>WBC (4.0-11.0 ×10⁹/L)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span>NLR (&lt;3.0)</span>
          </div>
        </div>
      </div>

      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
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
              yAxisId="inflammation"
              orientation="left"
              domain={['dataMin', 'dataMax']}
              label={{ value: 'Inflammation Markers', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9ca3af' } }}
              stroke="#9ca3af"
            />
            <YAxis
              yAxisId="immune"
              orientation="right"
              domain={['dataMin', 'dataMax']}
              label={{ value: 'Immune Cells', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#9ca3af' } }}
              stroke="#9ca3af"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <ReferenceLine yAxisId="inflammation" y={3.0} stroke="#ef4444" strokeDasharray="5 5" label="CRP Normal" />
            <ReferenceLine yAxisId="inflammation" y={20} stroke="#f59e0b" strokeDasharray="5 5" label="ESR Normal" />
            <ReferenceLine yAxisId="immune" y={4.0} stroke="#3b82f6" strokeDasharray="5 5" label="WBC Low" />
            <ReferenceLine yAxisId="immune" y={11.0} stroke="#3b82f6" strokeDasharray="5 5" label="WBC High" />
            <ReferenceLine yAxisId="immune" y={3.0} stroke="#8b5cf6" strokeDasharray="5 5" label="NLR Normal" />
            <Line
              yAxisId="inflammation"
              type="monotone"
              dataKey="crp"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
              name="C-Reactive Protein"
              connectNulls={false}
            />
            <Line
              yAxisId="inflammation"
              type="monotone"
              dataKey="esr"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
              name="ESR"
              connectNulls={false}
            />
            <Bar
              yAxisId="immune"
              dataKey="wbc"
              fill="#3b82f6"
              name="White Blood Cells"
              opacity={0.7}
            />
            <Line
              yAxisId="immune"
              type="monotone"
              dataKey="nlr"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
              name="Neutrophil-Lymphocyte Ratio"
              connectNulls={false}
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

export { InflammationChart };