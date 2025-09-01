import axios from 'axios';

// API configuration
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:5288/api';

// Athlete 1 (Bowen Bezuidenhoudt) - High training load week
const athlete1Data = [
  {
    date: '2025-08-31',
    restingHeartRate: 52,
    heartRateVariability: 7.55,
    sleepQuality: 7.8,
    recoveryScore: 8.5,
    fatigueLevel: 2.5,
    deepSleep: 20.5,
    remSleep: 22.8,
    spO2: 97.5,
    respiratoryRate: 14.2,
    bodyTemperature: 36.8
  },
  {
    date: '2025-09-01',
    restingHeartRate: 54,
    heartRateVariability: 6.12,
    sleepQuality: 7.2,
    recoveryScore: 7.8,
    fatigueLevel: 3.8,
    deepSleep: 17.8,
    remSleep: 19.5,
    spO2: 96.8,
    respiratoryRate: 15.1,
    bodyTemperature: 37.0
  },
  {
    date: '2025-09-02',
    restingHeartRate: 56,
    heartRateVariability: 5.85,
    sleepQuality: 6.8,
    recoveryScore: 7.2,
    fatigueLevel: 4.5,
    deepSleep: 15.2,
    remSleep: 17.9,
    spO2: 96.2,
    respiratoryRate: 15.8,
    bodyTemperature: 37.1
  },
  {
    date: '2025-09-03',
    restingHeartRate: 53,
    heartRateVariability: 6.35,
    sleepQuality: 7.5,
    recoveryScore: 8.2,
    fatigueLevel: 3.2,
    deepSleep: 18.9,
    remSleep: 21.2,
    spO2: 97.1,
    respiratoryRate: 14.5,
    bodyTemperature: 36.9
  },
  {
    date: '2025-09-04',
    restingHeartRate: 55,
    heartRateVariability: 6.05,
    sleepQuality: 7.0,
    recoveryScore: 7.5,
    fatigueLevel: 4.2,
    deepSleep: 16.5,
    remSleep: 18.8,
    spO2: 96.5,
    respiratoryRate: 15.2,
    bodyTemperature: 37.0
  },
  {
    date: '2025-09-05',
    restingHeartRate: 57,
    heartRateVariability: 5.72,
    sleepQuality: 6.5,
    recoveryScore: 6.8,
    fatigueLevel: 4.8,
    deepSleep: 14.8,
    remSleep: 16.9,
    spO2: 95.9,
    respiratoryRate: 16.1,
    bodyTemperature: 37.2
  },
  {
    date: '2025-09-06',
    restingHeartRate: 54,
    heartRateVariability: 6.28,
    sleepQuality: 7.3,
    recoveryScore: 7.9,
    fatigueLevel: 3.5,
    deepSleep: 19.2,
    remSleep: 22.1,
    spO2: 97.3,
    respiratoryRate: 14.8,
    bodyTemperature: 36.7
  }
];

async function seedAthlete1Data() {
  console.log('🌱 Starting to seed biometric data for Athlete 1 (Bowen Bezuidenhoudt)...');

  for (const record of athlete1Data) {
    try {
      const payload = {
        date: record.date + 'T00:00:00Z',
        hrv_night: record.heartRateVariability * 10,
        resting_hr: record.restingHeartRate,
        sleep_duration_h: record.sleepQuality,
        training_load_pct: record.fatigueLevel * 10,
        deep_sleep_pct: record.deepSleep,
        rem_sleep_pct: record.remSleep,
        spo2_night: record.spO2,
        resp_rate_night: record.respiratoryRate,
        temp_trend_c: record.bodyTemperature
      };

      console.log(`📤 Inserting data for ${record.date}...`);
      const response = await axios.post(`${API_BASE_URL}/athletes/1/biometric-data`, payload);

      if (response.status === 200 || response.status === 201) {
        console.log(`✅ Successfully inserted data for ${record.date}`);
      }
    } catch (error) {
      console.error(`❌ Failed to insert data for ${record.date}:`, error.response?.data || error.message);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('🎉 Finished seeding biometric data for Athlete 1!');
}

seedAthlete1Data().catch(console.error);