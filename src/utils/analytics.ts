import { athletes } from '../data/mockData';
import { BiometricData, Alert, GeneticProfile } from '../types';

export function generateAlert(
  athleteId: string, 
  biometricData: BiometricData[], 
  geneticProfiles: GeneticProfile[]
): Alert {
  if (biometricData.length === 0) {
    return {
      type: 'no_data',
      title: '📊 No Data',
      cause: 'No recent biometric data available',
      rec: 'Please ensure data collection is active.'
    };
  }

  const latest = biometricData[biometricData.length - 1];
  const geneticDict = geneticProfiles.reduce((acc, profile) => {
    acc[profile.gene] = profile.genotype;
    return acc;
  }, {} as Record<string, string>);

  // Get trend data if available
  let hrvDrop = false;
  let rhrRise = false;
  
  if (biometricData.length >= 2) {
    const prev = biometricData[biometricData.length - 2];
    hrvDrop = (prev.hrv_night - latest.hrv_night) / prev.hrv_night > 0.15;
    rhrRise = (latest.resting_hr - prev.resting_hr) / prev.resting_hr > 0.05;
  } else {
    hrvDrop = latest.hrv_night < 40;
    rhrRise = latest.resting_hr > 70;
  }

  // Alert conditions
  const tempHigh = latest.temp_trend_c >= 37.0;
  const spo2Low = latest.spo2_night <= 94;
  const deepLow = latest.deep_sleep_pct < 17;
  const remLow = latest.rem_sleep_pct < 16;
  const sleepShort = latest.sleep_duration_h < 7.0;
  const respHigh = latest.resp_rate_night >= 17;
  
  // Sleep timing check
  const sleepLate = latest.sleep_onset_time && 
    new Date(`1970-01-01T${latest.sleep_onset_time}:00`).getHours() >= 23.5;

  // Apply alert rules
  if (hrvDrop && rhrRise && tempHigh && spo2Low) {
    return {
      type: 'inflammation',
      title: '⚠️ Inflammation/Illness Risk',
      cause: `HRV↓(${latest.hrv_night}) + RHR↑(${latest.resting_hr}) + Temp↑(${latest.temp_trend_c}) + SpO₂↓(${latest.spo2_night})`,
      rec: 'Prioritize rest, hydration, anti-inflammatory nutrition. Monitor temperature closely.'
    };
  } else if (hrvDrop && deepLow && sleepLate) {
    return {
      type: 'circadian',
      title: '🌙 Circadian Misalignment',
      cause: `HRV↓ + Deep Sleep↓(${latest.deep_sleep_pct}%) + Late Sleep`,
      rec: 'Advance bedtime by 45min, increase morning light exposure, avoid screens after 9PM.'
    };
  } else if (hrvDrop && remLow && !tempHigh) {
    return {
      type: 'nutrition',
      title: '🥗 Possible Nutrient Gap',
      cause: `HRV↓ + REM↓(${latest.rem_sleep_pct}%) with stable temperature`,
      rec: 'Check iron, magnesium, omega-3, B12 status. Increase nutrient-dense foods.'
    };
  } else if (spo2Low && respHigh) {
    return {
      type: 'airway',
      title: '🌬️ Airway/Respiratory Stress',
      cause: `SpO₂=${latest.spo2_night}% + Resp Rate=${latest.resp_rate_night}/min`,
      rec: 'Evaluate sleep environment, nasal breathing. Consider air quality assessment.'
    };
  } else {
    return {
      type: 'green',
      title: '🟢 Optimal Recovery State',
      cause: 'All metrics within target ranges',
      rec: 'Maintain current training and recovery protocols.'
    };
  }
}

export const getTeamAverage = (
  metric: keyof BiometricData,
  athleteId: string,
  allBiometrics: BiometricData[]
): number => {
  const athleteTeam = athletes.find(a => a.athlete_id === athleteId)?.team;
  if (!athleteTeam) return 0;

  const teamMembers = athletes.filter(a => a.team === athleteTeam);
  const teamData = allBiometrics.filter(d => 
    teamMembers.some(m => m.athlete_id === d.athlete_id)
  );

  const values = teamData.map(d => d[metric]).filter(Boolean) as number[];
  return values.length > 0 ? Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)) : 0;
};

