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
  ResponsiveContainer
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

 // Helper function to calculate sleep debt (positive = debt, negative = surplus)
const calculateSleepDebt = (sleepDuration: number, recommendedHours: number): number => {
  // Sleep debt is the shortfall relative to recommendation. Positive means you owe sleep.
  return Math.max(0, recommendedHours - sleepDuration);
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

// Clamp helper
const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val));

// Composite Sleep Quality Score (0-100)
// Weights: Duration 35%, Efficiency 30%, Deep 20%, REM 15%
const calculateSleepQualityScore = (
  sleepDurationH: number,
  sleepEfficiencyPct: number,
  deepPct: number,
  remPct: number,
  recommendedH: number
): number => {
  const durationFactor = clamp((sleepDurationH || 0) / (recommendedH || 8), 0, 1);
  // Target ~90% efficiency as excellent
  const efficiencyFactor = clamp((sleepEfficiencyPct || 0) / 90, 0, 1);
  const deepFactor = clamp((deepPct || 0) / 20, 0, 1);
  const remFactor = clamp((remPct || 0) / 18, 0, 1);

  const score =
    durationFactor * 0.35 +
    efficiencyFactor * 0.30 +
    deepFactor * 0.20 +
    remFactor * 0.15;

  return Math.round(score * 100);
};

// Return normalized sub-scores (0..1) for UI progress bars
const computeSubScores = (d: {
  sleepDuration: number;
  sleepEfficiency: number;
  deepSleep: number;
  remSleep: number;
  recommendedSleep: number;
}) => {
  return {
    duration: clamp((d.sleepDuration || 0) / (d.recommendedSleep || 8), 0, 1),
    efficiency: clamp((d.sleepEfficiency || 0) / 90, 0, 1),
    deep: clamp((d.deepSleep || 0) / 20, 0, 1),
    rem: clamp((d.remSleep || 0) / 18, 0, 1)
  };
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
  const total = deepSleep + remSleep + lightSleep;
  if (total === 0) {
    return [
      { name: 'Deep Sleep', value: 0 },
      { name: 'REM Sleep', value: 0 },
      { name: 'Light Sleep', value: 0 }
    ];
  }

  // Normalize to ensure they add up to 100%
  const normalizedDeep = (deepSleep / total) * 100;
  const normalizedRem = (remSleep / total) * 100;
  const normalizedLight = (lightSleep / total) * 100;

  return [
    { name: 'Deep Sleep', value: normalizedDeep },
    { name: 'REM Sleep', value: normalizedRem },
    { name: 'Light Sleep', value: normalizedLight }
  ];
};

