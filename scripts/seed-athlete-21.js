import axios from 'axios';

// API configuration
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:5288/api';

// Athlete 21 (Frik Fourie) - Biometric data
const athlete21Data = [
  {
    "date": "2025-08-31",
    "restingHeartRate": 59,
    "heartRateVariability": 5.71,
    "sleepQuality": 8,
    "recoveryScore": 8.3,
    "fatigueLevel": 2.1,
    "deepSleep": 22.7,
    "remSleep": 24.2,
    "spO2": 98.2,
    "respiratoryRate": 15,
    "bodyTemperature": 36.9
  },
  {
    "date": "2025-09-01",
    "restingHeartRate": 58,
    "heartRateVariability": 5.63,
    "sleepQuality": 7.9,
    "recoveryScore": 8.3,
    "fatigueLevel": 2.1,
    "deepSleep": 22.4,
    "remSleep": 24,
    "spO2": 98.2,
    "respiratoryRate": 15,
    "bodyTemperature": 36.8
  },
  {
    "date": "2025-09-02",
    "restingHeartRate": 60,
    "heartRateVariability": 5.93,
    "sleepQuality": 8.2,
    "recoveryScore": 8.4,
    "fatigueLevel": 2.2,
    "deepSleep": 23.3,
    "remSleep": 24.6,
    "spO2": 98.5,
    "respiratoryRate": 15.3,
    "bodyTemperature": 36.9
  },
  {
    "date": "2025-09-03",
    "restingHeartRate": 58,
    "heartRateVariability": 5.59,
    "sleepQuality": 7.9,
    "recoveryScore": 8.3,
    "fatigueLevel": 2,
    "deepSleep": 22.3,
    "remSleep": 23.9,
    "spO2": 98.1,
    "respiratoryRate": 14.9,
    "bodyTemperature": 36.8
  },
  {
    "date": "2025-09-04",
    "restingHeartRate": 59,
    "heartRateVariability": 5.68,
    "sleepQuality": 8,
    "recoveryScore": 8.3,
    "fatigueLevel": 2.1,
    "deepSleep": 22.6,
    "remSleep": 24.1,
    "spO2": 98.2,
    "respiratoryRate": 15,
    "bodyTemperature": 36.9
  },
  {
    "date": "2025-09-05",
    "restingHeartRate": 60,
    "heartRateVariability": 5.92,
    "sleepQuality": 8.2,
    "recoveryScore": 8.4,
    "fatigueLevel": 2.2,
    "deepSleep": 23.3,
    "remSleep": 24.6,
    "spO2": 98.5,
    "respiratoryRate": 15.3,
    "bodyTemperature": 36.9
  },
  {
    "date": "2025-09-06",
    "restingHeartRate": 59,
    "heartRateVariability": 5.69,
    "sleepQuality": 8,
    "recoveryScore": 8.3,
    "fatigueLevel": 2.1,
    "deepSleep": 22.6,
    "remSleep": 24.1,
    "spO2": 98.2,
    "respiratoryRate": 15,
    "bodyTemperature": 36.9
  }
];

async function seedAthlete21Data() {
  console.log('🌱 Starting to seed biometric data for Athlete 21 (Frik Fourie)...');

  for (const record of athlete21Data) {
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
      const response = await axios.post(`${API_BASE_URL}/athletes/21/biometric-data`, payload);

      if (response.status === 200 || response.status === 201) {
        console.log(`✅ Successfully inserted data for ${record.date}`);
      }
    } catch (error) {
      console.error(`❌ Failed to insert data for ${record.date}:`, error.response?.data || error.message);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('🎉 Finished seeding biometric data for Athlete 21!');
}

seedAthlete21Data().catch(console.error);
