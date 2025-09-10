import React, { useState, useMemo, useEffect } from 'react';
import { biometricDataService, athleteService, geneticProfileService } from '../services/dataService';
import { calculateReadinessScore, getRecoveryGenePanelInsights } from '../utils/analytics';
import { BiometricData, Athlete, GeneticProfile } from '../types';
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
  ZAxis,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart
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
  recoveryScore: number;
  sleepQuality: number;
  stressIndex: number;
  fatigueLevel: number;
}

interface RecoveryMetrics {
  overallRecovery: number;
  sleepQuality: number;
  autonomicBalance: number;
  inflammationRisk: number;
  fatigueLevel: number;
  recommendations: string[];
}

interface RecoveryTimelineProps {
  athleteId?: string;
}

// Enhanced recovery score calculation using multiple biometric metrics
const calculateEnhancedRecoveryScore = (data: BiometricData): RecoveryMetrics => {
  console.log('🔢 Calculating recovery score for data:', data);

  // Helper function to check if a value is valid (not null, undefined, or 0)
  const isValidValue = (value: any): boolean => {
    return value !== null && value !== undefined && value !== 0 && !isNaN(value);
  };

  // HRV Score (25% weight) - more granular scoring for better differentiation
  let hrvScore = 50; // Default neutral score
  if (isValidValue(data.hrv_night)) {
    if (data.hrv_night >= 70) hrvScore = 100;
    else if (data.hrv_night >= 60) hrvScore = 90;
    else if (data.hrv_night >= 50) hrvScore = 80;
    else if (data.hrv_night >= 40) hrvScore = 60;
    else if (data.hrv_night >= 30) hrvScore = 40;
    else hrvScore = 20;
  }

  // Resting HR Score (20% weight) - more granular for better differentiation
  let rhrScore = 50; // Default neutral score
  if (isValidValue(data.resting_hr)) {
    if (data.resting_hr <= 45) rhrScore = 100;
    else if (data.resting_hr <= 50) rhrScore = 90;
    else if (data.resting_hr <= 55) rhrScore = 80;
    else if (data.resting_hr <= 60) rhrScore = 70;
    else if (data.resting_hr <= 65) rhrScore = 60;
    else if (data.resting_hr <= 70) rhrScore = 50;
    else if (data.resting_hr <= 75) rhrScore = 40;
    else rhrScore = 30;
  }

  // Sleep Duration Score (20% weight) - more granular scoring
  let sleepDurationScore = 50; // Default neutral score
  if (isValidValue(data.sleep_duration_h)) {
    if (data.sleep_duration_h >= 9) sleepDurationScore = 100;
    else if (data.sleep_duration_h >= 8.5) sleepDurationScore = 95;
    else if (data.sleep_duration_h >= 8) sleepDurationScore = 90;
    else if (data.sleep_duration_h >= 7.5) sleepDurationScore = 80;
    else if (data.sleep_duration_h >= 7) sleepDurationScore = 70;
    else if (data.sleep_duration_h >= 6.5) sleepDurationScore = 60;
    else if (data.sleep_duration_h >= 6) sleepDurationScore = 50;
    else sleepDurationScore = 40;
  }

  // Sleep Quality Score (15% weight) - based on deep sleep and REM with more granularity
  let sleepQualityScore = 50; // Default neutral score
  const hasDeepSleep = isValidValue(data.deep_sleep_pct);
  const hasRemSleep = isValidValue(data.rem_sleep_pct);

  if (hasDeepSleep || hasRemSleep) {
    const avgSleepQuality = hasDeepSleep && hasRemSleep
      ? (data.deep_sleep_pct + data.rem_sleep_pct) / 2
      : hasDeepSleep ? data.deep_sleep_pct : data.rem_sleep_pct;

    if (avgSleepQuality >= 30) sleepQualityScore = 100;
    else if (avgSleepQuality >= 27) sleepQualityScore = 90;
    else if (avgSleepQuality >= 25) sleepQualityScore = 85;
    else if (avgSleepQuality >= 22) sleepQualityScore = 75;
    else if (avgSleepQuality >= 20) sleepQualityScore = 70;
    else if (avgSleepQuality >= 17) sleepQualityScore = 60;
    else if (avgSleepQuality >= 15) sleepQualityScore = 50;
    else sleepQualityScore = 40;
  }

  // SpO2 Score (10% weight) - more granular scoring
  let spo2Score = 50; // Default neutral score
  if (isValidValue(data.spo2_night)) {
    if (data.spo2_night >= 98) spo2Score = 100;
    else if (data.spo2_night >= 97) spo2Score = 95;
    else if (data.spo2_night >= 96) spo2Score = 90;
    else if (data.spo2_night >= 95) spo2Score = 85;
    else if (data.spo2_night >= 94) spo2Score = 75;
    else if (data.spo2_night >= 93) spo2Score = 65;
    else if (data.spo2_night >= 92) spo2Score = 55;
    else spo2Score = 45;
  }

  // Temperature Score (5% weight) - more granular for subtle differences
  let tempScore = 50; // Default neutral score
  if (isValidValue(data.temp_trend_c)) {
    if (data.temp_trend_c <= 36.2) tempScore = 100;
    else if (data.temp_trend_c <= 36.4) tempScore = 90;
    else if (data.temp_trend_c <= 36.6) tempScore = 80;
    else if (data.temp_trend_c <= 36.8) tempScore = 70;
    else if (data.temp_trend_c <= 37.0) tempScore = 60;
    else if (data.temp_trend_c <= 37.2) tempScore = 50;
    else if (data.temp_trend_c <= 37.5) tempScore = 40;
    else tempScore = 30;
  }

  // Respiratory Rate Score (5% weight) - more granular scoring
  let respScore = 50; // Default neutral score
  if (isValidValue(data.resp_rate_night)) {
    if (data.resp_rate_night <= 12) respScore = 100;
    else if (data.resp_rate_night <= 13) respScore = 95;
    else if (data.resp_rate_night <= 14) respScore = 90;
    else if (data.resp_rate_night <= 15) respScore = 80;
    else if (data.resp_rate_night <= 16) respScore = 70;
    else if (data.resp_rate_night <= 17) respScore = 60;
    else if (data.resp_rate_night <= 18) respScore = 50;
    else respScore = 40;
  }

  // Calculate weighted overall recovery score
  const overallRecovery = Math.round(
    (hrvScore * 0.25) + (rhrScore * 0.20) + (sleepDurationScore * 0.20) +
    (sleepQualityScore * 0.15) + (spo2Score * 0.10) + (tempScore * 0.05) + (respScore * 0.05)
  );

  // Calculate autonomic balance (HRV/RHR ratio) - only if both values are available
  let autonomicBalance = 50; // Default neutral
  if (isValidValue(data.hrv_night) && isValidValue(data.resting_hr) && data.resting_hr > 0) {
    autonomicBalance = Math.round((data.hrv_night / data.resting_hr) * 10);
    autonomicBalance = Math.max(0, Math.min(100, autonomicBalance)); // Clamp to 0-100
  }

  // Calculate inflammation risk based on temperature and HRV
  let inflammationRisk = 30; // Default low risk
  if (isValidValue(data.temp_trend_c) && isValidValue(data.hrv_night)) {
    inflammationRisk = data.temp_trend_c > 37.0 && data.hrv_night < 40 ? 80 :
                      data.temp_trend_c > 37.0 || data.hrv_night < 40 ? 60 : 30;
  }

  // Calculate fatigue level based on training load and recovery metrics - more sensitive calculation
  let fatigueLevel = 20; // Default low fatigue
  if (isValidValue(data.training_load_pct)) {
    // More sensitive calculation: higher training load relative to recovery indicates fatigue
    const loadRecoveryRatio = data.training_load_pct / Math.max(overallRecovery, 1);
    fatigueLevel = Math.min(100, Math.max(0, (loadRecoveryRatio - 0.8) * 100));
  }

  console.log('📊 Recovery score calculation:', {
    hrvScore, rhrScore, sleepDurationScore, sleepQualityScore, spo2Score, tempScore, respScore,
    overallRecovery, autonomicBalance, inflammationRisk, fatigueLevel,
    rawValues: {
      hrv: data.hrv_night,
      rhr: data.resting_hr,
      sleepDuration: data.sleep_duration_h,
      spo2: data.spo2_night,
      trainingLoad: data.training_load_pct
    }
  });

  // Generate specific recommendations based on actual biometric values
  const recommendations: string[] = [];

  // HRV-based recommendations
  if (isValidValue(data.hrv_night)) {
    if (data.hrv_night < 50) {
      recommendations.push("Low HRV detected - prioritize stress reduction and recovery");
    } else if (data.hrv_night < 60) {
      recommendations.push("Moderate HRV - consider additional recovery modalities");
    }
  }

  // Resting HR recommendations
  if (isValidValue(data.resting_hr)) {
    if (data.resting_hr > 65) {
      recommendations.push("Elevated resting HR - monitor for fatigue accumulation");
    } else if (data.resting_hr > 60) {
      recommendations.push("Resting HR slightly elevated - ensure adequate recovery");
    }
  }

  // Sleep duration recommendations
  if (isValidValue(data.sleep_duration_h)) {
    if (data.sleep_duration_h < 7) {
      recommendations.push(`Sleep duration: ${data.sleep_duration_h}h - aim for 8+ hours nightly`);
    } else if (data.sleep_duration_h < 7.5) {
      recommendations.push("Sleep duration adequate but could be optimized");
    }
  }

  // Sleep quality recommendations
  if (hasDeepSleep || hasRemSleep) {
    const avgSleepQuality = hasDeepSleep && hasRemSleep
      ? (data.deep_sleep_pct + data.rem_sleep_pct) / 2
      : hasDeepSleep ? data.deep_sleep_pct : data.rem_sleep_pct;

    if (avgSleepQuality < 20) {
      recommendations.push(`Sleep quality: ${avgSleepQuality.toFixed(1)}% - focus on sleep environment`);
    }
  }

  // SpO2 recommendations
  if (isValidValue(data.spo2_night) && data.spo2_night < 95) {
    recommendations.push(`SpO2: ${data.spo2_night}% - monitor breathing quality during sleep`);
  }

  // Temperature-based recommendations
  if (isValidValue(data.temp_trend_c) && data.temp_trend_c > 37.0) {
    recommendations.push(`Body temp: ${data.temp_trend_c}°C - possible inflammation, monitor closely`);
  }

  // Training load and fatigue recommendations
  if (isValidValue(data.training_load_pct)) {
    if (data.training_load_pct > 80) {
      recommendations.push(`High training load: ${data.training_load_pct}% - balance with recovery`);
    }
    if (fatigueLevel > 50) {
      recommendations.push(`Fatigue level: ${fatigueLevel.toFixed(0)}% - consider load reduction`);
    }
  }

  // Overall recovery assessment
  if (overallRecovery >= 90) {
    recommendations.push("Excellent recovery status - maintain current protocols");
  } else if (overallRecovery >= 80) {
    recommendations.push("Good recovery - continue monitoring key metrics");
  } else if (overallRecovery >= 70) {
    recommendations.push("Moderate recovery - focus on high-priority recovery factors");
  } else {
    recommendations.push("Recovery needs attention - prioritize rest and recovery modalities");
  }

  // If no specific recommendations, add a general one
  if (recommendations.length === 0) {
    recommendations.push("All metrics within optimal ranges - maintain current recovery protocols");
  }

  return {
    overallRecovery,
    sleepQuality: sleepQualityScore,
    autonomicBalance,
    inflammationRisk,
    fatigueLevel,
    recommendations
  };
};

