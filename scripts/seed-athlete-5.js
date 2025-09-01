import axios from 'axios';

// API configuration
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:5288/api';

// Athlete 5 (Francois Rossouw) - Biometric data
const athlete5Data = [
  {
    "date": "2025-08-31",
    "restingHeartRate": 50,
    "heartRateVariability": 6.51,
    "sleepQuality": 8.8,
    "recoveryScore": 8,
    "fatigueLevel": 4.5,
    "deepSleep": 21.2,
    "remSleep": 24.4,
    "spO2": 97.8,
    "respiratoryRate": 14,
    "bodyTemperature": 36.5
  },
  {
    "date": "2025-09-01",
    "restingHeartRate": 50,
    "heartRateVariability": 6.56,
    "sleepQuality": 8.8,
    "recoveryScore": 8.1,
    "fatigueLevel": 4.5,
    "deepSleep": 21.4,
    "remSleep": 24.5,
    "spO2": 97.9,
    "respiratoryRate": 14.1,
    "bodyTemperature": 36.5
  },
  {
    "date": "2025-09-02",
    "restingHeartRate": 51,
    "heartRateVariability": 6.8,
    "sleepQuality": 9,
    "recoveryScore": 8.2,
    "fatigueLevel": 4.6,
    "deepSleep": 22.1,
    "remSleep": 25,
    "spO2": 98.1,
    "respiratoryRate": 14.3,
    "bodyTemperature": 36.6
  },
  {
    "date": "2025-09-03",
    "restingHeartRate": 51,
    "heartRateVariability": 6.78,
    "sleepQuality": 9,
    "recoveryScore": 8.2,
    "fatigueLevel": 4.6,
    "deepSleep": 22,
    "remSleep": 24.9,
    "spO2": 98.1,
    "respiratoryRate": 14.3,
    "bodyTemperature": 36.6
  },
  {
    "date": "2025-09-04",
    "restingHeartRate": 51,
    "heartRateVariability": 6.72,
    "sleepQuality": 9,
    "recoveryScore": 8.1,
    "fatigueLevel": 4.6,
    "deepSleep": 21.8,
    "remSleep": 24.8,
    "spO2": 98,
    "respiratoryRate": 14.2,
    "bodyTemperature": 36.5
  },
  {
    "date": "2025-09-05",
    "restingHeartRate": 51,
    "heartRateVariability": 6.81,
    "sleepQuality": 9,
    "recoveryScore": 8.2,
    "fatigueLevel": 4.6,
    "deepSleep": 22.1,
    "remSleep": 25,
    "spO2": 98.1,
    "respiratoryRate": 14.3,
    "bodyTemperature": 36.6
  },
  {
    "date": "2025-09-06",
    "restingHeartRate": 50,
    "heartRateVariability": 6.53,
    "sleepQuality": 8.8,
    "recoveryScore": 8,
    "fatigueLevel": 4.5,
    "deepSleep": 21.3,
    "remSleep": 24.4,
    "spO2": 97.8,
    "respiratoryRate": 14,
    "bodyTemperature": 36.5
  }
];

async function seedAthlete5Data() {
  console.log('🌱 Starting to seed biometric data for Athlete 5 (Francois Rossouw)...');

  for (const record of athlete5Data) {
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
      const response = await axios.post(`${API_BASE_URL}/athletes/5/biometric-data`, payload);

      if (response.status === 200 || response.status === 201) {
        console.log(`✅ Successfully inserted data for ${record.date}`);
      }
    } catch (error) {
      console.error(`❌ Failed to insert data for ${record.date}:`, error.response?.data || error.message);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('🎉 Finished seeding biometric data for Athlete 5!');
}

seedAthlete5Data().catch(console.error);
