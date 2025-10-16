import axios, { AxiosError } from 'axios';
import { Athlete, BiometricData, GeneticProfile, BodyComposition, BloodResults } from '../types';
import { WomenHealthRecord, GpsPoint, ApneaRecord } from '../types/specializedData';
import authService, { jcringApi, ApiError, AuthError } from './authService';
import { log } from 'three/src/nodes/TSL.js';

// Transform backend athlete data to frontend format
const transformAthletesData = (backendAthletes: any[]): Athlete[] => {
  const calculateAge = (dob: string | Date | undefined): number => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return backendAthletes.map(athlete => {
    const rawId = athlete.Id || athlete.$id || athlete.id;
    const transformedAthlete = {
      id: rawId,
      athlete_id: (athlete.UnionId || athlete.unionId)?.toString() || '',
      name: `${athlete.FirstName || ''} ${athlete.LastName || ''}`.trim() || athlete.FullName || athlete.fullName || 'Athlete Unknown',
      age: athlete.Age || athlete.age || calculateAge(athlete.DateOfBirth || athlete.dateOfBirth),
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
      item.HRVNight ??
      item.HrvNight  // Match the actual backend field name
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
      item.RestingHR ??
      item.RestingHr  // Match the actual backend field name
    );

    // Try multiple possible field names for Sleep
    const sleepValue = getNumericValue(
      item.SleepQuality ??
      item.Sleep ??
      item.sleep_duration ??
      item.sleep_hours ??
      item.SleepDuration ??
      item.sleep_duration_h ??
      item.SleepDurationH  // Match the actual backend field name
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
      spo2_night: (() => { const v = getNumericValue(item.SpO2 ?? item.SPO2 ?? item.SpO2Night ?? item.Spo2Night ?? item.Spo2 ?? item.spo2 ?? item.spo2Night ?? item.OxygenSaturation ?? item.oxygen_saturation, 0); return v > 0 && v <= 1 ? v * 100 : v; })(),
      resp_rate_night: getNumericValue(item.RespiratoryRate ?? item.RespRate ?? item.RespiratoryRateNight ?? item.RespRateNight, 0),
      deep_sleep_pct: getNumericValue(item.DeepSleep ?? item.DeepSleepPct ?? item.DeepSleepPercent ?? item.DeepSleepPct, 0),
      rem_sleep_pct: getNumericValue(item.RemSleep ?? item.RemSleepPct ?? item.RemSleepPercent ?? item.RemSleepPct, 0),
      light_sleep_pct: getNumericValue(item.LightSleep ?? item.LightSleepPct ?? item.LightSleepPercent ?? item.LightSleepPct, 0),
      sleep_duration_h: sleepValue,
      temp_trend_c: getNumericValue(item.BodyTemperature ?? item.Temperature ?? item.BodyTemp ?? item.TempTrendC, 0),
      training_load_pct: trainingLoadValue,
      recovery_score: scaledRecoveryScoreValue,
      sleep_onset_time: item.SleepOnsetTime ?? item.SleepOnset,
      wake_time: item.WakeTime ?? item.WakeUpTime,
      avg_heart_rate: getNumericValue(item.avg_heart_rate ?? item.avg_heart_rate ?? item.AvgHeartRate, 0),
      blood_pressure_systolic: getNumericValue(item.SystolicBP ?? item.BloodPressureSystolic ?? item.BPSystolic ?? item.systolic_bp, 0),
      blood_pressure_diastolic: getNumericValue(item.DiastolicBP ?? item.BloodPressureDiastolic ?? item.BPDiastolic ?? item.diastolic_bp, 0),
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
  return backendData
    .filter(item => {
      // Filter out $ref objects that don't contain actual data
      return !item.$ref && (item.AthleteId || item.UnionId || item.GeneName || item.Gene || item.Variant || item.Genotype);
    })
    .map(item => ({
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
  return backendData
    .filter(item => {
      // Filter out $ref objects (JSON serialization optimization)
      if (item.$ref) {
        return false;
      }

      // Filter out records with missing essential data
      const hasEssentialData = item.Id && item.AthleteId && item.MeasurementDate;
      return hasEssentialData;
    })
    .map(item => {
      // Helper function to safely get numeric values with default 0
      const getNumericValue = (value: any, defaultValue: number = 0): number => {
        if (value === null || value === undefined || value === '') return defaultValue;
        const num = Number(value);
        return isNaN(num) ? defaultValue : num;
      };

      // Helper function to safely get date values
      const getDateValue = (value: any): string => {
        if (!value) return '';
        try {
          // Handle different date formats
          let dateString = value.toString();

          // Remove timezone info if present (e.g., +00, +02, etc.)
          dateString = dateString.replace(/([+-]\d{2}):?(\d{2})?$/, '');

          const date = new Date(dateString);
          return isNaN(date.getTime()) ? '' : value;
        } catch {
          return '';
        }
      };

      // Map API properties directly to frontend properties
      const transformed = {
        id: item.Id,
        athleteId: item.AthleteId,
        measurementDate: getDateValue(item.MeasurementDate),
        weight: getNumericValue(item.Weight),
        bodyFat: getNumericValue(item.BodyFat),
        muscleMass: getNumericValue(item.MuscleMass),
        boneDensity: getNumericValue(item.BoneDensity),
        targetWeight: getNumericValue(item.TargetWeight),
        weightRangeMin: getNumericValue(item.WeightRangeMin),
        weightRangeMax: getNumericValue(item.WeightRangeMax),
        bmi: getNumericValue(item.BMI),
        visceralFatGrade: getNumericValue(item.VisceralFatGrade),
        basalMetabolicRate: getNumericValue(item.BasalMetabolicRate),
        subcutaneousFatPercent: getNumericValue(item.SubcutaneousFatPercent),
        bodyAge: getNumericValue(item.BodyAge),
        smi: getNumericValue(item.SMI),
        armMassRightKg: getNumericValue(item.ArmMassRightKg),
        armMassLeftKg: getNumericValue(item.ArmMassLeftKg),
        legMassRightKg: getNumericValue(item.LegMassRightKg),
        legMassLeftKg: getNumericValue(item.LegMassLeftKg),
        trunkMassKg: getNumericValue(item.TrunkMassKg),
        ArmMassRightFatKg: getNumericValue(item.ArmMassRightFatKg),
        ArmMassLeftFatKg: getNumericValue(item.ArmMassLeftFatKg),
        LegMassRightFatKg: getNumericValue(item.LegMassRightFatKg),
        LegMassLeftFatKg: getNumericValue(item.LegMassLeftFatKg),
        TrunkMassFatKg: getNumericValue(item.TrunkMassFatKg),
        // Include athlete navigation property if available (may be null for general endpoint)
        athlete: item.Athlete || null
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
    let athleteData: any = null;
    const respData = response.data;
    if (respData && typeof respData === 'object') {
      if (respData.Data) {
        if (Array.isArray(respData.Data)) {
          athleteData = respData.Data[0] || null;
        } else if (respData.Data.$values && Array.isArray(respData.Data.$values)) {
          athleteData = respData.Data.$values[0] || null;
        } else {
          athleteData = respData.Data;
        }
      } else if (Array.isArray(respData)) {
        athleteData = respData[0] || null;
      } else if (respData.$values && Array.isArray(respData.$values)) {
        athleteData = respData.$values[0] || null;
      } else {
        athleteData = respData;
      }
    }
    if (!athleteData || typeof athleteData !== 'object') {
      throw new Error(`Athlete with ID ${athleteId} not found`);
    }
    return transformAthletesData([athleteData])[0];
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
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('dataType', 'all');
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const url = `/Wearable/biometric/${athleteId}?${params.toString()}`;

      const response = await wearableApi.get(url);
      // Handle .NET JSON serialization format with $values
      let rawData = response.data?.data || response.data || [];

      // Extract array from .NET $values format
      if (rawData && typeof rawData === 'object' && rawData.$values && Array.isArray(rawData.$values)) {
        rawData = rawData.$values;
      }

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
        return [];
      }
      return [];
    }
  },

  // Get biometric data for all athletes in one call
  async getAllAthletesBiometricData(startDate?: string, endDate?: string, page: number = 1, limit: number = 1000): Promise<BiometricData[]> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('dataType', 'all');
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const url = `/Wearable/biometric/all?${params.toString()}`;

      const response = await wearableApi.get(url);

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
          rawData = [];
        }
      }

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

      return paginatedData;
    } catch (error) {
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

      // Transform and merge all data by date, accumulating non-default fields from each data type
      const allDailyData: any[] = [];
      responses.forEach(({ dataType, data }) => {
        if (data && Array.isArray(data)) {
          const transformed = transformBiometricData(data);
          transformed.forEach((item: any) => {
            const partial: any = { date: item.date, athlete_id: athleteId.toString() };
            Object.keys(item).forEach((key: string) => {
              if (key !== 'date' && key !== 'athlete_id') {
                const value = item[key];
                if (value !== undefined && value !== null &&
                    (typeof value !== 'number' || value !== 0) &&
                    (typeof value !== 'string' || value !== '')) {
                  partial[key] = value;
                }
              }
            });
            if (Object.keys(partial).length > 2) {
              allDailyData.push(partial);
            }
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
        spo2_night: (() => { const s = Number(d.spo2_night) || 0; return s > 0 && s <= 1 ? s * 100 : s; })(),
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
      return [];
    }
  },

  // Insert/Update biometric data
  async saveBiometricData(athleteId: number, data: Omit<BiometricData, 'athlete_id'>): Promise<void> {
    await api.post(`/athletes/${athleteId}/biometric-data`, data);
  },

  // Get previous night's sleep data for specific athlete
  async getPreviousNightSleep(
    athleteId: number,
    targetDate?: string
  ): Promise<{
    date: string;
    sleepDurationH: number;
    deepSleepPct: number;
    remSleepPct: number;
    lightSleepPct: number;
    sleepOnsetTime: string;
    wakeTime: string;
  } | null> {
    try {
      const params = new URLSearchParams();
      if (targetDate) params.append('targetDate', targetDate);

      const url = `/Wearable/previous-night-sleep/${athleteId}?${params.toString()}`;

      const response = await wearableApi.get(url);
      const data = response.data;

      if (!data) return null;

      return {
        date: data.Date || data.date || '',
        sleepDurationH: Number(data.SleepDurationH || data.sleepDurationH) || 0,
        deepSleepPct: Number(data.DeepSleepPct || data.deepSleepPct) || 0,
        remSleepPct: Number(data.RemSleepPct || data.remSleepPct) || 0,
        lightSleepPct: Number(data.LightSleepPct || data.lightSleepPct) || 0,
        sleepOnsetTime: data.SleepOnsetTime || data.sleepOnsetTime || '',
        wakeTime: data.WakeTime || data.wakeTime || ''
      };
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        return null;
      }
      return null;
    }
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
      let data: any = response.data.Data || response.data;

      // Handle nested structure with profiles.$values
      let geneticProfiles: any[] = [];
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        // Check for nested profiles structure
        if (data.profiles && data.profiles.$values && Array.isArray(data.profiles.$values)) {
          geneticProfiles = data.profiles.$values;
        } else if (data.profiles && Array.isArray(data.profiles)) {
          geneticProfiles = data.profiles;
        } else if (data.$values && Array.isArray(data.$values)) {
          geneticProfiles = data.$values;
        } else if (Array.isArray(data)) {
          geneticProfiles = data;
        }
      } else if (Array.isArray(data)) {
        geneticProfiles = data;
      }

      return transformGeneticProfileData(geneticProfiles);
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

  // Get genetic summary data for athlete from AthleteGeneticSummary table
  async getGeneticSummaryByAthlete(athleteId: number): Promise<any[]> {
    try {
      const response = await api.get(`/GeneticsAthletes/summary/${athleteId}`);
      let data = response.data || [];

      // Handle .NET JSON serialization format with $values
      if (data && typeof data === 'object' && data.$values && Array.isArray(data.$values)) {
        data = data.$values;
      }

      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    }
  },

  // Get genetic cellular data for athlete from AthleteGeneticSummary table
  async getGeneticCellularByAthlete(athleteId: number): Promise<any[]> {
    try {
      const response = await api.get(`/GeneticsAthletes/cellular/${athleteId}`);
      let data = response.data || [];

      // Handle .NET JSON serialization format with $values
      if (data && typeof data === 'object' && data.$values && Array.isArray(data.$values)) {
        data = data.$values;
      }

      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    }
  },

  // Get pharmacogenomics data for athlete from AthleteGeneticSummary table
  async getPharmacogenomicsByAthlete(athleteId: number): Promise<any[]> {
    try {
      const response = await api.get(`/GeneticsAthletes/pharmacogenomics/${athleteId}`);
      let data = response.data || [];

      // Handle .NET JSON serialization format with $values
      if (data && typeof data === 'object' && data.$values && Array.isArray(data.$values)) {
        data = data.$values;
      }

      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    }
  },

  // Get nutrigenomics data for athlete from AthleteGeneticSummary table
  async getNutrigenomicsByAthlete(athleteId: number): Promise<any[]> {
    try {
      const response = await api.get(`/GeneticsAthletes/nutrigenomics/${athleteId}`);
      let data = response.data || [];

      // Handle .NET JSON serialization format with $values
      if (data && typeof data === 'object' && data.$values && Array.isArray(data.$values)) {
        data = data.$values;
      }

      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    }
  },

  // Get recovery genetics data for athlete from AthleteGeneticSummary table
  async getRecoveryGeneticsByAthlete(athleteId: number): Promise<any[]> {
    try {
      const response = await api.get(`/GeneticsAthletes/recovery/${athleteId}`);
      let data = response.data || [];

      // Handle .NET JSON serialization format with $values
      if (data && typeof data === 'object' && data.$values && Array.isArray(data.$values)) {
        data = data.$values;
      }

      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    }
  },

  // Get all genetic data for athlete
  async getAllGeneticDataByAthlete(athleteId: number): Promise<{ geneticSummary: any[], geneticCellular: any[] }> {
    try {
      const response = await api.get(`/GeneticsAthletes/all/${athleteId}`);
      let data = response.data || { geneticSummary: [], geneticCellular: [] };

      // Handle .NET JSON serialization format with $values for nested objects
      if (data && typeof data === 'object') {
        if (data.geneticSummary && data.geneticSummary.$values && Array.isArray(data.geneticSummary.$values)) {
          data.geneticSummary = data.geneticSummary.$values;
        }
        if (data.geneticCellular && data.geneticCellular.$values && Array.isArray(data.geneticCellular.$values)) {
          data.geneticCellular = data.geneticCellular.$values;
        }
      }

      return data;
    } catch (error) {
      return { geneticSummary: [], geneticCellular: [] };
    }
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

      const response = await api.get(`/body-composition?${params.toString()}`, {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
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
    // First try the general endpoint to get all data, then filter
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await api.get(`/body-composition?${params.toString()}`);

      const data = response.data.Data;

      let allData: any[] = [];
      if (data) {
        if (Array.isArray(data)) {
          allData = data;
        } else if (data.records && data.records.$values && Array.isArray(data.records.$values)) {
          allData = data.records.$values;
        } else if (data.$values && Array.isArray(data.$values)) {
          allData = data.$values;
        }
      }

      // Filter by athleteId
      const athleteData = allData.filter(item => item && item.AthleteId === athleteId);

      // Transform data to match frontend expectations
      const transformedData = transformBodyCompositionData(athleteData);

      return transformedData;
    } catch (error) {
      return [];
    }
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

  // Delete body composition record
  async deleteBodyComposition(recordId: number, athleteId?: number): Promise<void> {
    // If athleteId is provided, include it in the URL for proper routing
    if (athleteId) {
      await api.delete(`/body-composition/${athleteId}/${recordId}`);
    } else {
      await api.delete(`/body-composition/${recordId}`);
    }
  },

  // Get all athletes
  async getAllAthletes(page: number = 1, limit: number = 50): Promise<Athlete[]> {
    const response = await athleteService.getAllAthletes(page, limit);
    return response.athletes || [];
  },
};

// =====================================================
// HEART RATE DATA SERVICES
// =====================================================

export const heartRateService = {
  // Get heart rate data for specific athlete within date range
  async getHeartRateData(
    athleteId: number,
    startDate?: string,
    endDate?: string,
    page: number = 1,
    limit: number = 100
  ): Promise<{ measuredAt: Date; heartRateBPM: number; type: string }[]> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('dataType', 'dynamicHeartRateData');
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const url = `/Wearable/biometric/${athleteId}?${params.toString()}`;

      const response = await wearableApi.get(url);
      let rawData = response.data?.data || response.data || [];

      // Handle .NET JSON serialization format with $values
      if (rawData && typeof rawData === 'object' && rawData.$values && Array.isArray(rawData.$values)) {
        rawData = rawData.$values;
      }

      // Transform to heart rate format
      const transformedData = Array.isArray(rawData) ? rawData.map((item: any) => ({
        measuredAt: new Date(item.MeasuredAt || item.measuredAt || item.date),
        heartRateBPM: Number(item.HeartRateBPM || item.heartRateBPM || item.bpm || item.HeartRate || item.heartRate) || 0,
        type: item.Type || item.type || 'Unknown'
      })).filter(item => item.heartRateBPM > 0) : [];

      return transformedData;
    } catch (error) {
      return [];
    }
  },

  // Get previous night's sleep data for specific athlete
  async getPreviousNightSleep(
    athleteId: number,
    targetDate?: string
  ): Promise<{
    date: string;
    sleepDurationH: number;
    deepSleepPct: number;
    remSleepPct: number;
    lightSleepPct: number;
    sleepOnsetTime: string;
    wakeTime: string;
  } | null> {
    try {
      const params = new URLSearchParams();
      if (targetDate) params.append('targetDate', targetDate);

      const url = `/Wearable/previous-night-sleep/${athleteId}?${params.toString()}`;

      const response = await wearableApi.get(url);
      const data = response.data;

      if (!data) return null;

      return {
        date: data.Date || data.date || '',
        sleepDurationH: Number(data.SleepDurationH || data.sleepDurationH) || 0,
        deepSleepPct: Number(data.DeepSleepPct || data.deepSleepPct) || 0,
        remSleepPct: Number(data.RemSleepPct || data.remSleepPct) || 0,
        lightSleepPct: Number(data.LightSleepPct || data.lightSleepPct) || 0,
        sleepOnsetTime: data.SleepOnsetTime || data.sleepOnsetTime || '',
        wakeTime: data.WakeTime || data.wakeTime || ''
      };
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        return null;
      }
      return null;
    }
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
// INJURY SERVICES
// =====================================================

type InjuryPayload = {
  AthleteId: number;
  Diagnosis: string;
  DateOfInjury?: string;
  BodyArea?: string;
  Laterality?: string;
  Mechanism?: string;
  Severity?: string;
  IsConcussion?: boolean;
  HIAFlag?: boolean;
  ConcussionStage?: string;
  RTPStage?: string;
  Status?: string;
  ReturnDatePlanned?: string;
  ReturnDateActual?: string;
  Notes?: string;
};

type InjuryQuery = {
  athleteId?: number;
  status?: string;
  isConcussion?: boolean;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
};

const extractArrayFromDotNet = (data: any): any[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.$values && Array.isArray(data.$values)) return data.$values;
  return [];
};

const normalizeInjury = (raw: any) => {
  const toIso = (d: any): string | undefined => {
    try {
      if (!d) return undefined;
      const date = new Date(d);
      if (isNaN(date.getTime())) return typeof d === 'string' ? d : undefined;
      return date.toISOString().slice(0, 10);
    } catch {
      return undefined;
    }
  };

  return {
    id: Number(raw.id ?? raw.Id ?? 0),
    athleteId: Number(raw.athleteId ?? raw.AthleteId ?? raw.Athlete?.Id ?? 0),
    dateOfInjury: toIso(raw.dateOfInjury ?? raw.DateOfInjury),
    diagnosis: raw.diagnosis ?? raw.Diagnosis ?? '',
    bodyArea: raw.bodyArea ?? raw.BodyArea ?? undefined,
    laterality: raw.laterality ?? raw.Laterality ?? undefined,
    mechanism: raw.mechanism ?? raw.Mechanism ?? undefined,
    severity: raw.severity ?? raw.Severity ?? undefined,
    isConcussion: raw.isConcussion ?? raw.IsConcussion ?? undefined,
    hIAFlag: raw.hIAFlag ?? raw.HIAFlag ?? undefined,
    hIAFlagAlt: raw.HIAFlag ?? raw.hIAFlag ?? undefined,
    concussionStage: raw.concussionStage ?? raw.ConcussionStage ?? undefined,
    // The component expects rTPStage (camel with leading lower r), map from RTPStage as well
    rTPStage: raw.rTPStage ?? raw.RTPStage ?? undefined,
    status: raw.status ?? raw.Status ?? 'Open',
    returnDatePlanned: toIso(raw.returnDatePlanned ?? raw.ReturnDatePlanned),
    returnDateActual: toIso(raw.returnDateActual ?? raw.ReturnDateActual),
    notes: raw.notes ?? raw.Notes ?? undefined,
    createdAt: toIso(raw.createdAt ?? raw.CreatedAt),
    updatedAt: toIso(raw.updatedAt ?? raw.UpdatedAt),
  };
};

export const injuryService = {
  // List injuries with optional filters and pagination
  async getInjuries(query?: InjuryQuery): Promise<{ total: number; page: number; limit: number; items: any[] }> {
    const params = new URLSearchParams();
    if (query?.athleteId != null) params.append('athleteId', String(query.athleteId));
    if (query?.status) params.append('status', query.status);
    if (typeof query?.isConcussion === 'boolean') params.append('isConcussion', String(query.isConcussion));
    if (query?.startDate) params.append('startDate', query.startDate);
    if (query?.endDate) params.append('endDate', query.endDate);
    params.append('page', String(query?.page ?? 1));
    params.append('limit', String(query?.limit ?? 100));

    const res = await api.get(`/injuries?${params.toString()}`);
    const payload = res.data?.Data ?? res.data ?? {};

    const rawItems =
      (payload?.items?.$values && Array.isArray(payload.items.$values))
        ? payload.items.$values
        : Array.isArray(payload?.items) ? payload.items
        : extractArrayFromDotNet(payload);

    const items = Array.isArray(rawItems) ? rawItems.map(normalizeInjury) : [];

    return {
      total: Number(payload?.total ?? items.length),
      page: Number(payload?.page ?? 1),
      limit: Number(payload?.limit ?? items.length),
      items,
    };
  },

  // Get single injury
  async getById(id: number): Promise<any | null> {
    try {
      const res = await api.get(`/injuries/${id}`);
      const data = res.data?.Data ?? res.data ?? null;
      return data ? normalizeInjury(data) : null;
    } catch {
      return null;
    }
  },

  // Create injury
  async create(data: InjuryPayload): Promise<any> {
    const res = await api.post('/injuries', data);
    return res.data?.Data ?? res.data;
  },

  // Update injury
  async update(id: number, data: Partial<InjuryPayload>): Promise<any> {
    const res = await api.put(`/injuries/${id}`, data);
    return res.data?.Data ?? res.data;
  },

  // Delete injury
  async remove(id: number): Promise<boolean> {
    try {
      await api.delete(`/injuries/${id}`);
      return true;
    } catch {
      return false;
    }
  },

  // Update HIA/Concussion
  async updateHia(id: number, data: { HIAFlag?: boolean; ConcussionStage?: string; IsConcussion?: boolean; Notes?: string }): Promise<any> {
    const res = await api.post(`/injuries/${id}/hia`, data);
    return res.data?.Data ?? res.data;
  },

  // Update RTP stage/planned return
  async updateRtp(id: number, data: { RTPStage?: string; ReturnDatePlanned?: string; Notes?: string }): Promise<any> {
    const res = await api.post(`/injuries/${id}/rtp`, data);
    return res.data?.Data ?? res.data;
  },

  // Resolve injury and set actual return date
  async resolve(id: number, data?: { ReturnDateActual?: string; Notes?: string }): Promise<any> {
    const res = await api.post(`/injuries/${id}/resolve`, data ?? {});
    return res.data?.Data ?? res.data;
  },
};

// =====================================================
// EVENTS SERVICES (Calendar)
// =====================================================

export const normalizeEvent = (raw: any) => {
  const toIso = (d: any): string => {
    try {
      if (!d) return '';
      const dt = new Date(d);
      return isNaN(dt.getTime()) ? String(d) : dt.toISOString();
    } catch {
      return '';
    }
  };
  return {
    id: Number(raw.id ?? raw.Id ?? 0),
    title: raw.title ?? raw.Title ?? '',
    type: raw.type ?? raw.Type ?? 'Other',
    description: raw.description ?? raw.Description ?? undefined,
    location: raw.location ?? raw.Location ?? undefined,
    startUtc: toIso(raw.startUtc ?? raw.StartUtc),
    endUtc: toIso(raw.endUtc ?? raw.EndUtc),
    allDay: Boolean(raw.allDay ?? raw.AllDay ?? false),
    athleteId: raw.athleteId ?? raw.AthleteId ?? null,
    organizationId: raw.organizationId ?? raw.OrganizationId ?? null,
    recurrenceRule: raw.recurrenceRule ?? raw.RecurrenceRule ?? undefined,
    createdAt: toIso(raw.createdAt ?? raw.CreatedAt),
    updatedAt: toIso(raw.updatedAt ?? raw.UpdatedAt),
  };
};

export const eventService = {
  async getEvents(params?: {
    athleteId?: number;
    type?: string;
    start?: string;
    end?: string;
    page?: number;
    limit?: number;
  }): Promise<{ total: number; page: number; limit: number; items: any[] }> {
    const qs = new URLSearchParams();
    if (params?.athleteId != null) qs.append('athleteId', String(params.athleteId));
    if (params?.type) qs.append('type', params.type);
    if (params?.start) qs.append('start', params.start);
    if (params?.end) qs.append('end', params.end);
    qs.append('page', String(params?.page ?? 1));
    qs.append('limit', String(params?.limit ?? 200));

    const res = await api.get(`/events?${qs.toString()}`);
    const payload = res.data?.Data ?? res.data ?? {};
    const rawItems =
      (payload?.items?.$values && Array.isArray(payload.items.$values))
        ? payload.items.$values
        : Array.isArray(payload?.items) ? payload.items
        : extractArrayFromDotNet(payload);

    const items = Array.isArray(rawItems) ? rawItems.map(normalizeEvent) : [];
    return {
      total: Number(payload?.total ?? items.length),
      page: Number(payload?.page ?? 1),
      limit: Number(payload?.limit ?? items.length),
      items,
    };
  },

  async getById(id: number): Promise<any | null> {
    try {
      const res = await api.get(`/events/${id}`);
      const data = res.data?.Data ?? res.data ?? null;
      return data ? normalizeEvent(data) : null;
    } catch {
      return null;
    }
  },

  async create(data: {
    Title: string;
    Type?: string;
    Description?: string;
    Location?: string;
    StartUtc?: string;
    EndUtc?: string;
    AllDay?: boolean;
    AthleteId?: number;
    OrganizationId?: number;
    RecurrenceRule?: string;
  }): Promise<any> {
    const res = await api.post('/events', data);
    return res.data?.Data ?? res.data;
  },

  async update(id: number, data: Partial<{
    Title: string;
    Type: string;
    Description: string;
    Location: string;
    StartUtc: string;
    EndUtc: string;
    AllDay: boolean;
    AthleteId: number;
    OrganizationId: number;
    RecurrenceRule: string;
  }>): Promise<any> {
    const res = await api.put(`/events/${id}`, data);
    return res.data?.Data ?? res.data;
  },

  async remove(id: number): Promise<boolean> {
    try {
      await api.delete(`/events/${id}`);
      return true;
    } catch {
      return false;
    }
  },

  async exportIcs(params?: { athleteId?: number; type?: string; start?: string; end?: string }): Promise<Blob> {
    const qs = new URLSearchParams();
    if (params?.athleteId != null) qs.append('athleteId', String(params.athleteId));
    if (params?.type) qs.append('type', params.type);
    if (params?.start) qs.append('start', params.start);
    if (params?.end) qs.append('end', params.end);
    const res = await api.get(`/events/ics?${qs.toString()}`, { responseType: 'blob' });
    return res.data as Blob;
  },
};

// =====================================================
// ATHLETE NOTES SERVICES (categorized positive/neutral/negative)
// =====================================================

const normalizeNote = (raw: any) => {
  const toIso = (d: any): string => {
    try {
      if (!d) return '';
      const dt = new Date(d);
      return isNaN(dt.getTime()) ? String(d) : dt.toISOString();
    } catch {
      return '';
    }
  };
  return {
    id: Number(raw.id ?? raw.Id ?? 0),
    athleteId: Number(raw.athleteId ?? raw.AthleteId ?? 0),
    category: raw.category ?? raw.Category ?? 'Neutral',
    title: raw.title ?? raw.Title ?? undefined,
    content: raw.content ?? raw.Content ?? undefined,
    tags: raw.tags ?? raw.Tags ?? undefined,
    author: raw.author ?? raw.Author ?? undefined,
    createdAt: toIso(raw.createdAt ?? raw.CreatedAt),
    updatedAt: toIso(raw.updatedAt ?? raw.UpdatedAt),
  };
};

export const athleteNotesService = {
  async list(params?: {
    athleteId?: number;
    category?: string;
    start?: string;
    end?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ total: number; page: number; limit: number; items: any[] }> {
    const qs = new URLSearchParams();
    if (params?.athleteId != null) qs.append('athleteId', String(params.athleteId));
    if (params?.category) qs.append('category', params.category);
    if (params?.start) qs.append('start', params.start);
    if (params?.end) qs.append('end', params.end);
    if (params?.search) qs.append('search', params.search);
    qs.append('page', String(params?.page ?? 1));
    qs.append('limit', String(params?.limit ?? 100));

    const res = await api.get(`/athlete-notes?${qs.toString()}`);
    const payload = res.data?.Data ?? res.data ?? {};
    const rawItems =
      (payload?.items?.$values && Array.isArray(payload.items.$values))
        ? payload.items.$values
        : Array.isArray(payload?.items) ? payload.items
        : extractArrayFromDotNet(payload);

    const items = Array.isArray(rawItems) ? rawItems.map(normalizeNote) : [];
    return {
      total: Number(payload?.total ?? items.length),
      page: Number(payload?.page ?? 1),
      limit: Number(payload?.limit ?? items.length),
      items,
    };
  },

  async getById(id: number): Promise<any | null> {
    try {
      const res = await api.get(`/athlete-notes/${id}`);
      const data = res.data?.Data ?? res.data ?? null;
      return data ? normalizeNote(data) : null;
    } catch {
      return null;
    }
  },

  async create(data: {
    AthleteId: number;
    Category?: string; // Positive | Neutral | Negative
    Title?: string;
    Content?: string;
    Tags?: string;
    Author?: string;
  }): Promise<any> {
    const res = await api.post('/athlete-notes', data);
    return res.data?.Data ?? res.data;
  },

  async update(id: number, data: Partial<{
    AthleteId: number;
    Category: string;
    Title: string;
    Content: string;
    Tags: string;
    Author: string;
  }>): Promise<any> {
    const res = await api.put(`/athlete-notes/${id}`, data);
    return res.data?.Data ?? res.data;
  },

  async remove(id: number): Promise<boolean> {
    try {
      await api.delete(`/athlete-notes/${id}`);
      return true;
    } catch {
      return false;
    }
  },

  async reportSummary(params?: { athleteId?: number; start?: string; end?: string }): Promise<any> {
    const qs = new URLSearchParams();
    if (params?.athleteId != null) qs.append('athleteId', String(params.athleteId));
    if (params?.start) qs.append('start', params.start);
    if (params?.end) qs.append('end', params.end);
    const res = await api.get(`/athlete-notes/report/summary?${qs.toString()}`);
    return res.data?.Data ?? res.data ?? {};
  },

  async reportTrend(params?: { athleteId?: number; start?: string; end?: string; interval?: 'day' | 'week' | 'month' }): Promise<any[]> {
    const qs = new URLSearchParams();
    if (params?.athleteId != null) qs.append('athleteId', String(params.athleteId));
    if (params?.start) qs.append('start', params.start);
    if (params?.end) qs.append('end', params.end);
    if (params?.interval) qs.append('interval', params.interval);
    const res = await api.get(`/athlete-notes/report/trend?${qs.toString()}`);
    const data = res.data?.Data ?? res.data ?? [];
    if (Array.isArray(data?.$values)) return data.$values;
    return Array.isArray(data) ? data : [];
  },

  async exportCsv(params?: { athleteId?: number; start?: string; end?: string }): Promise<Blob> {
    const qs = new URLSearchParams();
    if (params?.athleteId != null) qs.append('athleteId', String(params.athleteId));
    if (params?.start) qs.append('start', params.start);
    if (params?.end) qs.append('end', params.end);
    const res = await api.get(`/athlete-notes/export.csv?${qs.toString()}`, { responseType: 'blob' });
    return res.data as Blob;
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

      // Fetch biometric data for all athletes in one call (optimized)
      let biometricData: BiometricData[] = [];
      try {
        // Use the new single API call instead of looping through athletes
        biometricData = await biometricDataService.getAllAthletesBiometricData(undefined, undefined, 1, 1000);
        
      } catch (error) {
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

      // Fetch latest blood results for all athletes
      let bloodResults: BloodResults[] = [];
      try {
        bloodResults = await bloodResultsService.getLatestBloodResults();
      } catch (error) {
        bloodResults = []; // Ensure it's always an array
      }

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
      const athlete = await athleteService.getAthleteById(athleteId);

      if (!athlete) {
        return {
          athlete: undefined,
          biometricData: [],
          geneticProfile: [],
          bodyComposition: [],
          bloodResults: []
        };
      }

      // Fetch biometric data for this athlete using the database ID (which the backend converts to UnionId)
      let biometricData: BiometricData[] = [];
      try {
        // Use the database ID - the backend controller will convert it to UnionId for wearable data
        biometricData = await biometricDataService.getAllBiometricData(athleteId, undefined, undefined, 1, 1000) as BiometricData[];
      } catch (error) {
        biometricData = []; // Ensure it's always an array
      }

      // Fetch genetic profile for this athlete
      let geneticProfile: GeneticProfile[] = [];
      try {
        geneticProfile = await geneticProfileService.getGeneticProfileByAthlete(athleteId);
      } catch (error) {
        geneticProfile = []; // Ensure it's always an array
      }

      // Fetch body composition for this athlete (try with broader date range)
      let bodyComposition: BodyComposition[] = [];
      try {
        // Skip date parameters entirely since backend doesn't support them properly
        bodyComposition = await bodyCompositionService.getBodyCompositionByAthlete(athleteId);
      } catch (error) {
        bodyComposition = []; // Ensure it's always an array
      }

      // Fetch blood results for this athlete
      let bloodResults: BloodResults[] = [];
      try {
        bloodResults = await bloodResultsService.getBloodResultsByAthlete(athleteId);
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

// =====================================================
// CHAT AI SERVICES
// =====================================================

export const chatAIService = {
  // Send message to AI through backend with context data
  async askAI(message: string, context: {
    name: string;
    sport: string;
    age: number;
    team: string;
    latestBiometrics: {
      HrvNight?: number | null;
      RestingHr?: number | null;
      DeepSleepPct?: number | null;
      RemSleepPct?: number | null;
      SleepDurationH?: number | null;
      Spo2Night?: number | null;
      TrainingLoadPct?: number | null;
      Date?: string | null;
    } | null;
    biometricHistory: Array<{
      HrvNight?: number | null;
      RestingHr?: number | null;
      DeepSleepPct?: number | null;
      RemSleepPct?: number | null;
      SleepDurationH?: number | null;
      Spo2Night?: number | null;
      TrainingLoadPct?: number | null;
      Date?: string | null;
    }>;
    geneticProfile: Record<string, string>;
    totalBiometricRecords: number;
    totalGeneticMarkers: number;
  }): Promise<{
    success: boolean;
    response: string;
    athlete: string;
    context: {
      hasBiometrics: boolean;
      biometricCount: number;
      geneticCount: number;
    };
  }> {
    try {
      const response = await api.post('/chat-ai/ask', {
        message,
        context
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Export default service
export default dataService;