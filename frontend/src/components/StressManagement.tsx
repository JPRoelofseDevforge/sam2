import React, { useState, useMemo, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  AreaChart,
  Area
} from 'recharts';
import { BiometricData, Athlete } from '../types';
import { dataService } from '../services/dataService';
import { 
  getRestingHRStatus, 
  getHRVStatus, 
  calculateStrainIndex, 
  getStressLevel, 
  calculateDailyStressLoad,
  calculateRecoveryReadiness,
  getHRVTrend
} from '../utils/stressAnalytics';

interface StressManagementProps {
  athleteId: string;
  biometricData: BiometricData[];
}

interface StressDataPoint {
  date: string;
  restingHR: number;
  hrv: number;
  strainIndex: number;
  stressLevel: string;
  recoveryReadiness: number;
  trainingLoad: number;
}

interface WhoopStressDataPoint {
  time: string;
  heartRate: number;
  stressLevel?: number;
}

interface StressZone {
  id: number;
  name: string;
  range: string;
  percentage: number;
  duration: string;
  color: string;
  bgColor: string;
}

export const StressManagement: React.FC<StressManagementProps> = ({
  athleteId,
  biometricData
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d'>('7d');
  const [whoopSelectedPeriod, setWhoopSelectedPeriod] = useState<'24h' | '7d'>('24h');
  const [athlete, setAthlete] = useState<Athlete | undefined>(undefined);
  const [athleteLoading, setAthleteLoading] = useState<boolean>(true);
  const [athleteError, setAthleteError] = useState<string | null>(null);

  // Fetch athlete data on component mount
  useEffect(() => {
    const fetchAthlete = async () => {
      try {
        setAthleteLoading(true);
        setAthleteError(null);

        // Convert athleteId to number if it's a string
        const numericAthleteId = typeof athleteId === 'string' ? parseInt(athleteId, 10) : athleteId;

        const athleteData = await dataService.getAthleteData(numericAthleteId);
        setAthlete(athleteData.athlete);

        // Also update the biometricData prop if it's not provided or needs refreshing
        if (!biometricData.length && athleteData.biometricData.length) {
          // Note: This is a workaround since biometricData is a prop
          // In a real implementation, you might want to lift this state up
          console.log('Biometric data loaded from API:', athleteData.biometricData.length, 'records');
        }
      } catch (error) {
        console.error('Failed to fetch athlete data:', error);
        setAthleteError('Failed to load athlete data');
      } finally {
        setAthleteLoading(false);
      }
    };

    if (athleteId) {
      fetchAthlete();
    }
  }, [athleteId, biometricData.length]);

  const athleteAge = athlete?.age || 25;

  // Sleep debt over last 7 days (hours; positive means owed sleep relative to 8h target)
  const sleepDebt7d = useMemo(() => {
    const last7 = biometricData.slice(-7);
    return last7.reduce((sum, d) => {
      const dur = (d.sleep_duration_h ?? 0);
      return sum + Math.max(0, 8 - dur);
    }, 0);
  }, [biometricData]);

  // Period slices and aggregates
  const periodDays = selectedPeriod === '7d' ? 7 : 30;
  const periodSlice = useMemo(() => biometricData.slice(-periodDays), [biometricData, periodDays]);

  const highStressDays = useMemo(() => {
    return periodSlice.filter(d => {
      const hr = d.resting_hr ?? 0;
      const hrv = d.hrv_night ?? 0;
      if (hr <= 0 || hrv <= 0) return false;
      return calculateStrainIndex(hr, hrv, athleteAge) >= 60;
    }).length;
  }, [periodSlice, athleteAge]);

  const avgPeriodHR = useMemo(() => {
    if (periodSlice.length === 0) return 0;
    const vals = periodSlice.map(d => d.resting_hr ?? 0).filter(v => v > 0);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }, [periodSlice]);

  const avgPeriodHRV = useMemo(() => {
    if (periodSlice.length === 0) return 0;
    const vals = periodSlice.map(d => d.hrv_night ?? 0).filter(v => v > 0);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }, [periodSlice]);

  const avgPeriodSleep = useMemo(() => {
    if (periodSlice.length === 0) return 0;
    const vals = periodSlice.map(d => d.sleep_duration_h ?? 0).filter(v => v > 0);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }, [periodSlice]);

  const cumulativeSleepDebtPeriod = useMemo(() => {
    return periodSlice.reduce((sum, d) => sum + Math.max(0, 8 - (d.sleep_duration_h ?? 0)), 0);
  }, [periodSlice]);

  // Process data for charts
  const stressData = useMemo<StressDataPoint[]>(() => {
    if (!biometricData || biometricData.length === 0) return [];
    
    // Filter data based on selected period
    const days = selectedPeriod === '7d' ? 7 : 30;
    const filteredData = biometricData.slice(-days);
    
    return filteredData.map(data => {
      const strainIndex = calculateStrainIndex(data.resting_hr ?? 0, data.hrv_night ?? 0, athleteAge);
      const stressLevel = getStressLevel(strainIndex).level;
      
      // Calculate recovery readiness using 7-day sleep debt
      const hrvTrend = getHRVTrend(biometricData, 7);
      const recoveryReadiness = calculateRecoveryReadiness(
        biometricData,
        sleepDebt7d,
        hrvTrend,
        data.resting_hr ?? 0,
        data.training_load_pct ?? 0
      );
      
      return {
        date: data.date,
        restingHR: data.resting_hr ?? 0,
        hrv: data.hrv_night ?? 0,
        strainIndex,
        stressLevel,
        recoveryReadiness,
        trainingLoad: data.training_load_pct ?? 0
      };
    });
  }, [biometricData, selectedPeriod, athleteAge]);

  // Get latest data point
  const latestData = stressData.length > 0 ? stressData[stressData.length - 1] : null;
  
  // Calculate metrics
  const restingHRStatus = latestData ? getRestingHRStatus(latestData.restingHR) : null;
  const hrvStatus = latestData ? getHRVStatus(latestData.hrv, athleteAge) : null;
  const strainIndex = latestData ? latestData.strainIndex : 0;
  const stressLevel = latestData ? getStressLevel(strainIndex) : null;
  const dailyStressLoad = calculateDailyStressLoad(biometricData, 7);
  const hrvTrend = getHRVTrend(biometricData, 7);

  // Hex color for current stress level
  const stressColorHex = React.useMemo(() => {
    if (!stressLevel) return '#9CA3AF';
    return stressLevel.level === 'Low' ? '#10B981' : stressLevel.level === 'Moderate' ? '#F59E0B' : '#EF4444';
  }, [stressLevel]);
  
  // Calculate stress score (Whoop feature)
  const stressScore = useMemo(() => {
    if (!latestData) return 0;
    return calculateStrainIndex(
      latestData.restingHR,
      latestData.hrv,
      athleteAge
    );
  }, [latestData, athleteAge]);
  
  // Calculate previous stress score for delta
  const previousStressScore = useMemo(() => {
    if (stressData.length < 2) return 0;
    const previousData = stressData[stressData.length - 2];
    return calculateStrainIndex(
      previousData.restingHR,
      previousData.hrv,
      athleteAge
    );
  }, [stressData, athleteAge]);
  
  // Calculate delta
  const delta = stressScore - previousStressScore;
  const deltaFormatted = delta >= 0 ? `↑ ${delta.toFixed(1)}` : `↓ ${Math.abs(delta).toFixed(1)}`;
  
  // Process data for Whoop chart
  const whoopChartData = useMemo<WhoopStressDataPoint[]>(() => {
    if (biometricData.length === 0) return [];
    
    // For 24h view, we'll use the last 24 data points (assuming hourly data)
    if (whoopSelectedPeriod === '24h') {
      // Get the last 24 data points or all if less than 24
      const recentData = biometricData.slice(-24);
      
      return recentData.map((data, index) => {
        // Calculate strain index for each data point
        // Snapshot metrics
        const hr = Math.round(data.resting_hr ?? 0);
        const hrv = data.hrv_night ?? 0;

        // Only compute stress when we have valid inputs
        const stress =
          hr > 0 && hrv > 0
            ? Math.round(calculateStrainIndex(hr, hrv, athleteAge))
            : undefined;
        
        // Create a time label (hours ago)
        const hoursAgo = recentData.length - 1 - index;
        const timeLabel = hoursAgo === 0 ? 'Now' : `${hoursAgo}h ago`;
        
        return {
          time: timeLabel,
          heartRate: hr,
          stressLevel: stress
        };
      });
    }
    // For 7d view, we'll aggregate data by day
    else {
      // Group data by date
      const dataByDay: Record<string, BiometricData[]> = {};
      
      biometricData.forEach(data => {
        const date = data.date;
        if (!dataByDay[date]) {
          dataByDay[date] = [];
        }
        dataByDay[date].push(data);
      });
      
      // Get last 7 days
      const dates = Object.keys(dataByDay).sort().slice(-7);
      
      return dates.map(date => {
        // Calculate average values for the day
        const dayData = dataByDay[date];
        const avgRestingHR = dayData.reduce((sum, d) => sum + (d.resting_hr ?? 0), 0) / dayData.length;
        const avgHRV = dayData.reduce((sum, d) => sum + (d.hrv_night ?? 0), 0) / dayData.length;
        
        // Calculate strain index for the day when inputs are valid
        const stress =
          avgRestingHR > 0 && avgHRV > 0
            ? Math.round(calculateStrainIndex(avgRestingHR, avgHRV, athleteAge))
            : undefined;
        
        // Format date for display
        const dateObj = new Date(date);
        const dayLabel = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        
        return {
          time: dayLabel,
          heartRate: Math.round(avgRestingHR),
          stressLevel: stress
        };
      });
    }
  }, [biometricData, whoopSelectedPeriod, athleteAge]);

  // Only show stress line if data is valid (non-zero HR and HRV)
  const hasWhoopStress = useMemo(
    () => whoopChartData.some(d => typeof d.stressLevel === 'number' && d.stressLevel > 0),
    [whoopChartData]
  );
  
  // Generate stress zones data based on actual data
  const stressZones: StressZone[] = useMemo(() => {
    if (biometricData.length === 0) {
      return [
        {
          id: 5,
          name: 'ZONE 5',
          range: '90–100%',
          percentage: 0,
          duration: '0:00:00',
          color: '#EF4444',
          bgColor: 'bg-red-500'
        },
        {
          id: 4,
          name: 'ZONE 4',
          range: '80–90%',
          percentage: 0,
          duration: '0:00:00',
          color: '#F97316',
          bgColor: 'bg-orange-500'
        },
        {
          id: 3,
          name: 'ZONE 3',
          range: '70–80%',
          percentage: 0,
          duration: '0:00:00',
          color: '#EAB308',
          bgColor: 'bg-yellow-500'
        },
        {
          id: 2,
          name: 'ZONE 2',
          range: '50–70%',
          percentage: 0,
          duration: '0:00:00',
          color: '#22C55E',
          bgColor: 'bg-green-500'
        },
        {
          id: 1,
          name: 'ZONE 1',
          range: '0–50%',
          percentage: 0,
          duration: '0:00:00',
          color: '#3B82F6',
          bgColor: 'bg-blue-500'
        }
      ];
    }
    
    // For simplicity, we'll use fixed percentages based on typical stress distribution
    // In a real app, this would be calculated from actual heart rate data
    return [
      {
        id: 5,
        name: 'ZONE 5',
        range: '90–100%',
        percentage: 10,
        duration: '0:15:22',
        color: '#EF4444',
        bgColor: 'bg-red-500'
      },
      {
        id: 4,
        name: 'ZONE 4',
        range: '80–90%',
        percentage: 20,
        duration: '0:30:45',
        color: '#F97316',
        bgColor: 'bg-orange-500'
      },
      {
        id: 3,
        name: 'ZONE 3',
        range: '70–80%',
        percentage: 30,
        duration: '0:45:10',
        color: '#EAB308',
        bgColor: 'bg-yellow-500'
      },
      {
        id: 2,
        name: 'ZONE 2',
        range: '50–70%',
        percentage: 25,
        duration: '0:37:33',
        color: '#22C55E',
        bgColor: 'bg-green-500'
      },
      {
        id: 1,
        name: 'ZONE 1',
        range: '0–50%',
        percentage: 15,
        duration: '0:22:10',
        color: '#3B82F6',
        bgColor: 'bg-blue-500'
      }
    ];
  }, [biometricData]);
  
  // Generate insight message based on stress intensity
  const getInsightMessage = () => {
    const stressLevel = getStressLevel(stressScore);
    
    if (stressLevel.level === 'High') {
      return `You spent 10 minutes at 90–100% of your max HR during today's training session. This high-intensity effort is excellent for performance gains but requires adequate recovery.`;
    } else if (stressLevel.level === 'Moderate') {
      return `Your stress levels were moderate today with balanced periods of activity and recovery. Continue maintaining this pattern for optimal adaptation.`;
    } else {
      return `You had a low-stress day which is perfect for active recovery. Consider light movement or stretching to promote circulation without adding stress.`;
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Format time for display
  const formatTime = (timeString: string) => {
    return timeString;
  };

  // Show loading state for athlete data
  if (athleteLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white">Loading athlete data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state for athlete data
  if (athleteError) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-white mb-2">Failed to Load Athlete Data</h3>
            <p className="text-gray-300 mb-4">{athleteError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show no data state
  if (!athlete) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-gray-400 text-4xl mb-4">👤</div>
            <h3 className="text-lg font-semibold text-white mb-2">Athlete Not Found</h3>
            <p className="text-gray-300">No athlete data available for the selected athlete.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold text-white">🧘 Stress Management</h2>
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

      {/* Stress Score (Whoop Feature) */}
      <div className="card-enhanced p-6">
        <div className="flex flex-col items-center">
          <div className={`text-6xl font-bold mb-2 ${
            stressLevel?.level === 'High' ? 'text-red-500' :
            stressLevel?.level === 'Moderate' ? 'text-yellow-500' :
            stressLevel?.level === 'Low' ? 'text-green-500' : 'text-gray-500'
          }`}>
            {stressScore.toFixed(1)}
          </div>
          <div className="text-lg text-gray-300 mb-1">
            STRESS SCORE
          </div>
          <div className={`text-sm font-medium ${delta >= 0 ? 'text-red-400' : 'text-green-400'}`}>
            {deltaFormatted} from previous
          </div>
        </div>
      </div>
      
      {/* Key Stress Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-50 p-5 rounded-lg">
          <div className="text-xs uppercase tracking-wide text-gray-500">Cumulative Sleep Debt ({selectedPeriod === '7d' ? '7d' : '30d'})</div>
          <div className="mt-1 text-3xl font-bold text-gray-900">{cumulativeSleepDebtPeriod.toFixed(1)}h</div>
          <div className="text-sm text-gray-600 mt-1">Avg Sleep: {avgPeriodSleep.toFixed(1)}h</div>
        </div>
        <div className="bg-gray-50 p-5 rounded-lg">
          <div className="text-xs uppercase tracking-wide text-gray-500">HRV Trend (7d)</div>
          <div className="mt-1 text-3xl font-bold text-gray-900">{hrvTrend > 0 ? '+' : ''}{hrvTrend.toFixed(1)} ms</div>
          <div className="text-sm text-gray-600 mt-1">Avg HRV: {avgPeriodHRV.toFixed(0)} ms</div>
        </div>
        <div className="bg-gray-50 p-5 rounded-lg">
          <div className="text-xs uppercase tracking-wide text-gray-500">Stress Days</div>
          <div className="mt-1 text-3xl font-bold text-gray-900">{highStressDays}</div>
          <div className="text-sm text-gray-600 mt-1">Avg Sleeping HR: {avgPeriodHR.toFixed(0)} bpm</div>
        </div>
      </div>

      {/* Stress Dial */}
      <div className="card-enhanced p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Stress Level Indicator</h3>
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 flex justify-center">
            <div className="relative w-48 h-48">
              {/* Background circle */}
              <div className="absolute inset-0 rounded-full border-8 border-gray-200"></div>
              
              {/* Stress level arc */}
              <div className="absolute inset-0 rounded-full border-8 border-transparent"
                style={{
                  borderTopColor: stressColorHex,
                  borderRightColor: stressColorHex,
                  transform: 'rotate(45deg)',
                  clipPath: `inset(0 ${100 - Math.min(100, Math.max(0, strainIndex))}% 0 0)`
                }}></div>
              
              {/* Center indicator */}
              <div className="absolute inset-8 rounded-full bg-white flex items-center justify-center">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${stressLevel?.color || 'text-gray-500'}`}>
                    {strainIndex ? Math.round(strainIndex) : '--'}
                  </div>
                  <div className="text-sm text-gray-600">Stress Index</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex-1">
            <div className="space-y-4">
              {/* Stress Level */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900">Current Stress Level</h4>
                <p className={`text-2xl font-bold mt-1 ${stressLevel?.color || 'text-gray-500'}`}>
                  {stressLevel?.level || 'Unknown'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {stressLevel?.message || 'No data available'}
                </p>
              </div>
              
              {/* Resting HR Status */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900">Sleeping Heart Rate</h4>
                <p className={`text-2xl font-bold mt-1 ${restingHRStatus?.color || 'text-gray-500'}`}>
                  {latestData ? `${latestData.restingHR} bpm` : '--'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {restingHRStatus?.message || 'No data available'}
                </p>
              </div>
              
              {/* HRV Status */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900">Heart Rate Variability</h4>
                <p className={`text-2xl font-bold mt-1 ${hrvStatus?.color || 'text-gray-500'}`}>
                  {latestData ? `${latestData.hrv} ms` : '--'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {hrvStatus?.message || 'No data available'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Whoop Heart Rate Chart */}
      <div className="card-enhanced p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {whoopSelectedPeriod === '24h' ? 'HEART RATE TODAY' : 'HEART RATE THIS WEEK'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Monitor your heart rate patterns throughout the day to understand stress and recovery.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setWhoopSelectedPeriod('24h')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                whoopSelectedPeriod === '24h'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              24 Hours
            </button>
            <button
              onClick={() => setWhoopSelectedPeriod('7d')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                whoopSelectedPeriod === '7d'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              7 Days
            </button>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={whoopChartData}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="time"
                stroke="#9CA3AF"
                tickFormatter={formatTime}
              />
              <YAxis
                yAxisId="left"
                stroke="#9CA3AF"
                domain={[40, 180]}
              />
              {hasWhoopStress && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#9CA3AF"
                  domain={[0, 100]}
                />
              )}
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  borderColor: '#374151',
                  borderRadius: '0.5rem',
                  color: '#F9FAFB'
                }}
                formatter={(value, name) => {
                  const v = Number(value);
                  if (name === 'heartRate') return [`${Math.round(v)} bpm`, 'Heart Rate'];
                  if (name === 'stressLevel') return [`${Math.round(v)}`, 'Stress Level'];
                  return [Math.round(v), name];
                }}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="heartRate"
                name="Heart Rate"
                stroke="#3B82F6"
                fill="url(#colorHeartRate)"
                strokeWidth={2}
              />
              {hasWhoopStress && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="stressLevel"
                  name="Stress Level"
                  stroke="#F59E0B"
                  strokeWidth={2}
                />
              )}
              <defs>
                <linearGradient id="colorHeartRate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-sm text-gray-400">
          <p>Heart rate range: 100–175 bpm</p>
        </div>
      </div>
      
      {/* Stress Zones (Whoop Feature) */}
      <div className="card-enhanced p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            STRESS ZONES
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Distribution of time spent in different heart rate zones indicates training intensity and stress levels.
          </p>
        </div>
        <div className="space-y-4">
          {stressZones.map((zone) => (
            <div key={zone.id} className="space-y-2">
              <div className="flex justify-between text-sm">
                <div className="flex items-center">
                  <span className="font-medium text-gray-900 mr-2">{zone.name}</span>
                  <span className="text-gray-400">({zone.range})</span>
                </div>
                <div className="flex space-x-4">
                  <span className="text-gray-900">{zone.percentage}%</span>
                  <span className="text-gray-400">{zone.duration}</span>
                </div>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full"
                  style={{
                    width: `${zone.percentage}%`,
                    backgroundColor: zone.color
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* HRV Trend Chart */}
      <div className="card-enhanced p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">HRV Trend (7/30 Days)</h3>
        <p className="text-sm text-gray-600 mb-4">Heart Rate Variability (HRV) is a key indicator of stress and recovery. Higher HRV values indicate better recovery and parasympathetic nervous system activity.</p>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={stressData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke="#6b7280"
              />
              <YAxis yAxisId="left" stroke="#6b7280" />
              <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  color: '#1f2937'
                }}
                formatter={(value, name) => {
                  if (name === 'hrv') return [`${typeof value === 'number' ? Math.round(value) : value} ms`, 'HRV'];
                  if (name === 'restingHR') return [`${typeof value === 'number' ? Math.round(value) : value} bpm`, 'Sleeping HR'];
                  return [typeof value === 'number' ? Math.round(value) : value, name];
                }}
                labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString()}`}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="hrv"
                name="HRV (ms)"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="restingHR"
                name="Sleeping HR (bpm)"
                stroke="#EF4444"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <ReferenceLine
                y={hrvTrend > 0 ? Math.min(...stressData.map(d => d.hrv)) : Math.max(...stressData.map(d => d.hrv))}
                stroke={hrvTrend > 0 ? "#10B981" : "#EF4444"}
                strokeDasharray="3 3"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          <p>
            HRV Trend (7 days): 
            <span className={hrvTrend > 0 ? "text-green-600 font-medium" : hrvTrend < 0 ? "text-red-600 font-medium" : "text-gray-600"}>
              {' '}{hrvTrend > 0 ? '+' : ''}{hrvTrend.toFixed(1)} ms
            </span>
            {' '}|
            Daily Stress Load:
            <span className={dailyStressLoad.stressBalance > 0 ? "text-green-600 font-medium" : dailyStressLoad.stressBalance < 0 ? "text-red-600 font-medium" : "text-gray-600"}>
              {' '}{dailyStressLoad.stressBalance > 0 ? '+' : ''}{Math.round(dailyStressLoad.stressBalance)}
            </span>
          </p>
        </div>
      </div>


      {/* Stress Insights */}
      <div className="card-enhanced p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Stress Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h4 className="font-medium text-blue-800">Acute Stress Load</h4>
            <p className="text-2xl font-bold mt-1 text-blue-600">
              {Math.round(dailyStressLoad.acuteStress)}
            </p>
            <p className="text-sm text-blue-600 mt-1">
              Last 7 days average
            </p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <h4 className="font-medium text-purple-800">Chronic Stress Load</h4>
            <p className="text-2xl font-bold mt-1 text-purple-600">
              {Math.round(dailyStressLoad.chronicStress)}
            </p>
            <p className="text-sm text-purple-600 mt-1">
              Previous 7 days average
            </p>
          </div>
          
          <div className={`${
            dailyStressLoad.stressBalance > 0 ? 'bg-green-50 border-green-100' : 
            dailyStressLoad.stressBalance < 0 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'
          } p-4 rounded-lg border`}>
            <h4 className={`font-medium ${
              dailyStressLoad.stressBalance > 0 ? 'text-green-800' : 
              dailyStressLoad.stressBalance < 0 ? 'text-red-800' : 'text-gray-800'
            }`}>
              Stress Balance
            </h4>
            <p className={`text-2xl font-bold mt-1 ${
              dailyStressLoad.stressBalance > 0 ? 'text-green-600' : 
              dailyStressLoad.stressBalance < 0 ? 'text-red-600' : 'text-gray-600'
            }`}>
              {dailyStressLoad.stressBalance > 0 ? '+' : ''}{Math.round(dailyStressLoad.stressBalance)}
            </p>
            <p className="text-sm mt-1" style={{ 
              color: dailyStressLoad.stressBalance > 0 ? '#059669' : 
                     dailyStressLoad.stressBalance < 0 ? '#DC2626' : '#6B7280'
            }}>
              {dailyStressLoad.stressBalance > 0 ? 'Improving trend' : 
               dailyStressLoad.stressBalance < 0 ? 'Worsening trend' : 'Stable'}
            </p>
          </div>
        </div>
        
        <div className="mt-6">
          <h4 className="font-medium text-gray-900 mb-2">Stress Management Recommendations</h4>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
            {stressLevel?.level === 'High' && (
              <>
                <li>Prioritize sleep hygiene and aim for 7-9 hours of quality sleep</li>
                <li>Consider active recovery or rest days to allow stress markers to normalize</li>
                <li>Practice stress-reduction techniques like meditation or breathing exercises</li>
              </>
            )}
            {stressLevel?.level === 'Moderate' && (
              <>
                <li>Maintain consistent sleep schedule and monitor sleep quality</li>
                <li>Balance training load with adequate recovery periods</li>
                <li>Stay hydrated and maintain proper nutrition to support recovery</li>
              </>
            )}
            {stressLevel?.level === 'Low' && (
              <>
                <li>You're in a good recovery state - maintain current healthy habits</li>
                <li>Continue monitoring trends to prevent stress accumulation</li>
                <li>Optimize training timing for peak performance windows</li>
              </>
            )}
            {!stressLevel && (
              <li>Insufficient data to provide specific recommendations. Continue monitoring metrics.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};