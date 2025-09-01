import axios from 'axios';

// API configuration
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:5288/api';

// Athlete 16 (Kobus Van Der Walt) - Biometric data
const athlete16Data = [
  {
    "date": "2025-08-31",
    "restingHeartRate": 62,
    "heartRateVariability": 7.62,
    "sleepQuality": 7.5,
    "recoveryScore": 9,
    "fatigueLevel": 2.3,
    "deepSleep": 23,
    "remSleep": 22.6,
    "spO2": 98.9,
    "respiratoryRate": 13.7,
    "bodyTemperature": 36.8
  },
  {
    "date": "2025-09-01",
    "restingHeartRate": 61,
    "heartRateVariability": 7.52,
    "sleepQuality": 7.4,
    "recoveryScore": 8.9,
    "fatigueLevel": 2.3,
    "deepSleep": 22.8,
    "remSleep": 22.4,
    "spO2": 98.8,
    "respiratoryRate": 13.6,
    "bodyTemperature": 36.8
  },
  {
    "date": "2025-09-02",
    "restingHeartRate": 61,
    "heartRateVariability": 7.55,
    "sleepQuality": 7.4,
    "recoveryScore": 9,
    "fatigueLevel": 2.3,
    "deepSleep": 22.8,
    "remSleep": 22.5,
    "spO2": 98.8,
    "respiratoryRate": 13.6,
    "bodyTemperature": 36.8
  },
  {
    "date": "2025-09-03",
    "restingHeartRate": 62,
    "heartRateVariability": 7.63,
    "sleepQuality": 7.5,
    "recoveryScore": 9,
    "fatigueLevel": 2.3,
    "deepSleep": 23.1,
    "remSleep": 22.6,
    "spO2": 98.9,
    "respiratoryRate": 13.7,
    "bodyTemperature": 36.8
  },
  {
    "date": "2025-09-04",
    "restingHeartRate": 62,
    "heartRateVariability": 7.68,
    "sleepQuality": 7.5,
    "recoveryScore": 9,
    "fatigueLevel": 2.3,
    "deepSleep": 23.2,
    "remSleep": 22.7,
    "spO2": 98.9,
    "respiratoryRate": 13.7,
    "bodyTemperature": 36.8
  },
  {
    "date": "2025-09-05",
    "restingHeartRate": 60,
    "heartRateVariability": 7.39,
    "sleepQuality": 7.2,
    "recoveryScore": 8.9,
    "fatigueLevel": 2.2,
    "deepSleep": 22.4,
    "remSleep": 22.1,
    "spO2": 98.6,
    "respiratoryRate": 13.4,
    "bodyTemperature": 36.7
  },
  {
    "date": "2025-09-06",
    "restingHeartRate": 60,
    "heartRateVariability": 7.32,
    "sleepQuality": 7.2,
    "recoveryScore": 8.8,
    "fatigueLevel": 2.2,
    "deepSleep": 22.1,
    "remSleep": 22,
    "spO2": 98.6,
    "respiratoryRate": 13.4,
    "bodyTemperature": 36.7
  }
];

async function seedAthlete16Data() {
  console.log('🌱 Starting to seed biometric data for Athlete 16 (Kobus Van Der Walt)...');

  for (const record of athlete16Data) {
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
      const response = await axios.post(`${API_BASE_URL}/athletes/16/biometric-data`, payload);

      if (response.status === 200 || response.status === 201) {
        console.log(`✅ Successfully inserted data for ${record.date}`);
      }
    } catch (error) {
      console.error(`❌ Failed to insert data for ${record.date}:`, error.response?.data || error.message);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('🎉 Finished seeding biometric data for Athlete 16!');
}

seedAthlete16Data().catch(console.error);
