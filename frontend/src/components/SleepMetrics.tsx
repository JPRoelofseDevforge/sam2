import React, { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import { BiometricData } from '../types';

interface SleepMetricsProps {
  biometricData: BiometricData[];
  athleteId: string;
}

// Helper function to calculate standard deviation
const calculateStandardDeviation = (values: number[]): number => {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
  const variance = squaredDifferences.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.sqrt(variance);
};

// Helper function to calculate sleep debt
const calculateSleepDebt = (sleepDuration: number, recommendedHours: number): number => {
  return sleepDuration - recommendedHours;
};

// Helper function to calculate sleep consistency (standard deviation of bed/wake times)
const calculateSleepConsistency = (sleepOnsetTimes: string[], wakeTimes: string[]): number => {
  // Convert times to minutes since midnight for calculation
  const sleepOnsetMinutes = sleepOnsetTimes.map(time => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  });
  
  const wakeMinutes = wakeTimes.map(time => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  });
  
  // Calculate standard deviation of sleep onset times
  const onsetStdDev = calculateStandardDeviation(sleepOnsetMinutes);
  const wakeStdDev = calculateStandardDeviation(wakeMinutes);
  
  // Return the average of both standard deviations
  return (onsetStdDev + wakeStdDev) / 2;
};

// Helper function to determine consistency level
const getConsistencyLevel = (stdDev: number): string => {
  if (stdDev <= 15) return 'High';
  if (stdDev <= 45) return 'Moderate';
  return 'Low';
};

// Helper function to determine consistency color
const getConsistencyColor = (stdDev: number): string => {
  if (stdDev <= 15) return '#10B981'; // Green
  if (stdDev <= 45) return '#F59E0B'; // Yellow
  return '#EF4444'; // Red
};

// Helper function to convert minutes to time string
const formatMinutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// Helper function to calculate sleep efficiency
const calculateSleepEfficiency = (sleepDuration: number, timeInBed: number): number => {
  return timeInBed > 0 ? (sleepDuration / timeInBed) * 100 : 0;
};

// Helper function to determine chronotype
const determineChronotype = (sleepOnsetTime: string, wakeTime: string): string => {
  const [onsetHours] = sleepOnsetTime.split(':').map(Number);
  const [wakeHours] = wakeTime.split(':').map(Number);
  
  // Simple chronotype determination based on sleep timing
  // Morning type: prefers early bedtimes and wake times
  // Evening type: prefers late bedtimes and wake times
  // Intermediate: in between
  if (onsetHours >= 23 || (onsetHours >= 0 && onsetHours <= 5)) {
    return 'Evening Type';
  } else if (onsetHours >= 21 && onsetHours <= 22) {
    return 'Intermediate';
  } else {
    return 'Morning Type';
  }
};

// Helper function to check if chronotype is optimal
  const isChronotypeOptimal = (chronotype: string, recommendedWindow: string): boolean => {
    // Simplified check - in a real app, this would be more complex
    return true; // For now, always return true
  };

// Helper function to calculate sleep stage distribution
const calculateSleepStageDistribution = (deepSleep: number, remSleep: number, lightSleep: number): { name: string; value: number }[] => {
  return [
    { name: 'Deep Sleep', value: deepSleep },
    { name: 'REM Sleep', value: remSleep },
    { name: 'Light Sleep', value: lightSleep }
  ];
};

// Helper function to get sleep stress indicators
const getSleepStressIndicators = (biometricData: BiometricData[]): string[] => {
  const indicators: string[] = [];
  
  biometricData.forEach(data => {
    // Fragmentation (wake-ups/hour) - we'll simulate this based on sleep data
    if (data.sleep_duration_h < 6) {
      indicators.push('Fragmented Sleep');
    }
    
    // HRV suppression during sleep - we'll check if HRV is low
    if (data.hrv_night < 40) {
      indicators.push('HRV Suppression');
    }
    
    // Resting HR not dropping at night - we'll check if resting HR is elevated
    if (data.resting_hr > 70) {
      indicators.push('Elevated Resting HR');
    }
    
    // Low deep sleep percentage
    if (data.deep_sleep_pct < 15) {
      indicators.push('Low Deep Sleep');
    }
    
    // Low REM sleep percentage
    if (data.rem_sleep_pct < 15) {
      indicators.push('Low REM Sleep');
    }
  });
  
  return indicators;
};

