import axios from 'axios';

// API configuration
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:5288/api';

// Athlete 9 (Danie Van Zyl) - Biometric data
const athlete9Data = [
  {
    "date": "2025-08-31",
    "restingHeartRate": 52,
    "heartRateVariability": 6.27,
    "sleepQuality": 6.9,
    "recoveryScore": 8.1,
    "fatigueLevel": 4.4,
    "deepSleep": 19.7,
    "remSleep": 22.3,
    "spO2": 96,
    "respiratoryRate": 14.3,
    "bodyTemperature": 36.4
  },
  {
    "date": "2025-09-01",
    "restingHeartRate": 54,
    "heartRateVariability": 6.57,
    "sleepQuality": 7.2,
    "recoveryScore": 8.2,
    "fatigueLevel": 4.6,
    "deepSleep": 20.6,
    "remSleep": 22.9,
    "spO2": 96.3,
    "respiratoryRate": 14.6,
    "bodyTemperature": 36.5
  },
  {
    "date": "2025-09-02",
    "restingHeartRate": 52,
    "heartRateVariability": 6.22,
    "sleepQuality": 6.9,
    "recoveryScore": 8.1,
    "fatigueLevel": 4.4,
    "deepSleep": 19.6,
    "remSleep": 22.2,
    "spO2": 95.9,
    "respiratoryRate": 14.2,
    "bodyTemperature": 36.4
  },
  {
    "date": "2025-09-03",
    "restingHeartRate": 53,
    "heartRateVariability": 6.42,
    "sleepQuality": 7.1,
    "recoveryScore": 8.2,
    "fatigueLevel": 4.5,
    "deepSleep": 20.2,
    "remSleep": 22.6,
    "spO2": 96.1,
    "respiratoryRate": 14.4,
    "bodyTemperature": 36.4
  },
  {
    "date": "2025-09-04",
    "restingHeartRate": 54,
    "heartRateVariability": 6.61,
    "sleepQuality": 7.2,
    "recoveryScore": 8.3,
    "fatigueLevel": 4.6,
    "deepSleep": 20.8,
    "remSleep": 23,
    "spO2": 96.3,
    "respiratoryRate": 14.6,
    "bodyTemperature": 36.5
  },
  {
    "date": "2025-09-05",
    "restingHeartRate": 53,
    "heartRateVariability": 6.45,
    "sleepQuality": 7.1,
    "recoveryScore": 8.2,
    "fatigueLevel": 4.5,
    "deepSleep": 20.3,
    "remSleep": 22.6,
    "spO2": 96.1,
    "respiratoryRate": 14.4,
    "bodyTemperature": 36.4
  },
  {
    "date": "2025-09-06",
    "restingHeartRate": 52,
    "heartRateVariability": 6.26,
    "sleepQuality": 6.9,
    "recoveryScore": 8.1,
    "fatigueLevel": 4.4,
    "deepSleep": 19.7,
    "remSleep": 22.3,
    "spO2": 95.9,
    "respiratoryRate": 14.2,
    "bodyTemperature": 36.4
  }
];

async function seedAthlete9Data() {
  console.log('🌱 Starting to seed biometric data for Athlete 9 (Danie Van Zyl)...');

  for (const record of athlete9Data) {
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
      const response = await axios.post(`${API_BASE_URL}/athletes/9/biometric-data`, payload);

      if (response.status === 200 || response.status === 201) {
        console.log(`✅ Successfully inserted data for ${record.date}`);
      }
    } catch (error) {
      console.error(`❌ Failed to insert data for ${record.date}:`, error.response?.data || error.message);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('🎉 Finished seeding biometric data for Athlete 9!');
}

seedAthlete9Data().catch(console.error);
