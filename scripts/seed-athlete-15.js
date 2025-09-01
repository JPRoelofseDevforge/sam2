import axios from 'axios';

// API configuration
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:5288/api';

// Athlete 15 (Hennie Van Niekerk) - Biometric data
const athlete15Data = [
  {
    "date": "2025-08-31",
    "restingHeartRate": 63,
    "heartRateVariability": 7.63,
    "sleepQuality": 6.9,
    "recoveryScore": 7.1,
    "fatigueLevel": 4.8,
    "deepSleep": 17.1,
    "remSleep": 24.6,
    "spO2": 97.9,
    "respiratoryRate": 17.8,
    "bodyTemperature": 36.7
  },
  {
    "date": "2025-09-01",
    "restingHeartRate": 64,
    "heartRateVariability": 7.88,
    "sleepQuality": 7.2,
    "recoveryScore": 7.2,
    "fatigueLevel": 5,
    "deepSleep": 17.9,
    "remSleep": 25.1,
    "spO2": 98.1,
    "respiratoryRate": 18,
    "bodyTemperature": 36.8
  },
  {
    "date": "2025-09-02",
    "restingHeartRate": 63,
    "heartRateVariability": 7.64,
    "sleepQuality": 6.9,
    "recoveryScore": 7.1,
    "fatigueLevel": 4.9,
    "deepSleep": 17.2,
    "remSleep": 24.7,
    "spO2": 97.9,
    "respiratoryRate": 17.8,
    "bodyTemperature": 36.7
  },
  {
    "date": "2025-09-03",
    "restingHeartRate": 65,
    "heartRateVariability": 7.98,
    "sleepQuality": 7.3,
    "recoveryScore": 7.2,
    "fatigueLevel": 5,
    "deepSleep": 18.2,
    "remSleep": 25.3,
    "spO2": 98.2,
    "respiratoryRate": 18.1,
    "bodyTemperature": 36.8
  },
  {
    "date": "2025-09-04",
    "restingHeartRate": 64,
    "heartRateVariability": 7.81,
    "sleepQuality": 7.1,
    "recoveryScore": 7.1,
    "fatigueLevel": 4.9,
    "deepSleep": 17.7,
    "remSleep": 25,
    "spO2": 98,
    "respiratoryRate": 18,
    "bodyTemperature": 36.8
  },
  {
    "date": "2025-09-05",
    "restingHeartRate": 64,
    "heartRateVariability": 7.9,
    "sleepQuality": 7.2,
    "recoveryScore": 7.2,
    "fatigueLevel": 5,
    "deepSleep": 18,
    "remSleep": 25.2,
    "spO2": 98.1,
    "respiratoryRate": 18.1,
    "bodyTemperature": 36.8
  },
  {
    "date": "2025-09-06",
    "restingHeartRate": 63,
    "heartRateVariability": 7.7,
    "sleepQuality": 7,
    "recoveryScore": 7.1,
    "fatigueLevel": 4.9,
    "deepSleep": 17.4,
    "remSleep": 24.8,
    "spO2": 97.9,
    "respiratoryRate": 17.9,
    "bodyTemperature": 36.8
  }
];

async function seedAthlete15Data() {
  console.log('🌱 Starting to seed biometric data for Athlete 15 (Hennie Van Niekerk)...');

  for (const record of athlete15Data) {
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
      const response = await axios.post(`${API_BASE_URL}/athletes/15/biometric-data`, payload);

      if (response.status === 200 || response.status === 201) {
        console.log(`✅ Successfully inserted data for ${record.date}`);
      }
    } catch (error) {
      console.error(`❌ Failed to insert data for ${record.date}:`, error.response?.data || error.message);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('🎉 Finished seeding biometric data for Athlete 15!');
}

seedAthlete15Data().catch(console.error);
