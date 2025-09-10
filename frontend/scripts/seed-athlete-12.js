import axios from 'axios';

// API configuration
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:5288/api';

// Athlete 12 (Pieter Van Wyk) - Biometric data
const athlete12Data = [
  {
    "date": "2025-08-31",
    "restingHeartRate": 49,
    "heartRateVariability": 7.15,
    "sleepQuality": 8.4,
    "recoveryScore": 8.5,
    "fatigueLevel": 2.5,
    "deepSleep": 22.9,
    "remSleep": 24.1,
    "spO2": 95.6,
    "respiratoryRate": 12.6,
    "bodyTemperature": 36.9
  },
  {
    "date": "2025-09-01",
    "restingHeartRate": 51,
    "heartRateVariability": 7.47,
    "sleepQuality": 8.7,
    "recoveryScore": 8.6,
    "fatigueLevel": 2.6,
    "deepSleep": 23.8,
    "remSleep": 24.8,
    "spO2": 95.9,
    "respiratoryRate": 12.9,
    "bodyTemperature": 37
  },
  {
    "date": "2025-09-02",
    "restingHeartRate": 49,
    "heartRateVariability": 7.17,
    "sleepQuality": 8.4,
    "recoveryScore": 8.5,
    "fatigueLevel": 2.5,
    "deepSleep": 22.9,
    "remSleep": 24.2,
    "spO2": 95.6,
    "respiratoryRate": 12.6,
    "bodyTemperature": 36.9
  },
  {
    "date": "2025-09-03",
    "restingHeartRate": 50,
    "heartRateVariability": 7.41,
    "sleepQuality": 8.6,
    "recoveryScore": 8.6,
    "fatigueLevel": 2.6,
    "deepSleep": 23.7,
    "remSleep": 24.6,
    "spO2": 95.8,
    "respiratoryRate": 12.9,
    "bodyTemperature": 36.9
  },
  {
    "date": "2025-09-04",
    "restingHeartRate": 50,
    "heartRateVariability": 7.42,
    "sleepQuality": 8.6,
    "recoveryScore": 8.6,
    "fatigueLevel": 2.6,
    "deepSleep": 23.7,
    "remSleep": 24.7,
    "spO2": 95.9,
    "respiratoryRate": 12.9,
    "bodyTemperature": 36.9
  },
  {
    "date": "2025-09-05",
    "restingHeartRate": 50,
    "heartRateVariability": 7.4,
    "sleepQuality": 8.6,
    "recoveryScore": 8.6,
    "fatigueLevel": 2.6,
    "deepSleep": 23.6,
    "remSleep": 24.6,
    "spO2": 95.8,
    "respiratoryRate": 12.9,
    "bodyTemperature": 36.9
  },
  {
    "date": "2025-09-06",
    "restingHeartRate": 50,
    "heartRateVariability": 7.36,
    "sleepQuality": 8.6,
    "recoveryScore": 8.6,
    "fatigueLevel": 2.6,
    "deepSleep": 23.5,
    "remSleep": 24.5,
    "spO2": 95.8,
    "respiratoryRate": 12.8,
    "bodyTemperature": 36.9
  }
];

async function seedAthlete12Data() {
  console.log('🌱 Starting to seed biometric data for Athlete 12 (Pieter Van Wyk)...');

  for (const record of athlete12Data) {
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
      const response = await axios.post(`${API_BASE_URL}/athletes/12/biometric-data`, payload);

      if (response.status === 200 || response.status === 201) {
        console.log(`✅ Successfully inserted data for ${record.date}`);
      }
    } catch (error) {
      console.error(`❌ Failed to insert data for ${record.date}:`, error.response?.data || error.message);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('🎉 Finished seeding biometric data for Athlete 12!');
}

seedAthlete12Data().catch(console.error);
