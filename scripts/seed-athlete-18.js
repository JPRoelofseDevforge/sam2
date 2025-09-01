import axios from 'axios';

// API configuration
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:5288/api';

// Athlete 18 (Lourens De Villiers) - Biometric data
const athlete18Data = [
  {
    "date": "2025-08-31",
    "restingHeartRate": 50,
    "heartRateVariability": 6.38,
    "sleepQuality": 6.9,
    "recoveryScore": 8.1,
    "fatigueLevel": 4.1,
    "deepSleep": 22.2,
    "remSleep": 23.3,
    "spO2": 95.1,
    "respiratoryRate": 17.1,
    "bodyTemperature": 36.3
  },
  {
    "date": "2025-09-01",
    "restingHeartRate": 50,
    "heartRateVariability": 6.38,
    "sleepQuality": 6.9,
    "recoveryScore": 8.1,
    "fatigueLevel": 4.2,
    "deepSleep": 22.2,
    "remSleep": 23.4,
    "spO2": 95.1,
    "respiratoryRate": 17.1,
    "bodyTemperature": 36.3
  },
  {
    "date": "2025-09-02",
    "restingHeartRate": 49,
    "heartRateVariability": 6.28,
    "sleepQuality": 6.8,
    "recoveryScore": 8,
    "fatigueLevel": 4.1,
    "deepSleep": 21.9,
    "remSleep": 23.1,
    "spO2": 95,
    "respiratoryRate": 17,
    "bodyTemperature": 36.3
  },
  {
    "date": "2025-09-03",
    "restingHeartRate": 49,
    "heartRateVariability": 6.28,
    "sleepQuality": 6.8,
    "recoveryScore": 8,
    "fatigueLevel": 4.1,
    "deepSleep": 21.9,
    "remSleep": 23.1,
    "spO2": 95,
    "respiratoryRate": 17,
    "bodyTemperature": 36.3
  },
  {
    "date": "2025-09-04",
    "restingHeartRate": 50,
    "heartRateVariability": 6.54,
    "sleepQuality": 7.1,
    "recoveryScore": 8.2,
    "fatigueLevel": 4.2,
    "deepSleep": 22.7,
    "remSleep": 23.7,
    "spO2": 95.3,
    "respiratoryRate": 17.3,
    "bodyTemperature": 36.3
  },
  {
    "date": "2025-09-05",
    "restingHeartRate": 49,
    "heartRateVariability": 6.24,
    "sleepQuality": 6.8,
    "recoveryScore": 8,
    "fatigueLevel": 4.1,
    "deepSleep": 21.8,
    "remSleep": 23.1,
    "spO2": 95,
    "respiratoryRate": 17,
    "bodyTemperature": 36.2
  },
  {
    "date": "2025-09-06",
    "restingHeartRate": 50,
    "heartRateVariability": 6.36,
    "sleepQuality": 6.9,
    "recoveryScore": 8.1,
    "fatigueLevel": 4.1,
    "deepSleep": 22.1,
    "remSleep": 23.3,
    "spO2": 95.1,
    "respiratoryRate": 17.1,
    "bodyTemperature": 36.3
  }
];

async function seedAthlete18Data() {
  console.log('🌱 Starting to seed biometric data for Athlete 18 (Lourens De Villiers)...');

  for (const record of athlete18Data) {
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
      const response = await axios.post(`${API_BASE_URL}/athletes/18/biometric-data`, payload);

      if (response.status === 200 || response.status === 201) {
        console.log(`✅ Successfully inserted data for ${record.date}`);
      }
    } catch (error) {
      console.error(`❌ Failed to insert data for ${record.date}:`, error.response?.data || error.message);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('🎉 Finished seeding biometric data for Athlete 18!');
}

seedAthlete18Data().catch(console.error);
