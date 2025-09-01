import axios from 'axios';

// API configuration
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:5288/api';

// Athlete 20 (Sarel Pretorius) - Biometric data
const athlete20Data = [
  {
    "date": "2025-08-31",
    "restingHeartRate": 61,
    "heartRateVariability": 5.53,
    "sleepQuality": 8.6,
    "recoveryScore": 7.6,
    "fatigueLevel": 4.8,
    "deepSleep": 17.8,
    "remSleep": 18.7,
    "spO2": 97.4,
    "respiratoryRate": 12.8,
    "bodyTemperature": 36.5
  },
  {
    "date": "2025-09-01",
    "restingHeartRate": 62,
    "heartRateVariability": 5.59,
    "sleepQuality": 8.7,
    "recoveryScore": 7.6,
    "fatigueLevel": 4.8,
    "deepSleep": 18,
    "remSleep": 18.9,
    "spO2": 97.5,
    "respiratoryRate": 12.9,
    "bodyTemperature": 36.5
  },
  {
    "date": "2025-09-02",
    "restingHeartRate": 63,
    "heartRateVariability": 5.81,
    "sleepQuality": 8.9,
    "recoveryScore": 7.7,
    "fatigueLevel": 4.9,
    "deepSleep": 18.7,
    "remSleep": 19.3,
    "spO2": 97.7,
    "respiratoryRate": 13.1,
    "bodyTemperature": 36.6
  },
  {
    "date": "2025-09-03",
    "restingHeartRate": 61,
    "heartRateVariability": 5.51,
    "sleepQuality": 8.6,
    "recoveryScore": 7.6,
    "fatigueLevel": 4.8,
    "deepSleep": 17.8,
    "remSleep": 18.7,
    "spO2": 97.4,
    "respiratoryRate": 12.8,
    "bodyTemperature": 36.5
  },
  {
    "date": "2025-09-04",
    "restingHeartRate": 62,
    "heartRateVariability": 5.57,
    "sleepQuality": 8.6,
    "recoveryScore": 7.6,
    "fatigueLevel": 4.8,
    "deepSleep": 18,
    "remSleep": 18.8,
    "spO2": 97.5,
    "respiratoryRate": 12.9,
    "bodyTemperature": 36.5
  },
  {
    "date": "2025-09-05",
    "restingHeartRate": 61,
    "heartRateVariability": 5.49,
    "sleepQuality": 8.6,
    "recoveryScore": 7.5,
    "fatigueLevel": 4.8,
    "deepSleep": 17.7,
    "remSleep": 18.7,
    "spO2": 97.4,
    "respiratoryRate": 12.8,
    "bodyTemperature": 36.5
  },
  {
    "date": "2025-09-06",
    "restingHeartRate": 62,
    "heartRateVariability": 5.72,
    "sleepQuality": 8.8,
    "recoveryScore": 7.7,
    "fatigueLevel": 4.9,
    "deepSleep": 18.4,
    "remSleep": 19.1,
    "spO2": 97.6,
    "respiratoryRate": 13,
    "bodyTemperature": 36.6
  }
];

async function seedAthlete20Data() {
  console.log('🌱 Starting to seed biometric data for Athlete 20 (Sarel Pretorius)...');

  for (const record of athlete20Data) {
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
      const response = await axios.post(`${API_BASE_URL}/athletes/20/biometric-data`, payload);

      if (response.status === 200 || response.status === 201) {
        console.log(`✅ Successfully inserted data for ${record.date}`);
      }
    } catch (error) {
      console.error(`❌ Failed to insert data for ${record.date}:`, error.response?.data || error.message);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('🎉 Finished seeding biometric data for Athlete 20!');
}

seedAthlete20Data().catch(console.error);
