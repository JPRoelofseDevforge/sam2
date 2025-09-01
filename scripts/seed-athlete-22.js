import axios from 'axios';

// API configuration
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:5288/api';

// Athlete 22 (Jan-Hendrik Van Der Berg) - Biometric data
const athlete22Data = [
  {
    "date": "2025-08-31",
    "restingHeartRate": 54,
    "heartRateVariability": 5.79,
    "sleepQuality": 8.6,
    "recoveryScore": 8.9,
    "fatigueLevel": 4.9,
    "deepSleep": 16.6,
    "remSleep": 23.5,
    "spO2": 97.6,
    "respiratoryRate": 12.4,
    "bodyTemperature": 37.2
  },
  {
    "date": "2025-09-01",
    "restingHeartRate": 54,
    "heartRateVariability": 5.87,
    "sleepQuality": 8.7,
    "recoveryScore": 9,
    "fatigueLevel": 4.9,
    "deepSleep": 16.8,
    "remSleep": 23.6,
    "spO2": 97.6,
    "respiratoryRate": 12.5,
    "bodyTemperature": 37.2
  },
  {
    "date": "2025-09-02",
    "restingHeartRate": 53,
    "heartRateVariability": 5.65,
    "sleepQuality": 8.4,
    "recoveryScore": 8.8,
    "fatigueLevel": 4.8,
    "deepSleep": 16.2,
    "remSleep": 23.2,
    "spO2": 97.4,
    "respiratoryRate": 12.2,
    "bodyTemperature": 37.1
  },
  {
    "date": "2025-09-03",
    "restingHeartRate": 55,
    "heartRateVariability": 5.95,
    "sleepQuality": 8.7,
    "recoveryScore": 9,
    "fatigueLevel": 5,
    "deepSleep": 17,
    "remSleep": 23.8,
    "spO2": 97.7,
    "respiratoryRate": 12.5,
    "bodyTemperature": 37.2
  },
  {
    "date": "2025-09-04",
    "restingHeartRate": 54,
    "heartRateVariability": 5.87,
    "sleepQuality": 8.7,
    "recoveryScore": 9,
    "fatigueLevel": 4.9,
    "deepSleep": 16.8,
    "remSleep": 23.6,
    "spO2": 97.6,
    "respiratoryRate": 12.5,
    "bodyTemperature": 37.2
  },
  {
    "date": "2025-09-05",
    "restingHeartRate": 54,
    "heartRateVariability": 5.72,
    "sleepQuality": 8.5,
    "recoveryScore": 8.9,
    "fatigueLevel": 4.9,
    "deepSleep": 16.4,
    "remSleep": 23.3,
    "spO2": 97.5,
    "respiratoryRate": 12.3,
    "bodyTemperature": 37.2
  },
  {
    "date": "2025-09-06",
    "restingHeartRate": 53,
    "heartRateVariability": 5.6,
    "sleepQuality": 8.4,
    "recoveryScore": 8.8,
    "fatigueLevel": 4.8,
    "deepSleep": 16,
    "remSleep": 23.1,
    "spO2": 97.4,
    "respiratoryRate": 12.2,
    "bodyTemperature": 37.1
  }
];

async function seedAthlete22Data() {
  console.log('🌱 Starting to seed biometric data for Athlete 22 (Jan-Hendrik Van Der Berg)...');

  for (const record of athlete22Data) {
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
      const response = await axios.post(`${API_BASE_URL}/athletes/22/biometric-data`, payload);

      if (response.status === 200 || response.status === 201) {
        console.log(`✅ Successfully inserted data for ${record.date}`);
      }
    } catch (error) {
      console.error(`❌ Failed to insert data for ${record.date}:`, error.response?.data || error.message);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('🎉 Finished seeding biometric data for Athlete 22!');
}

seedAthlete22Data().catch(console.error);
