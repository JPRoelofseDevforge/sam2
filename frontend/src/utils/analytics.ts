import { BiometricData, Alert, GeneticProfile } from '../types';

export function generateAlert(
  athleteId: string,
  biometricData: BiometricData[],
  geneticProfiles: GeneticProfile[]
): Alert {
  // Ensure inputs are arrays
  const biometricArray = Array.isArray(biometricData) ? biometricData : [];
  const geneticArray = Array.isArray(geneticProfiles) ? geneticProfiles : [];

  if (biometricArray.length === 0) {
    return {
      type: 'no_data',
      title: '📊 No Data',
      cause: 'No recent biometric data available',
      rec: 'Please ensure data collection is active.'
    };
  }

  const latest = biometricArray[biometricArray.length - 1];
  const geneticDict = geneticArray.reduce((acc, profile) => {
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
  // For now, calculate average across all athletes since team data is not yet available in database
  // TODO: Update this function when team information is added to the database schema
  const allAthleteData = allBiometrics.filter(d => d.athlete_id !== athleteId); // Exclude current athlete
  const values = allAthleteData.map(d => d[metric]).filter(Boolean) as number[];
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
  const geneticArray = Array.isArray(geneticProfiles) ? geneticProfiles : [];
  const geneticDict = geneticArray.reduce((acc, profile) => {
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

// Calculate training load trends
export function calculateTrainingLoadTrends(biometricData: BiometricData[]) {
  if (biometricData.length < 7) return { trend: 'insufficient_data', value: 0 };
  
  // Get last 7 days of data
  const recentData = biometricData.slice(-7);
  const avgLoad = recentData.reduce((sum, d) => sum + d.training_load_pct, 0) / recentData.length;
  
  // Compare with previous week if available
  if (biometricData.length >= 14) {
    const previousWeek = biometricData.slice(-14, -7);
    const prevAvgLoad = previousWeek.reduce((sum, d) => sum + d.training_load_pct, 0) / previousWeek.length;
    const change = avgLoad - prevAvgLoad;
    
    if (change > 5) return { trend: 'increasing', value: change };
    if (change < -5) return { trend: 'decreasing', value: change };
    return { trend: 'stable', value: change };
  }
  
  return { trend: 'new', value: avgLoad };
}

// Get recovery timeline data
export function getRecoveryTimelineData(biometricData: BiometricData[]) {
  return biometricData.map(data => ({
    date: data.date,
    readinessScore: calculateReadinessScore(data),
    hrv: data.hrv_night,
    restingHr: data.resting_hr,
    sleepDuration: data.sleep_duration_h,
    spo2: data.spo2_night,
    trainingLoad: data.training_load_pct,
    events: getRecoveryEvents(data)
  }));
}

// Get recovery events for a specific day
function getRecoveryEvents(data: BiometricData): string[] {
  const events: string[] = [];
  
  if (data.training_load_pct > 90) events.push('High Load Session');
  if (data.hrv_night < 40) events.push('Low HRV');
  if (data.sleep_duration_h < 6) events.push('Short Sleep');
  if (data.resting_hr > 70) events.push('Elevated RHR');
  
  return events;
}

// Get pharmacogenomics insights
export function getPharmacogenomicsInsights(geneticProfiles: GeneticProfile[]) {
  const insights: Array<{medication: string, gene: string, genotype: string, effect: string, recommendation: string, riskLevel: 'low' | 'medium' | 'high'}> = [];
  const geneticArray = Array.isArray(geneticProfiles) ? geneticProfiles : [];
  const geneticDict = geneticArray.reduce((acc, profile) => {
    acc[profile.gene] = profile.genotype;
    return acc;
  }, {} as Record<string, string>);
  
  // Common sports medicine medications and their genetic interactions
  if (geneticDict.CYP2D6) {
    if (geneticDict.CYP2D6.includes('Poor')) {
      insights.push({
        medication: 'Codeine',
        gene: 'CYP2D6',
        genotype: geneticDict.CYP2D6,
        effect: 'Poor metabolism - may be ineffective',
        recommendation: 'Avoid codeine, consider alternative pain relief',
        riskLevel: 'high'
      });
    } else if (geneticDict.CYP2D6.includes('Ultra')) {
      insights.push({
        medication: 'Codeine',
        gene: 'CYP2D6',
        genotype: geneticDict.CYP2D6,
        effect: 'Ultra-rapid metabolism - risk of toxicity',
        recommendation: 'Avoid codeine, risk of overdose',
        riskLevel: 'high'
      });
    }
  }
  
  if (geneticDict.CYP2C19) {
    if (geneticDict.CYP2C19.includes('Poor')) {
      insights.push({
        medication: 'Omeprazole',
        gene: 'CYP2C19',
        genotype: geneticDict.CYP2C19,
        effect: 'Poor metabolism - reduced effectiveness',
        recommendation: 'Higher doses may be needed or alternative PPI',
        riskLevel: 'medium'
      });
    }
  }
  
  if (geneticDict.SLCO1B1) {
    if (geneticDict.SLCO1B1 === 'CC') {
      insights.push({
        medication: 'Atorvastatin',
        gene: 'SLCO1B1',
        genotype: geneticDict.SLCO1B1,
        effect: 'Increased risk of statin-induced myopathy',
        recommendation: 'Monitor for muscle pain, consider lower doses',
        riskLevel: 'medium'
      });
    } else if (geneticDict.SLCO1B1 === 'CT' || geneticDict.SLCO1B1 === 'TT') {
      insights.push({
        medication: 'Atorvastatin',
        gene: 'SLCO1B1',
        genotype: geneticDict.SLCO1B1,
        effect: 'Significantly increased risk of myopathy',
        recommendation: 'Avoid statins or use very low doses with monitoring',
        riskLevel: 'high'
      });
    }
  }
  
  return insights;
}

// Get nutrigenomics recommendations
export function getNutrigenomicsRecommendations(geneticProfiles: GeneticProfile[]) {
  const recommendations: Array<{supplement: string, gene: string, genotype: string, rationale: string, dosage: string, timing: string, priority: 'high' | 'medium' | 'low'}> = [];
  const geneticArray = Array.isArray(geneticProfiles) ? geneticProfiles : [];
  const geneticDict = geneticArray.reduce((acc, profile) => {
    acc[profile.gene] = profile.genotype;
    return acc;
  }, {} as Record<string, string>);
  
  // Common genetic variants affecting nutrition and supplementation
  if (geneticDict.MTHFR) {
    if (geneticDict.MTHFR === 'TT' || geneticDict.MTHFR === 'CT') {
      recommendations.push({
        supplement: 'Methylated Folate (5-MTHF)',
        gene: 'MTHFR',
        genotype: geneticDict.MTHFR,
        rationale: 'Reduced enzyme activity affects folate metabolism',
        dosage: '400-800 mcg daily',
        timing: 'With breakfast for better absorption',
        priority: geneticDict.MTHFR === 'TT' ? 'high' : 'medium'
      });
    }
  }
  
  if (geneticDict.VDR) {
    if (geneticDict.VDR === 'FF' || geneticDict.VDR === 'Ff') {
      recommendations.push({
        supplement: 'Vitamin D3',
        gene: 'VDR',
        genotype: geneticDict.VDR,
        rationale: 'Reduced vitamin D receptor sensitivity',
        dosage: '2000-4000 IU daily (with blood testing)',
        timing: 'With fat-containing meal for better absorption',
        priority: 'high'
      });
    }
  }
  
  if (geneticDict.FTO) {
    if (geneticDict.FTO === 'AA' || geneticDict.FTO === 'AT') {
      recommendations.push({
        supplement: 'Green Tea Extract (EGCG)',
        gene: 'FTO',
        genotype: geneticDict.FTO,
        rationale: 'Increased risk of weight gain, enhanced fat oxidation support',
        dosage: '250-500 mg EGCG daily',
        timing: '30 minutes before exercise',
        priority: 'medium'
      });
    }
  }
  
  if (geneticDict.ACTN3) {
    if (geneticDict.ACTN3 === 'XX') {
      recommendations.push({
        supplement: 'Creatine Monohydrate',
        gene: 'ACTN3',
        genotype: geneticDict.ACTN3,
        rationale: 'Reduced power/strength potential, creatine can help',
        dosage: '3-5g daily',
        timing: 'Post-workout with carbohydrates',
        priority: 'medium'
      });
    } else if (geneticDict.ACTN3 === 'RR') {
      recommendations.push({
        supplement: 'Beta-Alanine',
        gene: 'ACTN3',
        genotype: geneticDict.ACTN3,
        rationale: 'Enhanced power capacity, buffering support',
        dosage: '3-5g daily (divided doses)',
        timing: 'Pre-workout',
        priority: 'medium'
      });
    }
  }
  
  if (geneticDict.PPARGC1A) {
    if (geneticDict.PPARGC1A.includes('Ser')) {
      recommendations.push({
        supplement: 'Resveratrol',
        gene: 'PPARGC1A',
        genotype: geneticDict.PPARGC1A,
        rationale: 'Enhanced mitochondrial biogenesis response',
        dosage: '250-500mg daily',
        timing: 'With dinner',
        priority: 'medium'
      });
      
      recommendations.push({
        supplement: 'Coenzyme Q10',
        gene: 'PPARGC1A',
        genotype: geneticDict.PPARGC1A,
        rationale: 'Mitochondrial support for energy production',
        dosage: '100-200mg daily',
        timing: 'With breakfast',
        priority: 'medium'
      });
    }
  }
  
  if (geneticDict.ADRB2) {
    if (geneticDict.ADRB2 === 'Gly16Gly') {
      recommendations.push({
        supplement: 'Caffeine (Genotype-Optimized)',
        gene: 'ADRB2',
        genotype: geneticDict.ADRB2,
        rationale: 'Reduced fat mobilization, strategic caffeine use',
        dosage: '100-200mg (lower than typical doses)',
        timing: 'Pre-workout (avoid late in day)',
        priority: 'medium'
      });
    }
  }
  
  if (geneticDict.NOS3) {
    if (geneticDict.NOS3 === 'CC' || geneticDict.NOS3 === 'CT') {
      recommendations.push({
        supplement: 'L-Citrulline',
        gene: 'NOS3',
        genotype: geneticDict.NOS3,
        rationale: 'Enhanced nitric oxide production support',
        dosage: '6-8g daily',
        timing: '30 minutes before exercise',
        priority: 'medium'
      });
    }
  }
  
  return recommendations;
}

// Get recovery gene panel insights
export function getRecoveryGenePanelInsights(geneticProfiles: GeneticProfile[]) {
  const genes: Array<{gene: string, genotype: string, trait: string, impact: string, recoveryProtocol: string, priority: 'high' | 'medium' | 'low'}> = [];
  const geneticArray = Array.isArray(geneticProfiles) ? geneticProfiles : [];
  const geneticDict = geneticArray.reduce((acc, profile) => {
    acc[profile.gene] = profile.genotype;
    return acc;
  }, {} as Record<string, string>);
  
  // Expanded genetic markers related to recovery
  if (geneticDict.IL6) {
    genes.push({
      gene: 'IL6',
      genotype: geneticDict.IL6,
      trait: 'Inflammatory Response',
      impact: geneticDict.IL6 === 'GG'
        ? 'Higher baseline inflammation, slower recovery'
        : geneticDict.IL6 === 'GC'
          ? 'Moderate inflammation response'
          : 'Lower baseline inflammation, faster recovery',
      recoveryProtocol: geneticDict.IL6 === 'GG'
        ? 'Emphasize anti-inflammatory nutrition (omega-3s, turmeric), longer recovery periods'
        : geneticDict.IL6 === 'GC'
          ? 'Standard recovery protocols with attention to inflammation markers'
          : 'May recover quickly with standard protocols',
      priority: geneticDict.IL6 === 'GG' ? 'high' : 'medium'
    });
  }
  
  if (geneticDict.TNF) {
    genes.push({
      gene: 'TNF',
      genotype: geneticDict.TNF,
      trait: 'Inflammatory Cytokine Production',
      impact: geneticDict.TNF === 'AA'
        ? 'Higher TNF-alpha production, increased inflammation'
        : geneticDict.TNF === 'AG'
          ? 'Moderate TNF-alpha production'
          : 'Lower TNF-alpha production, reduced inflammation',
      recoveryProtocol: geneticDict.TNF === 'AA'
        ? 'Prioritize anti-inflammatory interventions (cryotherapy, massage), monitor CRP levels'
        : geneticDict.TNF === 'AG'
          ? 'Standard anti-inflammatory approaches sufficient'
          : 'May require less intensive anti-inflammatory interventions',
      priority: geneticDict.TNF === 'AA' ? 'high' : 'medium'
    });
  }
  
  if (geneticDict.IL10) {
    genes.push({
      gene: 'IL10',
      genotype: geneticDict.IL10,
      trait: 'Anti-inflammatory Response',
      impact: geneticDict.IL10 === 'AA'
        ? 'Higher IL-10 production, better inflammation control'
        : geneticDict.IL10 === 'AC'
          ? 'Moderate IL-10 production'
          : 'Lower IL-10 production, reduced anti-inflammatory capacity',
      recoveryProtocol: geneticDict.IL10 === 'AA'
        ? 'May recover well with standard protocols'
        : geneticDict.IL10 === 'AC'
          ? 'Standard recovery protocols appropriate'
          : 'Emphasize anti-inflammatory nutrition and recovery modalities',
      priority: geneticDict.IL10 === 'CC' ? 'high' : 'low'
    });
  }
  
  if (geneticDict.VDR) {
    genes.push({
      gene: 'VDR',
      genotype: geneticDict.VDR,
      trait: 'Vitamin D Receptor Sensitivity',
      impact: geneticDict.VDR === 'FF'
        ? 'Reduced vitamin D receptor sensitivity, potential deficiency effects'
        : geneticDict.VDR === 'Ff'
          ? 'Moderate sensitivity'
          : 'Normal sensitivity',
      recoveryProtocol: geneticDict.VDR === 'FF'
        ? 'Ensure optimal vitamin D status (supplementation if needed), supports immune function'
        : geneticDict.VDR === 'Ff'
          ? 'Monitor vitamin D levels, supplement as needed'
          : 'Maintain adequate vitamin D through sun exposure and diet',
      priority: geneticDict.VDR === 'FF' ? 'high' : 'medium'
    });
  }
  
  if (geneticDict.ADRB1) {
    genes.push({
      gene: 'ADRB1',
      genotype: geneticDict.ADRB1,
      trait: 'Catecholamine Sensitivity',
      impact: geneticDict.ADRB1 === 'AA'
        ? 'Higher adrenaline sensitivity, increased stress response'
        : geneticDict.ADRB1 === 'AG'
          ? 'Moderate sensitivity'
          : 'Lower adrenaline sensitivity, reduced stress response',
      recoveryProtocol: geneticDict.ADRB1 === 'AA'
        ? 'Emphasize parasympathetic activation (meditation, breathing), avoid overstimulation'
        : geneticDict.ADRB1 === 'AG'
          ? 'Standard stress management techniques'
          : 'May tolerate higher stimulation, monitor for under-recovery',
      priority: geneticDict.ADRB1 === 'AA' ? 'high' : 'medium'
    });
  }
  
  if (geneticDict.CLOCK) {
    genes.push({
      gene: 'CLOCK',
      genotype: geneticDict.CLOCK,
      trait: 'Circadian Rhythm Regulation',
      impact: geneticDict.CLOCK === 'AA'
        ? 'Enhanced circadian sensitivity, strict schedule benefits'
        : geneticDict.CLOCK === 'AG'
          ? 'Moderate circadian sensitivity'
          : 'Reduced circadian sensitivity, more flexible timing',
      recoveryProtocol: geneticDict.CLOCK === 'AA'
        ? 'Maintain strict sleep/wake times, minimize blue light exposure 2h before bed'
        : geneticDict.CLOCK === 'AG'
          ? 'Consistent schedule beneficial but some flexibility allowed'
          : 'More adaptable to schedule changes, but still prioritize consistency',
      priority: geneticDict.CLOCK === 'AA' ? 'high' : 'medium'
    });
  }
  
  if (geneticDict.HSD11B1) {
    genes.push({
      gene: 'HSD11B1',
      genotype: geneticDict.HSD11B1,
      trait: 'Cortisol Regeneration',
      impact: geneticDict.HSD11B1 === 'TT'
        ? 'Higher cortisol regeneration, increased stress response'
        : geneticDict.HSD11B1 === 'TC'
          ? 'Moderate cortisol regeneration'
          : 'Lower cortisol regeneration, reduced stress response',
      recoveryProtocol: geneticDict.HSD11B1 === 'TT'
        ? 'Prioritize stress management, cortisol-lowering interventions (adaptogens, meditation)'
        : geneticDict.HSD11B1 === 'TC'
          ? 'Standard stress management sufficient'
          : 'May be more resilient to stress, but still monitor recovery markers',
      priority: geneticDict.HSD11B1 === 'TT' ? 'high' : 'medium'
    });
  }
  
  if (geneticDict.COMT) {
    genes.push({
      gene: 'COMT',
      genotype: geneticDict.COMT,
      trait: 'Catecholamine Breakdown',
      impact: geneticDict.COMT === 'AA'
        ? 'Slower breakdown of adrenaline/noradrenaline, prolonged stress response'
        : geneticDict.COMT === 'AG'
          ? 'Moderate breakdown rate'
          : 'Faster breakdown, quicker return to baseline',
      recoveryProtocol: geneticDict.COMT === 'AA'
        ? 'Emphasize parasympathetic activation, longer recovery periods after high-stress sessions'
        : geneticDict.COMT === 'AG'
          ? 'Standard recovery protocols appropriate'
          : 'May recover quickly but monitor for under-recovery from overtraining',
      priority: geneticDict.COMT === 'AA' ? 'high' : 'medium'
    });
  }
  
  return genes;
}