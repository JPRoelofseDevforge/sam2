import axios from 'axios';

// API configuration
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:5288/api';

// Athlete 10 (Jaco Pretorius) - Biometric data
const athlete10Data = [
  {
    "date": "2025-08-31",
    "restingHeartRate": 56,
    "heartRateVariability": 7.53,
    "sleepQuality": 8.2,
    "recoveryScore": 7.1,
    "fatigueLevel": 3.6,
    "deepSleep": 21.4,
    "remSleep": 18.9,
    "spO2": 98.1,
    "respiratoryRate": 17.6,
    "bodyTemperature": 36.8
  },
  {
    "date": "2025-09-01",
    "restingHeartRate": 56,
    "heartRateVariability": 7.51,
    "sleepQuality": 8.2,
    "recoveryScore": 7.1,
    "fatigueLevel": 3.6,
    "deepSleep": 21.3,
    "remSleep": 18.9,
    "spO2": 98.1,
    "respiratoryRate": 17.6,
    "bodyTemperature": 36.8
  },
  {
    "date": "2025-09-02",
    "restingHeartRate": 55,
    "heartRateVariability": 7.32,
    "sleepQuality": 8,
    "recoveryScore": 7,
    "fatigueLevel": 3.5,
    "deepSleep": 20.8,
    "remSleep": 18.5,
    "spO2": 97.9,
    "respiratoryRate": 17.4,
    "bodyTemperature": 36.7
  },
  {
    "date": "2025-09-03",
    "restingHeartRate": 55,
    "heartRateVariability": 7.42,
    "sleepQuality": 8.1,
    "recoveryScore": 7,
    "fatigueLevel": 3.6,
    "deepSleep": 21.1,
    "remSleep": 18.7,
    "spO2": 98,
    "respiratoryRate": 17.5,
    "bodyTemperature": 36.8
  },
  {
    "date": "2025-09-04",
    "restingHeartRate": 54,
    "heartRateVariability": 7.29,
    "sleepQuality": 7.9,
    "recoveryScore": 7,
    "fatigueLevel": 3.5,
    "deepSleep": 20.7,
    "remSleep": 18.4,
    "spO2": 97.9,
    "respiratoryRate": 17.3,
    "bodyTemperature": 36.7
  },
  {
    "date": "2025-09-05",
    "restingHeartRate": 55,
    "heartRateVariability": 7.46,
    "sleepQuality": 8.1,
    "recoveryScore": 7,
    "fatigueLevel": 3.6,
    "deepSleep": 21.2,
    "remSleep": 18.8,
    "spO2": 98.1,
    "respiratoryRate": 17.5,
    "bodyTemperature": 36.8
  },
  {
    "date": "2025-09-06",
    "restingHeartRate": 54,
    "heartRateVariability": 7.26,
    "sleepQuality": 7.9,
    "recoveryScore": 6.9,
    "fatigueLevel": 3.5,
    "deepSleep": 20.6,
    "remSleep": 18.4,
    "spO2": 97.9,
    "respiratoryRate": 17.3,
    "bodyTemperature": 36.7
  }
];

async function seedAthlete10Data() {
  console.log('🌱 Starting to seed biometric data for Athlete 10 (Jaco Pretorius)...');

  for (const record of athlete10Data) {
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
      const response = await axios.post(`${API_BASE_URL}/athletes/10/biometric-data`, payload);

      if (response.status === 200 || response.status === 201) {
        console.log(`✅ Successfully inserted data for ${record.date}`);
      }
    } catch (error) {
      console.error(`❌ Failed to insert data for ${record.date}:`, error.response?.data || error.message);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('🎉 Finished seeding biometric data for Athlete 10!');
}

seedAthlete10Data().catch(console.error);
