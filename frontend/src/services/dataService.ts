import axios, { AxiosError } from 'axios';
import { Athlete, BiometricData, GeneticProfile, BodyComposition, BloodResults } from '../types';
import { WomenHealthRecord, GpsPoint, ApneaRecord } from '../types/specializedData';
import authService, { jcringApi, ApiError, AuthError } from './authService';

// Transform backend athlete data to frontend format
const transformAthletesData = (backendAthletes: any[]): Athlete[] => {
  return backendAthletes.map(athlete => {
    const transformedAthlete = {
      id: athlete.$id || athlete.Id || athlete.id,
      athlete_id: (athlete.UnionId || athlete.unionId)?.toString() || '',
      name: athlete.FullName || athlete.fullName || 'Athlete Unknown',
      age: athlete.Age || athlete.age || 0,
      sport: athlete.SportName || athlete.sportName || 'General',
      team: 'Default Team',
      baseline_start_date: undefined,
      date_of_birth: athlete.DateOfBirth || athlete.dateOfBirth,
      latestSteps: athlete.LatestSteps || athlete.latestSteps,
      latestCalories: athlete.LatestCalories || athlete.latestCalories,
      latestDistanceKm: athlete.LatestDistanceKm || athlete.latestDistanceKm,
      avgHeartRate7Days: athlete.AvgHeartRate7Days || athlete.avgHeartRate7Days,
      latestRestingHeartRate: athlete.LatestRestingHeartRate || athlete.latestRestingHeartRate,
      latestSpO2: athlete.LatestSpO2 || athlete.latestSpO2,
      latestBodyTemperature: athlete.LatestBodyTemperature || athlete.latestBodyTemperature,
      recoveryScore: athlete.RecoveryScore || athlete.recoveryScore,
      gender: athlete.Gender || athlete.gender
    };

    return transformedAthlete;
  });
};
// Transform backend biometric data to frontend format
const transformBiometricData = (backendData: any[]): BiometricData[] => {
  return backendData.map(item => {

    // Helper function to safely get numeric values with default 0
    const getNumericValue = (value: any, defaultValue: number = 0): number => {
      if (value === null || value === undefined || value === '') return defaultValue;
      const num = Number(value);
      return isNaN(num) ? defaultValue : num;
    };

    // Try multiple possible field names for HRV
    const hrvValue = getNumericValue(
      item.HeartRateVariability ??
      item.HRV ??
      item.Hrv ??
      item.heart_rate_variability ??
      item.hrv_night ??
      item.HRVNight
    );

    // Scale up HRV if it's stored as decimal (e.g., 6.55 -> 65.5)
    const scaledHrvValue = hrvValue < 10 ? hrvValue * 10 : hrvValue;

    // Try multiple possible field names for Resting HR
    const restingHrValue = getNumericValue(
      item.RestingHeartRate ??
      item.RHR ??
      item.Rhr ??
      item.resting_heart_rate ??
      item.resting_hr ??
      item.RestingHR
    );

    // Try multiple possible field names for Sleep
    const sleepValue = getNumericValue(
      item.SleepQuality ??
      item.Sleep ??
      item.sleep_duration ??
      item.sleep_hours ??
      item.SleepDuration??
      item.sleep_duration_h
    );

    // Try multiple possible field names for Recovery Score
    const recoveryScoreValue = getNumericValue(
      item.RecoveryScore ??
      item.Recovery ??
      item.recovery_score ??
      item.RecoveryScore
    );

    // Scale up Recovery Score if it's stored as decimal (e.g., 8.5 -> 85)
    const scaledRecoveryScoreValue = recoveryScoreValue < 10 ? recoveryScoreValue * 10 : recoveryScoreValue;

    // Try multiple possible field names for training load
    // Prioritize FatigueLevel as specified by user: FatigueLevel * 10
    let rawTrainingLoad = item.FatigueLevel ??
      item.Fatigue ??
      item.fatigue_level ??
      item.fatigueLevel ??
      item.training_load_pct ??
      item.TrainingLoadPct ??
      item.trainingLoadPct ??
      item.training_load ??
      item.TrainingLoad ??
      item.trainingLoad ??
      item.Training_Load ??
      item.TrainingLoadPercentage ??
      item.trainingLoadPercentage ??
      item.load_percentage ??
      item.LoadPercentage ??
      item.intensity ??
      item.Intensity ??
      item.workload ??
      item.Workload ??
      item.effort ??
      item.Effort;

    let trainingLoadValue = 0; // Default to 0

    if (rawTrainingLoad !== null && rawTrainingLoad !== undefined && rawTrainingLoad !== '') {
      const num = Number(rawTrainingLoad);
      if (!isNaN(num)) {
        // Special handling for FatigueLevel: multiply by 10 as specified by user
        if (item.FatigueLevel !== undefined || item.Fatigue !== undefined ||
            item.fatigue_level !== undefined || item.fatigueLevel !== undefined) {
          trainingLoadValue = num * 10; // FatigueLevel * 10
        } else {
          // For other fields, use existing logic
          trainingLoadValue = num > 10 ? num : num * 10;
        }
      }
    } else {
      trainingLoadValue = 0;
    }

    // Try multiple possible field names for athlete ID
    // Priority: union_id (from API), then other fields
    const athleteId = item.union_id?.toString() ||
                      item.UnionId?.toString() ||
                      item.AthleteId?.toString() ||
                      item.athlete_id?.toString() ||
                      item.athleteId?.toString() ||
                      item.Athlete?.UnionId?.toString() ||
                      item.Athlete?.Id?.toString() ||
                      '';

    const transformed = {
      athlete_id: athleteId,
      date: item.Date || item.date || '',
      hrv_night: scaledHrvValue,
      resting_hr: restingHrValue,
      spo2_night: getNumericValue(item.SpO2 ?? item.SPO2 ?? item.SpO2Night, 0),
      resp_rate_night: getNumericValue(item.RespiratoryRate ?? item.RespRate ?? item.RespiratoryRateNight, 0),
      deep_sleep_pct: getNumericValue(item.DeepSleep ?? item.DeepSleepPct ?? item.DeepSleepPercent, 0),
      rem_sleep_pct: getNumericValue(item.RemSleep ?? item.RemSleepPct ?? item.RemSleepPercent, 0),
      light_sleep_pct: getNumericValue(item.LightSleep ?? item.LightSleepPct ?? item.LightSleepPercent, 0),
      sleep_duration_h: sleepValue,
      temp_trend_c: getNumericValue(item.BodyTemperature ?? item.Temperature ?? item.BodyTemp, 0),
      training_load_pct: trainingLoadValue,
      sleep_onset_time: item.SleepOnsetTime ?? item.SleepOnset,
      wake_time: item.WakeTime ?? item.WakeUpTime,
      avg_heart_rate: getNumericValue(item.avg_heart_rate ?? item.avg_heart_rate, 0),
    };



    return transformed;
  });
};

