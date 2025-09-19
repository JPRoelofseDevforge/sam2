import { BiometricData, GeneticProfile } from '../types';

// Status color utilities
export const getStatusColorClass = (alertType: string): string => {
  switch (alertType) {
    case 'critical':
    case 'high':
      return 'status-critical';
    case 'warning':
    case 'medium':
      return 'status-warning';
    case 'optimal':
    case 'low':
      return 'status-optimal';
    default:
      return 'status-unknown';
  }
};

export const getStatusColor = (alertType: string): string => {
  switch (alertType) {
    case 'critical':
    case 'high':
      return 'text-red-600';
    case 'warning':
    case 'medium':
      return 'text-yellow-600';
    case 'optimal':
    case 'low':
      return 'text-green-600';
    default:
      return 'text-gray-600';
  }
};

export const getStatusIcon = (type: string): string => {
  switch (type) {
    case 'inflammation':
      return '🔥';
    case 'circadian':
      return '🌙';
    case 'nutrition':
      return '🥗';
    case 'airway':
      return '🌬️';
    case 'green':
      return '✅';
    default:
      return '📊';
  }
};

// Data processing utilities
export const getAthleteBiometricData = (
  athleteId: string,
  biometricData: BiometricData[],
  geneticProfiles: GeneticProfile[]
) => {
  const biometricArray = Array.isArray(biometricData) ? biometricData : [];
  const geneticArray = Array.isArray(geneticProfiles) ? geneticProfiles : [];

  // Try multiple matching strategies to handle different ID formats
  const data = biometricArray.filter(d => {
    const biometricId = d.athlete_id?.toString();
    const athleteIdStr = athleteId?.toString();

    // Try exact match first
    if (biometricId === athleteIdStr) return true;

    // Try loose equality
    if (d.athlete_id == athleteId) return true;

    // Try numeric comparison
    if (parseInt(biometricId || '') === parseInt(athleteIdStr || '')) return true;

    return false;
  });

  const genetics = geneticArray.filter(g => {
    const geneticId = g.athlete_id?.toString();
    const athleteIdStr = athleteId?.toString();

    if (geneticId === athleteIdStr) return true;
    if (g.athlete_id == athleteId) return true;
    if (parseInt(geneticId || '') === parseInt(athleteIdStr || '')) return true;

    return false;
  });

  return { data, genetics };
};

// Filter valid biometric records
export const filterValidBiometricData = (biometricData: BiometricData[]): BiometricData[] => {
  return biometricData.filter(record => {
    // Must have valid athlete_id and date
    const hasValidIdentifiers = record &&
                               record.athlete_id &&
                               record.athlete_id !== '' &&
                               record.date &&
                               record.date !== '';

    // Must have at least one meaningful biometric value (not null, undefined, or 0)
    const hasBiometricData = record &&
                           (record.hrv_night && record.hrv_night > 0) ||
                           (record.resting_hr && record.resting_hr > 0) ||
                           (record.deep_sleep_pct && record.deep_sleep_pct > 0) ||
                           (record.rem_sleep_pct && record.rem_sleep_pct > 0) ||
                           (record.sleep_duration_h && record.sleep_duration_h > 0) ||
                           (record.spo2_night && record.spo2_night > 0) ||
                           (record.resp_rate_night && record.resp_rate_night > 0) ||
                           (record.temp_trend_c && record.temp_trend_c > 0) ||
                           (record.training_load_pct && record.training_load_pct > 0);

    return hasValidIdentifiers && hasBiometricData;
  });
};

// Sort biometric data by date (most recent first)
export const sortBiometricDataByDate = (data: BiometricData[]): BiometricData[] => {
  return data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Get latest biometric record
export const getLatestBiometricRecord = (biometricData: BiometricData[]): BiometricData | null => {
  const validData = filterValidBiometricData(biometricData);
  const sortedData = sortBiometricDataByDate(validData);
  return sortedData.length > 0 ? sortedData[0] : null;
};

// Create sorted biometric data for charts
export const getSortedBiometricDataForCharts = (biometricData: BiometricData[]): BiometricData[] => {
  return biometricData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};