import { Athlete, BiometricData, GeneticProfile } from '../src/types';

// Sample data for testing
const sampleAthletes: Partial<Athlete>[] = [
  {
    id: 1,
    athlete_id: '1',
    name: 'Bowen Bezuidenhoudt',
    sport: 'General',
    age: 25,
    team: 'Default Team'
  },
  {
    id: 2,
    athlete_id: '2',
    name: 'Lezane Botto',
    sport: 'General',
    age: 24,
    team: 'Default Team'
  },
  {
    id: 3,
    athlete_id: '3',
    name: 'Steffan De Jongh',
    sport: 'General',
    age: 26,
    team: 'Default Team'
  },
  {
    id: 4,
    athlete_id: '4',
    name: 'Juanre De Klerk',
    sport: 'General',
    age: 23,
    team: 'Default Team'
  }
];

const sampleBiometricData: Partial<BiometricData>[] = [
  {
    athlete_id: '1',
    date: new Date().toISOString().split('T')[0],
    hrv_night: 65.5,
    resting_hr: 52,
    sleep_duration_h: 7.8,
    spo2_night: 97,
    resp_rate_night: 14,
    deep_sleep_pct: 22,
    rem_sleep_pct: 20,
    light_sleep_pct: 58,
    temp_trend_c: 36.6,
    training_load_pct: 75
  },
  {
    athlete_id: '2',
    date: new Date().toISOString().split('T')[0],
    hrv_night: 58.2,
    resting_hr: 48,
    sleep_duration_h: 8.2,
    spo2_night: 98,
    resp_rate_night: 13,
    deep_sleep_pct: 25,
    rem_sleep_pct: 18,
    light_sleep_pct: 57,
    temp_trend_c: 36.4,
    training_load_pct: 82
  },
  {
    athlete_id: '3',
    date: new Date().toISOString().split('T')[0],
    hrv_night: 72.1,
    resting_hr: 55,
    sleep_duration_h: 7.5,
    spo2_night: 96,
    resp_rate_night: 15,
    deep_sleep_pct: 20,
    rem_sleep_pct: 22,
    light_sleep_pct: 58,
    temp_trend_c: 36.8,
    training_load_pct: 68
  },
  {
    athlete_id: '4',
    date: new Date().toISOString().split('T')[0],
    hrv_night: 61.8,
    resting_hr: 50,
    sleep_duration_h: 8.0,
    spo2_night: 97,
    resp_rate_night: 14,
    deep_sleep_pct: 23,
    rem_sleep_pct: 19,
    light_sleep_pct: 58,
    temp_trend_c: 36.5,
    training_load_pct: 71
  }
];

const sampleGeneticProfiles: Partial<GeneticProfile>[] = [
  {
    athlete_id: '1',
    gene: 'ACTN3',
    genotype: 'RR'
  },
  {
    athlete_id: '1',
    gene: 'PPARGC1A',
    genotype: 'Ser'
  },
  {
    athlete_id: '2',
    gene: 'ACTN3',
    genotype: 'XX'
  },
  {
    athlete_id: '3',
    gene: 'CLOCK',
    genotype: 'AA'
  },
  {
    athlete_id: '4',
    gene: 'MTHFR',
    genotype: 'CT'
  }
];

console.log('Sample data defined for seeding database');
console.log('Athletes:', sampleAthletes.length);
console.log('Biometric data:', sampleBiometricData.length);
console.log('Genetic profiles:', sampleGeneticProfiles.length);

// Note: This is just sample data structure
// The actual seeding would need to be implemented in the backend API