// Parse sleep data from raw stages string (assume JSON array of {stage: 'deep'|'rem'|'light', duration_min: number})
const parseSleepData = (rawStages: string): {duration_h: number, deep_pct: number, rem_pct: number} => {
  try {
    const stages = JSON.parse(rawStages);
    if (!Array.isArray(stages)) return {duration_h: 0, deep_pct: 0, rem_pct: 0};
    const totalMin = stages.reduce((sum: number, s: any) => sum + (s.duration_min || 0), 0);
    const duration_h = totalMin / 60;
    const deepMin = stages.filter((s: any) => s.stage === 'deep').reduce((sum: number, s: any) => sum + (s.duration_min || 0), 0);
    const remMin = stages.filter((s: any) => s.stage === 'rem').reduce((sum: number, s: any) => sum + (s.duration_min || 0), 0);
    return {
      duration_h,
      deep_pct: totalMin > 0 ? (deepMin / totalMin * 100) : 0,
      rem_pct: totalMin > 0 ? (remMin / totalMin * 100) : 0,
    };
  } catch {
    return {duration_h: 0, deep_pct: 0, rem_pct: 0};
  }
};

// Aggregate data by date, e.g., avg for HR/HRV - fix to track count for proper avg
const aggregateByDate = (data: any[], valueKey: string): Record<string, number> => {
  const aggregated: Record<string, {sum: number, count: number}> = {};
  data.forEach((item: any) => {
    const date = item.date || item.Date;
    const value = Number(item[valueKey]) || 0;
    if (!aggregated[date]) {
      aggregated[date] = {sum: 0, count: 0};
    }
    aggregated[date].sum += value;
    aggregated[date].count += 1;
  });
  return Object.fromEntries(
    Object.entries(aggregated).map(([date, {sum, count}]) => [date, count > 0 ? sum / count : 0])
  );
};


// Transform backend genetic profile data to frontend format
const transformGeneticProfileData = (backendData: any[]): GeneticProfile[] => {
  return backendData.map(item => ({
    athlete_id: item.AthleteId?.toString() || item.UnionId || '',
    gene: item.GeneName || item.Gene || '',
    genotype: item.Variant || item.Genotype || ''
  }));
};

