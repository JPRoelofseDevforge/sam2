import axios from 'axios';

// API configuration
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:5288/api';

// Athlete 3 (Steffan De Jongh) - Power athlete
const athlete3Data = [
  {
    date: '2025-08-31',
    restingHeartRate: 55,
    heartRateVariability: 7.21,
    sleepQuality: 7.5,
    recoveryScore: 8.8,
    fatigueLevel: 2.0,
    deepSleep: 18.5,
    remSleep: 22.3,
    spO2: 97.2,
    respiratoryRate: 14.8,
    bodyTemperature: 36.7
  },
  {
    date: '2025-09-01',
    restingHeartRate: 58,
    heartRateVariability: 6.85,
    sleepQuality: 7.0,
    recoveryScore: 8.2,
    fatigueLevel: 2.8,
    deepSleep: 16.8,
    remSleep: 20.1,
    spO2: 96.8,
    respiratoryRate: 15.2,
    bodyTemperature: 36.9
  },
  {
    date: '2025-09-02',
    restingHeartRate: 56,
    heartRateVariability: 7.05,
    sleepQuality: 7.3,
    recoveryScore: 8.5,
    fatigueLevel: 2.5,
    deepSleep: 19.2,
    remSleep: 21.8,
    spO2: 97.5,
    respiratoryRate: 14.5,
    bodyTemperature: 36.6
  },
  {
    date: '2025-09-03',
    restingHeartRate: 59,
    heartRateVariability: 6.72,
    sleepQuality: 6.8,
    recoveryScore: 7.8,
    fatigueLevel: 3.2,
    deepSleep: 15.5,
    remSleep: 18.9,
    spO2: 96.2,
    respiratoryRate: 15.8,
    bodyTemperature: 37.1
  },
  {
    date: '2025-09-04',
    restingHeartRate: 57,
    heartRateVariability: 6.95,
    sleepQuality: 7.2,
    recoveryScore: 8.3,
    fatigueLevel: 2.7,
    deepSleep: 17.9,
    remSleep: 22.5,
    spO2: 97.1,
    respiratoryRate: 14.9,
    bodyTemperature: 36.8
  },
  {
    date: '2025-09-05',
    restingHeartRate: 60,
    heartRateVariability: 6.58,
    sleepQuality: 6.5,
    recoveryScore: 7.5,
    fatigueLevel: 3.5,
    deepSleep: 14.2,
    remSleep: 17.3,
    spO2: 95.8,
    respiratoryRate: 16.1,
    bodyTemperature: 37.2
  },
  {
    date: '2025-09-06',
    restingHeartRate: 56,
    heartRateVariability: 7.15,
    sleepQuality: 7.4,
    recoveryScore: 8.6,
    fatigueLevel: 2.3,
    deepSleep: 20.1,
    remSleep: 23.2,
    spO2: 97.8,
    respiratoryRate: 14.2,
    bodyTemperature: 36.5
  }
];

async function seedAthlete3Data() {
  console.log('🌱 Starting to seed biometric data for Athlete 3 (Steffan De Jongh)...');

  for (const record of athlete3Data) {
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
      const response = await axios.post(`${API_BASE_URL}/athletes/3/biometric-data`, payload);

      if (response.status === 200 || response.status === 201) {
        console.log(`✅ Successfully inserted data for ${record.date}`);
      }
    } catch (error) {
      console.error(`❌ Failed to insert data for ${record.date}:`, error.response?.data || error.message);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('🎉 Finished seeding biometric data for Athlete 3!');
}

seedAthlete3Data().catch(console.error);