// Helper function to get sleep stress indicators
const getSleepStressIndicators = (biometricData: BiometricData[]): string[] => {
  const indicators: string[] = [];

  biometricData.forEach(data => {
    // Fragmentation (proxy via short duration)
    const durationH = data.sleep_duration_h ?? 0;
    if (durationH > 0 && durationH < 6) {
      indicators.push('Fragmented Sleep');
    }

    // HRV suppression during sleep
    const hrv = data.hrv_night ?? 0;
    if (hrv > 0 && hrv < 40) {
      indicators.push('HRV Suppression');
    }

    // Resting HR elevated at night
    const rhr = data.resting_hr ?? 0;
    if (rhr > 70) {
      indicators.push('Elevated Resting HR');
    }

    // Low deep sleep percentage
    const deep = data.deep_sleep_pct ?? 0;
    if (deep > 0 && deep < 15) {
      indicators.push('Low Deep Sleep');
    }

    // Low REM sleep percentage
    const rem = data.rem_sleep_pct ?? 0;
    if (rem > 0 && rem < 15) {
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
  
  // Debug logs removed for production stability

  // Helper function to parse time to minutes
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

   // Calculate sleep metrics
    const sleepDebtData = filteredData.map(data => {
      const recommendedSleep = 8; // Default to 8 hours for adult athletes
      const sleepDuration = data.sleep_duration_h || 0;
  
      // Daily sleep debt (positive = owe sleep, zero-floored)
      const sleepDebt = calculateSleepDebt(sleepDuration, recommendedSleep);
      // Sleep balance (positive = surplus, negative = deficit)
      const sleepBalance = sleepDuration - recommendedSleep;
  
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
        timeInBedHours = sleepDuration + 0.5;
      }
  
      return {
        date: data.date,
        sleepDebt,
        sleepBalance,
        sleepDuration,
        recommendedSleep,
        deepSleep: data.deep_sleep_pct || 0,
        remSleep: data.rem_sleep_pct || 0,
        lightSleep: data.light_sleep_pct || 0,
        sleepEfficiency: sleepDuration > 0 && timeInBedHours > 0 ? calculateSleepEfficiency(sleepDuration, timeInBedHours) : 0,
        timeInBed: timeInBedHours,
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
  
    // Calculate average sleep stage percentages (guard for empty datasets)
    const avgDeepSleep = filteredData.length > 0 ? filteredData.reduce((sum, d) => sum + (d.deep_sleep_pct || 0), 0) / filteredData.length : 0;
    const avgRemSleep = filteredData.length > 0 ? filteredData.reduce((sum, d) => sum + (d.rem_sleep_pct || 0), 0) / filteredData.length : 0;
    const avgLightSleep = filteredData.length > 0 ? filteredData.reduce((sum, d) => sum + (d.light_sleep_pct || 0), 0) / filteredData.length : 0;

    // Use latest sleep data for stage distribution
    const lastData = filteredData.length > 0 ? filteredData[filteredData.length - 1] : null;

  // Calculate sleep stage distribution based on latest data
  const sleepStageDistribution = lastData ? calculateSleepStageDistribution(
    lastData.deep_sleep_pct || 0,
    lastData.rem_sleep_pct || 0,
    lastData.light_sleep_pct || 0
  ) : calculateSleepStageDistribution(0, 0, 0);
  
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
      (d.sleepDuration || 0) >= 8 ? 1320 : // 10 PM for long sleepers
      (d.sleepDuration || 0) >= 7 ? 1380 : // 11 PM for normal sleepers
      1440; // 12 AM for short sleepers

    const estimatedWakeTime = wakeTime !== null ? wakeTime :
      estimatedSleepOnset + ((d.sleepDuration || 0) * 60);

    return {
      date: d.date,
      sleepOnset: estimatedSleepOnset,
      wakeTime: estimatedWakeTime % 1440, // Wrap around 24 hours
      hasRealTimingData: sleepOnset !== null && wakeTime !== null
    };
  });
  
  // Use latest sleep data for quality score (same as stage distribution)
  const latestData = filteredData.length > 0 ? filteredData[filteredData.length - 1] : null;

  // Calculate sleep quality metrics based on latest data (normalized percentages)
  const rawDeep = latestData ? (latestData.deep_sleep_pct || 0) : 0;
  const rawRem = latestData ? (latestData.rem_sleep_pct || 0) : 0;
  const rawLight = latestData ? (latestData.light_sleep_pct || 0) : 0;

  // Normalize to ensure they add up to 100%
  const totalRaw = rawDeep + rawRem + rawLight;
  const normalizedDeep = totalRaw > 0 ? (rawDeep / totalRaw) * 100 : 0;
  const normalizedRem = totalRaw > 0 ? (rawRem / totalRaw) * 100 : 0;
  const normalizedLight = totalRaw > 0 ? (rawLight / totalRaw) * 100 : 0;

  const lastNightScore = latestData
    ? calculateSleepQualityScore(
        latestData.sleep_duration_h || 0,
        calculateSleepEfficiency(
          latestData.sleep_duration_h || 0,
          (latestData.sleep_duration_h || 0) + 0.5 // Estimate time in bed as sleep duration + 30 min
        ),
        normalizedDeep,
        normalizedRem,
        8 // Recommended sleep hours
      )
    : 0;

  const avgSleepScore =
    sleepDebtData.length > 0
      ? Math.round(
          sleepDebtData.reduce(
            (sum, d) =>
              sum +
              calculateSleepQualityScore(
                d.sleepDuration,
                d.sleepEfficiency,
                d.deepSleep,
                d.remSleep,
                d.recommendedSleep
              ),
            0
          ) / sleepDebtData.length
        )
      : 0;

  const lastSubScores = latestData ? computeSubScores({
    sleepDuration: latestData.sleep_duration_h || 0,
    sleepEfficiency: calculateSleepEfficiency(
      latestData.sleep_duration_h || 0,
      (latestData.sleep_duration_h || 0) + 0.5
    ),
    deepSleep: normalizedDeep,
    remSleep: normalizedRem,
    recommendedSleep: 8
  }) : { duration: 0, efficiency: 0, deep: 0, rem: 0 };

  // Aggregates
  const cumulativeSleepDebt = sleepDebtData.reduce((sum, d) => sum + (d.sleepDebt || 0), 0);
  const totalSleepCredit = sleepDebtData.reduce((sum, d) => sum + Math.max(0, d.sleepBalance || 0), 0);
  const avgSleepEfficiency =
    sleepDebtData.length > 0
      ? sleepDebtData.reduce((sum, d) => sum + (d.sleepEfficiency || 0), 0) / sleepDebtData.length
      : 0;
  const avgSleepDuration =
    sleepDebtData.length > 0
      ? sleepDebtData.reduce((sum, d) => sum + (d.sleepDuration || 0), 0) / sleepDebtData.length
      : 0;
  const deficitDays = sleepDebtData.filter(d => (d.sleepDebt || 0) > 0).length;
  const surplusDays = sleepDebtData.filter(d => (d.sleepBalance || 0) > 0).length;

  // SpO2 low nights over the period
  const lowSpO2Nights = filteredData.filter(d => (d.spo2_night ?? 0) > 0 && (d.spo2_night ?? 100) < 95).length;

  // Personalized recommendations
  const getSleepRecommendations = (): string[] => {
    const recs: string[] = [];
    if (cumulativeSleepDebt > 3) {
      recs.push('High cumulative sleep debt — advance bedtime by 45–60 min and schedule 20–30 min naps 2–3× this week.');
    } else if (cumulativeSleepDebt > 1.5) {
      recs.push('Moderate sleep debt — aim for +30–60 min earlier bedtime the next few nights.');
    }

    if (avgSleepEfficiency < 85) {
      recs.push('Sleep efficiency below target — reduce time-in-bed and avoid screens 60 min before sleep.');
    }

    if (avgSleepDuration < 7) {
      recs.push('Average sleep duration is short — target at least 7–8 hours by shifting bedtime earlier.');
    }

    if (avgDeepSleep < 20) {
      recs.push('Deep sleep below 20% — consider earlier resistance training, reduce late caffeine, and evaluate magnesium (glycinate).');
    }

    if (avgRemSleep < 18) {
      recs.push('REM sleep below 18% — add evening relaxation routine; support with omega‑3 and vitamin B6 as appropriate.');
    }

    if (sleepConsistency > 45) {
      recs.push('Irregular bed/wake times — standardize within ±30 minutes to improve circadian alignment.');
    }

    if (lowSpO2Nights >= 2) {
      recs.push('Multiple low SpO₂ nights — evaluate airway/sleep environment and nasal breathing; consider air quality.');
    }

    if (recs.length === 0) {
      recs.push('Sleep metrics are on track — maintain consistent routine and recovery strategies.');
    }
    return recs;
  };

  const recommendations = getSleepRecommendations();

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
                  stroke={(sleepDebtData.length > 0) ? (
                    sleepDebtData.reduce((sum, d) => sum + d.sleepDebt, 0) > 3
                      ? '#EF4444'
                      : sleepDebtData.reduce((sum, d) => sum + d.sleepDebt, 0) > 1.5
                        ? '#F59E0B'
                        : '#10B981'
                  ) : '#9CA3AF'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.min(sleepDebtData.reduce((sum, d) => sum + d.sleepDebt, 0), 16) * 10}, 1000`}
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
                    sleepDebtData.reduce((sum, d) => sum + d.sleepDebt, 0).toFixed(1) : '0.0'}
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
                <h4 className="font-medium text-gray-900">Cumulative Sleep Debt ({selectedPeriod === '7d' ? '7 days' : '30 days'})</h4>
                <p className="text-2xl font-bold mt-1  text-gray-900">
                  {sleepDebtData.length > 0 ?
                    sleepDebtData.reduce((sum, d) => sum + d.sleepDebt, 0).toFixed(1) : '0.0'} hours
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {(() => {
                    const total = sleepDebtData.reduce((sum, d) => sum + d.sleepDebt, 0);
                    if (total > 3) return 'High sleep debt — prioritize earlier bedtime and naps this week';
                    if (total > 1.5) return 'Moderate sleep debt — aim for +30–60 min earlier bedtime';
                    return 'Minimal sleep debt — maintain your routine';
                  })()}
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900">Sleep Consistency</h4>
                <p className="text-2xl font-bold mt-1  text-gray-900">
                  {sleepConsistency.toFixed(1)} min
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Standard deviation of bed/wake times
                </p>
                <div className="mt-2">
                  <span className={`inline-block w-3 h-3 rounded-full mr-2`} style={{ backgroundColor: consistencyColor }}></span>
                  <span className="text-sm font-medium text-black">
                    {consistencyLevel} Consistency
                  </span>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900">Chronotype</h4>
                <p className="text-2xl font-bold mt-1 text-black">
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
      
      {/* Sleep Quality Score */}
      <div className="card-enhanced p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">⭐ Sleep Quality Score</h3>
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="text-center md:w-48">
            <div className="text-5xl font-extrabold text-gray-900">{lastNightScore}</div>
            <div className="text-sm text-gray-600">Last night</div>
            <div className="mt-1 text-xs text-gray-500">Avg {avgSleepScore} ({selectedPeriod === '7d' ? '7d' : '30d'})</div>
          </div>
          <div className="flex-1 w-full space-y-3">
            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Duration</span>
                <span>{latestData ? `${(latestData.sleep_duration_h || 0).toFixed(1)}h / 8h` : '—'}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${Math.round((lastSubScores.duration || 0) * 100)}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Efficiency</span>
                <span>{latestData ? `${Math.round(calculateSleepEfficiency(latestData.sleep_duration_h || 0, (latestData.sleep_duration_h || 0) + 0.5))}%` : '—'}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-violet-500" style={{ width: `${Math.round((lastSubScores.efficiency || 0) * 100)}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Deep</span>
                <span>{latestData ? `${normalizedDeep.toFixed(1)}% (${rawDeep.toFixed(1)}%)` : '—'}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-700" style={{ width: `${Math.round((lastSubScores.deep || 0) * 100)}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>REM</span>
                <span>{latestData ? `${normalizedRem.toFixed(1)}% (${rawRem.toFixed(1)}%)` : '—'}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${Math.round((lastSubScores.rem || 0) * 100)}%` }}></div>
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
              <YAxis stroke="#6b7280" tickFormatter={(value) => Number(value).toFixed(1)} />
              <Tooltip
                              contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#1f2937' }}
                              formatter={(value, name) => [`${Number(value).toFixed(1)} h`, name as string]}
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
              <YAxis stroke="#6b7280" tickFormatter={(value) => `${Number(value).toFixed(1)} h`} />
              <Tooltip
                              formatter={(value) => [`${Number(value).toFixed(1)} hours`, 'Sleep Debt']}
                              contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#1f2937' }}
                            />
              <Legend />
              <Bar
                dataKey="sleepDebt"
                name="Sleep Debt (hours)"
              >
                {sleepDebtChartData.map((entry, index) => (
                  <Cell key={`sd-cell-${index}`} fill={entry.sleepDebt > 0 ? '#EF4444' : '#10B981'} />
                ))}
              </Bar>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🌙 Latest Sleep Stage Distribution</h3>
          {lastData ? (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">Sleep stages from the most recent night ({new Date(lastData.date).toLocaleDateString()})</p>
              </div>
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={sleepStageDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}\n${(percent ? percent * 100 : 0).toFixed(1)}%`}
                      >
                        {sleepStageDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [`${Number(value).toFixed(1)}%`, name]}
                        contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#1f2937' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1">
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <h4 className="font-semibold text-gray-900">Stage Breakdown</h4>
                    </div>
                    {sleepStageDistribution.map((stage, index) => (
                      <div key={stage.name} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div
                              className="w-5 h-5 rounded-full mr-3"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            ></div>
                            <div>
                              <div className="font-medium text-gray-900">{stage.name}</div>
                              <div className="text-sm text-gray-600">
                                {stage.value.toFixed(1)}% of total sleep time
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">{stage.value.toFixed(1)}%</div>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full"
                              style={{
                                width: `${stage.value}%`,
                                backgroundColor: COLORS[index % COLORS.length]
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="text-center text-xs text-gray-500 mt-4">
                      Total: {sleepStageDistribution.reduce((sum, stage) => sum + stage.value, 0).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">
              <p>No sleep data available</p>
            </div>
          )}
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
      
      {/* 48-Hour Sleep Timeline (all sleep in window) */}
      {sleepDebtData.length > 0 && (() => {
        // Helpers for absolute time math
        const startOfDay = (dateStr: string) => {
          const d = new Date(dateStr);
          return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
        };
        const addMinutes = (dt: Date, mins: number) => new Date(dt.getTime() + mins * 60000);
        const minutesBetween = (a: Date, b: Date) => Math.round((a.getTime() - b.getTime()) / 60000);
        const clamp0to48h = (startAbs: number, endAbs: number) => ({
          start: Math.max(0, startAbs),
          end: Math.min(48 * 60, endAbs)
        });

        // Define the sleep segment type (absolute minutes from windowStart)
        interface SleepSegment {
          type: 'awake' | 'light' | 'deep' | 'rem';
          startAbs: number;
          endAbs: number;
          duration: number;
          label: string;
          color: string;
          segment?: string;
        }

        // Determine 48h window anchored to the last available date (midnight prior to last date)
        const lastRecord = sleepDebtData[sleepDebtData.length - 1];
        const lastDateMidnight = startOfDay(lastRecord.date);
        const windowStart = new Date(lastDateMidnight.getTime() - 24 * 60 * 60000); // previous day 00:00
        const windowEnd = new Date(windowStart.getTime() + 48 * 60 * 60000);

        // Color map
        const colorByType: Record<Exclude<SleepSegment['type'], 'awake'>, string> = {
          light: '#F59E0B',
          deep: '#1E40AF',
          rem: '#8B5CF6'
        };

        // Build segments for a single biometric record
        const buildSegmentsForRecord = (d: typeof sleepDebtData[number]): SleepSegment[] => {
          const segments: SleepSegment[] = [];
          const durationMin = Math.max(0, Math.round((d.sleepDuration || 0) * 60));
          if (durationMin <= 0) return segments;

          const onset = parseTimeToMinutes(d.sleepOnsetTime || '');
          const wake = parseTimeToMinutes(d.wakeTime || '');
          const day0 = startOfDay(d.date);
          let startDT: Date;
          let endDT: Date;

          if (onset !== null && wake !== null) {
            // If crosses midnight, start previous day at onset, end on report date at wake
            if (wake - onset < 0) {
              startDT = addMinutes(new Date(day0.getTime() - 24 * 60 * 60000), onset);
              endDT = addMinutes(day0, wake);
            } else {
              startDT = addMinutes(day0, onset);
              endDT = addMinutes(day0, wake);
            }
          } else if (onset !== null) {
            // No wake: estimate using duration. Assume onset after noon means crosses midnight to report date.
            const crosses = onset >= 12 * 60;
            startDT = crosses ? addMinutes(new Date(day0.getTime() - 24 * 60 * 60000), onset) : addMinutes(day0, onset);
            endDT = addMinutes(startDT, durationMin);
          } else if (wake !== null) {
            // No onset: end at wake on report date, backfill start via duration
            endDT = addMinutes(day0, wake);
            startDT = addMinutes(endDT, -durationMin);
          } else {
            // No timing: estimate around 22:00 previous day
            const estOnset = 22 * 60;
            startDT = addMinutes(new Date(day0.getTime() - 24 * 60 * 60000), estOnset);
            endDT = addMinutes(startDT, durationMin);
          }

          // Stage minutes based on percentages
          const deepMin = Math.round(durationMin * ((d.deepSleep || 0) / 100));
          const remMin = Math.round(durationMin * ((d.remSleep || 0) / 100));
          const lightMin = Math.max(0, durationMin - deepMin - remMin);

          // Distribute realistically: 60% light, then deep, then 40% light, then REM
          const stagePlan = [
            { type: 'light' as const, minutes: Math.floor(lightMin * 0.6), label: 'Light Sleep' },
            { type: 'deep' as const, minutes: deepMin, label: 'Deep Sleep' },
            { type: 'light' as const, minutes: Math.floor(lightMin * 0.4), label: 'Light Sleep' },
            { type: 'rem' as const, minutes: remMin, label: 'REM Sleep' }
          ].filter(s => s.minutes > 0);

          let cursor = new Date(startDT);
          let segNum = 1;
          const step = 10; // 10-minute segments

          for (const s of stagePlan) {
            const full = Math.floor(s.minutes / step);
            const remm = s.minutes % step;

            for (let i = 0; i < full; i++) {
              const segStartAbs = minutesBetween(cursor, windowStart) * 1 + 0; // ensure number
              const segEndAbs = minutesBetween(addMinutes(cursor, step), windowStart);
              const { start, end } = clamp0to48h(segStartAbs, segEndAbs);
              if (end > start) {
                segments.push({
                  type: s.type,
                  startAbs: start,
                  endAbs: end,
                  duration: end - start,
                  label: s.label,
                  color: colorByType[s.type],
                  segment: `${segNum}`
                });
              }
              cursor = addMinutes(cursor, step);
              segNum++;
            }

            if (remm > 0) {
              const segStartAbs = minutesBetween(cursor, windowStart);
              const segEndAbs = minutesBetween(addMinutes(cursor, remm), windowStart);
              const { start, end } = clamp0to48h(segStartAbs, segEndAbs);
              if (end > start) {
                segments.push({
                  type: s.type,
                  startAbs: start,
                  endAbs: end,
                  duration: end - start,
                  label: s.label,
                  color: colorByType[s.type],
                  segment: `${segNum} (Partial)`
                });
              }
              cursor = addMinutes(cursor, remm);
              segNum++;
            }
          }

          return segments;
        };

        // Build segments for all biometric entries that overlap the 48h window
        const allSegments: SleepSegment[] = [];
        for (const d of sleepDebtData) {
          // Consider only records whose potential sleep window could overlap 48h frame
          // Cheap pre-filter: include the two calendar days of the window
          const dMidnight = startOfDay(d.date);
          if (dMidnight > new Date(windowEnd.getTime() + 24 * 60 * 60000)) continue;
          if (new Date(dMidnight.getTime() + 24 * 60 * 60000) < new Date(windowStart.getTime() - 24 * 60 * 60000)) continue;
          const segs = buildSegmentsForRecord(d);
          allSegments.push(...segs);
        }

        // Aggregate for legend
        const totalMin = allSegments.reduce((s, x) => s + x.duration, 0);
        const deepMinAgg = allSegments.filter(s => s.type === 'deep').reduce((s, x) => s + x.duration, 0);
        const lightMinAgg = allSegments.filter(s => s.type === 'light').reduce((s, x) => s + x.duration, 0);
        const remMinAgg = allSegments.filter(s => s.type === 'rem').reduce((s, x) => s + x.duration, 0);

        return (
          <div className="card-enhanced p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              48‑Hour Sleep Timeline
              <span className="text-sm font-normal text-gray-600 ml-2">
                (all sleep episodes within the 48‑hour window)
              </span>
            </h3>

            <div className="mb-6">
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-800"></div>
                  <span className='text-black'>Deep Sleep: {totalMin ? ((deepMinAgg / totalMin) * 100).toFixed(1) : '0.0'}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                  <span className='text-black'>Light Sleep: {totalMin ? ((lightMinAgg / totalMin) * 100).toFixed(1) : '0.0'}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                  <span className='text-black'>REM Sleep: {totalMin ? ((remMinAgg / totalMin) * 100).toFixed(1) : '0.0'}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gray-400"></div>
                  <span className='text-black'>Total Sleep: {(totalMin / 60).toFixed(1)}h within window</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* 48-hour timeline visualization */}
              <div className="relative">
                {/* 48-hour time header */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span>Day 1 - 12:00 AM</span>
                  <span>Day 1 - 12:00 PM</span>
                  <span>Day 2 - 12:00 AM</span>
                  <span>Day 2 - 12:00 PM</span>
                  <span>Day 3 - 12:00 AM</span>
                </div>

                <div className="relative h-24 bg-gray-100 rounded-lg overflow-hidden">
                  {/* Background time markers every 6 hours for 48-hour view */}
                  {Array.from({ length: 9 }, (_, i) => i * 6).map(hour => (
                    <div
                      key={hour}
                      className="absolute top-0 bottom-0 border-l border-gray-300"
                      style={{ left: `${(hour / 48) * 100}%` }}
                    />
                  ))}

                  {/* Sleep stage segments positioned within 48-hour timeline */}
                  {allSegments.map((segment, index) => {
                    const positionPercent = (segment.startAbs / (48 * 60)) * 100;
                    const widthPercent = ((segment.endAbs - segment.startAbs) / (48 * 60)) * 100;

                    return (
                      <div
                        key={index}
                        className="absolute top-0 bottom-0 flex items-center justify-center text-xs font-medium text-white shadow-sm hover:shadow-md transition-shadow"
                        style={{
                          left: `${positionPercent}%`,
                          width: `${Math.max(widthPercent, 0.5)}%`,
                          backgroundColor: segment.color,
                          minWidth: '1px'
                        }}
                        title={`${segment.label} (${segment.segment}) • ${segment.duration} min`}
                      >
                      </div>
                    );
                  })}
                </div>

                {/* 48-hour scale indicators */}
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0h</span>
                  <span>12h</span>
                  <span>24h</span>
                  <span>36h</span>
                  <span>48h</span>
                </div>
              </div>

              {/* Detailed breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Sleep Stage Segments (10-minute intervals)</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {allSegments.map((segment, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded-lg border bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: segment.color }}
                          ></div>
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{segment.label}</div>
                            <div className="text-xs text-gray-600">
                              Segment {segment.segment} • Offset {segment.startAbs}–{segment.endAbs} min (within window)
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900 text-sm">{segment.duration} min</div>
                          <div className="text-xs text-gray-600">{totalMin ? ((segment.duration / totalMin) * 100).toFixed(1) : '0.0'}% of 48h-sleep</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">48‑Hour Sleep Context Analysis</h4>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="font-medium text-blue-800 mb-1">48‑Hour Timeline View</div>
                      <div className="text-blue-700">
                        All sleep episodes over the last 48 hours are visualized by stage and timing relative to the window.
                      </div>
                    </div>

                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="font-medium text-purple-800 mb-1">10‑Minute Segment Tracking</div>
                      <div className="text-purple-700">
                        Sleep is broken into 10‑minute segments allocated by recorded stage percentages for finer pattern analysis.
                      </div>
                    </div>

                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="font-medium text-green-800 mb-1">Stage Distribution (window‑weighted)</div>
                      <div className="text-green-700">
                        Deep: {totalMin ? ((deepMinAgg / totalMin) * 100).toFixed(1) : '0.0'}% •
                        REM: {totalMin ? ((remMinAgg / totalMin) * 100).toFixed(1) : '0.0'}% •
                        Light: {totalMin ? ((lightMinAgg / totalMin) * 100).toFixed(1) : '0.0'}%
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="font-medium text-gray-800 mb-1">Timeline Context</div>
                      <div className="text-gray-700 text-xs">
                        Window spans 48 hours starting from midnight of the day before the latest record. Any sleep overlapping
                        this window is shown and clipped to the window bounds.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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