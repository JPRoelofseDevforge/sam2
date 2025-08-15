export interface Athlete {
  athlete_id: string;
  name: string;
  sport: string;
  age: number;
  team: string;
  baseline_start_date?: string;
}

export interface BiometricData {
  athlete_id: string;
  date: string;
  hrv_night: number;
  resting_hr: number;
  spo2_night: number;
  resp_rate_night: number;
  deep_sleep_pct: number;
  rem_sleep_pct: number;
  light_sleep_pct: number;
  sleep_duration_h: number;
  temp_trend_c: number;
  training_load_pct: number;
  sleep_onset_time?: string;
  wake_time?: string;
}

export interface GeneticProfile {
  athlete_id: string;
  gene: string;
  genotype: string;
}

// types.ts
export interface MuscleSymmetry {
  arm_mass_left_kg: number;
  arm_mass_right_kg: number;
  leg_mass_left_kg: number;
  leg_mass_right_kg: number;
  trunk_mass_kg: number;
}

export interface BodyComposition {
  athlete_id: string;
  date?: string; // Optional for single entry, required for history

  weight_kg: number;
  weight_range_min: number;
  weight_range_max: number;

  fat_mass_kg: number;
  fat_mass_range_min: number;
  fat_mass_range_max: number;

  muscle_mass_kg: number;
  muscle_mass_range_min: number;
  muscle_mass_range_max: number;

  skeletal_muscle_kg: number;
  body_fat_rate: number;
  bmi: number;
  target_weight_kg: number;
  weight_control_kg: number;
  fat_control_kg: number;
  muscle_control_kg: number;
  visceral_fat_grade: number;
  basal_metabolic_rate_kcal: number;
  fat_free_body_weight_kg: number;
  subcutaneous_fat_percent: number;
  smi_kg_m2: number;
  body_age: number;

  // New: Symmetry
  symmetry?: MuscleSymmetry;
}

export interface Alert {
  type: 'inflammation' | 'circadian' | 'nutrition' | 'airway' | 'green' | 'error' | 'no_data';
  title: string;
  cause: string;
  rec: string;
}

export interface MetricStatus {
  value: number;
  status: 'red' | 'yellow' | 'green' | 'unknown';
  unit: string;
}