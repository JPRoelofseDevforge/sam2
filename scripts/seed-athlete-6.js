import axios from 'axios';

// API configuration
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:5288/api';

// Athlete 6 (Marco Nel) - Biometric data
const athlete6Data = [
  {
    "date": "2025-08-31",
    "restingHeartRate": 55,
    "heartRateVariability": 6.25,
    "sleepQuality": 7.9,
    "recoveryScore": 8.6,
    "fatigueLevel": 3,
    "deepSleep": 24.7,
    "remSleep": 19.3,
    "spO2": 96,
    "respiratoryRate": 18.1,
    "bodyTemperature": 36.5
  },
  {
    "date": "2025-09-01",
    "restingHeartRate": 54,
    "heartRateVariability": 5.99,
    "sleepQuality": 7.6,
    "recoveryScore": 8.5,
    "fatigueLevel": 2.9,
    "deepSleep": 23.9,
    "remSleep": 18.7,
    "spO2": 95.7,
    "respiratoryRate": 17.8,
    "bodyTemperature": 36.4
  },
  {
    "date": "2025-09-02",
    "restingHeartRate": 53,
    "heartRateVariability": 5.87,
    "sleepQuality": 7.5,
    "recoveryScore": 8.4,
    "fatigueLevel": 2.8,
    "deepSleep": 23.5,
    "remSleep": 18.5,
    "spO2": 95.6,
    "respiratoryRate": 17.7,
    "bodyTemperature": 36.4
  },
  {
    "date": "2025-09-03",
    "restingHeartRate": 54,
    "heartRateVariability": 6.04,
    "sleepQuality": 7.7,
    "recoveryScore": 8.5,
    "fatigueLevel": 2.9,
    "deepSleep": 24,
    "remSleep": 18.8,
    "spO2": 95.7,
    "respiratoryRate": 17.9,
    "bodyTemperature": 36.4
  },
  {
    "date": "2025-09-04",
    "restingHeartRate": 53,
    "heartRateVariability": 5.95,
    "sleepQuality": 7.6,
    "recoveryScore": 8.5,
    "fatigueLevel": 2.8,
    "deepSleep": 23.8,
    "remSleep": 18.6,
    "spO2": 95.7,
    "respiratoryRate": 17.8,
    "bodyTemperature": 36.4
  },
  {
    "date": "2025-09-05",
    "restingHeartRate": 53,
    "heartRateVariability": 5.89,
    "sleepQuality": 7.5,
    "recoveryScore": 8.5,
    "fatigueLevel": 2.8,
    "deepSleep": 23.6,
    "remSleep": 18.5,
    "spO2": 95.6,
    "respiratoryRate": 17.7,
    "bodyTemperature": 36.4
  },
  {
    "date": "2025-09-06",
    "restingHeartRate": 55,
    "heartRateVariability": 6.16,
    "sleepQuality": 7.8,
    "recoveryScore": 8.6,
    "fatigueLevel": 2.9,
    "deepSleep": 24.4,
    "remSleep": 19.1,
    "spO2": 95.9,
    "respiratoryRate": 18,
    "bodyTemperature": 36.4
  }
];

async function seedAthlete6Data() {
  console.log('🌱 Starting to seed biometric data for Athlete 6 (Marco Nel)...');

  for (const record of athlete6Data) {
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
      const response = await axios.post(`${API_BASE_URL}/athletes/6/biometric-data`, payload);

      if (response.status === 200 || response.status === 201) {
        console.log(`✅ Successfully inserted data for ${record.date}`);
      }
    } catch (error) {
      console.error(`❌ Failed to insert data for ${record.date}:`, error.response?.data || error.message);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('🎉 Finished seeding biometric data for Athlete 6!');
}

seedAthlete6Data().catch(console.error);