// Transform backend blood results data to frontend format
const transformBloodResultsData = (backendData: any[]): BloodResults[] => {
  return backendData.map(item => {
    // Start with basic fields
    const result: BloodResults = {
      id: item.Id,
      AthleteId: item.athlete_id,
      name: item.athlete_name || '',
      code: item.BloodTestTypeId,
      date: item.date,
      created_at: item.created_at,
      lab_name: item.lab_name,
      test_method: item.test_method,
      reference_ranges: item.reference_ranges,
      notes: item.Notes,
      is_abnormal: item.is_abnormal,
      flagged_values: item.flagged_values,
    };

    // Copy flat biomarker properties directly from API response
    const biomarkerFields = [
      'cortisol_nmol_l', 'vitamin_d', 'testosterone', 'ck', 'fasting_glucose',
      'hba1c', 'hba1c_ifcc', 'estimated_average_glucose', 'urea', 'creatinine',
      'egfr', 'uric_acid', 's_glutamyl_transferase', 's_alanine_transaminase',
      's_aspartate_transaminase', 'lactate_dehydrogenase', 'calcium_adjusted',
      'calcium_measured', 'magnesium', 'albumin_bcg', 'c_reactive_protein',
      'total_protein', 'esr', 'erythrocyte_count', 'hemoglobin', 'hematocrit',
      'mcv', 'mch', 'mchc', 'rdw', 'leucocyte_count', 'neutrophils_pct',
      'neutrophil_absolute_count', 'lymphocytes_pct', 'lymphocytes_absolute_count',
      'monocytes_pct', 'monocytes_absolute_count', 'eosinophils_pct',
      'eosinophils_absolute_count', 'basophils_pct', 'basophils_absolute_count',
      'nlr', 'platelets'
    ];

    biomarkerFields.forEach(field => {
      if (item[field] !== undefined && item[field] !== null) {
        (result as any)[field] = item[field];
      }
    });

    // Transform markers array to flat structure (fallback)
    if (item.Markers && item.Markers.$values && Array.isArray(item.Markers.$values)) {
      item.Markers.$values.forEach((marker: any) => {
        const markerName = marker.MarkerName?.toLowerCase().replace(/[^a-z0-9_]/g, '_');
        if (markerName) {
          // Map common marker names to expected frontend field names
          const fieldMapping: Record<string, string> = {
            'cortisol': 'cortisol_nmol_l',
            'vitamin_d': 'vitamin_d',
            'testosterone': 'testosterone',
            'creatine_kinase': 'ck',
            'ck': 'ck',
            'fasting_glucose': 'fasting_glucose',
            'glucose': 'fasting_glucose',
            'hba1c': 'hba1c',
            'hba1c_ifcc': 'hba1c_ifcc',
            'estimated_average_glucose': 'estimated_average_glucose',
            'urea': 'urea',
            'creatinine': 'creatinine',
            'egfr': 'egfr',
            'uric_acid': 'uric_acid',
            'ggt': 's_glutamyl_transferase',
            'glutamyl_transferase': 's_glutamyl_transferase',
            'alt': 's_alanine_transaminase',
            'alanine_transaminase': 's_alanine_transaminase',
            'ast': 's_aspartate_transaminase',
            'aspartate_transaminase': 's_aspartate_transaminase',
            'ldh': 'lactate_dehydrogenase',
            'lactate_dehydrogenase': 'lactate_dehydrogenase',
            'calcium_adjusted': 'calcium_adjusted',
            'calcium_measured': 'calcium_measured',
            'magnesium': 'magnesium',
            'albumin': 'albumin_bcg',
            'crp': 'c_reactive_protein',
            'c_reactive_protein': 'c_reactive_protein',
            'total_protein': 'total_protein',
            'esr': 'esr',
            'erythrocyte_count': 'erythrocyte_count',
            'rbc': 'erythrocyte_count',
            'hemoglobin': 'hemoglobin',
            'hematocrit': 'hematocrit',
            'mcv': 'mcv',
            'mch': 'mch',
            'mchc': 'mchc',
            'rdw': 'rdw',
            'leucocyte_count': 'leucocyte_count',
            'wbc': 'leucocyte_count',
            'neutrophils_pct': 'neutrophils_pct',
            'neutrophil_absolute_count': 'neutrophil_absolute_count',
            'lymphocytes_pct': 'lymphocytes_pct',
            'lymphocytes_absolute_count': 'lymphocytes_absolute_count',
            'monocytes_pct': 'monocytes_pct',
            'monocytes_absolute_count': 'monocytes_absolute_count',
            'eosinophils_pct': 'eosinophils_pct',
            'eosinophils_absolute_count': 'eosinophils_absolute_count',
            'basophils_pct': 'basophils_pct',
            'basophils_absolute_count': 'basophils_absolute_count',
            'nlr': 'nlr',
            'platelets': 'platelets'
          };

          const fieldName = fieldMapping[markerName] || markerName;
          (result as any)[fieldName] = marker.Value;
        }
      });
    }

    return result;
  });
};
// Transform backend body composition data to frontend format
const transformBodyCompositionData = (backendData: any[]): BodyComposition[] => {
  return backendData.map(item => {
    // Helper function to safely get numeric values with default 0
    const getNumericValue = (value: any, defaultValue: number = 0): number => {
      if (value === null || value === undefined || value === '') return defaultValue;
      const num = Number(value);
      return isNaN(num) ? defaultValue : num;
    };

    // Map API properties to expected frontend properties
    const weightKg = getNumericValue(item.Weight);
    const bodyFatRate = getNumericValue(item.BodyFat);
    const muscleMassKg = getNumericValue(item.MuscleMass);
    const boneDensity = getNumericValue(item.BoneDensity);

    // Calculate derived properties
    const fatMassKg = (bodyFatRate / 100) * weightKg;
    const fatFreeBodyWeightKg = weightKg - fatMassKg;

    // Assume skeletal muscle is a portion of total muscle mass (typically 50-60%)
    const skeletalMuscleKg = muscleMassKg * 0.55;

    // Set reasonable defaults for other properties
    const transformed = {
      athlete_id: item.AthleteId?.toString() || item.UnionId || '',
      date: item.MeasurementDate || item.date || '',
      weight_kg: weightKg,
      body_fat_rate: bodyFatRate,
      muscle_mass_kg: muscleMassKg,
      bone_density: boneDensity,
      fat_mass_kg: fatMassKg,
      skeletal_muscle_kg: skeletalMuscleKg,
      fat_free_body_weight_kg: fatFreeBodyWeightKg,
      target_weight_kg: getNumericValue(item.TargetWeight, weightKg), // Default to current weight if not provided
      weight_range_min: getNumericValue(item.WeightRangeMin, weightKg * 0.9), // Default to 90% of current
      weight_range_max: getNumericValue(item.WeightRangeMax, weightKg * 1.1), // Default to 110% of current
      bmi: getNumericValue(item.BMI, 22), // Default BMI
      visceral_fat_grade: getNumericValue(item.VisceralFatGrade, 5), // Default grade
      basal_metabolic_rate_kcal: getNumericValue(item.BasalMetabolicRate, 1800), // Default BMR
      subcutaneous_fat_percent: getNumericValue(item.SubcutaneousFatPercent, bodyFatRate * 0.8), // Estimate
      body_age: getNumericValue(item.BodyAge, 25), // Default body age
      smi_kg_m2: getNumericValue(item.SMI, 7.0), // Default skeletal muscle index
      symmetry: item.Symmetry || {
        arm_mass_right_kg: muscleMassKg * 0.05,
        arm_mass_left_kg: muscleMassKg * 0.05,
        leg_mass_right_kg: muscleMassKg * 0.25,
        leg_mass_left_kg: muscleMassKg * 0.25,
        trunk_mass_kg: muscleMassKg * 0.4
      },
      // Include any other properties from the API response
      ...item
    };

    return transformed;
  });
};

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5288/api';

