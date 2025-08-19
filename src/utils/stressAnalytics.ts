import { BiometricData } from '../types';

// Calculate resting heart rate status
export function getRestingHRStatus(restingHR: number): { status: string; color: string; message: string } {
  if (restingHR < 55) {
    return { status: 'Optimal', color: 'text-green-500', message: 'Excellent cardiovascular fitness' };
  } else if (restingHR < 65) {
    return { status: 'Good', color: 'text-green-500', message: 'Healthy resting heart rate' };
  } else if (restingHR < 75) {
    return { status: 'Elevated', color: 'text-yellow-500', message: 'Slightly elevated, monitor trends' };
  } else {
    return { status: 'High', color: 'text-red-500', message: 'Significantly elevated, potential stress/fatigue' };
  }
}

// Calculate HRV status
export function getHRVStatus(hrv: number, athleteAge: number): { status: string; color: string; message: string } {
  // Simplified HRV zones based on age (in a real app, this would be more sophisticated)
  const baselineHRV = athleteAge < 25 ? 60 : athleteAge < 35 ? 55 : 50;
  
  if (hrv > baselineHRV + 10) {
    return { status: 'Excellent', color: 'text-green-500', message: 'Strong parasympathetic activity' };
  } else if (hrv > baselineHRV) {
    return { status: 'Good', color: 'text-green-500', message: 'Healthy HRV levels' };
  } else if (hrv > baselineHRV - 10) {
    return { status: 'Moderate', color: 'text-yellow-500', message: 'Moderately reduced HRV, monitor trends' };
  } else {
    return { status: 'Low', color: 'text-red-500', message: 'Reduced HRV, potential stress/fatigue' };
  }
}

// Calculate strain index (combination of HR and HRV)
export function calculateStrainIndex(restingHR: number, hrv: number, athleteAge: number): number {
  // Normalize values to 0-1 scale
  const normalizedHR = Math.max(0, Math.min(1, (restingHR - 40) / 60)); // 40-100 bpm range
  const baselineHRV = athleteAge < 25 ? 60 : athleteAge < 35 ? 55 : 50;
  const normalizedHRV = Math.max(0, Math.min(1, hrv / (baselineHRV * 1.5))); // 0 to 150% of baseline
  
  // Strain index: higher HR and lower HRV = higher strain
  // We invert HRV since lower HRV indicates higher stress
  return (normalizedHR * 0.6 + (1 - normalizedHRV) * 0.4) * 100;
}

// Get stress level based on strain index
export function getStressLevel(strainIndex: number): { level: string; color: string; bgColor: string; message: string } {
  if (strainIndex < 30) {
    return { 
      level: 'Low', 
      color: 'text-green-500', 
      bgColor: 'bg-green-500', 
      message: 'Low stress levels, good recovery' 
    };
  } else if (strainIndex < 60) {
    return { 
      level: 'Moderate', 
      color: 'text-yellow-500', 
      bgColor: 'bg-yellow-500', 
      message: 'Moderate stress, monitor recovery' 
    };
  } else {
    return { 
      level: 'High', 
      color: 'text-red-500', 
      bgColor: 'bg-red-500', 
      message: 'High stress levels, prioritize recovery' 
    };
  }
}

// Calculate daily stress load (acute vs chronic stress)
export function calculateDailyStressLoad(biometricData: BiometricData[], days: number = 7): {
  acuteStress: number;
  chronicStress: number;
  stressBalance: number;
} {
  if (biometricData.length < days * 2) {
    return { acuteStress: 0, chronicStress: 0, stressBalance: 0 };
  }

  // Get recent data (last N days)
  const recentData = biometricData.slice(-days);
  
  // Calculate acute stress (last 7 days)
  const acuteHR = recentData.reduce((sum, d) => sum + d.resting_hr, 0) / recentData.length;
  const acuteHRV = recentData.reduce((sum, d) => sum + d.hrv_night, 0) / recentData.length;
  const acuteStress = (acuteHR / 70) * 50 + (1 - acuteHRV / 60) * 50; // Combined score 0-100
  
  // Get previous data (before last N days)
  const previousData = biometricData.slice(-(days * 2), -days);
  
  // Calculate chronic stress (previous 7 days)
  const chronicHR = previousData.reduce((sum, d) => sum + d.resting_hr, 0) / previousData.length;
  const chronicHRV = previousData.reduce((sum, d) => sum + d.hrv_night, 0) / previousData.length;
  const chronicStress = (chronicHR / 70) * 50 + (1 - chronicHRV / 60) * 50; // Combined score 0-100
  
  // Stress balance (positive = improving, negative = worsening)
  const stressBalance = chronicStress - acuteStress;
  
  return { acuteStress, chronicStress, stressBalance };
}

// Calculate recovery readiness composite index
export function calculateRecoveryReadiness(
  biometricData: BiometricData[],
  sleepDebt: number,
  hrvTrend: number,
  restingHR: number,
  trainingLoad: number
): number {
  if (biometricData.length < 3) return 50; // Default middle value if insufficient data
  
  // Sleep debt component (lower is better)
  const sleepScore = Math.max(0, 100 - Math.abs(sleepDebt) * 10);
  
  // HRV trend component (higher is better)
  const hrvScore = Math.max(0, Math.min(100, 50 + hrvTrend * 2));
  
  // Resting HR component (lower is better)
  const hrScore = Math.max(0, 100 - (restingHR - 50) * 2);
  
  // Training load component (moderate is better)
  const loadScore = trainingLoad > 85 ? 100 - (trainingLoad - 85) * 2 : 
                    trainingLoad < 40 ? 100 - (40 - trainingLoad) * 1.5 : 100;
  
  // Composite score (weighted average)
  return (sleepScore * 0.25 + hrvScore * 0.25 + hrScore * 0.25 + loadScore * 0.25);
}

// Get HRV trend over specified period
export function getHRVTrend(biometricData: BiometricData[], days: number = 7): number {
  if (biometricData.length < days) return 0;
  
  const recentData = biometricData.slice(-days);
  const previousData = biometricData.slice(-(days * 2), -days);
  
  if (recentData.length === 0 || previousData.length === 0) return 0;
  
  const recentAvg = recentData.reduce((sum, d) => sum + d.hrv_night, 0) / recentData.length;
  const previousAvg = previousData.reduce((sum, d) => sum + d.hrv_night, 0) / previousData.length;
  
  return recentAvg - previousAvg; // Positive = improving HRV
}