import axios from 'axios';
import { Athlete, BiometricData, GeneticProfile, BodyComposition, BloodResults } from '../types';

// Transform backend athlete data to frontend format
const transformAthletesData = (backendAthletes: any[]): Athlete[] => {
  return backendAthletes.map(athlete => {
    // Calculate age from date of birth
    const age = athlete.DateOfBirth
      ? new Date().getFullYear() - new Date(athlete.DateOfBirth).getFullYear()
      : 0;

    // Build athlete name with fallbacks
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
      // Use ID as fallback if no name available
      athleteName = `Athlete ${athlete.Id || athlete.UnionId || 'Unknown'}`;
    }

    const transformedAthlete = {
      id: athlete.Id || athlete.UnionId, // Include numeric ID for API calls
      athlete_id: (athlete.Id || athlete.UnionId)?.toString() || '',
      name: athleteName,
      sport: athlete.Sport || athlete.SportName || 'General',
      age: age,
      team: athlete.Team || athlete.TeamName || 'Default Team',
      baseline_start_date: undefined,
      date_of_birth: athlete.DateOfBirth
    };

    console.log('🔄 Transformed athlete:', {
      original: { id: athlete.Id, unionId: athlete.UnionId, name: athleteName },
      transformed: { id: transformedAthlete.id, athlete_id: transformedAthlete.athlete_id, name: transformedAthlete.name }
    });

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
      item.SleepDuration
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
          console.log(`🔢 FatigueLevel calculation: ${num} * 10 = ${trainingLoadValue}`);
        } else {
          // For other fields, use existing logic
          trainingLoadValue = num > 10 ? num : num * 10;
        }
      }
    } else {
      // If no training load found, try to use other metrics as proxy
      // For example, use sleep quality or HRV as an inverse indicator
      const sleepQuality = getNumericValue(item.SleepQuality ?? item.sleep_quality ?? item.Sleep ?? item.sleep_duration_h);
      const hrvValue = scaledHrvValue;

      if (sleepQuality > 0) {
        // Convert sleep hours to a load indicator (more sleep = less load)
        trainingLoadValue = Math.max(0, Math.min(100, (10 - sleepQuality) * 10));
      } else if (hrvValue > 0) {
        // Use HRV as load indicator (higher HRV = lower load)
        trainingLoadValue = Math.max(0, Math.min(100, (100 - hrvValue)));
      } else {
        // Generate a random value between 20-80 for demo purposes
        trainingLoadValue = Math.floor(Math.random() * 60) + 20;
      }

    }

    // Try multiple possible field names for athlete ID
    const athleteId = item.AthleteId?.toString() ||
                     item.UnionId?.toString() ||
                     item.athlete_id?.toString() ||
                     item.athleteId?.toString() ||
                     item.Athlete?.Id?.toString() ||
                     item.Athlete?.UnionId?.toString() ||
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
      wake_time: item.WakeTime ?? item.WakeUpTime
    };



    return transformed;
  });
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

    return { athletes: athletesArray };
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
  async getAllBiometricData(startDate?: string, endDate?: string, page: number = 1, limit: number = 50): Promise<any> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response = await api.get(`/biometric-daily?${params.toString()}`);
    console.log('🔍 Raw biometric API response:', response.data);
    const extractedData = response.data.Data;

    // Handle .NET JSON serialization format with $values
    let biometricArray: any[] = [];
    if (extractedData && typeof extractedData === 'object') {
      // Check for nested records structure (API returns Data.records.$values)
      if (extractedData.records && extractedData.records.$values && Array.isArray(extractedData.records.$values)) {
        biometricArray = extractedData.records.$values;
      }
      // Check for direct records array
      else if (extractedData.records && Array.isArray(extractedData.records)) {
        biometricArray = extractedData.records;
      }
      // Check for nested biometric structure
      else if (extractedData.biometricData) {
        if (Array.isArray(extractedData.biometricData)) {
          biometricArray = extractedData.biometricData;
        } else if (extractedData.biometricData.$values && Array.isArray(extractedData.biometricData.$values)) {
          biometricArray = extractedData.biometricData.$values;
        }
      }
      // Check for direct $values structure
      else if (extractedData.$values && Array.isArray(extractedData.$values)) {
        biometricArray = extractedData.$values;
      }
      // Check if extractedData itself is the biometric array
      else if (Array.isArray(extractedData)) {
        biometricArray = extractedData;
      }
      // Try to extract from object properties
      else {
        const possibleArrays = Object.values(extractedData).filter(val => Array.isArray(val));
        if (possibleArrays.length > 0) {
          biometricArray = possibleArrays[0] as any[];
        }
      }
    } else if (Array.isArray(extractedData)) {
      biometricArray = extractedData;
    }

    // Log essential API response data for debugging
    console.log('📡 Biometric API:', {
      status: response.status,
      records: biometricArray.length,
      sample: biometricArray.length > 0 ? {
        athlete_id: biometricArray[0].AthleteId || biometricArray[0].athlete_id,
        date: biometricArray[0].Date || biometricArray[0].date
      } : 'NO_DATA'
    });


    return biometricArray; // Return the extracted array
  },

  // Get biometric data for specific athlete
  async getBiometricDataByAthlete(
    athleteId: number,
    startDate?: string,
    endDate?: string
  ): Promise<BiometricData[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    params.append('limit', '1000'); // Fetch all records to ensure we get all data points for charts

    // Since the athlete-specific endpoint is not working properly, let's fetch all data and filter on frontend
    const response = await api.get(`/biometric-daily?${params.toString()}`);

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

    // Also extract from nested BiometricDailyRecords within each athlete's data
    let nestedRecords: any[] = [];
    if (Array.isArray(extractedData)) {
      extractedData.forEach(item => {
        if (item.Athlete && item.Athlete.BiometricDailyRecords && item.Athlete.BiometricDailyRecords.$values) {
          const biometricRecords = item.Athlete.BiometricDailyRecords.$values;
          if (Array.isArray(biometricRecords)) {
            nestedRecords = nestedRecords.concat(biometricRecords);
          }
        }
      });
    }

    // Combine main records with nested records
    if (nestedRecords.length > 0) {
      extractedData = extractedData.concat(nestedRecords);
    }

    // Filter data by athlete ID on frontend
    const athleteSpecificData = Array.isArray(extractedData)
      ? extractedData.filter(item => {
          const itemAthleteId = item.AthleteId;
          const matches = itemAthleteId == athleteId; // Use loose equality to handle string/number differences
          return matches;
        })
      : [];

    const transformedData = Array.isArray(athleteSpecificData) ? transformBiometricData(athleteSpecificData) : [];

    return transformedData;
  },

  // Get latest biometric data for all athletes
  async getLatestBiometricData(): Promise<BiometricData[]> {
    try {
      const response = await api.get('/biometric-daily/latest');
      const data = response.data?.Data;

      // Handle .NET JSON serialization format with nested $values structure
      let extractedData: any[] = [];
      if (data?.values?.$values) {
        // API returns data in: Data.values.$values
        extractedData = data.values.$values;
      } else if (data?.$values) {
        // Fallback to direct $values
        extractedData = data.$values;
      } else if (Array.isArray(data)) {
        // Direct array
        extractedData = data;
      }

      const transformedData = Array.isArray(extractedData) ? transformBiometricData(extractedData) : [];
      console.debug('🎯 Final transformed data length:', transformedData.length);
      return transformedData;
    } catch (error) {
      console.error('❌ Failed to fetch latest biometric data:', error);
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
  async getAllGeneticProfiles(page: number = 1, limit: number = 50): Promise<any> {
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
    const response = await api.get(`/genetic-profiles/athletes/${athleteId}`);
    // Handle .NET JSON serialization format with $values
    const data = response.data.Data;
    const extractedData = data?.$values || data || [];
    return Array.isArray(extractedData) ? transformGeneticProfileData(extractedData) : [];
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
  async getAllBodyComposition(startDate?: string, endDate?: string, page: number = 1, limit: number = 50): Promise<any> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response = await api.get(`/body-composition?${params.toString()}`);
    return response.data.Data; // Extract data from JCRing.Api response
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
  async getAllBloodResults(page: number = 1, limit: number = 50): Promise<any> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response = await api.get(`/blood-results?${params.toString()}`);
    return response.data.Data; // Extract data from JCRing.Api response
  },

  // Get blood results for specific athlete
  async getBloodResultsByAthlete(athleteId: number): Promise<BloodResults[]> {
    const response = await api.get(`/blood-results/athlete/${athleteId}`);
    // Handle .NET JSON serialization format with $values
    const data = response.data.Data;
    const extractedData = data?.$values || data || [];
    return Array.isArray(extractedData) ? transformBloodResultsData(extractedData) : [];
  },

  // Get latest blood results for all athletes
  async getLatestBloodResults(): Promise<BloodResults[]> {
    const response = await api.get('/blood-results/latest');
    // Handle .NET JSON serialization format with $values
    const data = response.data.Data;
    const extractedData = data?.$values || data || [];
    return Array.isArray(extractedData) ? transformBloodResultsData(extractedData) : [];
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
      console.log('🔍 Fetched athletes from API:', athletesResponse);
      // Handle the $values structure from .NET JSON serialization
      const athletesArray = athletesResponse.athletes || [];

      const athletes = transformAthletesData(athletesArray);

      // Fetch biometric data for all athletes (skip date parameters to avoid 500 errors)
      let biometricData: BiometricData[] = [];
      try {
        console.log('🔍 Fetching biometric data from API...');
        // Skip date parameters entirely since they cause 500 errors
        const rawBiometricData = await biometricDataService.getAllBiometricData(undefined, undefined, 1, 2000);

        // biometricDataService.getAllBiometricData() now returns an array directly
        biometricData = transformBiometricData(rawBiometricData || []);
      } catch (error) {
        console.error('❌ Failed to fetch biometric data:', error);
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
        console.error('❌ Failed to fetch body composition data:', error);
        bodyComposition = []; // Ensure it's always an array
      }

      // Fetch all genetic profiles
      let geneticProfiles: GeneticProfile[] = [];
      try {
        const geneticResponse = await geneticProfileService.getAllGeneticProfiles(1, 1000);
        geneticProfiles = geneticResponse;
      } catch (error) {
        console.error('❌ Failed to fetch genetic profiles:', error);
        geneticProfiles = []; // Ensure it's always an array
      }

      // Log the final result

      // Fetch latest blood results for all athletes
      let bloodResults: BloodResults[] = [];
      try {
        bloodResults = await bloodResultsService.getLatestBloodResults();
      } catch (error) {
        console.error('❌ Failed to fetch blood results:', error);
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
        console.debug("dataService.getData() fetched data:");
        console.debug(data);
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
};

// Export default service
export default dataService;