export const SleepMetrics: React.FC<SleepMetricsProps> = ({ biometricData, athleteId }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d'>('30d');
  
  // Filter data based on selected period
  const filteredData = selectedPeriod === '7d' 
    ? biometricData.slice(-7) 
    : biometricData.slice(-30);
  
  // Debug: Log sleep timing data to understand what's available
  console.log('🔍 SleepMetrics: Analyzing sleep timing data for', filteredData.length, 'records');
  filteredData.forEach((data, index) => {
    console.log(`📊 Record ${index + 1}: sleep_onset_time="${data.sleep_onset_time}", wake_time="${data.wake_time}", sleep_duration=${data.sleep_duration_h}`);
  });

  // Calculate sleep metrics
  const sleepDebtData = filteredData.map(data => {
    // Calculate recommended sleep based on age and athlete type (simplified)
    // In a real app, this would be more sophisticated and possibly use genetic data
    const recommendedSleep = 8; // Default to 8 hours for adult athletes
    const sleepDebt = calculateSleepDebt(data.sleep_duration_h, recommendedSleep);
    
    // Calculate time in bed from sleep onset and wake time
    const parseTimeToMinutes = (timeString: string) => {
      if (!timeString || timeString === '00:00' || timeString === '') {
        return null; // Return null for invalid/missing times
      }
      const [hours, minutes] = timeString.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) {
        return null;
      }
      return hours * 60 + minutes;
    };

    const sleepOnsetMinutes = parseTimeToMinutes(data.sleep_onset_time || '');
    const wakeMinutes = parseTimeToMinutes(data.wake_time || '');

    // Calculate time in bed - use fallback if timing data is missing
    let timeInBedHours = 0;
    if (sleepOnsetMinutes !== null && wakeMinutes !== null) {
      // Handle case where wake time is next day (before sleep onset)
      let timeInBedMinutes = wakeMinutes - sleepOnsetMinutes;
      if (timeInBedMinutes < 0) {
        timeInBedMinutes += 24 * 60; // Add 24 hours in minutes
      }
      timeInBedHours = timeInBedMinutes / 60;
    } else {
      // Fallback: estimate time in bed as sleep duration + 30 minutes (for falling asleep)
      timeInBedHours = data.sleep_duration_h + 0.5;
    }
    
    return {
      date: data.date,
      sleepDebt,
      sleepDuration: data.sleep_duration_h,
      recommendedSleep: recommendedSleep,
      deepSleep: data.deep_sleep_pct,
      remSleep: data.rem_sleep_pct,
      lightSleep: data.light_sleep_pct,
      sleepEfficiency: (() => {
        const efficiency = calculateSleepEfficiency(data.sleep_duration_h, timeInBedHours);
        console.log(`📊 Sleep Efficiency calc: sleep=${data.sleep_duration_h}h, timeInBed=${timeInBedHours}h, efficiency=${efficiency}%`);
        return efficiency;
      })(),
      sleepOnsetTime: data.sleep_onset_time || '00:00',
      wakeTime: data.wake_time || '00:00',
      chronotype: (data.sleep_onset_time && data.sleep_onset_time !== '00:00' && data.wake_time && data.wake_time !== '00:00')
        ? determineChronotype(data.sleep_onset_time, data.wake_time)
        : 'Unknown (Missing timing data)',
      sleepStressIndicators: getSleepStressIndicators([data])
    };
  });
  
  // Calculate sleep consistency - only use data with valid timing
  const validTimingData = filteredData.filter(d =>
    d.sleep_onset_time && d.sleep_onset_time !== '00:00' &&
    d.wake_time && d.wake_time !== '00:00'
  );

  let sleepConsistency = 0;
  let consistencyLevel = 'Unknown';
  let consistencyColor = '#9CA3AF';

  if (validTimingData.length >= 2) {
    const sleepOnsetTimes = validTimingData.map(d => d.sleep_onset_time!);
    const wakeTimes = validTimingData.map(d => d.wake_time!);
    sleepConsistency = calculateSleepConsistency(sleepOnsetTimes, wakeTimes);
    consistencyLevel = getConsistencyLevel(sleepConsistency);
    consistencyColor = getConsistencyColor(sleepConsistency);
  } else {
    consistencyLevel = 'Insufficient Data';
  }
  
  // Calculate average sleep stage percentages
  const avgDeepSleep = filteredData.reduce((sum, d) => sum + d.deep_sleep_pct, 0) / filteredData.length;
  const avgRemSleep = filteredData.reduce((sum, d) => sum + d.rem_sleep_pct, 0) / filteredData.length;
  const avgLightSleep = filteredData.reduce((sum, d) => sum + d.light_sleep_pct, 0) / filteredData.length;
  
  // Calculate sleep stage distribution
  const sleepStageDistribution = calculateSleepStageDistribution(
    avgDeepSleep,
    avgRemSleep,
    avgLightSleep
  );
  
  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];
  
  // Sleep debt chart data
  const sleepDebtChartData = sleepDebtData.map(d => ({
    date: d.date,
    sleepDebt: d.sleepDebt
  }));
  
  // Sleep duration chart data
  const sleepDurationChartData = sleepDebtData.map(d => ({
    date: d.date,
    sleepDuration: d.sleepDuration,
    recommendedSleep: d.recommendedSleep
  }));
  
  // Sleep efficiency chart data
  const sleepEfficiencyChartData = sleepDebtData.map(d => ({
    date: d.date,
    sleepEfficiency: d.sleepEfficiency
  }));
  
  // Sleep stages chart data
  const sleepStagesChartData = sleepDebtData.map(d => ({
    date: d.date,
    deepSleep: d.deepSleep,
    remSleep: d.remSleep,
    lightSleep: d.lightSleep
  }));
  
  // Sleep timing chart data - convert time strings to minutes for better visualization
  const sleepTimingChartData = sleepDebtData.map(d => {
    const parseTimeToMinutes = (timeString: string) => {
      if (!timeString || timeString === '00:00' || timeString === '') {
        return null; // Return null for invalid/missing times
      }
      const [hours, minutes] = timeString.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) {
        return null;
      }
      return hours * 60 + minutes;
    };

    const sleepOnset = parseTimeToMinutes(d.sleepOnsetTime);
    const wakeTime = parseTimeToMinutes(d.wakeTime);

    // If timing data is missing, provide reasonable estimates based on sleep duration
    const estimatedSleepOnset = sleepOnset !== null ? sleepOnset :
      d.sleepDuration >= 8 ? 1320 : // 10 PM for long sleepers
      d.sleepDuration >= 7 ? 1380 : // 11 PM for normal sleepers
      1440; // 12 AM for short sleepers

    const estimatedWakeTime = wakeTime !== null ? wakeTime :
      estimatedSleepOnset + (d.sleepDuration * 60);

    return {
      date: d.date,
      sleepOnset: estimatedSleepOnset,
      wakeTime: estimatedWakeTime % 1440, // Wrap around 24 hours
      hasRealTimingData: sleepOnset !== null && wakeTime !== null
    };
  });
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold text-white">🌙 Sleep Metrics</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedPeriod('7d')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedPeriod === '7d'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setSelectedPeriod('30d')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedPeriod === '30d'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            30 Days
          </button>
        </div>
      </div>
      
      {/* Sleep Debt Gauge */}
      <div className="card-enhanced p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Sleep Debt</h3>
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <div className="relative w-48 h-48 mx-auto">
              {/* Gauge background */}
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                />
                {/* Gauge fill */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={sleepDebtData.length > 0 ? 
                    sleepDebtData[sleepDebtData.length - 1].sleepDebt > 0 ? 
                      '#10B981' : '#EF4444' : '#9CA3AF'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.abs(sleepDebtData.length > 0 ? 
                    sleepDebtData[sleepDebtData.length - 1].sleepDebt : 0) * 10}, 1000`}
                  transform="rotate(-90 50 50)"
                />
                {/* Center text */}
                <text
                  x="50"
                  y="50"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-2xl font-bold"
                >
                  {sleepDebtData.length > 0 ? 
                    sleepDebtData[sleepDebtData.length - 1].sleepDebt.toFixed(1) : '0.0'}
                </text>
                <text
                  x="50"
                  y="60"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-sm text-gray-600"
                >
                  Hours
                </text>
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900">Current Sleep Debt</h4>
                <p className="text-2xl font-bold mt-1">
                  {sleepDebtData.length > 0 ? 
                    sleepDebtData[sleepDebtData.length - 1].sleepDebt.toFixed(1) : '0.0'} hours
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {sleepDebtData.length > 0 && sleepDebtData[sleepDebtData.length - 1].sleepDebt > 0
                    ? 'You are in debt - need more sleep'
                    : 'You are catching up - good job!'}
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900">Sleep Consistency</h4>
                <p className="text-2xl font-bold mt-1">
                  {sleepConsistency.toFixed(1)} min
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Standard deviation of bed/wake times
                </p>
                <div className="mt-2">
                  <span className={`inline-block w-3 h-3 rounded-full mr-2`} style={{ backgroundColor: consistencyColor }}></span>
                  <span className="text-sm font-medium">
                    {consistencyLevel} Consistency
                  </span>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900">Chronotype</h4>
                <p className="text-2xl font-bold mt-1">
                  {sleepDebtData.length > 0 ? sleepDebtData[sleepDebtData.length - 1].chronotype : 'Unknown'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {sleepDebtData.length > 0 && !sleepDebtData[sleepDebtData.length - 1].chronotype.includes('Unknown') && isChronotypeOptimal(
                    sleepDebtData[sleepDebtData.length - 1].chronotype,
                    'Optimal window'
                  ) ? 'Within optimal window' : sleepDebtData[sleepDebtData.length - 1]?.chronotype.includes('Unknown') ? 'Insufficient timing data' : 'Outside optimal window'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Sleep Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sleep Duration Trend */}
        <div className="card-enhanced p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Sleep Duration Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={sleepDurationChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                              contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#1f2937' }}
                            />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="sleepDuration" 
                name="Actual Sleep (h)" 
                stroke="#3b82f6" 
                strokeWidth={3} 
                dot={{ r: 4 }} 
              />
              <Line 
                type="monotone" 
                dataKey="recommendedSleep" 
                name="Recommended (8h)" 
                stroke="#94a3b8" 
                strokeWidth={2} 
                strokeDasharray="5 5" 
                dot={false} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Sleep Debt Trend */}
        <div className="card-enhanced p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📉 Sleep Debt Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sleepDebtChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                              formatter={(value) => [`${Number(value).toFixed(1)} hours`, 'Sleep Debt']}
                              contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#1f2937' }}
                            />
              <Legend />
              <Bar 
                dataKey="sleepDebt" 
                name="Sleep Debt (hours)" 
                fill={sleepDebtChartData.length > 0 && sleepDebtChartData[sleepDebtChartData.length - 1].sleepDebt > 0 ? '#EF4444' : '#10B981'} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Sleep Efficiency and Stages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sleep Efficiency */}
        <div className="card-enhanced p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📊 Sleep Efficiency
            {sleepDebtData.some(d => !d.sleepOnsetTime || d.sleepOnsetTime === '00:00' || !d.wakeTime || d.wakeTime === '00:00') && (
              <span className="text-sm font-normal text-gray-600 ml-2">
                (estimated where timing data unavailable)
              </span>
            )}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={sleepEfficiencyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis
                              stroke="#6b7280"
                              domain={[0, 100]}
                              tickFormatter={(value) => `${Number(value).toFixed(1)}%`}
                            />
                            <Tooltip
                              formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Efficiency']}
                              contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#1f2937' }}
                            />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="sleepEfficiency" 
                name="Efficiency (%)" 
                stroke="#8b5cf6" 
                strokeWidth={3} 
                dot={{ r: 4 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Sleep Stage Distribution */}
        <div className="card-enhanced p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🌙 Sleep Stage Distribution</h3>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sleepStageDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent ? percent * 100 : 0).toFixed(0)}%`}
                  >
                    {sleepStageDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Percentage']}
                    contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#1f2937' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1">
              <div className="space-y-3">
                {sleepStageDistribution.map((stage, index) => (
                  <div key={stage.name} className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded-full mr-3" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{stage.name}</div>
                      <div className="text-sm text-gray-600">{stage.value.toFixed(1)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Sleep Timing */}
      <div className="card-enhanced p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ⏰ Sleep Timing
          {sleepTimingChartData.some(d => !d.hasRealTimingData) && (
            <span className="text-sm font-normal text-gray-600 ml-2">
              (estimated times where data unavailable)
            </span>
          )}
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={sleepTimingChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#6b7280" />
            <YAxis
              stroke="#6b7280"
              domain={[0, 1440]} // 0 to 24 hours in minutes
              tickFormatter={(value) => formatMinutesToTime(value)}
            />
            <Tooltip
                          contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#1f2937' }}
                          formatter={(value, name, props) => {
                            const timeStr = formatMinutesToTime(Number(value));
                            const isEstimated = !props.payload.hasRealTimingData;
                            return [
                              `${timeStr}${isEstimated ? ' (estimated)' : ''}`,
                              name
                            ];
                          }}
                          labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString()}`}
                        />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="sleepOnset" 
              name="Bed Time" 
              stroke="#10B981" 
              strokeWidth={3} 
              dot={{ r: 4 }} 
              activeDot={{ r: 6 }} 
            />
            <Line 
              type="monotone" 
              dataKey="wakeTime" 
              name="Wake Time" 
              stroke="#F59E0B" 
              strokeWidth={3} 
              dot={{ r: 4 }} 
              activeDot={{ r: 6 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Sleep Stress Indicators */}
      <div className="card-enhanced p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">⚠️ High Sleep Stress Indicators</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sleepDebtData.length > 0 && sleepDebtData[sleepDebtData.length - 1].sleepStressIndicators.length > 0 ? (
            sleepDebtData[sleepDebtData.length - 1].sleepStressIndicators.map((indicator, index) => (
              <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                      <span className="text-red-600">⚠️</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-red-800">{indicator}</h4>
                    <p className="text-xs text-red-600 mt-1">
                      {indicator === 'Fragmented Sleep' && 'Frequent wake-ups during the night'}
                                            {indicator === 'HRV Suppression' && 'Low HRV during sleep indicates stress'}
                                            {indicator === 'Elevated Resting HR' && 'High resting heart rate at night'}
                                            {indicator === 'Low Deep Sleep' && 'Insufficient deep sleep for recovery'}
                                            {indicator === 'Low REM Sleep' && 'Insufficient REM sleep for cognitive recovery'}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-8 text-gray-600">
              <p>No sleep stress indicators detected</p>
              <p className="text-sm mt-2">Great job maintaining healthy sleep patterns!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};