import axios from 'axios';

// API configuration
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:5288/api';

// Athlete 8 (Heinrich Smit) - Biometric data
const athlete8Data = [
  {
    "date": "2025-08-31",
    "restingHeartRate": 60,
    "heartRateVariability": 5.8,
    "sleepQuality": 8.6,
    "recoveryScore": 7.3,
    "fatigueLevel": 2.7,
    "deepSleep": 16.8,
    "remSleep": 23.7,
    "spO2": 97.6,
    "respiratoryRate": 12.4,
    "bodyTemperature": 37.2
  },
  {
    "date": "2025-09-01",
    "restingHeartRate": 59,
    "heartRateVariability": 5.6,
    "sleepQuality": 8.4,
    "recoveryScore": 7.2,
    "fatigueLevel": 2.6,
    "deepSleep": 16.2,
    "remSleep": 23.3,
    "spO2": 97.4,
    "respiratoryRate": 12.2,
    "bodyTemperature": 37.1
  },
  {
    "date": "2025-09-02",
    "restingHeartRate": 61,
    "heartRateVariability": 5.95,
    "sleepQuality": 8.7,
    "recoveryScore": 7.4,
    "fatigueLevel": 2.8,
    "deepSleep": 17.2,
    "remSleep": 24,
    "spO2": 97.7,
    "respiratoryRate": 12.6,
    "bodyTemperature": 37.2
  },
  {
    "date": "2025-09-03",
    "restingHeartRate": 60,
    "heartRateVariability": 5.85,
    "sleepQuality": 8.6,
    "recoveryScore": 7.3,
    "fatigueLevel": 2.8,
    "deepSleep": 16.9,
    "remSleep": 23.8,
    "spO2": 97.6,
    "respiratoryRate": 12.5,
    "bodyTemperature": 37.2
  },
  {
    "date": "2025-09-04",
    "restingHeartRate": 60,
    "heartRateVariability": 5.77,
    "sleepQuality": 8.6,
    "recoveryScore": 7.3,
    "fatigueLevel": 2.7,
    "deepSleep": 16.7,
    "remSleep": 23.6,
    "spO2": 97.5,
    "respiratoryRate": 12.4,
    "bodyTemperature": 37.2
  },
  {
    "date": "2025-09-05",
    "restingHeartRate": 60,
    "heartRateVariability": 5.73,
    "sleepQuality": 8.5,
    "recoveryScore": 7.3,
    "fatigueLevel": 2.7,
    "deepSleep": 16.6,
    "remSleep": 23.6,
    "spO2": 97.5,
    "respiratoryRate": 12.4,
    "bodyTemperature": 37.2
  },
  {
    "date": "2025-09-06",
    "restingHeartRate": 60,
    "heartRateVariability": 5.77,
    "sleepQuality": 8.6,
    "recoveryScore": 7.3,
    "fatigueLevel": 2.7,
    "deepSleep": 16.7,
    "remSleep": 23.7,
    "spO2": 97.5,
    "respiratoryRate": 12.4,
    "bodyTemperature": 37.2
  }
];

async function seedAthlete8Data() {
  console.log('🌱 Starting to seed biometric data for Athlete 8 (Heinrich Smit)...');

  for (const record of athlete8Data) {
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
      const response = await axios.post(`${API_BASE_URL}/athletes/8/biometric-data`, payload);

      if (response.status === 200 || response.status === 201) {
        console.log(`✅ Successfully inserted data for ${record.date}`);
      }
    } catch (error) {
      console.error(`❌ Failed to insert data for ${record.date}:`, error.response?.data || error.message);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('🎉 Finished seeding biometric data for Athlete 8!');
}

seedAthlete8Data().catch(console.error);
