import axios from 'axios';

// API configuration
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:5288/api';

// Athlete 7 (Wian Van Der Merwe) - Biometric data
const athlete7Data = [
  {
    "date": "2025-08-31",
    "restingHeartRate": 52,
    "heartRateVariability": 7.34,
    "sleepQuality": 7.8,
    "recoveryScore": 7.7,
    "fatigueLevel": 4,
    "deepSleep": 20.5,
    "remSleep": 18.7,
    "spO2": 96.3,
    "respiratoryRate": 16.7,
    "bodyTemperature": 37.1
  },
  {
    "date": "2025-09-01",
    "restingHeartRate": 52,
    "heartRateVariability": 7.35,
    "sleepQuality": 7.8,
    "recoveryScore": 7.7,
    "fatigueLevel": 4,
    "deepSleep": 20.5,
    "remSleep": 18.7,
    "spO2": 96.4,
    "respiratoryRate": 16.7,
    "bodyTemperature": 37.1
  },
  {
    "date": "2025-09-02",
    "restingHeartRate": 53,
    "heartRateVariability": 7.44,
    "sleepQuality": 7.9,
    "recoveryScore": 7.7,
    "fatigueLevel": 4,
    "deepSleep": 20.8,
    "remSleep": 18.9,
    "spO2": 96.4,
    "respiratoryRate": 16.8,
    "bodyTemperature": 37.1
  },
  {
    "date": "2025-09-03",
    "restingHeartRate": 52,
    "heartRateVariability": 7.34,
    "sleepQuality": 7.8,
    "recoveryScore": 7.7,
    "fatigueLevel": 4,
    "deepSleep": 20.5,
    "remSleep": 18.7,
    "spO2": 96.3,
    "respiratoryRate": 16.7,
    "bodyTemperature": 37.1
  },
  {
    "date": "2025-09-04",
    "restingHeartRate": 52,
    "heartRateVariability": 7.32,
    "sleepQuality": 7.7,
    "recoveryScore": 7.7,
    "fatigueLevel": 4,
    "deepSleep": 20.4,
    "remSleep": 18.6,
    "spO2": 96.3,
    "respiratoryRate": 16.7,
    "bodyTemperature": 37.1
  },
  {
    "date": "2025-09-05",
    "restingHeartRate": 53,
    "heartRateVariability": 7.4,
    "sleepQuality": 7.8,
    "recoveryScore": 7.7,
    "fatigueLevel": 4,
    "deepSleep": 20.7,
    "remSleep": 18.8,
    "spO2": 96.4,
    "respiratoryRate": 16.8,
    "bodyTemperature": 37.1
  },
  {
    "date": "2025-09-06",
    "restingHeartRate": 52,
    "heartRateVariability": 7.25,
    "sleepQuality": 7.7,
    "recoveryScore": 7.6,
    "fatigueLevel": 4,
    "deepSleep": 20.3,
    "remSleep": 18.5,
    "spO2": 96.3,
    "respiratoryRate": 16.6,
    "bodyTemperature": 37.1
  }
];

async function seedAthlete7Data() {
  console.log('🌱 Starting to seed biometric data for Athlete 7 (Wian Van Der Merwe)...');

  for (const record of athlete7Data) {
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
      const response = await axios.post(`${API_BASE_URL}/athletes/7/biometric-data`, payload);

      if (response.status === 200 || response.status === 201) {
        console.log(`✅ Successfully inserted data for ${record.date}`);
      }
    } catch (error) {
      console.error(`❌ Failed to insert data for ${record.date}:`, error.response?.data || error.message);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('🎉 Finished seeding biometric data for Athlete 7!');
}

seedAthlete7Data().catch(console.error);