// Helper function to get default date range (last 90 days for more historical data)
const getDefaultDateRange = () => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 90); // Last 90 days to capture more historical data

  return {
    startDate: startDate.toISOString().split('T')[0], // YYYY-MM-DD format
    endDate: endDate.toISOString().split('T')[0]
  };
};

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const wearableApi = axios.create({
  baseURL: API_BASE_URL,
});


// Add request interceptor for logging
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// =====================================================
// ATHLETE SERVICES
// =====================================================

export const athleteService = {
  // Get all athletes
  async getAllAthletes(page: number = 1, limit: number = 50, sportId?: number): Promise<any> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (sportId) params.append('sportId', sportId.toString());

    const response = await api.get(`/athletes?${params.toString()}`);
    const extractedData = response.data.Data;

    // Handle .NET JSON serialization format with $values
    let athletesArray: any[] = [];
    if (extractedData && typeof extractedData === 'object') {
      // Check for nested athletes structure
      if (extractedData.athletes) {
        if (Array.isArray(extractedData.athletes)) {
          athletesArray = extractedData.athletes;
        } else if (extractedData.athletes.$values && Array.isArray(extractedData.athletes.$values)) {
          athletesArray = extractedData.athletes.$values;
        }
      }
      // Check for Value property (common in .NET APIs)
      else if (extractedData.Value && Array.isArray(extractedData.Value)) {
        athletesArray = extractedData.Value;
      }
      // Check for direct $values structure
      else if (extractedData.$values && Array.isArray(extractedData.$values)) {
        athletesArray = extractedData.$values;
      }
      // Check if extractedData itself is the athletes array
      else if (Array.isArray(extractedData)) {
        athletesArray = extractedData;
      }
      // Try to extract from object properties
      else {
        const possibleArrays = Object.values(extractedData).filter(val => Array.isArray(val));
        if (possibleArrays.length > 0) {
          athletesArray = possibleArrays[0] as any[];
        }
      }
    } else if (Array.isArray(extractedData)) {
      athletesArray = extractedData;
    }

    return { athletes: transformAthletesData(athletesArray) };
  },

  // Get single athlete by Id (number)
  async getAthleteById(athleteId: number): Promise<Athlete> {
    const response = await api.get(`/athletes/${athleteId}`);
    const athleteData = response.data.Data;
    return athleteData; // Extract data from JCRing.Api response
  },

  // Get athletes by team/organization
  async getAthletesByTeam(organizationId: number): Promise<Athlete[]> {
    const response = await api.get(`/organizations/${organizationId}/athletes`);
    return response.data.Data; // Extract data from JCRing.Api response
  },
};

// =====================================================
// BIOMETRIC DATA SERVICES
// =====================================================

