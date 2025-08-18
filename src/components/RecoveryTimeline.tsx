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
}

export const RecoveryTimeline: React.FC = () => {
  const [selectedAthlete, setSelectedAthlete] = useState<string>(athletes[0].athlete_id);
  const [timeRange, setTimeRange] = useState<'7' | '14' | '30' | '90'>('30');
  const [viewMode, setViewMode] = useState<'line' | 'scatter'>('line');

  // Get recovery data for selected athlete
  const recoveryData = useMemo<RecoveryDataPoint[]>(() => {
    const athleteBiometrics = biometricData.filter(d => d.athlete_id === selectedAthlete);
    
    // Sort by date
    athleteBiometrics.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Filter by time range
    const days = parseInt(timeRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const filteredData = athleteBiometrics.filter(d => 
      new Date(d.date) >= cutoffDate
    );
    
    return filteredData.map(data => {
      const readinessScore = calculateReadinessScore(data);
      
      // Simulate some events based on data patterns
      const events: string[] = [];
      if (data.training_load_pct > 90) events.push('High Load Session');
      if (data.hrv_night < 40) events.push('Low HRV');
      if (data.sleep_duration_h < 6) events.push('Short Sleep');
      if (data.resting_hr > 70) events.push('Elevated RHR');
      
      return {
        date: data.date,
        readinessScore: readinessScore,
        hrv: data.hrv_night,
        restingHr: data.resting_hr,
        sleepDuration: data.sleep_duration_h,
        spo2: data.spo2_night,
        trainingLoad: data.training_load_pct,
        events: events
      };
    });
  }, [selectedAthlete, timeRange]);

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
        
        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-6">
          {/* Athlete Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Athlete</label>
            <select
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={selectedAthlete}
              onChange={(e) => setSelectedAthlete(e.target.value)}
            >
              {athletes.map(athlete => (
                <option key={athlete.athlete_id} value={athlete.athlete_id}>
                  {athlete.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Time Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
            <div className="flex gap-1">
              {(['7', '14', '30', '90'] as const).map(range => (
                <button
                  key={range}
                  className={`px-3 py-1.5 text-sm rounded-md ${
                    timeRange === range
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setTimeRange(range)}
                >
                  {range}d
                </button>
              ))}
            </div>
          </div>
          
          {/* View Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">View</label>
            <div className="flex gap-1">
              <button
                className={`px-3 py-1.5 text-sm rounded-md ${
                  viewMode === 'line'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setViewMode('line')}
              >
                Line Chart
              </button>
              <button
                className={`px-3 py-1.5 text-sm rounded-md ${
                  viewMode === 'scatter'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setViewMode('scatter')}
              >
                Scatter Plot
              </button>
            </div>
          </div>
        </div>
        
        {/* Chart */}
        <div className="h-96">
          {viewMode === 'line' ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={recoveryData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  interval="preserveStartEnd"
                />
                <YAxis yAxisId="left" domain={[0, 100]} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'readinessScore') return [`${value}%`, 'Readiness'];
                    if (name === 'trainingLoad') return [`${value}%`, 'Training Load'];
                    if (name === 'hrv') return [value, 'HRV (ms)'];
                    if (name === 'restingHr') return [value, 'RHR (bpm)'];
                    if (name === 'sleepDuration') return [value, 'Sleep (h)'];
                    if (name === 'spo2') return [value, 'SpO2 (%)'];
                    return [value, name];
                  }}
                  labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString()}`}
                />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="readinessScore" 
                  name="Readiness Score" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="trainingLoad" 
                  name="Training Load" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  strokeDasharray="3 3"
                />
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
                  domain={[30, 80]} 
                />
                <YAxis 
                  type="number" 
                  dataKey="restingHr" 
                  name="Resting HR" 
                  unit="bpm" 
                  domain={[45, 80]} 
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
                <Scatter 
                  name="Recovery State" 
                  data={recoveryData} 
                  fill="#8884d8" 
                >
                  {recoveryData.map((entry, index) => (
                    <text 
                      key={`label-${index}`} 
                      x={entry.hrv} 
                      y={entry.restingHr} 
                      dx={5} 
                      dy={5} 
                      fontSize={12} 
                      fill="#000000"
                    >
                      {Math.round(entry.readinessScore)}%
                    </text>
                  ))}
                </Scatter>
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
              {recoveryData
                .filter(d => d.events.length > 0)
                .map((data, index) => (
                  <div key={index} className="relative flex items-start">
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
                ))
              }
            </div>
          </div>
        </div>
        
        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card-enhanced p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {recoveryData.length > 0 
                ? Math.round(recoveryData[recoveryData.length - 1].readinessScore) 
                : '0'}%
            </div>
            <div className="text-sm text-gray-600">Current Readiness</div>
          </div>
          <div className="card-enhanced p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {recoveryData.length > 0 
                ? Math.round(recoveryData.reduce((sum, d) => sum + d.readinessScore, 0) / recoveryData.length) 
                : '0'}%
            </div>
            <div className="text-sm text-gray-600">Avg Readiness</div>
          </div>
          <div className="card-enhanced p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {recoveryData.filter(d => d.readinessScore > 75).length}
            </div>
            <div className="text-sm text-gray-600">High Readiness Days</div>
          </div>
          <div className="card-enhanced p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {recoveryData.filter(d => d.events.length > 0).length}
            </div>
            <div className="text-sm text-gray-600">Events Detected</div>
          </div>
        </div>
      </div>
    </div>
  );
};