export function getMetricStatus(value: number, metric: string): 'red' | 'yellow' | 'green' | 'unknown' {
  // Simplified status logic - in real app this would come from configuration
  const thresholds: Record<string, { red: [number, number], yellow: [number, number], green: [number, number] }> = {
    'hrv_night': { green: [45, 100], yellow: [35, 44], red: [0, 34] },
    'resting_hr': { green: [45, 65], yellow: [66, 75], red: [76, 120] },
    'spo2_night': { green: [96, 100], yellow: [94, 95], red: [0, 93] },
    'deep_sleep_pct': { green: [18, 30], yellow: [15, 17], red: [0, 14] },
    'rem_sleep_pct': { green: [18, 30], yellow: [15, 17], red: [0, 14] },
    'sleep_duration_h': { green: [7.5, 10], yellow: [6.5, 7.4], red: [0, 6.4] },
    'temp_trend_c': { green: [36.0, 36.8], yellow: [36.9, 36.9], red: [37.0, 40.0] }
  };

  const threshold = thresholds[metric];
  if (!threshold) return 'unknown';

  if (value >= threshold.green[0] && value <= threshold.green[1]) return 'green';
  if (value >= threshold.yellow[0] && value <= threshold.yellow[1]) return 'yellow';
  if (value >= threshold.red[0] && value <= threshold.red[1]) return 'red';
  
  return 'unknown';
}

export function calculateReadinessScore(data: BiometricData): number {
  const hrvScore = data.hrv_night > 45 ? 1 : data.hrv_night > 35 ? 0.5 : 0;
  const rhrScore = data.resting_hr < 65 ? 1 : data.resting_hr < 75 ? 0.5 : 0;
  const sleepScore = data.sleep_duration_h > 7.5 ? 1 : data.sleep_duration_h > 6.5 ? 0.5 : 0;
  const spo2Score = data.spo2_night > 96 ? 1 : data.spo2_night > 94 ? 0.5 : 0;
  
  return ((hrvScore + rhrScore + sleepScore + spo2Score) / 4) * 100;
}

export function getGeneticInsights(geneticProfiles: GeneticProfile[]): Array<{
  gene: string;
  trait: string;
  recommendation: string;
}> {
  const insights: Array<{gene: string; trait: string; recommendation: string}> = [];
  const geneticDict = geneticProfiles.reduce((acc, profile) => {
    acc[profile.gene] = profile.genotype;
    return acc;
  }, {} as Record<string, string>);

  // PER3 gene insights
  if (geneticDict.PER3 === 'long') {
    insights.push({
      gene: 'PER3 (Long variant)',
      trait: 'Natural night owl tendency',
      recommendation: 'Allow later bedtimes when possible, prioritize consistent wake times, use bright light therapy in morning'
    });
  } else if (geneticDict.PER3 === 'short') {
    insights.push({
      gene: 'PER3 (Short variant)',
      trait: 'Natural early bird tendency',
      recommendation: 'Optimize early morning training, avoid late evening intense exercise, maintain regular early bedtime'
    });
  }

  // CLOCK gene insights
  if (geneticDict.CLOCK === 'AA') {
    insights.push({
      gene: 'CLOCK (AA genotype)',
      trait: 'Enhanced circadian sensitivity',
      recommendation: 'Maintain strict sleep schedule, minimize blue light exposure 2h before bed, prioritize sleep environment optimization'
    });
  }

  // ACTN3 gene insights
  if (geneticDict.ACTN3 === 'XX') {
    insights.push({
      gene: 'ACTN3 (XX genotype)',
      trait: 'Enhanced endurance capacity',
      recommendation: 'Focus on aerobic base building, longer recovery periods between high-intensity sessions, emphasize mitochondrial health'
    });
  } else if (geneticDict.ACTN3 === 'RR') {
    insights.push({
      gene: 'ACTN3 (RR genotype)',
      trait: 'Enhanced power/sprint capacity',
      recommendation: 'Optimize explosive training, shorter but more intense sessions, focus on neuromuscular recovery'
    });
  }

  return insights;
}