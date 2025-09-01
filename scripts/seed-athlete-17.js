import axios from 'axios';

// API configuration
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:5288/api';

// Athlete 17 (Tiaan Van Rensburg) - Biometric data
const athlete17Data = [
  {
    "date": "2025-08-31",
    "restingHeartRate": 56,
    "heartRateVariability": 7.56,
    "sleepQuality": 8.2,
    "recoveryScore": 8.6,
    "fatigueLevel": 2.5,
    "deepSleep": 16.7,
    "remSleep": 24.4,
    "spO2": 97.2,
    "respiratoryRate": 15.8,
    "bodyTemperature": 36.6
  },
  {
    "date": "2025-09-01",
    "restingHeartRate": 57,
    "heartRateVariability": 7.61,
    "sleepQuality": 8.2,
    "recoveryScore": 8.7,
    "fatigueLevel": 2.6,
    "deepSleep": 16.8,
    "remSleep": 24.4,
    "spO2": 97.3,
    "respiratoryRate": 15.8,
    "bodyTemperature": 36.6
  },
  {
    "date": "2025-09-02",
    "restingHeartRate": 58,
    "heartRateVariability": 7.82,
    "sleepQuality": 8.4,
    "recoveryScore": 8.8,
    "fatigueLevel": 2.7,
    "deepSleep": 17.5,
    "remSleep": 24.9,
    "spO2": 97.5,
    "respiratoryRate": 16.1,
    "bodyTemperature": 36.7
  },
  {
    "date": "2025-09-03",
    "restingHeartRate": 58,
    "heartRateVariability": 7.82,
    "sleepQuality": 8.4,
    "recoveryScore": 8.8,
    "fatigueLevel": 2.7,
    "deepSleep": 17.5,
    "remSleep": 24.9,
    "spO2": 97.5,
    "respiratoryRate": 16.1,
    "bodyTemperature": 36.7
  },
  {
    "date": "2025-09-04",
    "restingHeartRate": 57,
    "heartRateVariability": 7.61,
    "sleepQuality": 8.2,
    "recoveryScore": 8.7,
    "fatigueLevel": 2.6,
    "deepSleep": 16.9,
    "remSleep": 24.5,
    "spO2": 97.3,
    "respiratoryRate": 15.9,
    "bodyTemperature": 36.6
  },
  {
    "date": "2025-09-05",
    "restingHeartRate": 57,
    "heartRateVariability": 7.68,
    "sleepQuality": 8.3,
    "recoveryScore": 8.7,
    "fatigueLevel": 2.6,
    "deepSleep": 17.1,
    "remSleep": 24.6,
    "spO2": 97.3,
    "respiratoryRate": 15.9,
    "bodyTemperature": 36.6
  },
  {
    "date": "2025-09-06",
    "restingHeartRate": 56,
    "heartRateVariability": 7.55,
    "sleepQuality": 8.2,
    "recoveryScore": 8.6,
    "fatigueLevel": 2.5,
    "deepSleep": 16.7,
    "remSleep": 24.3,
    "spO2": 97.2,
    "respiratoryRate": 15.8,
    "bodyTemperature": 36.6
  }
];

async function seedAthlete17Data() {
  console.log('🌱 Starting to seed biometric data for Athlete 17 (Tiaan Van Rensburg)...');

  for (const record of athlete17Data) {
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
      const response = await axios.post(`${API_BASE_URL}/athletes/17/biometric-data`, payload);

      if (response.status === 200 || response.status === 201) {
        console.log(`✅ Successfully inserted data for ${record.date}`);
      }
    } catch (error) {
      console.error(`❌ Failed to insert data for ${record.date}:`, error.response?.data || error.message);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('🎉 Finished seeding biometric data for Athlete 17!');
}

seedAthlete17Data().catch(console.error);
