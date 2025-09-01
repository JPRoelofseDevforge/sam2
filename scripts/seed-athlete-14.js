import axios from 'axios';

// API configuration
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:5288/api';

// Athlete 14 (Jacques Du Plessis) - Biometric data
const athlete14Data = [
  {
    "date": "2025-08-31",
    "restingHeartRate": 64,
    "heartRateVariability": 5.95,
    "sleepQuality": 6.6,
    "recoveryScore": 8.8,
    "fatigueLevel": 3.2,
    "deepSleep": 16.1,
    "remSleep": 22.3,
    "spO2": 95.5,
    "respiratoryRate": 16.3,
    "bodyTemperature": 36.9
  },
  {
    "date": "2025-09-01",
    "restingHeartRate": 64,
    "heartRateVariability": 5.9,
    "sleepQuality": 6.5,
    "recoveryScore": 8.8,
    "fatigueLevel": 3.2,
    "deepSleep": 15.9,
    "remSleep": 22.2,
    "spO2": 95.5,
    "respiratoryRate": 16.2,
    "bodyTemperature": 36.9
  },
  {
    "date": "2025-09-02",
    "restingHeartRate": 64,
    "heartRateVariability": 5.91,
    "sleepQuality": 6.5,
    "recoveryScore": 8.8,
    "fatigueLevel": 3.2,
    "deepSleep": 16,
    "remSleep": 22.2,
    "spO2": 95.5,
    "respiratoryRate": 16.2,
    "bodyTemperature": 36.9
  },
  {
    "date": "2025-09-03",
    "restingHeartRate": 63,
    "heartRateVariability": 5.78,
    "sleepQuality": 6.4,
    "recoveryScore": 8.7,
    "fatigueLevel": 3.1,
    "deepSleep": 15.6,
    "remSleep": 21.9,
    "spO2": 95.3,
    "respiratoryRate": 16.1,
    "bodyTemperature": 36.8
  },
  {
    "date": "2025-09-04",
    "restingHeartRate": 64,
    "heartRateVariability": 5.96,
    "sleepQuality": 6.6,
    "recoveryScore": 8.8,
    "fatigueLevel": 3.2,
    "deepSleep": 16.1,
    "remSleep": 22.3,
    "spO2": 95.5,
    "respiratoryRate": 16.3,
    "bodyTemperature": 36.9
  },
  {
    "date": "2025-09-05",
    "restingHeartRate": 64,
    "heartRateVariability": 5.98,
    "sleepQuality": 6.6,
    "recoveryScore": 8.8,
    "fatigueLevel": 3.2,
    "deepSleep": 16.2,
    "remSleep": 22.3,
    "spO2": 95.6,
    "respiratoryRate": 16.3,
    "bodyTemperature": 36.9
  },
  {
    "date": "2025-09-06",
    "restingHeartRate": 64,
    "heartRateVariability": 6,
    "sleepQuality": 6.6,
    "recoveryScore": 8.8,
    "fatigueLevel": 3.2,
    "deepSleep": 16.2,
    "remSleep": 22.4,
    "spO2": 95.6,
    "respiratoryRate": 16.3,
    "bodyTemperature": 36.9
  }
];

async function seedAthlete14Data() {
  console.log('🌱 Starting to seed biometric data for Athlete 14 (Jacques Du Plessis)...');

  for (const record of athlete14Data) {
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
      const response = await axios.post(`${API_BASE_URL}/athletes/14/biometric-data`, payload);

      if (response.status === 200 || response.status === 201) {
        console.log(`✅ Successfully inserted data for ${record.date}`);
      }
    } catch (error) {
      console.error(`❌ Failed to insert data for ${record.date}:`, error.response?.data || error.message);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('🎉 Finished seeding biometric data for Athlete 14!');
}

seedAthlete14Data().catch(console.error);
