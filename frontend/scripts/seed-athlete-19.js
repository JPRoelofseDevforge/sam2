import axios from 'axios';

// API configuration
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:5288/api';

// Athlete 19 (Gerrit Van Der Linde) - Biometric data
const athlete19Data = [
  {
    "date": "2025-08-31",
    "restingHeartRate": 52,
    "heartRateVariability": 6.14,
    "sleepQuality": 6.6,
    "recoveryScore": 7.3,
    "fatigueLevel": 3.1,
    "deepSleep": 20.9,
    "remSleep": 24.9,
    "spO2": 98.5,
    "respiratoryRate": 12.6,
    "bodyTemperature": 37.2
  },
  {
    "date": "2025-09-01",
    "restingHeartRate": 53,
    "heartRateVariability": 6.23,
    "sleepQuality": 6.7,
    "recoveryScore": 7.4,
    "fatigueLevel": 3.2,
    "deepSleep": 21.1,
    "remSleep": 25.1,
    "spO2": 98.5,
    "respiratoryRate": 12.6,
    "bodyTemperature": 37.2
  },
  {
    "date": "2025-09-02",
    "restingHeartRate": 53,
    "heartRateVariability": 6.19,
    "sleepQuality": 6.7,
    "recoveryScore": 7.3,
    "fatigueLevel": 3.1,
    "deepSleep": 21,
    "remSleep": 25,
    "spO2": 98.5,
    "respiratoryRate": 12.6,
    "bodyTemperature": 37.2
  },
  {
    "date": "2025-09-03",
    "restingHeartRate": 53,
    "heartRateVariability": 6.22,
    "sleepQuality": 6.7,
    "recoveryScore": 7.4,
    "fatigueLevel": 3.2,
    "deepSleep": 21.1,
    "remSleep": 25.1,
    "spO2": 98.5,
    "respiratoryRate": 12.6,
    "bodyTemperature": 37.2
  },
  {
    "date": "2025-09-04",
    "restingHeartRate": 52,
    "heartRateVariability": 6.15,
    "sleepQuality": 6.6,
    "recoveryScore": 7.3,
    "fatigueLevel": 3.1,
    "deepSleep": 20.9,
    "remSleep": 24.9,
    "spO2": 98.5,
    "respiratoryRate": 12.6,
    "bodyTemperature": 37.2
  },
  {
    "date": "2025-09-05",
    "restingHeartRate": 53,
    "heartRateVariability": 6.23,
    "sleepQuality": 6.7,
    "recoveryScore": 7.4,
    "fatigueLevel": 3.2,
    "deepSleep": 21.1,
    "remSleep": 25.1,
    "spO2": 98.5,
    "respiratoryRate": 12.6,
    "bodyTemperature": 37.2
  },
  {
    "date": "2025-09-06",
    "restingHeartRate": 52,
    "heartRateVariability": 6.08,
    "sleepQuality": 6.6,
    "recoveryScore": 7.3,
    "fatigueLevel": 3.1,
    "deepSleep": 20.7,
    "remSleep": 24.8,
    "spO2": 98.4,
    "respiratoryRate": 12.5,
    "bodyTemperature": 37.2
  }
];

async function seedAthlete19Data() {
  console.log('🌱 Starting to seed biometric data for Athlete 19 (Gerrit Van Der Linde)...');

  for (const record of athlete19Data) {
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
      const response = await axios.post(`${API_BASE_URL}/athletes/19/biometric-data`, payload);

      if (response.status === 200 || response.status === 201) {
        console.log(`✅ Successfully inserted data for ${record.date}`);
      }
    } catch (error) {
      console.error(`❌ Failed to insert data for ${record.date}:`, error.response?.data || error.message);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('🎉 Finished seeding biometric data for Athlete 19!');
}

seedAthlete19Data().catch(console.error);