export const RecoveryTimeline: React.FC<RecoveryTimelineProps> = ({ athleteId }) => {
  const [timeRange, setTimeRange] = useState<'7' | '14' | '30' | '90'>('30');
  const [viewMode, setViewMode] = useState<'line' | 'scatter' | 'area' | 'composed'>('line');
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [biometricData, setBiometricData] = useState<BiometricData[]>([]);
  const [geneticProfiles, setGeneticProfiles] = useState<GeneticProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGeneticInsights, setShowGeneticInsights] = useState(false);

  // Fetch athletes data
  useEffect(() => {
    const fetchAthletes = async () => {
      try {
        const athletesResponse = await athleteService.getAllAthletes();
        console.log('🔍 Raw athletes API response:', athletesResponse);

        // Handle the $values structure from .NET JSON serialization
        let athletesArray: any[] = [];
        if (athletesResponse && typeof athletesResponse === 'object') {
          if (athletesResponse.athletes) {
            if (Array.isArray(athletesResponse.athletes)) {
              athletesArray = athletesResponse.athletes;
            } else if (athletesResponse.athletes.$values && Array.isArray(athletesResponse.athletes.$values)) {
              athletesArray = athletesResponse.athletes.$values;
            }
          } else if (athletesResponse.$values && Array.isArray(athletesResponse.$values)) {
            athletesArray = athletesResponse.$values;
          } else if (Array.isArray(athletesResponse)) {
            athletesArray = athletesResponse;
          }
        }

        console.log('📊 Extracted athletes array:', athletesArray);

        // Transform the athletes data
        const transformedAthletes = athletesArray.map(athlete => {
          const age = athlete.DateOfBirth
            ? new Date().getFullYear() - new Date(athlete.DateOfBirth).getFullYear()
            : 0;

          // Build athlete name with multiple fallbacks
          let athleteName = '';
          if (athlete.FirstName && athlete.LastName) {
            athleteName = `${athlete.FirstName} ${athlete.LastName}`.trim();
          } else if (athlete.FirstName) {
            athleteName = athlete.FirstName;
          } else if (athlete.LastName) {
            athleteName = athlete.LastName;
          } else if (athlete.Name) {
            athleteName = athlete.Name;
          } else if (athlete.FullName) {
            athleteName = athlete.FullName;
          } else {
            athleteName = `Athlete ${athlete.Id || athlete.UnionId || 'Unknown'}`;
          }

          return {
            id: athlete.Id || athlete.UnionId,
            athlete_id: (athlete.Id || athlete.UnionId)?.toString() || '',
            name: athleteName,
            sport: athlete.Sport || athlete.SportName || 'General',
            age: age,
            team: athlete.Team || athlete.TeamName || 'Default Team',
            baseline_start_date: undefined,
            date_of_birth: athlete.DateOfBirth
          };
        });

        console.log('✅ Transformed athletes:', transformedAthletes);
        setAthletes(transformedAthletes);

        // Set default selected athlete if none specified
        if (!athleteId && transformedAthletes.length > 0) {
          const defaultAthleteId = transformedAthletes[0].athlete_id;
          console.log('🎯 RecoveryTimeline: Setting default athlete:', defaultAthleteId);
          setSelectedAthletes([defaultAthleteId]);
        } else if (athleteId) {
          console.log('🎯 RecoveryTimeline: Using specified athlete ID:', athleteId);
          setSelectedAthletes([athleteId]);
        } else {
          console.log('⚠️ RecoveryTimeline: No athletes available for selection');
        }
      } catch (err) {
        console.error('Failed to fetch athletes:', err);
        setError('Failed to load athletes data');
      }
    };

    fetchAthletes();
  }, [athleteId]);

  // Fetch biometric data and genetic profiles for selected athletes
  useEffect(() => {
    const fetchData = async () => {
      console.log('🔄 RecoveryTimeline: Fetching data for athletes:', selectedAthletes);

      if (selectedAthletes.length === 0) {
        console.log('⚠️ RecoveryTimeline: No athletes selected, skipping data fetch');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const allBiometricData: BiometricData[] = [];
        const allGeneticProfiles: GeneticProfile[] = [];

        for (const athleteId of selectedAthletes) {
          const athleteIdNum = parseInt(athleteId, 10);
          console.log(`🔍 Fetching data for athlete ID: ${athleteId} (numeric: ${athleteIdNum})`);

          if (!isNaN(athleteIdNum)) {
            try {
              // Fetch biometric data
              const athleteBiometrics = await biometricDataService.getBiometricDataByAthlete(athleteIdNum);
              console.log(`📊 Biometric data for athlete ${athleteId}:`, athleteBiometrics);

              if (Array.isArray(athleteBiometrics)) {
                allBiometricData.push(...athleteBiometrics);

                // Log sample of the data to see what we're getting
                if (athleteBiometrics.length > 0) {
                  console.log(`💡 Sample biometric record for athlete ${athleteId}:`, {
                    athlete_id: athleteBiometrics[0].athlete_id,
                    date: athleteBiometrics[0].date,
                    hrv_night: athleteBiometrics[0].hrv_night,
                    resting_hr: athleteBiometrics[0].resting_hr,
                    sleep_duration_h: athleteBiometrics[0].sleep_duration_h,
                    spo2_night: athleteBiometrics[0].spo2_night,
                    training_load_pct: athleteBiometrics[0].training_load_pct
                  });
                }
              }

              // Fetch genetic profiles
              const athleteGenetics = await geneticProfileService.getGeneticProfileByAthlete(athleteIdNum);
              console.log(`🧬 Genetic data for athlete ${athleteId}:`, athleteGenetics);

              if (Array.isArray(athleteGenetics)) {
                allGeneticProfiles.push(...athleteGenetics);
              }
            } catch (err) {
              console.error(`Failed to fetch data for athlete ${athleteId}:`, err);
              // Continue with other athletes even if one fails
            }
          } else {
            console.warn(`⚠️ Invalid athlete ID: ${athleteId} (could not parse to number)`);
          }
        }

        setBiometricData(allBiometricData);
        setGeneticProfiles(allGeneticProfiles);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load recovery data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedAthletes]);

  // Get recovery data for selected athletes with enhanced metrics
  const { athleteDataMap, lineChartData, recoveryMetrics, geneticInsights } = useMemo(() => {
    const dataMap: { [athleteId: string]: RecoveryDataPoint[] } = {};
    const allDates = new Set<string>();
    const metrics: { [athleteId: string]: RecoveryMetrics } = {};

    console.log('🔍 RecoveryTimeline: Processing enhanced recovery data', {
      biometricDataCount: biometricData?.length || 0,
      geneticProfilesCount: geneticProfiles?.length || 0,
      athletesCount: athletes?.length || 0,
      selectedAthletesCount: selectedAthletes?.length || 0,
      athletes: athletes?.map(a => ({ id: a.athlete_id, name: a.name })),
      selectedAthletes: selectedAthletes
    });

    // Guard against null/undefined/non-array data
    if (!biometricData || !Array.isArray(biometricData) || !athletes || !Array.isArray(athletes) || !selectedAthletes || !Array.isArray(selectedAthletes)) {
      console.log('⚠️ RecoveryTimeline: Missing or invalid data arrays');
      return { athleteDataMap: {}, lineChartData: [], recoveryMetrics: {}, geneticInsights: [] };
    }

    // First pass: collect all unique dates
    selectedAthletes.forEach(athleteId => {
      const athleteBiometrics = biometricData.filter(d => {
        if (!d) return false;
        const recordAthleteId = d.athlete_id || (d as any).AthleteId || (d as any).athleteId || '';
        const matches = recordAthleteId?.toString() === athleteId?.toString();
        return matches;
      });

      console.log(`🎯 RecoveryTimeline: Athlete ${athleteId} has ${athleteBiometrics.length} biometric records`);
      if (athleteBiometrics.length > 0) {
        console.log('📊 Sample biometric record:', athleteBiometrics[0]);
      }

      athleteBiometrics.forEach(d => {
        if (d.date || (d as any).Date) {
          allDates.add(d.date || (d as any).Date);
        }
      });
    });

    // Filter by time range
    const days = parseInt(timeRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const filteredDates = Array.from(allDates)
      .filter(date => new Date(date) >= cutoffDate)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    // Create unified data structure for charts
    const unifiedData: any[] = [];
    filteredDates.forEach(date => {
      const dataPoint: any = { date };

      selectedAthletes.forEach(athleteId => {
        const athleteBiometric = biometricData.find(d => {
          const recordAthleteId = d.athlete_id || (d as any).AthleteId || (d as any).athleteId || '';
          const recordDate = d.date || (d as any).Date || '';
          return recordAthleteId?.toString() === athleteId?.toString() && recordDate === date;
        });

        // More robust athlete lookup - try multiple ID fields
        const athlete = athletes.find(a => {
          const athleteIds = [
            a.athlete_id,
            a.id?.toString(),
            (a as any).Id?.toString(),
            (a as any).UnionId?.toString()
          ].filter(Boolean);

          return athleteIds.some(id => id === athleteId);
        });

        if (athleteBiometric) {
          // Calculate enhanced recovery metrics
          const enhancedMetrics = calculateEnhancedRecoveryScore(athleteBiometric);
          const recoveryScore = enhancedMetrics.overallRecovery;

          // If recovery score is the default (91), it means no valid data was available
          const hasValidData = athleteBiometric.hrv_night > 0 ||
                              athleteBiometric.resting_hr > 0 ||
                              athleteBiometric.sleep_duration_h > 0 ||
                              athleteBiometric.spo2_night > 0;

          const finalRecoveryScore = hasValidData ? recoveryScore : 0; // 0 means no data available

          dataPoint[`${athleteId}_recovery`] = finalRecoveryScore;
          dataPoint[`${athleteId}_hrv`] = athleteBiometric.hrv_night;
          dataPoint[`${athleteId}_sleepQuality`] = enhancedMetrics.sleepQuality;
          dataPoint[`${athleteId}_fatigue`] = enhancedMetrics.fatigueLevel;
          dataPoint[`${athleteId}_events`] = [];

          // Enhanced event detection based on multiple metrics
          if (athleteBiometric.training_load_pct > 90) dataPoint[`${athleteId}_events`].push('High Training Load');
          if (athleteBiometric.hrv_night < 40) dataPoint[`${athleteId}_events`].push('Poor Autonomic Recovery');
          if (athleteBiometric.sleep_duration_h < 6) dataPoint[`${athleteId}_events`].push('Insufficient Sleep Duration');
          if (athleteBiometric.resting_hr > 70) dataPoint[`${athleteId}_events`].push('Elevated Resting HR');
          if (enhancedMetrics.inflammationRisk > 60) dataPoint[`${athleteId}_events`].push('Inflammation Risk');
          if (enhancedMetrics.fatigueLevel > 70) dataPoint[`${athleteId}_events`].push('High Fatigue Level');

          console.log(`✅ RecoveryTimeline: Enhanced metrics for ${athlete?.name} on ${date}:`, {
            recoveryScore: finalRecoveryScore,
            sleepQuality: enhancedMetrics.sleepQuality,
            fatigueLevel: enhancedMetrics.fatigueLevel,
            inflammationRisk: enhancedMetrics.inflammationRisk,
            hasValidData: hasValidData
          });

          // Populate individual athlete data map with enhanced metrics
          if (!dataMap[athleteId]) dataMap[athleteId] = [];
          dataMap[athleteId].push({
            date: date,
            readinessScore: finalRecoveryScore,
            hrv: athleteBiometric.hrv_night,
            restingHr: athleteBiometric.resting_hr,
            sleepDuration: athleteBiometric.sleep_duration_h,
            spo2: athleteBiometric.spo2_night,
            trainingLoad: athleteBiometric.training_load_pct,
            events: dataPoint[`${athleteId}_events`],
            athleteId: athleteId,
            athleteName: athlete?.name || `Athlete ${athleteId}`,
            recoveryScore: finalRecoveryScore,
            sleepQuality: enhancedMetrics.sleepQuality,
            stressIndex: enhancedMetrics.autonomicBalance,
            fatigueLevel: enhancedMetrics.fatigueLevel
          });

          // Store latest metrics for dashboard
          if (!metrics[athleteId]) {
            metrics[athleteId] = enhancedMetrics;
          }
        } else {
          dataPoint[`${athleteId}_recovery`] = null;
          dataPoint[`${athleteId}_hrv`] = null;
          dataPoint[`${athleteId}_sleepQuality`] = null;
          dataPoint[`${athleteId}_fatigue`] = null;
          dataPoint[`${athleteId}_events`] = [];
        }
      });

      unifiedData.push(dataPoint);
    });

    // Get genetic insights for recovery
    const geneticInsights = getRecoveryGenePanelInsights(geneticProfiles);

    console.log('📊 RecoveryTimeline: Final enhanced processed data:', {
      athleteDataMapKeys: Object.keys(dataMap),
      lineChartDataLength: unifiedData.length,
      recoveryMetricsKeys: Object.keys(metrics),
      geneticInsightsCount: geneticInsights.length
    });

    return {
      athleteDataMap: dataMap,
      lineChartData: unifiedData,
      recoveryMetrics: metrics,
      geneticInsights: geneticInsights
    };
  }, [selectedAthletes, timeRange, biometricData, geneticProfiles]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="card-enhanced p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Recovery Timeline</h2>
          <p className="text-gray-600 mb-6">Interactive timeline showing recovery progression</p>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading recovery data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-8">
        <div className="card-enhanced p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Recovery Timeline</h2>
          <p className="text-gray-600 mb-6">Interactive timeline showing recovery progression</p>
          <div className="text-center py-12">
            <p className="text-red-600 mb-2">⚠️ Error loading data</p>
            <p className="text-sm text-gray-500">{error}</p>
          </div>
        </div>
      </div>
    );
  }

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

        {/* Enhanced Chart Controls */}
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
                📈 Recovery Trend
              </button>
              <button
                className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                  viewMode === 'area'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setViewMode('area')}
              >
                📊 Recovery Areas
              </button>
              <button
                className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                  viewMode === 'composed'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setViewMode('composed')}
              >
                📈 Multi-Metric
              </button>
              <button
                className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                  viewMode === 'scatter'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setViewMode('scatter')}
              >
                🔍 Recovery State
              </button>
            </div>
          </div>

          {/* Genetic Insights Toggle */}
          {geneticProfiles.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Genetic Insights</label>
              <button
                className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                  showGeneticInsights
                    ? 'bg-purple-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setShowGeneticInsights(!showGeneticInsights)}
              >
                🧬 {showGeneticInsights ? 'Hide' : 'Show'} Insights
              </button>
            </div>
          )}
        </div>
        
        {/* Enhanced Recovery Charts */}
        <div className="h-96">
          {(() => {
            console.log('📊 RecoveryTimeline: Rendering enhanced chart with data:', {
              viewMode: viewMode,
              lineChartDataLength: lineChartData.length,
              sampleData: lineChartData.slice(0, 2)
            });
            return null;
          })()}

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
                    if (nameStr.includes('_recovery')) return [value === 0 ? 'No Data' : `${value}%`, 'Recovery Score'];
                    if (nameStr.includes('_hrv')) return [value, 'HRV (ms)'];
                    if (nameStr.includes('_sleepQuality')) return [`${value}%`, 'Sleep Quality'];
                    if (nameStr.includes('_fatigue')) return [`${value}%`, 'Fatigue Level'];
                    return [value, nameStr];
                  }}
                  labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString()}`}
                />
                <Legend />
                {/* Create lines for each athlete's recovery metrics */}
                {selectedAthletes.map((athleteId, index) => {
                  // More robust athlete lookup - try multiple ID fields
                  const athlete = athletes.find(a => {
                    const athleteIds = [
                      a.athlete_id,
                      a.id?.toString(),
                      (a as any).Id?.toString(),
                      (a as any).UnionId?.toString()
                    ].filter(Boolean);
          
                    const match = athleteIds.some(id => id === athleteId);
                    if (match) {
                      console.log(`✅ Found athlete match: ${a.name} for ID: ${athleteId}`);
                    }
                    return match;
                  });
          
                  if (!athlete) {
                    console.log(`❌ No athlete found for ID: ${athleteId}, available athletes:`, athletes.map(a => ({ id: a.athlete_id, name: a.name })));
                  }
                  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
                  const color = colors[index % colors.length];

                  return (
                    <Line
                      key={`recovery-${athleteId}`}
                      yAxisId="left"
                      type="monotone"
                      dataKey={`${athleteId}_recovery`}
                      name={`${athlete?.name || `Athlete ${athleteId}`} - Recovery`}
                      stroke={color}
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      connectNulls={false}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          ) : viewMode === 'area' ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
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
                <YAxis domain={[0, 100]} />
                <Tooltip
                  formatter={(value, name) => {
                    const nameStr = String(name);
                    if (nameStr.includes('_recovery')) return [value === 0 ? 'No Data' : `${value}%`, 'Recovery Score'];
                    if (nameStr.includes('_sleepQuality')) return [`${value}%`, 'Sleep Quality'];
                    if (nameStr.includes('_fatigue')) return [`${value}%`, 'Fatigue Level'];
                    return [value, nameStr];
                  }}
                  labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString()}`}
                />
                <Legend />
                {selectedAthletes.map((athleteId, index) => {
                  // More robust athlete lookup - try multiple ID fields
                  const athlete = athletes.find(a => {
                    const athleteIds = [
                      a.athlete_id,
                      a.id?.toString(),
                      (a as any).Id?.toString(),
                      (a as any).UnionId?.toString()
                    ].filter(Boolean);

                    return athleteIds.some(id => id === athleteId);
                  });
                  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
                  const color = colors[index % colors.length];

                  return (
                    <Area
                      key={`area-${athleteId}`}
                      type="monotone"
                      dataKey={`${athleteId}_recovery`}
                      name={`${athlete?.name || `Athlete ${athleteId}`} - Recovery`}
                      stroke={color}
                      fill={color}
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  );
                })}
              </AreaChart>
            </ResponsiveContainer>
          ) : viewMode === 'composed' ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
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
                    if (nameStr.includes('_recovery')) return [value === 0 ? 'No Data' : `${value}%`, 'Recovery Score'];
                    if (nameStr.includes('_hrv')) return [value, 'HRV (ms)'];
                    if (nameStr.includes('_sleepQuality')) return [`${value}%`, 'Sleep Quality'];
                    if (nameStr.includes('_fatigue')) return [`${value}%`, 'Fatigue Level'];
                    return [value, nameStr];
                  }}
                  labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString()}`}
                />
                <Legend />
                {selectedAthletes.map((athleteId, index) => {
                  // More robust athlete lookup - try multiple ID fields
                  const athlete = athletes.find(a => {
                    const athleteIds = [
                      a.athlete_id,
                      a.id?.toString(),
                      (a as any).Id?.toString(),
                      (a as any).UnionId?.toString()
                    ].filter(Boolean);

                    return athleteIds.some(id => id === athleteId);
                  });
                  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
                  const color = colors[index % colors.length];

                  return (
                    <React.Fragment key={`composed-${athleteId}`}>
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey={`${athleteId}_recovery`}
                        name={`${athlete?.name || `Athlete ${athleteId}`} - Recovery`}
                        stroke={color}
                        strokeWidth={3}
                        dot={{ r: 3 }}
                      />
                      <Bar
                        yAxisId="right"
                        dataKey={`${athleteId}_fatigue`}
                        name={`${athlete?.name || `Athlete ${athleteId}`} - Fatigue`}
                        fill={color}
                        fillOpacity={0.3}
                      />
                    </React.Fragment>
                  );
                })}
              </ComposedChart>
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
                  dataKey="fatigueLevel"
                  name="Fatigue Level"
                  unit="%"
                  domain={[0, 100]}
                  reversed
                />
                <ZAxis
                  type="number"
                  dataKey="recoveryScore"
                  range={[100, 1000]}
                  name="Recovery Score"
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  formatter={(value, name) => {
                    if (name === 'hrv') return [`${value} ms`, 'HRV'];
                    if (name === 'fatigueLevel') return [`${value}%`, 'Fatigue Level'];
                    if (name === 'recoveryScore') return [`${value}%`, 'Recovery Score'];
                    if (name === 'sleepQuality') return [`${value}%`, 'Sleep Quality'];
                    return [value, name];
                  }}
                />
                <Legend />
                {/* Create scatter plots for each athlete */}
                {selectedAthletes.map((athleteId, index) => {
                  // More robust athlete lookup - try multiple ID fields
                  const athlete = athletes.find(a => {
                    const athleteIds = [
                      a.athlete_id,
                      a.id?.toString(),
                      (a as any).Id?.toString(),
                      (a as any).UnionId?.toString()
                    ].filter(Boolean);

                    return athleteIds.some(id => id === athleteId);
                  });
                  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];
                  const color = colors[index % colors.length];
                  const athleteData = athleteDataMap[athleteId] || [];

                  return (
                    <Scatter
                      key={`scatter-${athleteId}`}
                      name={`${athlete?.name || `Athlete ${athleteId}`} - Recovery State`}
                      data={athleteData}
                      fill={color}
                    />
                  );
                })}
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>
        
        {/* Enhanced Recovery Events Timeline */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recovery Events & Alerts</h3>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

            <div className="space-y-6">
                {selectedAthletes.map(athleteId => {
                  // More robust athlete lookup - try multiple ID fields
                  const athlete = athletes.find(a => {
                    const athleteIds = [
                      a.athlete_id,
                      a.id?.toString(),
                      (a as any).Id?.toString(),
                      (a as any).UnionId?.toString()
                    ].filter(Boolean);

                    return athleteIds.some(id => id === athleteId);
                  });
                  const athleteData = athleteDataMap[athleteId] || [];
                  const athleteEvents = athleteData
                    .filter(d => d.events.length > 0)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                  if (athleteEvents.length === 0) return null;

                  return (
                    <div key={athleteId} className="space-y-4">
                      <h4 className="font-semibold text-gray-800 border-b pb-2">
                        {athlete?.name || `Athlete ${athleteId}`}
                      </h4>
                      {athleteEvents.map((data, index) => (
                        <div key={`${athleteId}-${index}`} className="relative flex items-start">
                          <div className={`absolute left-2 w-4 h-4 rounded-full border-4 border-white shadow ${
                            data.events.some(e => e.includes('High Training Load') || e.includes('Inflammation Risk'))
                              ? 'bg-red-500'
                              : data.events.some(e => e.includes('Poor Autonomic') || e.includes('High Fatigue'))
                                ? 'bg-orange-500'
                                : 'bg-yellow-500'
                          }`}></div>
                          <div className="ml-10 min-w-0 flex-1">
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
                                    event.includes('High Training Load') || event.includes('Inflammation Risk')
                                      ? 'bg-red-100 text-red-800'
                                      : event.includes('Poor Autonomic') || event.includes('High Fatigue')
                                        ? 'bg-orange-100 text-orange-800'
                                        : event.includes('Low') || event.includes('Short') || event.includes('Elevated')
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : 'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {event}
                                </span>
                              ))}
                            </div>
                            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Recovery:</span> {data.recoveryScore === 0 ? 'No Data' : `${data.recoveryScore}%`}
                              </div>
                              <div>
                                <span className="font-medium">HRV:</span> {data.hrv} ms
                              </div>
                              <div>
                                <span className="font-medium">Sleep:</span> {data.sleepDuration.toFixed(1)}h
                              </div>
                              <div>
                                <span className="font-medium">Fatigue:</span> {data.fatigueLevel}%
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* No events message */}
          {selectedAthletes.every(athleteId => {
            const athleteData = athleteDataMap[athleteId] || [];
            return athleteData.filter(d => d.events.length > 0).length === 0;
          }) && (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Recovery Alerts</h3>
              <p className="text-gray-600">
                All selected athletes are maintaining good recovery patterns within the selected time range.
              </p>
            </div>
          )}
        </div>
        
        {/* Comprehensive Recovery Metrics Dashboard */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Recovery Metrics Dashboard</h3>

          {/* Individual Athlete Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {selectedAthletes.map(athleteId => {
              // More robust athlete lookup - try multiple ID fields
              const athlete = athletes.find(a => {
                const athleteIds = [
                  a.athlete_id,
                  a.id?.toString(),
                  (a as any).Id?.toString(),
                  (a as any).UnionId?.toString()
                ].filter(Boolean);

                return athleteIds.some(id => id === athleteId);
              });
              const metrics = recoveryMetrics[athleteId];
              const athleteData = athleteDataMap[athleteId] || [];

              if (!metrics) return null;

              return (
                <div key={athleteId} className="card-enhanced p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    {athlete?.name || `Athlete ${athleteId}`}
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {metrics.overallRecovery === 0 ? 'No Data' : `${metrics.overallRecovery}%`}
                      </div>
                      <div className="text-sm text-gray-600">Recovery Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {metrics.sleepQuality}%
                      </div>
                      <div className="text-sm text-gray-600">Sleep Quality</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">
                        {metrics.autonomicBalance}
                      </div>
                      <div className="text-sm text-gray-600">Autonomic Balance</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600">
                        {metrics.fatigueLevel}%
                      </div>
                      <div className="text-sm text-gray-600">Fatigue Level</div>
                    </div>
                  </div>

                  {/* Recovery Recommendations */}
                  {metrics.recommendations.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Recovery Recommendations:</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {metrics.recommendations.slice(0, 3).map((rec, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-blue-500 mr-2">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Aggregate Stats */}
          {(() => {
            const allData = Object.values(athleteDataMap).flat();
            const allMetrics = Object.values(recoveryMetrics);

            const avgRecovery = allMetrics.length > 0
              ? Math.round(allMetrics.reduce((sum, m) => sum + m.overallRecovery, 0) / allMetrics.length)
              : 0;

            const avgSleepQuality = allMetrics.length > 0
              ? Math.round(allMetrics.reduce((sum, m) => sum + m.sleepQuality, 0) / allMetrics.length)
              : 0;

            const highFatigueCount = allMetrics.filter(m => m.fatigueLevel > 70).length;
            const inflammationRiskCount = allMetrics.filter(m => m.inflammationRisk > 60).length;

            return (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="card-enhanced p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {avgRecovery === 0 ? 'No Data' : `${avgRecovery}%`}
                  </div>
                  <div className="text-sm text-gray-600">Avg Recovery Score</div>
                </div>
                <div className="card-enhanced p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {avgSleepQuality}%
                  </div>
                  <div className="text-sm text-gray-600">Avg Sleep Quality</div>
                </div>
                <div className="card-enhanced p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {highFatigueCount}
                  </div>
                  <div className="text-sm text-gray-600">High Fatigue Athletes</div>
                </div>
                <div className="card-enhanced p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {inflammationRiskCount}
                  </div>
                  <div className="text-sm text-gray-600">Inflammation Risk</div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Genetic Recovery Insights */}
        {showGeneticInsights && geneticInsights.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Genetic Recovery Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {geneticInsights.map((insight, index) => (
                <div key={index} className="card-enhanced p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{insight.gene}</h4>
                      <div className="mt-1 flex items-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {insight.trait}
                        </span>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      insight.priority === 'high'
                        ? 'bg-red-100 text-red-800'
                        : insight.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                    }`}>
                      {insight.priority.charAt(0).toUpperCase() + insight.priority.slice(1)}
                    </span>
                  </div>

                  <div className="mt-3">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Impact:</span> {insight.impact}
                    </p>
                    <p className="text-sm text-gray-700 mt-2 bg-blue-50 p-3 rounded-md">
                      <span className="font-medium">Protocol:</span> {insight.recoveryProtocol}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};