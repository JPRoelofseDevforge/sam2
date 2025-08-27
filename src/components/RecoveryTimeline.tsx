import React, { useState, useMemo } from 'react';
import { biometricData, athletes } from '../data/mockData';
import { calculateReadinessScore } from '../utils/analytics';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';

interface RecoveryDataPoint {
  date: string;
  readinessScore: number;
  hrv: number;
  restingHr: number;
  sleepDuration: number;
  spo2: number;
  trainingLoad: number;
  events: string[];
  athleteId: string;
  athleteName: string;
}

interface RecoveryTimelineProps {
  athleteId?: string;
}

export const RecoveryTimeline: React.FC<RecoveryTimelineProps> = ({ athleteId }) => {
  const [timeRange, setTimeRange] = useState<'7' | '14' | '30' | '90'>('30');
  const [viewMode, setViewMode] = useState<'line' | 'scatter'>('line');
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>(
    athleteId ? [athleteId] : [athletes[0].athlete_id]
  );

  // Get recovery data for selected athletes - unified approach for LineChart
  const { athleteDataMap, lineChartData } = useMemo(() => {
    const dataMap: { [athleteId: string]: RecoveryDataPoint[] } = {};
    const allDates = new Set<string>();

    // First pass: collect all unique dates
    selectedAthletes.forEach(athleteId => {
      const athleteBiometrics = biometricData.filter(d => d.athlete_id === athleteId);
      athleteBiometrics.forEach(d => allDates.add(d.date));
    });

    // Filter by time range
    const days = parseInt(timeRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const filteredDates = Array.from(allDates)
      .filter(date => new Date(date) >= cutoffDate)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    // Create unified data structure for LineChart
    const unifiedData: any[] = [];
    filteredDates.forEach(date => {
      const dataPoint: any = { date };

      selectedAthletes.forEach(athleteId => {
        const athleteBiometric = biometricData.find(d => d.athlete_id === athleteId && d.date === date);
        const athlete = athletes.find(a => a.athlete_id === athleteId);

        if (athleteBiometric) {
          const readinessScore = calculateReadinessScore(athleteBiometric);
          dataPoint[`${athleteId}_readiness`] = readinessScore;
          dataPoint[`${athleteId}_hrv`] = athleteBiometric.hrv_night;
          dataPoint[`${athleteId}_events`] = [];

          // Simulate some events based on data patterns
          if (athleteBiometric.training_load_pct > 90) dataPoint[`${athleteId}_events`].push('High Load Session');
          if (athleteBiometric.hrv_night < 40) dataPoint[`${athleteId}_events`].push('Low HRV');
          if (athleteBiometric.sleep_duration_h < 6) dataPoint[`${athleteId}_events`].push('Short Sleep');
          if (athleteBiometric.resting_hr > 70) dataPoint[`${athleteId}_events`].push('Elevated RHR');

          // Also populate individual athlete data map
          if (!dataMap[athleteId]) dataMap[athleteId] = [];
          dataMap[athleteId].push({
            date: date,
            readinessScore: readinessScore,
            hrv: athleteBiometric.hrv_night,
            restingHr: athleteBiometric.resting_hr,
            sleepDuration: athleteBiometric.sleep_duration_h,
            spo2: athleteBiometric.spo2_night,
            trainingLoad: athleteBiometric.training_load_pct,
            events: dataPoint[`${athleteId}_events`],
            athleteId: athleteId,
            athleteName: athlete?.name || 'Unknown'
          });
        } else {
          dataPoint[`${athleteId}_readiness`] = null;
          dataPoint[`${athleteId}_hrv`] = null;
          dataPoint[`${athleteId}_events`] = [];
        }
      });

      unifiedData.push(dataPoint);
    });

    return { athleteDataMap: dataMap, lineChartData: unifiedData };
  }, [selectedAthletes, timeRange]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="space-y-8">
      <div className="card-enhanced p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Recovery Timeline</h2>
        <p className="text-gray-600 mb-6">Interactive timeline showing recovery progression</p>
        
        {/* Athlete Selection - only show when not in athlete profile */}
        {!athleteId && (
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-800 mb-4">Select Athletes to Compare</label>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-48 overflow-y-auto p-4 bg-gray-50 rounded-lg border">
              {athletes.map(athlete => {
                const isSelected = selectedAthletes.includes(athlete.athlete_id);
                return (
                  <label
                    key={athlete.athlete_id}
                    className={`
                      flex items-center p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md
                      ${isSelected
                        ? 'bg-blue-100 border-blue-400 shadow-sm'
                        : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAthletes([...selectedAthletes, athlete.athlete_id]);
                        } else {
                          setSelectedAthletes(selectedAthletes.filter(id => id !== athlete.athlete_id));
                        }
                      }}
                    />
                    <div className={`
                      w-5 h-5 rounded border-2 mr-3 flex items-center justify-center transition-colors
                      ${isSelected
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-gray-300'
                      }
                    `}>
                      {isSelected && (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-sm font-medium truncate ${
                      isSelected ? 'text-blue-900' : 'text-gray-700'
                    }`}>
                      {athlete.name}
                    </span>
                  </label>
                );
              })}
            </div>
            <div className="mt-3 text-sm text-gray-600 bg-white px-3 py-2 rounded-md border">
              <span className="font-medium">{selectedAthletes.length}</span> of <span className="font-medium">{athletes.length}</span> athletes selected
            </div>
          </div>
        )}

        {/* Chart Controls */}
        <div className="flex flex-wrap gap-6 mb-6">
          {/* Time Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Range</label>
            <div className="flex gap-2">
              {(['7', '14', '30', '90'] as const).map(range => (
                <button
                  key={range}
                  className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                    timeRange === range
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setTimeRange(range)}
                >
                  {range} days
                </button>
              ))}
            </div>
          </div>

          {/* View Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Chart Type</label>
            <div className="flex gap-2">
              <button
                className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                  viewMode === 'line'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setViewMode('line')}
              >
                📈 Line Chart
              </button>
              <button
                className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                  viewMode === 'scatter'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setViewMode('scatter')}
              >
                📊 Scatter Plot
              </button>
            </div>
          </div>
        </div>
        
        {/* Chart */}
        <div className="h-96">
          {viewMode === 'line' ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={lineChartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  interval="preserveStartEnd"
                  type="category"
                  scale="point"
                />
                <YAxis yAxisId="left" domain={[0, 100]} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                <Tooltip
                  formatter={(value, name) => {
                    const nameStr = String(name);
                    if (nameStr.includes('_readiness')) return [`${value}%`, 'Readiness'];
                    if (nameStr.includes('_hrv')) return [value, 'HRV (ms)'];
                    return [value, nameStr];
                  }}
                  labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString()}`}
                />
                <Legend />
                {/* Create lines for each athlete's readiness score */}
                {selectedAthletes.map((athleteId, index) => {
                  const athlete = athletes.find(a => a.athlete_id === athleteId);
                  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
                  const color = colors[index % colors.length];

                  return (
                    <Line
                      key={`readiness-${athleteId}`}
                      yAxisId="left"
                      type="monotone"
                      dataKey={`${athleteId}_readiness`}
                      name={`${athlete?.name || 'Unknown'} - Readiness`}
                      stroke={color}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                      connectNulls={false}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <CartesianGrid />
                <XAxis
                  type="number"
                  dataKey="hrv"
                  name="HRV"
                  unit="ms"
                  domain={[20, 90]}
                />
                <YAxis
                  type="number"
                  dataKey="restingHr"
                  name="Resting HR"
                  unit="bpm"
                  domain={[40, 90]}
                  reversed
                />
                <ZAxis 
                  type="number" 
                  dataKey="readinessScore" 
                  range={[100, 1000]} 
                  name="Readiness" 
                />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }} 
                  formatter={(value, name) => {
                    if (name === 'hrv') return [`${value} ms`, 'HRV'];
                    if (name === 'restingHr') return [`${value} bpm`, 'Resting HR'];
                    if (name === 'readinessScore') return [`${value}%`, 'Readiness'];
                    if (name === 'trainingLoad') return [`${value}%`, 'Training Load'];
                    if (name === 'sleepDuration') return [`${value} h`, 'Sleep'];
                    if (name === 'spo2') return [`${value}%`, 'SpO2'];
                    return [value, name];
                  }}
                />
                {/* Create scatter plots for each athlete */}
                {selectedAthletes.map((athleteId, index) => {
                  const athlete = athletes.find(a => a.athlete_id === athleteId);
                  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];
                  const color = colors[index % colors.length];
                  const athleteData = athleteDataMap[athleteId] || [];

                  return (
                    <Scatter
                      key={`scatter-${athleteId}`}
                      name={`${athlete?.name || 'Unknown'} - Recovery State`}
                      data={athleteData}
                      fill={color}
                    >
                      {athleteData.map((entry, entryIndex) => (
                        <text
                          key={`label-${athleteId}-${entryIndex}`}
                          x={entry.hrv}
                          y={entry.restingHr}
                          dx={5}
                          dy={5}
                          fontSize={10}
                          fill="#000000"
                        >
                          {Math.round(entry.readinessScore)}%
                        </text>
                      ))}
                    </Scatter>
                  );
                })}
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>
        
        {/* Events Timeline */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recovery Events</h3>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            
            <div className="space-y-6">
               {selectedAthletes.map(athleteId => {
                 const athlete = athletes.find(a => a.athlete_id === athleteId);
                 const athleteData = athleteDataMap[athleteId] || [];
                 const athleteEvents = athleteData
                   .filter(d => d.events.length > 0)
                   .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                 if (athleteEvents.length === 0) return null;

                 return (
                   <div key={athleteId} className="space-y-4">
                     <h4 className="font-semibold text-gray-800 border-b pb-2">
                       {athlete?.name || 'Unknown Athlete'}
                     </h4>
                     {athleteEvents.map((data, index) => (
                       <div key={`${athleteId}-${index}`} className="relative flex items-start">
                         <div className="absolute left-2 w-4 h-4 rounded-full bg-blue-500 border-4 border-white shadow"></div>
                         <div className="ml-10 min-w-0">
                           <div className="font-medium text-gray-900">
                             {new Date(data.date).toLocaleDateString('en-US', {
                               weekday: 'long',
                               year: 'numeric',
                               month: 'long',
                               day: 'numeric'
                             })}
                           </div>
                           <div className="mt-1 flex flex-wrap gap-2">
                             {data.events.map((event, eventIndex) => (
                               <span
                                 key={eventIndex}
                                 className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                   event.includes('High') ? 'bg-red-100 text-red-800' :
                                   event.includes('Low') || event.includes('Short') ? 'bg-yellow-100 text-yellow-800' :
                                   event.includes('Elevated') ? 'bg-orange-100 text-orange-800' :
                                   'bg-blue-100 text-blue-800'
                                 }`}
                               >
                                 {event}
                               </span>
                             ))}
                           </div>
                           <div className="mt-2 text-sm text-gray-600">
                             Readiness: <span className="font-medium">{data.readinessScore.toFixed(0)}%</span> •
                             HRV: <span className="font-medium">{data.hrv} ms</span> •
                             Sleep: <span className="font-medium">{data.sleepDuration.toFixed(1)}h</span>
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 );
               })}
            </div>
          </div>
        </div>
        
        {/* Summary Stats */}
        {(() => {
          // Calculate aggregate stats across all selected athletes
          const allData = Object.values(athleteDataMap).flat();
          const latestReadiness = allData.length > 0
            ? Math.round(allData[allData.length - 1].readinessScore)
            : 0;
          const avgReadiness = allData.length > 0
            ? Math.round(allData.reduce((sum, d) => sum + d.readinessScore, 0) / allData.length)
            : 0;
          const highReadinessDays = allData.filter(d => d.readinessScore > 75).length;
          const eventsDetected = allData.filter(d => d.events.length > 0).length;

          return (
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card-enhanced p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {latestReadiness}%
                </div>
                <div className="text-sm text-gray-600">Latest Readiness</div>
              </div>
              <div className="card-enhanced p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {avgReadiness}%
                </div>
                <div className="text-sm text-gray-600">Avg Readiness</div>
              </div>
              <div className="card-enhanced p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {highReadinessDays}
                </div>
                <div className="text-sm text-gray-600">High Readiness Days</div>
              </div>
              <div className="card-enhanced p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {eventsDetected}
                </div>
                <div className="text-sm text-gray-600">Events Detected</div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};