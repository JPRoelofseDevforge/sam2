import axios from 'axios';

// API configuration
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:5288/api';

// Athlete 3 biometric data for 7 days (from the SQL script)
const athlete3Data = [
  {
    date: '2025-08-31',
    restingHeartRate: 55,
    heartRateVariability: 7.21,
    sleepQuality: 7.5,
    recoveryScore: 8.8,
    fatigueLevel: 2.0
  },
  {
    date: '2025-09-01',
    restingHeartRate: 58,
    heartRateVariability: 6.85,
    sleepQuality: 7.0,
    recoveryScore: 8.2,
    fatigueLevel: 2.8
  },
  {
    date: '2025-09-02',
    restingHeartRate: 56,
    heartRateVariability: 7.05,
    sleepQuality: 7.3,
    recoveryScore: 8.5,
    fatigueLevel: 2.5
  },
  {
    date: '2025-09-03',
    restingHeartRate: 59,
    heartRateVariability: 6.72,
    sleepQuality: 6.8,
    recoveryScore: 7.8,
    fatigueLevel: 3.2
  },
  {
    date: '2025-09-04',
    restingHeartRate: 57,
    heartRateVariability: 6.95,
    sleepQuality: 7.2,
    recoveryScore: 8.3,
    fatigueLevel: 2.7
  },
  {
    date: '2025-09-05',
    restingHeartRate: 60,
    heartRateVariability: 6.58,
    sleepQuality: 6.5,
    recoveryScore: 7.5,
    fatigueLevel: 3.5
  },
  {
    date: '2025-09-06',
    restingHeartRate: 56,
    heartRateVariability: 7.15,
    sleepQuality: 7.4,
    recoveryScore: 8.6,
    fatigueLevel: 2.3
  }
];

async function seedAthlete3Data() {
  console.log('🌱 Starting to seed biometric data for Athlete 3...');

  for (const record of athlete3Data) {
    try {
      const payload = {
        date: record.date + 'T00:00:00Z',
        hrv_night: record.heartRateVariability * 10, // Convert to ms
        resting_hr: record.restingHeartRate,
        sleep_duration_h: record.sleepQuality,
        training_load_pct: record.fatigueLevel * 10, // Convert to percentage
        spo2_night: 96 + Math.random() * 3, // Random SpO2 between 96-99
        resp_rate_night: 14 + Math.random() * 4, // Random resp rate
        deep_sleep_pct: 18 + Math.random() * 10, // Random deep sleep %
        rem_sleep_pct: 18 + Math.random() * 6, // Random REM sleep %
        light_sleep_pct: 50 + Math.random() * 20, // Random light sleep %
        temp_trend_c: 36.5 + Math.random() * 0.5 // Random body temp
      };

      console.log(`📤 Inserting data for ${record.date}...`);
      const response = await axios.post(`${API_BASE_URL}/athletes/3/biometric-data`, payload);

      if (response.status === 200 || response.status === 201) {
        console.log(`✅ Successfully inserted data for ${record.date}`);
      }
    } catch (error) {
      console.error(`❌ Failed to insert data for ${record.date}:`, error.response?.data || error.message);
    }

    // Small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('🎉 Finished seeding biometric data for Athlete 3!');
  console.log('🔄 Refresh the athlete profile page to see the updated charts.');
}

seedAthlete3Data().catch(console.error);