export const biometricDataService = {
  // Get all biometric data
  async getAllBiometricData(athleteId: number, startDate?: string, endDate?: string, page: number = 1, limit: number = 50): Promise<BiometricData[]> {
    try {
      console.log('getAllBiometricData called with athleteId:', athleteId, 'type:', typeof athleteId);
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('dataType', 'all');
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const url = `/Wearable/biometric/${athleteId}?${params.toString()}`;
      
      const response = await wearableApi.get(url);
      // Assume response structure {code: 1, data: array}, parse to array
      const rawData = response.data?.data || response.data || [];
      console.log('Raw biometric data fetched:', rawData, 'records');
      // Transform to BiometricData (assume aggregated data with fields like date, steps, heartRate, temperature, spo2, etc.)
      let transformedData = Array.isArray(rawData) ? transformBiometricData(rawData) : [];
      
      // Client-side filter by dates if provided (backend may not filter fully)
      if (startDate || endDate) {
        transformedData = transformedData.filter(item => {
          const itemDate = item.date;
          if (!itemDate) return false;
          if (startDate && itemDate < startDate) return false;
          if (endDate && itemDate > endDate) return false;
          return true;
        });
      }
      
      // Client-side pagination
      const startIdx = (page - 1) * limit;
      const endIdx = startIdx + limit;
      transformedData = transformedData.slice(startIdx, endIdx);
      
      // Set athlete_id for all records
      return transformedData.map(item => ({ ...item, athlete_id: athleteId.toString() }));
    } catch (error) {
      // Handle 404 errors gracefully - athlete not found, return empty array
      if (error instanceof AxiosError && error.response?.status === 404) {
        console.log('Athlete not found (404), returning empty array');
        return [];
      }
      console.error('Error fetching biometric data:', error);
      return [];
    }
  },

  // Get biometric data for all athletes in one call
  async getAllAthletesBiometricData(startDate?: string, endDate?: string, page: number = 1, limit: number = 1000): Promise<BiometricData[]> {
    try {
      console.log('getAllBiometricData called with startDate:', startDate, 'endDate:', endDate, 'page:', page, 'limit:', limit);
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('dataType', 'all');
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const url = `/Wearable/biometric/all?${params.toString()}`;

      const response = await wearableApi.get(url);
      console.log('Raw API response:', response);
      console.log('Raw API response.data:', response.data);

      // Handle different response formats
      let rawData = [];
      if (response.data) {
        // Check if it's wrapped in a standard API response format
        if (response.data.Data && Array.isArray(response.data.Data)) {
          rawData = response.data.Data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          rawData = response.data.data;
        } else if (Array.isArray(response.data)) {
          rawData = response.data;
        } else if (response.data.$values && Array.isArray(response.data.$values)) {
          // Handle .NET JSON serialization format
          rawData = response.data.$values;
        } else {
          console.warn('Unexpected response format:', response.data);
          rawData = [];
        }
      }

      console.log('Raw all biometric data fetched:', rawData.length, 'records');

      // Transform to BiometricData format
      const transformedData = Array.isArray(rawData) ? transformBiometricData(rawData) : [];

      // Client-side filter by dates if provided (backend may not filter fully)
      let filteredData = transformedData;
      if (startDate || endDate) {
        filteredData = transformedData.filter(item => {
          const itemDate = item.date;
          if (!itemDate) return false;
          if (startDate && itemDate < startDate) return false;
          if (endDate && itemDate > endDate) return false;
          return true;
        });
      }

      // Client-side pagination
      const startIdx = (page - 1) * limit;
      const endIdx = startIdx + limit;
      const paginatedData = filteredData.slice(startIdx, endIdx);

      console.log('Transformed and filtered biometric data:', paginatedData.length, 'records');
      return paginatedData;
    } catch (error) {
      console.error('Error fetching all biometric data:', error);
      return [];
    }
  },

  // Get biometric data for specific athlete
  async getBiometricDataByAthlete(
    athleteId: number,
    startDate?: string,
    endDate?: string
  ): Promise<BiometricData[]> {
    try {
      const dataTypes = [
        'heartrate',
        'hrv',
        'sleep',
        'spo2',
        'temperature',
        'trainingload',
        'steps',
        'respiratory'
      ];

      // Parallel fetches for each dataType
      const responses = await Promise.all(
        dataTypes.map(async (dataType) => {
          try {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            params.append('page', '1');
            params.append('limit', '100');
            const url = `/Wearable/biometric/${athleteId}?dataType=${dataType}&${params.toString()}`;
            const response = await api.get(url);
            return { dataType, data: response.data || [] }; // Assume array of DTOs
          } catch (err) {
            return { dataType, data: [] };
          }
        })
      );

      // Transform and merge all data by date, fill missing fields with defaults
      const allDailyData: any[] = [];
      responses.forEach(({ dataType, data }) => {
        if (data && Array.isArray(data)) {
          const transformed = transformBiometricData(data);
          transformed.forEach((item: any) => {
            allDailyData.push(item);
          });
        }
      });

      // Merge by date
      const mergedData: any[] = [];
      const dateMap = new Map();
      allDailyData.forEach(item => {
        const dateKey = item.date;
        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, { date: dateKey, athlete_id: athleteId.toString(), ...item });
        } else {
          const existing = dateMap.get(dateKey);
          Object.assign(existing, item);
        }
      });

      return Array.from(dateMap.values()).map(d => ({
        ...d,
        resting_hr: Number(d.resting_hr) || 0,
        hrv_night: Number(d.hrv_night) || 0,
        sleep_duration_h: Number(d.sleep_duration_h) || 0,
        deep_sleep_pct: Number(d.deep_sleep_pct) || 0,
        rem_sleep_pct: Number(d.rem_sleep_pct) || 0,
        light_sleep_pct: Number(d.light_sleep_pct) || 0,
        spo2_night: Number(d.spo2_night) || 0,
        resp_rate_night: Number(d.resp_rate_night) || 0,
        temp_trend_c: Number(d.temp_trend_c) || 0,
        training_load_pct: Number(d.training_load_pct) || 0,
      }));

    } catch (error) {
      return [];
    }
  },

  // Get latest biometric data for all athletes
  async getLatestBiometricData(athleteId: string): Promise<BiometricData[]> {
    try {
      const { startDate, endDate } = getDefaultDateRange();
      return await biometricDataService.getAllBiometricData(parseInt(athleteId), startDate, endDate, 1, 50);
    } catch (error) {
      console.error('Error fetching latest biometric data:', error);
      return [];
    }
  },

  // Insert/Update biometric data
  async saveBiometricData(athleteId: number, data: Omit<BiometricData, 'athlete_id'>): Promise<void> {
    await api.post(`/athletes/${athleteId}/biometric-data`, data);
  },
};

