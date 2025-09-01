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

interface OrganFunctionChartProps {
  athleteId: string | number;
}

interface ChartDataPoint {
  date: number;
  dateString: string;
  alt: number;
  ast: number;
  ggt: number;
  creatinine: number;
  egfr: number;
}

const OrganFunctionChart: React.FC<OrganFunctionChartProps> = ({ athleteId }) => {
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

        // Filter blood results that have organ function markers
        const filteredResults = athleteData.bloodResults.filter(
          (result: BloodResults) =>
            (result.s_alanine_transaminase !== undefined && result.s_alanine_transaminase !== null) ||
            (result.s_aspartate_transaminase !== undefined && result.s_aspartate_transaminase !== null) ||
            (result.s_glutamyl_transferase !== undefined && result.s_glutamyl_transferase !== null) ||
            (result.creatinine !== undefined && result.creatinine !== null) ||
            (result.egfr !== undefined && result.egfr !== null)
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
              alt: result.s_alanine_transaminase || 0,
              ast: result.s_aspartate_transaminase || 0,
              ggt: result.s_glutamyl_transferase || 0,
              creatinine: result.creatinine || 0,
              egfr: result.egfr || 0
            };
          });

        // Sort by date
        chartData.sort((a, b) => a.date - b.date);

        setData(chartData);
      } catch (error) {
        console.error('Failed to fetch organ function data:', error);
        setError('Failed to load organ function data. Please try again.');
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
            let unit = ' U/L';
            if (entry.dataKey === 'creatinine') unit = ' µmol/L';
            else if (entry.dataKey === 'egfr') unit = ' mL/min/1.73m²';

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
          <p className="text-gray-400 text-lg">Loading organ function data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl border border-slate-700/50 p-6">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 font-medium text-lg">Error loading organ function data</p>
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
          <p className="text-gray-400 font-medium text-lg">No organ function data available</p>
          <p className="text-gray-500 mt-2">
            Organ function data requires blood test results with liver or kidney markers.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl border border-slate-700/50 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Liver & Kidney Function Trends</h2>
        <p className="text-gray-400 text-sm">
          Monitor liver enzymes (ALT, AST, GGT) and kidney function (creatinine, eGFR) over time.
        </p>
        <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Liver Enzymes (ALT &lt;56, AST &lt;40, GGT &lt;48 U/L)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Kidney Function (Creatinine 60-110 µmol/L, eGFR &gt;90)</span>
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
              yAxisId="liver"
              orientation="left"
              domain={['dataMin', 'dataMax']}
              label={{ value: 'Liver Enzymes (U/L)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9ca3af' } }}
              stroke="#10b981"
            />
            <YAxis
              yAxisId="kidney"
              orientation="right"
              domain={['dataMin', 'dataMax']}
              label={{ value: 'Kidney Markers', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#9ca3af' } }}
              stroke="#3b82f6"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <ReferenceLine yAxisId="liver" y={56} stroke="#ef4444" strokeDasharray="5 5" label="ALT Normal" />
            <ReferenceLine yAxisId="liver" y={40} stroke="#f59e0b" strokeDasharray="5 5" label="AST Normal" />
            <ReferenceLine yAxisId="liver" y={48} stroke="#8b5cf6" strokeDasharray="5 5" label="GGT Normal" />
            <ReferenceLine yAxisId="kidney" y={60} stroke="#3b82f6" strokeDasharray="5 5" label="Creatinine Low" />
            <ReferenceLine yAxisId="kidney" y={110} stroke="#3b82f6" strokeDasharray="5 5" label="Creatinine High" />
            <ReferenceLine yAxisId="kidney" y={90} stroke="#10b981" strokeDasharray="5 5" label="eGFR Normal" />
            <Line
              yAxisId="liver"
              type="monotone"
              dataKey="alt"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              name="ALT"
              connectNulls={false}
            />
            <Line
              yAxisId="liver"
              type="monotone"
              dataKey="ast"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
              name="AST"
              connectNulls={false}
            />
            <Line
              yAxisId="liver"
              type="monotone"
              dataKey="ggt"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
              name="GGT"
              connectNulls={false}
            />
            <Line
              yAxisId="kidney"
              type="monotone"
              dataKey="creatinine"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              name="Creatinine"
              connectNulls={false}
            />
            <Line
              yAxisId="kidney"
              type="monotone"
              dataKey="egfr"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
              name="eGFR"
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

export { OrganFunctionChart };