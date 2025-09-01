import axios from 'axios';

// API configuration
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:5288/api';

// Athlete 23 (Christiaan Van Zyl) - Biometric data
const athlete23Data = [
  {
    "date": "2025-08-31",
    "restingHeartRate": 51,
    "heartRateVariability": 5.97,
    "sleepQuality": 8.5,
    "recoveryScore": 7.2,
    "fatigueLevel": 2.6,
    "deepSleep": 18.4,
    "remSleep": 25.8,
    "spO2": 96.7,
    "respiratoryRate": 17,
    "bodyTemperature": 36.8
  },
  {
    "date": "2025-09-01",
    "restingHeartRate": 51,
    "heartRateVariability": 5.98,
    "sleepQuality": 8.5,
    "recoveryScore": 7.2,
    "fatigueLevel": 2.6,
    "deepSleep": 18.4,
    "remSleep": 25.8,
    "spO2": 96.7,
    "respiratoryRate": 17,
    "bodyTemperature": 36.8
  },
  {
    "date": "2025-09-02",
    "restingHeartRate": 51,
    "heartRateVariability": 6.13,
    "sleepQuality": 8.6,
    "recoveryScore": 7.3,
    "fatigueLevel": 2.6,
    "deepSleep": 18.8,
    "remSleep": 26.1,
    "spO2": 96.8,
    "respiratoryRate": 17.1,
    "bodyTemperature": 36.8
  },
  {
    "date": "2025-09-03",
    "restingHeartRate": 52,
    "heartRateVariability": 6.23,
    "sleepQuality": 8.7,
    "recoveryScore": 7.3,
    "fatigueLevel": 2.7,
    "deepSleep": 19.1,
    "remSleep": 26.3,
    "spO2": 96.9,
    "respiratoryRate": 17.2,
    "bodyTemperature": 36.9
  },
  {
    "date": "2025-09-04",
    "restingHeartRate": 51,
    "heartRateVariability": 6.08,
    "sleepQuality": 8.6,
    "recoveryScore": 7.3,
    "fatigueLevel": 2.6,
    "deepSleep": 18.7,
    "remSleep": 26,
    "spO2": 96.8,
    "respiratoryRate": 17.1,
    "bodyTemperature": 36.8
  },
  {
    "date": "2025-09-05",
    "restingHeartRate": 50,
    "heartRateVariability": 5.92,
    "sleepQuality": 8.4,
    "recoveryScore": 7.2,
    "fatigueLevel": 2.5,
    "deepSleep": 18.2,
    "remSleep": 25.7,
    "spO2": 96.6,
    "respiratoryRate": 16.9,
    "bodyTemperature": 36.8
  },
  {
    "date": "2025-09-06",
    "restingHeartRate": 51,
    "heartRateVariability": 6.12,
    "sleepQuality": 8.6,
    "recoveryScore": 7.3,
    "fatigueLevel": 2.6,
    "deepSleep": 18.8,
    "remSleep": 26.1,
    "spO2": 96.8,
    "respiratoryRate": 17.1,
    "bodyTemperature": 36.8
  }
];

async function seedAthlete23Data() {
  console.log('🌱 Starting to seed biometric data for Athlete 23 (Christiaan Van Zyl)...');

  for (const record of athlete23Data) {
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
      const response = await axios.post(`${API_BASE_URL}/athletes/23/biometric-data`, payload);

      if (response.status === 200 || response.status === 201) {
        console.log(`✅ Successfully inserted data for ${record.date}`);
      }
    } catch (error) {
      console.error(`❌ Failed to insert data for ${record.date}:`, error.response?.data || error.message);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('🎉 Finished seeding biometric data for Athlete 23!');
}

seedAthlete23Data().catch(console.error);