// =====================================================
// GENETIC PROFILE SERVICES
// =====================================================

export const geneticProfileService = {
  // Get all genetic profiles
  async getAllGeneticProfiles(page: number = 1, limit: number = 50): Promise<GeneticProfile[]> {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const response = await api.get(`/genetic-profiles?${params.toString()}`);
      const data = response.data?.Data || [];
      return Array.isArray(data) ? transformGeneticProfileData(data) : [];
    } catch (error) {
      return [];
    }
  },

  // Get genetic profile for specific athlete
  async getGeneticProfileByAthlete(athleteId: number): Promise<GeneticProfile[]> {
    try {
      const response = await api.get(`/genetic-profiles/athletes/${athleteId}`);
      // Handle .NET JSON serialization format with $values
      const data = response.data.Data;
      const extractedData = data?.$values || data || [];
      return Array.isArray(extractedData) ? transformGeneticProfileData(extractedData) : [];
    } catch (error) {
      return [];
    }
  },

  // Get genetic profiles by category
  async getGeneticProfilesByCategory(category: string): Promise<GeneticProfile[]> {
    const response = await api.get(`/genetic-profiles/category/${category}`);
    return response.data.Data; // Extract data from JCRing.Api response
  },

  // Get specific genes for all athletes
  async getSpecificGenes(genes: string[]): Promise<GeneticProfile[]> {
    const response = await api.post('/genetic-profiles/search', { genes });
    return response.data.Data; // Extract data from JCRing.Api response
  },

  // Get available genes list
  async getAvailableGenes(): Promise<{ gene_name: string; description: string; category: string }[]> {
    const response = await api.get('/genes');
    return response.data.Data; // Extract data from JCRing.Api response
  },
};

// =====================================================
// BODY COMPOSITION SERVICES
// =====================================================

export const bodyCompositionService = {
  // Get all body composition data
  async getAllBodyComposition(startDate?: string, endDate?: string, page: number = 1, limit: number = 50): Promise<BodyComposition[]> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const response = await api.get(`/body-composition?${params.toString()}`);
      const rawData = response.data.Data;
      if (Array.isArray(rawData)) {
        return transformBodyCompositionData(rawData);
      } else {
        return [];
      }
    } catch (error) {
      return [];
    }
  },

  // Get body composition for specific athlete
  async getBodyCompositionByAthlete(
    athleteId: number,
    startDate?: string,
    endDate?: string
  ): Promise<BodyComposition[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await api.get(`/athletes/${athleteId}/body-composition?${params.toString()}`);
    // Handle .NET JSON serialization format with $values
    const data = response.data.Data;

    let extractedData: any[] = [];
    if (data) {
      if (Array.isArray(data)) {
        extractedData = data;
      } else if (data.records && data.records.$values && Array.isArray(data.records.$values)) {
        // API returns data in nested structure: Data.records.$values
        extractedData = data.records.$values;
      } else if (data.$values && Array.isArray(data.$values)) {
        extractedData = data.$values;
      } else if (typeof data === 'object') {
        // Try to extract as array from object properties
        extractedData = Object.values(data).filter(item => typeof item === 'object' && item !== null);
      }
    }

    // Transform data to match frontend expectations
    const transformedData = Array.isArray(extractedData) ? transformBodyCompositionData(extractedData) : [];

    return transformedData;
  },

  // Get latest body composition for all athletes
  async getLatestBodyComposition(): Promise<BodyComposition[]> {
    try {
      const response = await api.get('/body-composition/latest');
      const data = response.data?.Data;

      let extractedData: any[] = [];
      if (data) {
        if (Array.isArray(data)) {
          extractedData = data;
        } else if (data.records && data.records.$values && Array.isArray(data.records.$values)) {
          // API returns data in nested structure: Data.records.$values
          extractedData = data.records.$values;
        } else if (data.$values && Array.isArray(data.$values)) {
          extractedData = data.$values;
        } else if (typeof data === 'object') {
          // Try to extract as array from object properties
          extractedData = Object.values(data).filter(item => typeof item === 'object' && item !== null);
        }
      }

      // Transform data to match frontend expectations
      const transformedData = Array.isArray(extractedData) ? transformBodyCompositionData(extractedData) : [];

      return transformedData;
    } catch (error) {
      return [];
    }
  },

  // Insert/Update body composition data
  async saveBodyComposition(athleteId: number, data: Omit<BodyComposition, 'athlete_id'>): Promise<void> {
    await api.post(`/athletes/${athleteId}/body-composition`, data);
  },
};

// =====================================================
// BLOOD RESULTS SERVICES
// =====================================================

