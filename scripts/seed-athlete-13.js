import axios from 'axios';

// API configuration
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:5288/api';

// Athlete 13 (Ruan Botha) - Biometric data
const athlete13Data = [
  {
    "date": "2025-08-31",
    "restingHeartRate": 58,
    "heartRateVariability": 6.9,
    "sleepQuality": 8.7,
    "recoveryScore": 8,
    "fatigueLevel": 3.4,
    "deepSleep": 15.9,
    "remSleep": 22,
    "spO2": 96.6,
    "respiratoryRate": 15.7,
    "bodyTemperature": 37.1
  },
  {
    "date": "2025-09-01",
    "restingHeartRate": 59,
    "heartRateVariability": 7,
    "sleepQuality": 8.8,
    "recoveryScore": 8.1,
    "fatigueLevel": 3.4,
    "deepSleep": 16.2,
    "remSleep": 22.2,
    "spO2": 96.7,
    "respiratoryRate": 15.8,
    "bodyTemperature": 37.1
  },
  {
    "date": "2025-09-02",
    "restingHeartRate": 57,
    "heartRateVariability": 6.7,
    "sleepQuality": 8.5,
    "recoveryScore": 7.9,
    "fatigueLevel": 3.3,
    "deepSleep": 15.3,
    "remSleep": 21.6,
    "spO2": 96.4,
    "respiratoryRate": 15.5,
    "bodyTemperature": 37
  },
  {
    "date": "2025-09-03",
    "restingHeartRate": 57,
    "heartRateVariability": 6.66,
    "sleepQuality": 8.4,
    "recoveryScore": 7.9,
    "fatigueLevel": 3.3,
    "deepSleep": 15.2,
    "remSleep": 21.5,
    "spO2": 96.4,
    "respiratoryRate": 15.4,
    "bodyTemperature": 37
  },
  {
    "date": "2025-09-04",
    "restingHeartRate": 58,
    "heartRateVariability": 6.78,
    "sleepQuality": 8.6,
    "recoveryScore": 7.9,
    "fatigueLevel": 3.3,
    "deepSleep": 15.6,
    "remSleep": 21.8,
    "spO2": 96.5,
    "respiratoryRate": 15.6,
    "bodyTemperature": 37
  },
  {
    "date": "2025-09-05",
    "restingHeartRate": 59,
    "heartRateVariability": 6.99,
    "sleepQuality": 8.8,
    "recoveryScore": 8.1,
    "fatigueLevel": 3.4,
    "deepSleep": 16.2,
    "remSleep": 22.2,
    "spO2": 96.7,
    "respiratoryRate": 15.8,
    "bodyTemperature": 37.1
  },
  {
    "date": "2025-09-06",
    "restingHeartRate": 58,
    "heartRateVariability": 6.86,
    "sleepQuality": 8.6,
    "recoveryScore": 8,
    "fatigueLevel": 3.4,
    "deepSleep": 15.8,
    "remSleep": 21.9,
    "spO2": 96.6,
    "respiratoryRate": 15.6,
    "bodyTemperature": 37
  }
];

async function seedAthlete13Data() {
  console.log('🌱 Starting to seed biometric data for Athlete 13 (Ruan Botha)...');

  for (const record of athlete13Data) {
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
      const response = await axios.post(`${API_BASE_URL}/athletes/13/biometric-data`, payload);

      if (response.status === 200 || response.status === 201) {
        console.log(`✅ Successfully inserted data for ${record.date}`);
      }
    } catch (error) {
      console.error(`❌ Failed to insert data for ${record.date}:`, error.response?.data || error.message);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('🎉 Finished seeding biometric data for Athlete 13!');
}

seedAthlete13Data().catch(console.error);
