import axios from 'axios';

// API configuration
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:5288/api';

// Athlete 11 (Andre Van Der Westhuizen) - Biometric data
const athlete11Data = [
  {
    "date": "2025-08-31",
    "restingHeartRate": 58,
    "heartRateVariability": 6.13,
    "sleepQuality": 7.1,
    "recoveryScore": 8.1,
    "fatigueLevel": 2.3,
    "deepSleep": 19.1,
    "remSleep": 22.8,
    "spO2": 96.1,
    "respiratoryRate": 13.8,
    "bodyTemperature": 37
  },
  {
    "date": "2025-09-01",
    "restingHeartRate": 57,
    "heartRateVariability": 6.04,
    "sleepQuality": 7,
    "recoveryScore": 8.1,
    "fatigueLevel": 2.2,
    "deepSleep": 18.8,
    "remSleep": 22.6,
    "spO2": 96,
    "respiratoryRate": 13.7,
    "bodyTemperature": 36.9
  },
  {
    "date": "2025-09-02",
    "restingHeartRate": 57,
    "heartRateVariability": 5.92,
    "sleepQuality": 6.9,
    "recoveryScore": 8,
    "fatigueLevel": 2.2,
    "deepSleep": 18.5,
    "remSleep": 22.4,
    "spO2": 95.9,
    "respiratoryRate": 13.6,
    "bodyTemperature": 36.9
  },
  {
    "date": "2025-09-03",
    "restingHeartRate": 57,
    "heartRateVariability": 6.07,
    "sleepQuality": 7.1,
    "recoveryScore": 8.1,
    "fatigueLevel": 2.2,
    "deepSleep": 18.9,
    "remSleep": 22.7,
    "spO2": 96,
    "respiratoryRate": 13.8,
    "bodyTemperature": 37
  },
  {
    "date": "2025-09-04",
    "restingHeartRate": 57,
    "heartRateVariability": 6.06,
    "sleepQuality": 7.1,
    "recoveryScore": 8.1,
    "fatigueLevel": 2.2,
    "deepSleep": 18.9,
    "remSleep": 22.7,
    "spO2": 96,
    "respiratoryRate": 13.7,
    "bodyTemperature": 37
  },
  {
    "date": "2025-09-05",
    "restingHeartRate": 57,
    "heartRateVariability": 5.95,
    "sleepQuality": 7,
    "recoveryScore": 8,
    "fatigueLevel": 2.2,
    "deepSleep": 18.6,
    "remSleep": 22.4,
    "spO2": 95.9,
    "respiratoryRate": 13.6,
    "bodyTemperature": 36.9
  },
  {
    "date": "2025-09-06",
    "restingHeartRate": 56,
    "heartRateVariability": 5.91,
    "sleepQuality": 6.9,
    "recoveryScore": 8,
    "fatigueLevel": 2.2,
    "deepSleep": 18.4,
    "remSleep": 22.4,
    "spO2": 95.9,
    "respiratoryRate": 13.6,
    "bodyTemperature": 36.9
  }
];

async function seedAthlete11Data() {
  console.log('🌱 Starting to seed biometric data for Athlete 11 (Andre Van Der Westhuizen)...');

  for (const record of athlete11Data) {
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
      const response = await axios.post(`${API_BASE_URL}/athletes/11/biometric-data`, payload);

      if (response.status === 200 || response.status === 201) {
        console.log(`✅ Successfully inserted data for ${record.date}`);
      }
    } catch (error) {
      console.error(`❌ Failed to insert data for ${record.date}:`, error.response?.data || error.message);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('🎉 Finished seeding biometric data for Athlete 11!');
}

seedAthlete11Data().catch(console.error);