export const bloodResultsService = {
  // Get all blood results
  async getAllBloodResults(page: number = 1, limit: number = 50): Promise<BloodResults[]> {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const response = await api.get(`/blood-results?${params.toString()}`);
      const data = response.data.Data;
      const extractedData = data?.$values || data || [];
      return Array.isArray(extractedData) ? transformBloodResultsData(extractedData) : [];
    } catch (error) {
      return [];
    }
  },

  // Get blood results for specific athlete
  async getBloodResultsByAthlete(athleteId: number): Promise<BloodResults[]> {
    try {
      const response = await api.get(`/blood-results/athlete/${athleteId}`);
      // Handle .NET JSON serialization format with $values
      const data = response.data.Data;
      const extractedData = data?.$values || data || [];
      return Array.isArray(extractedData) ? transformBloodResultsData(extractedData) : [];
    } catch (error) {
      return [];
    }
  },

  // Get latest blood results for all athletes
  async getLatestBloodResults(): Promise<BloodResults[]> {
    try {
      const response = await api.get('/blood-results/latest');
      // Handle .NET JSON serialization format with $values
      const data = response.data.Data;
      const extractedData = data?.$values || data || [];
      return Array.isArray(extractedData) ? transformBloodResultsData(extractedData) : [];
    } catch (error) {
      return [];
    }
  },

  // Insert/Update blood results
  async saveBloodResults(athleteId: number, data: Omit<BloodResults, 'id' | 'AthleteId'>): Promise<void> {
    await api.post(`/blood-results/athletes/${athleteId}/blood-results`, data);
  },
};

// =====================================================
// DASHBOARD SERVICES
// =====================================================

export const dashboardService = {
  // Get dashboard data (latest data for all athletes)
  async getDashboardData(): Promise<{
    athletes: Athlete[];
    biometricData: BiometricData[];
    geneticProfiles: GeneticProfile[];
    bodyComposition: BodyComposition[];
    bloodResults: BloodResults[];
  }> {
    try {
      const athletesResponse = await athleteService.getAllAthletes(1, 50);
      const athletes = athletesResponse.athletes || [];
      console.log('Fetched athletes:', athletes);

      // Fetch biometric data for all athletes in one call (optimized)
      let biometricData: BiometricData[] = [];
      try {
        // Use the new single API call instead of looping through athletes
        biometricData = await biometricDataService.getAllAthletesBiometricData(undefined, undefined, 1, 1000);
        
      } catch (error) {
        console.warn('Failed to fetch biometric data for all athletes:', error);
        biometricData = []; // Ensure it's always an array
      }

      // Fetch body composition data for all athletes (skip date parameters to avoid 500 errors)
      let bodyComposition: BodyComposition[] = [];
      try {
        // Skip date parameters entirely since they cause 500 errors
        const rawBodyCompositionData = await bodyCompositionService.getAllBodyComposition(undefined, undefined, 1, 2000);

        // Handle the response - it might be raw data or already transformed
        if (Array.isArray(rawBodyCompositionData)) {
          bodyComposition = transformBodyCompositionData(rawBodyCompositionData);
        } else {
          // If it's already transformed data, use it directly
          bodyComposition = rawBodyCompositionData || [];
        }
      } catch (error) {
        bodyComposition = []; // Ensure it's always an array
      }

      // Fetch all genetic profiles
      let geneticProfiles: GeneticProfile[] = [];
      try {
        const geneticResponse = await geneticProfileService.getAllGeneticProfiles(1, 1000);
        geneticProfiles = geneticResponse;
      } catch (error) {
        geneticProfiles = []; // Ensure it's always an array
      }

      // Log the final result

      // Fetch latest blood results for all athletes
      let bloodResults: BloodResults[] = [];
      try {
        bloodResults = await bloodResultsService.getLatestBloodResults();
      } catch (error) {
        bloodResults = []; // Ensure it's always an array
      }

      // Log the final result

      return {
        athletes,
        biometricData,
        geneticProfiles,
        bodyComposition,
        bloodResults
      };
    } catch (error) {
      return {
        athletes: [],
        biometricData: [],
        geneticProfiles: [],
        bodyComposition: [],
        bloodResults: []
      };
    }
  },

  // Get all data for a specific athlete
  async getAthleteAllData(athleteId: number, startDate?: string, endDate?: string): Promise<{
    athlete: Athlete | undefined;
    biometricData: BiometricData[];
    geneticProfile: GeneticProfile[];
    bodyComposition: BodyComposition[];
    bloodResults: BloodResults[];
  }> {
    try {
      // First get the athlete by UnionId
      const athleteResponse = await athleteService.getAthleteById(athleteId);
      const athlete = athleteResponse ? transformAthletesData([athleteResponse])[0] : undefined;

      if (!athlete) {
        return {
          athlete: undefined,
          biometricData: [],
          geneticProfile: [],
          bodyComposition: [],
          bloodResults: []
        };
      }

      // Fetch biometric data for this athlete (try with broader date range to get more historical data)
      let biometricData: BiometricData[] = [];
      try {
        // Skip date parameters entirely since backend doesn't support them properly
        biometricData = await biometricDataService.getBiometricDataByAthlete(athlete.id);
      } catch (error) {
        biometricData = []; // Ensure it's always an array
      }

      // Fetch genetic profile for this athlete
      let geneticProfile: GeneticProfile[] = [];
      try {
        geneticProfile = await geneticProfileService.getGeneticProfileByAthlete(athlete.id);
      } catch (error) {
        geneticProfile = []; // Ensure it's always an array
      }

      // Fetch body composition for this athlete (try with broader date range)
      let bodyComposition: BodyComposition[] = [];
      try {
        // Skip date parameters entirely since backend doesn't support them properly
        bodyComposition = await bodyCompositionService.getBodyCompositionByAthlete(athlete.id);
      } catch (error) {
        bodyComposition = []; // Ensure it's always an array
      }

      // Fetch blood results for this athlete
      let bloodResults: BloodResults[] = [];
      try {
        bloodResults = await bloodResultsService.getBloodResultsByAthlete(athlete.id);
      } catch (error) {
        bloodResults = []; // Ensure it's always an array
      }

      return {
        athlete,
        biometricData,
        geneticProfile,
        bodyComposition,
        bloodResults
      };
    } catch (error) {
      return {
        athlete: undefined,
        biometricData: [],
        geneticProfile: [],
        bodyComposition: [],
        bloodResults: []
      };
    }
  },
};

