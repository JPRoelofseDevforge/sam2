import fs from 'fs';
import path from 'path';

// Template for athlete seeding script
const scriptTemplate = (athleteId, athleteName, data) => `import axios from 'axios';

// API configuration
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:5288/api';

// Athlete ${athleteId} (${athleteName}) - Biometric data
const athlete${athleteId}Data = ${JSON.stringify(data, null, 2)};

async function seedAthlete${athleteId}Data() {
  console.log('🌱 Starting to seed biometric data for Athlete ${athleteId} (${athleteName})...');

  for (const record of athlete${athleteId}Data) {
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

      console.log(\`📤 Inserting data for \${record.date}...\`);
      const response = await axios.post(\`\${API_BASE_URL}/athletes/${athleteId}/biometric-data\`, payload);

      if (response.status === 200 || response.status === 201) {
        console.log(\`✅ Successfully inserted data for \${record.date}\`);
      }
    } catch (error) {
      console.error(\`❌ Failed to insert data for \${record.date}:\`, error.response?.data || error.message);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('🎉 Finished seeding biometric data for Athlete ${athleteId}!');
}

seedAthlete${athleteId}Data().catch(console.error);
`;

// Generate data for each athlete
function generateAthleteData(athleteId) {
  const baseData = {
    restingHeartRate: 50 + Math.floor(Math.random() * 15), // 50-65 bpm
    heartRateVariability: 5.5 + Math.random() * 2.5, // 5.5-8.0
    sleepQuality: 6.5 + Math.random() * 2.5, // 6.5-9.0 hours
    recoveryScore: 7.0 + Math.random() * 2.0, // 7.0-9.0
    fatigueLevel: 2.0 + Math.random() * 3.0, // 2.0-5.0
    deepSleep: 15 + Math.random() * 10, // 15-25%
    remSleep: 18 + Math.random() * 8, // 18-26%
    spO2: 95 + Math.random() * 4, // 95-99%
    respiratoryRate: 12 + Math.random() * 6, // 12-18 breaths/min
    bodyTemperature: 36.2 + Math.random() * 1.0 // 36.2-37.2°C
  };

  const data = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date('2025-08-31');
    date.setDate(date.getDate() + i);

    // Add some variation to each day's data
    const variation = (Math.random() - 0.5) * 0.4; // -0.2 to +0.2

    data.push({
      date: date.toISOString().split('T')[0],
      restingHeartRate: Math.round(baseData.restingHeartRate + variation * 5),
      heartRateVariability: Math.round((baseData.heartRateVariability + variation * 1) * 100) / 100,
      sleepQuality: Math.round((baseData.sleepQuality + variation * 1) * 10) / 10,
      recoveryScore: Math.round((baseData.recoveryScore + variation * 0.5) * 10) / 10,
      fatigueLevel: Math.round((baseData.fatigueLevel + variation * 0.5) * 10) / 10,
      deepSleep: Math.round((baseData.deepSleep + variation * 3) * 10) / 10,
      remSleep: Math.round((baseData.remSleep + variation * 2) * 10) / 10,
      spO2: Math.round((baseData.spO2 + variation * 1) * 10) / 10,
      respiratoryRate: Math.round((baseData.respiratoryRate + variation * 1) * 10) / 10,
      bodyTemperature: Math.round((baseData.bodyTemperature + variation * 0.3) * 10) / 10
    });
  }

  return data;
}

// Athlete names
const athleteNames = {
  1: 'Bowen Bezuidenhoudt',
  2: 'Aldrich Wichman',
  3: 'Steffan De Jongh',
  4: 'Juanre De Klerk',
  5: 'Francois Rossouw',
  6: 'Marco Nel',
  7: 'Wian Van Der Merwe',
  8: 'Heinrich Smit',
  9: 'Danie Van Zyl',
  10: 'Jaco Pretorius',
  11: 'Andre Van Der Westhuizen',
  12: 'Pieter Van Wyk',
  13: 'Ruan Botha',
  14: 'Jacques Du Plessis',
  15: 'Hennie Van Niekerk',
  16: 'Kobus Van Der Walt',
  17: 'Tiaan Van Rensburg',
  18: 'Lourens De Villiers',
  19: 'Gerrit Van Der Linde',
  20: 'Sarel Pretorius',
  21: 'Frik Fourie',
  22: 'Jan-Hendrik Van Der Berg',
  23: 'Christiaan Van Zyl'
};

// Generate scripts for athletes 4-23
for (let athleteId = 4; athleteId <= 23; athleteId++) {
  const athleteName = athleteNames[athleteId];
  const data = generateAthleteData(athleteId);
  const scriptContent = scriptTemplate(athleteId, athleteName, data);

  const fileName = `seed-athlete-${athleteId}.js`;
  const filePath = path.join(process.cwd(), fileName);

  fs.writeFileSync(filePath, scriptContent);
  console.log(`✅ Generated ${fileName} for ${athleteName}`);
}

console.log('🎉 Generated seeding scripts for athletes 4-23!');
console.log('📝 You can now run each script individually:');
console.log('   node scripts/seed-athlete-X.js');