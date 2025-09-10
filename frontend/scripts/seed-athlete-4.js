import axios from 'axios';

// API configuration
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:5288/api';

// Athlete 4 (Juanre De Klerk) - Biometric data
const athlete4Data = [
  {
    "date": "2025-08-31",
    "restingHeartRate": 64,
    "heartRateVariability": 6.31,
    "sleepQuality": 9,
    "recoveryScore": 7.3,
    "fatigueLevel": 4,
    "deepSleep": 17.9,
    "remSleep": 18.4,
    "spO2": 97.6,
    "respiratoryRate": 14.5,
    "bodyTemperature": 37.2
  },
  {
    "date": "2025-09-01",
    "restingHeartRate": 64,
    "heartRateVariability": 6.31,
    "sleepQuality": 9,
    "recoveryScore": 7.3,
    "fatigueLevel": 4,
    "deepSleep": 17.9,
    "remSleep": 18.4,
    "spO2": 97.6,
    "respiratoryRate": 14.5,
    "bodyTemperature": 37.2
  },
  {
    "date": "2025-09-02",
    "restingHeartRate": 64,
    "heartRateVariability": 6.17,
    "sleepQuality": 8.8,
    "recoveryScore": 7.3,
    "fatigueLevel": 4,
    "deepSleep": 17.5,
    "remSleep": 18.2,
    "spO2": 97.5,
    "respiratoryRate": 14.3,
    "bodyTemperature": 37.2
  },
  {
    "date": "2025-09-03",
    "restingHeartRate": 64,
    "heartRateVariability": 6.27,
    "sleepQuality": 8.9,
    "recoveryScore": 7.3,
    "fatigueLevel": 4,
    "deepSleep": 17.7,
    "remSleep": 18.3,
    "spO2": 97.6,
    "respiratoryRate": 14.4,
    "bodyTemperature": 37.2
  },
  {
    "date": "2025-09-04",
    "restingHeartRate": 63,
    "heartRateVariability": 6.13,
    "sleepQuality": 8.8,
    "recoveryScore": 7.2,
    "fatigueLevel": 4,
    "deepSleep": 17.3,
    "remSleep": 18.1,
    "spO2": 97.5,
    "respiratoryRate": 14.3,
    "bodyTemperature": 37.2
  },
  {
    "date": "2025-09-05",
    "restingHeartRate": 64,
    "heartRateVariability": 6.32,
    "sleepQuality": 9,
    "recoveryScore": 7.3,
    "fatigueLevel": 4,
    "deepSleep": 17.9,
    "remSleep": 18.4,
    "spO2": 97.6,
    "respiratoryRate": 14.5,
    "bodyTemperature": 37.2
  },
  {
    "date": "2025-09-06",
    "restingHeartRate": 63,
    "heartRateVariability": 6.11,
    "sleepQuality": 8.8,
    "recoveryScore": 7.2,
    "fatigueLevel": 3.9,
    "deepSleep": 17.3,
    "remSleep": 18,
    "spO2": 97.4,
    "respiratoryRate": 14.3,
    "bodyTemperature": 37.1
  }
];

async function seedAthlete4Data() {
  console.log('🌱 Starting to seed biometric data for Athlete 4 (Juanre De Klerk)...');

  for (const record of athlete4Data) {
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
      const response = await axios.post(`${API_BASE_URL}/athletes/4/biometric-data`, payload);

      if (response.status === 200 || response.status === 201) {
        console.log(`✅ Successfully inserted data for ${record.date}`);
      }
    } catch (error) {
      console.error(`❌ Failed to insert data for ${record.date}:`, error.response?.data || error.message);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('🎉 Finished seeding biometric data for Athlete 4!');
}

seedAthlete4Data().catch(console.error);