// =====================================================
// MAIN DATA SERVICE
// =====================================================

export const dataService = {
  // Main function to get data with fallback to mock data
  async getData(useDatabase: boolean = true): Promise<{
    athletes: Athlete[];
    biometricData: BiometricData[];
    geneticProfiles: GeneticProfile[];
    bodyComposition: BodyComposition[];
    bloodResults: BloodResults[];
  }> {
    if (useDatabase) {
      try {
        // Try to get data from database
        const data = await dashboardService.getDashboardData();
        
        return data;
      } catch (error) {
        // Return empty arrays instead of throwing error
        return {
          athletes: [],
          biometricData: [],
          geneticProfiles: [],
          bodyComposition: [],
          bloodResults: []
        };
      }
    } else {
      // Use empty data when not using database
      return {
        athletes: [],
        biometricData: [],
        geneticProfiles: [],
        bodyComposition: [],
        bloodResults: []
      };
    }
  },

  // Get data for specific athlete
  async getAthleteData(
    athleteId: number,
    useDatabase: boolean = true
  ): Promise<{
    athlete: Athlete | undefined;
    biometricData: BiometricData[];
    geneticProfile: GeneticProfile[];
    bodyComposition: BodyComposition[];
    bloodResults: BloodResults[];
  }> {
    if (useDatabase) {
      try {
        const data = await dashboardService.getAthleteAllData(athleteId);
        return data;
      } catch (error) {
        // Return empty data instead of throwing error
        return {
          athlete: undefined,
          biometricData: [],
          geneticProfile: [],
          bodyComposition: [],
          bloodResults: []
        };
      }
    } else {
      // Use empty data when not using database
      return {
        athlete: undefined,
        biometricData: [],
        geneticProfile: [],
        bodyComposition: [],
        bloodResults: []
      };
    }
  },

  async getWomenHealthRecords(startDay: string, endDay: string): Promise<WomenHealthRecord[]> {
    try {
      const users = await authService.getUserInfo();
      if (!users || users.length === 0) {
        return [];
      }
      const athleteId = parseInt(users[0].athlete_id || '0');
      if (!athleteId) {
        return [];
      }
      const response = await api.get(`/Wearable/women-health/${athleteId}?start=${startDay}&end=${endDay}`);
      if (!response || !Array.isArray(response)) return [];
      return response.map((item: any): WomenHealthRecord => ({
        day: item.Day || '',
        flowRate: Number(item.FlowRate) || 0,
        symptoms: JSON.parse(item.Symptoms || '[]') as number[],
      }));
    } catch (error) {
      return [];
    }
  },

  async getGpsData(start?: string, page: number = 1, limit: number = 50): Promise<GpsPoint[]> {
    try {
      const users = await authService.getUserInfo();
      if (!users) {
        return [];
      }
      const unionId = users[0]?.unionId || '';
      if (!unionId) throw new ApiError('No unionId found');
      const bindResponse = await jcringApi.get(`/wearableblev3/ring/queryBind?unionId=${unionId}`);
      if (!bindResponse.data || bindResponse.data.length === 0) throw new ApiError('No MAC found');
      const mac = bindResponse.data[0].mac || '';
      const params = new URLSearchParams({
        unionId,
        mac,
        dataType: 'gpsData',
        deviceType: '2026',
        page: page.toString(),
        limit: limit.toString(),
      });
      if (start) params.append('start', start);
      const response = await jcringApi.get(`/wearablequeryv3/ring/queryByPage?${params.toString()}`);
      if (!response.data || !Array.isArray(response.data)) return [];
      return response.data.map((item: any): GpsPoint => ({
        gpsDate: item.gpsDate || item.date || '',
        latitude: Number(item.latitude || item.lat) || 0,
        longitude: Number(item.longitude || item.lon) || 0,
      }));
    } catch (error) {
      return [];
    }
  },

  async getApneaRecords(page: number = 1, limit: number = 500): Promise<ApneaRecord[]> {
    try {
      const users = await authService.getUserInfo();
      if (!users) {
        return [];
      }
      const unionId = users[0]?.unionId || '';
      if (!unionId) throw new ApiError('No unionId found');
      const bindResponse = await jcringApi.get(`/wearableblev3/ring/queryBind?unionId=${unionId}`);
      if (!bindResponse.data || bindResponse.data.length === 0) throw new ApiError('No MAC found');
      const mac = bindResponse.data[0].mac || '';
      const formData = new FormData();
      formData.append('mac', mac);
      formData.append('page', page.toString());
      formData.append('limit', limit.toString());
      const response = await jcringApi.post('/wearableblev3/data/getSleepBreathPause', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (!response.data || !Array.isArray(response.data)) return [];
      return response.data.map((item: any): ApneaRecord => ({
        id: Number(item.id) || 0,
        mac: item.mac || '',
        day: item.day || item.date || '',
      }));
    } catch (error) {
      return [];
    }
  },

};

// Export default service
export default dataService;