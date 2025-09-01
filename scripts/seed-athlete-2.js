import axios from 'axios';

// API configuration
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:5288/api';

// Athlete 2 (Aldrich Wichman) - Endurance athlete
const athlete2Data = [
  {
    date: '2025-08-31',
    restingHeartRate: 48,
    heartRateVariability: 5.82,
    sleepQuality: 8.2,
    recoveryScore: 7.8,
    fatigueLevel: 3.5,
    deepSleep: 22.1,
    remSleep: 24.5,
    spO2: 98.2,
    respiratoryRate: 13.2,
    bodyTemperature: 36.5
  },
  {
    date: '2025-09-01',
    restingHeartRate: 47,
    heartRateVariability: 6.15,
    sleepQuality: 8.5,
    recoveryScore: 8.5,
    fatigueLevel: 2.8,
    deepSleep: 23.8,
    remSleep: 25.2,
    spO2: 98.5,
    respiratoryRate: 12.8,
    bodyTemperature: 36.4
  },
  {
    date: '2025-09-02',
    restingHeartRate: 46,
    heartRateVariability: 6.42,
    sleepQuality: 8.8,
    recoveryScore: 8.8,
    fatigueLevel: 2.2,
    deepSleep: 24.5,
    remSleep: 26.1,
    spO2: 98.8,
    respiratoryRate: 12.5,
    bodyTemperature: 36.3
  },
  {
    date: '2025-09-03',
    restingHeartRate: 49,
    heartRateVariability: 5.95,
    sleepQuality: 8.0,
    recoveryScore: 7.9,
    fatigueLevel: 3.2,
    deepSleep: 21.8,
    remSleep: 23.9,
    spO2: 97.9,
    respiratoryRate: 13.5,
    bodyTemperature: 36.6
  },
  {
    date: '2025-09-04',
    restingHeartRate: 48,
    heartRateVariability: 6.05,
    sleepQuality: 8.3,
    recoveryScore: 8.2,
    fatigueLevel: 2.9,
    deepSleep: 22.9,
    remSleep: 24.8,
    spO2: 98.1,
    respiratoryRate: 13.1,
    bodyTemperature: 36.5
  },
  {
    date: '2025-09-05',
    restingHeartRate: 47,
    heartRateVariability: 6.28,
    sleepQuality: 8.6,
    recoveryScore: 8.5,
    fatigueLevel: 2.5,
    deepSleep: 23.5,
    remSleep: 25.8,
    spO2: 98.3,
    respiratoryRate: 12.9,
    bodyTemperature: 36.4
  },
  {
    date: '2025-09-06',
    restingHeartRate: 46,
    heartRateVariability: 6.55,
    sleepQuality: 8.9,
    recoveryScore: 9.0,
    fatigueLevel: 2.0,
    deepSleep: 24.2,
    remSleep: 26.5,
    spO2: 98.6,
    respiratoryRate: 12.3,
    bodyTemperature: 36.2
  }
];

async function seedAthlete2Data() {
  console.log('🌱 Starting to seed biometric data for Athlete 2 (Aldrich Wichman)...');

  for (const record of athlete2Data) {
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
      const response = await axios.post(`${API_BASE_URL}/athletes/2/biometric-data`, payload);

      if (response.status === 200 || response.status === 201) {
        console.log(`✅ Successfully inserted data for ${record.date}`);
      }
    } catch (error) {
      console.error(`❌ Failed to insert data for ${record.date}:`, error.response?.data || error.message);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('🎉 Finished seeding biometric data for Athlete 2!');
}

seedAthlete2Data().catch(console.error);