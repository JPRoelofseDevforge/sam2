export interface Athlete {
  id: number; // Primary key from database
  athlete_id: string;
  name: string;
  sport: string;
  age: number;
  team: string;
  baseline_start_date?: string;
  date_of_birth?: string;
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

export interface BloodResults {
  id?: number; // Primary key, auto-incrementing
  AthleteId: number; // Foreign key to athletes table (note: capital A)
  name: string;
  code: number;
  date?: string; // Optional date for tracking multiple tests
  created_at?: string; // Timestamp

  // Lab information
  lab_name?: string;
  test_method?: string;
  reference_ranges?: any; // JSONB field
  notes?: string;
  is_abnormal?: boolean;
  flagged_values?: any; // JSONB field

  // Hormones
  cortisol_nmol_l?: number;
  vitamin_d?: number;
  testosterone?: number;

  // Muscle & Metabolic
  ck?: number; // Creatine Kinase
  fasting_glucose?: number;
  hba1c?: number;
  hba1c_ifcc?: number;
  estimated_average_glucose?: number;

  // Kidney Function
  urea?: number;
  creatinine?: number;
  egfr?: number;
  uric_acid?: number;

  // Liver Function
  s_glutamyl_transferase?: number; // GGT
  s_alanine_transaminase?: number; // ALT
  s_aspartate_transaminase?: number; // AST
  lactate_dehydrogenase?: number; // LDH

  // Minerals & Proteins
  calcium_adjusted?: number;
  calcium_measured?: number;
  magnesium?: number;
  albumin_bcg?: number;
  c_reactive_protein?: number; // CRP
  total_protein?: number;

  // Inflammation
  esr?: number; // Erythrocyte Sedimentation Rate

  // Complete Blood Count (CBC)
  erythrocyte_count?: number; // RBC
  hemoglobin?: number;
  hematocrit?: number;
  mcv?: number; // Mean Corpuscular Volume
  mch?: number; // Mean Corpuscular Hemoglobin
  mchc?: number; // Mean Corpuscular Hemoglobin Concentration
  rdw?: number; // Red Cell Distribution Width

  // White Blood Cells
  leucocyte_count?: number; // WBC
  neutrophils_pct?: number;
  neutrophil_absolute_count?: number;
  lymphocytes_pct?: number;
  lymphocytes_absolute_count?: number;
  monocytes_pct?: number;
  monocytes_absolute_count?: number;
  eosinophils_pct?: number;
  eosinophils_absolute_count?: number;
  basophils_pct?: number;
  basophils_absolute_count?: number;
  nlr?: number; // Neutrophil-to-Lymphocyte Ratio

  // Platelets
  platelets?: number;
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

export interface BloodResults {
  id?: number; // Primary key, auto-incrementing
  AthleteId: number; // Foreign key to athletes table (note: capital A)
  name: string;
  
  date?: string; // Optional date for tracking multiple tests
  created_at?: string; // Timestamp

  // Lab information
  lab_name?: string;
  test_method?: string;
  reference_ranges?: any; // JSONB field
  notes?: string;
  is_abnormal?: boolean;
  flagged_values?: any; // JSONB field

  // Hormones
  cortisol_nmol_l?: number;
  vitamin_d?: number;
  testosterone?: number;

  // Muscle & Metabolic
  ck?: number; // Creatine Kinase
  fasting_glucose?: number;
  hba1c?: number;
  hba1c_ifcc?: number;
  estimated_average_glucose?: number;

  // Kidney Function
  urea?: number;
  creatinine?: number;
  egfr?: number;
  uric_acid?: number;

  // Liver Function
  s_glutamyl_transferase?: number; // GGT
  s_alanine_transaminase?: number; // ALT
  s_aspartate_transaminase?: number; // AST
  lactate_dehydrogenase?: number; // LDH

  // Minerals & Proteins
  calcium_adjusted?: number;
  calcium_measured?: number;
  magnesium?: number;
  albumin_bcg?: number;
  c_reactive_protein?: number; // CRP
  total_protein?: number;

  // Inflammation
  esr?: number; // Erythrocyte Sedimentation Rate

  // Complete Blood Count (CBC)
  erythrocyte_count?: number; // RBC
  hemoglobin?: number;
  hematocrit?: number;
  mcv?: number; // Mean Corpuscular Volume
  mch?: number; // Mean Corpuscular Hemoglobin
  mchc?: number; // Mean Corpuscular Hemoglobin Concentration
  rdw?: number; // Red Cell Distribution Width

  // White Blood Cells
  leucocyte_count?: number; // WBC
  neutrophils_pct?: number;
  neutrophil_absolute_count?: number;
  lymphocytes_pct?: number;
  lymphocytes_absolute_count?: number;
  monocytes_pct?: number;
  monocytes_absolute_count?: number;
  eosinophils_pct?: number;
  eosinophils_absolute_count?: number;
  basophils_pct?: number;
  basophils_absolute_count?: number;
  nlr?: number; // Neutrophil-to-Lymphocyte Ratio

  // Platelets
  platelets?: number;
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

// Common API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
}

// JCRing.Api Response Format
export interface JCApiResponse<T> {
  Code: number;
  Info: string;
  Data?: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Common Component Props
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
  data?: any;
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'date';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    message?: string;
  };
}

export interface FormState {
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

// CRUD Operations
export interface CrudOperations<T> {
  getAll: (params?: any) => Promise<T[]>;
  getById: (id: string | number) => Promise<T | null>;
  create: (data: Partial<T>) => Promise<T>;
  update: (id: string | number, data: Partial<T>) => Promise<boolean>;
  delete: (id: string | number) => Promise<boolean>;
}

// Database Model Base Interface
export interface BaseModel<T> {
  getAll: (params?: any) => Promise<T[]>;
  getById: (id: string | number) => Promise<T | null>;
  create: (data: Partial<T>) => Promise<T>;
  update: (id: string | number, data: Partial<T>) => Promise<boolean>;
  delete: (id: string | number) => Promise<boolean>;
}

// Chart Data Types
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface ChartConfig {
  title?: string;
  data: ChartDataPoint[];
  color?: string;
  showTrend?: boolean;
  goalValue?: number;
  goalLabel?: string;
  teamAverage?: number;
}

// Status Types
export type StatusType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface StatusConfig {
  type: StatusType;
  message: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Filter and Search Types
export interface FilterOption {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'range';
  options?: { value: string; label: string }[];
}

export interface SearchParams {
  query?: string;
  filters?: Record<string, any>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

// Navigation Types
export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
  children?: NavItem[];
}

// Weather Types
export interface WeatherData {
  location: {
    city: string;
    state: string;
    country: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  current: {
    temperature: number;
    humidity: number;
    pressure: number;
    wind_speed: number;
    wind_direction: number;
    weather_condition: string;
    weather_description: string;
    uv_index: number;
    visibility: number;
    cloud_cover: number;
    feels_like: number;
    dew_point: number;
    precipitation_probability: number;
    air_quality_index?: number;
    air_quality_category?: string;
    timestamp: string;
  };
  forecast?: WeatherForecast[];
}

export interface WeatherForecast {
  date: string;
  temperature_max: number;
  temperature_min: number;
  humidity: number;
  precipitation_probability: number;
  weather_condition: string;
  weather_description: string;
  wind_speed: number;
  wind_direction: number;
  uv_index: number;
}

export interface WeatherApiConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface WeatherCacheEntry {
  data: WeatherData;
  timestamp: number;
  expiresAt: number;
}

export interface WeatherServiceResponse {
  success: boolean;
  data?: WeatherData;
  error?: string;
  message?: string;
  cached?: boolean;
  timestamp?: string;
}

// Theme Types
export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}