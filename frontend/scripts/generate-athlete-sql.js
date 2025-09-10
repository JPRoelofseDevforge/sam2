import fs from 'fs';

// Template for athlete SQL script
const sqlTemplate = (athleteId, athleteName, data) => `-- Athlete ${athleteId}: ${athleteName}
-- Insert 7 days of biometric data with realistic training patterns

INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel", "DeepSleep", "RemSleep", "SpO2", "RespiratoryRate", "BodyTemperature")
VALUES
${data.map((record, index) =>
  `  (${1000 + athleteId * 10 + index}, ${athleteId}, '${record.date}', ${record.restingHeartRate}, ${record.heartRateVariability}, ${record.sleepQuality}, ${record.recoveryScore}, ${record.fatigueLevel}, ${record.deepSleep}, ${record.remSleep}, ${record.spO2}, ${record.respiratoryRate}, ${record.bodyTemperature})`
).join(',\n')}
ON CONFLICT ("AthleteId", "Date") DO NOTHING;

-- Verify the data was inserted
SELECT
  a."FirstName",
  a."LastName",
  COUNT(b."Id") as biometric_records,
  MIN(b."Date") as earliest_date,
  MAX(b."Date") as latest_date,
  ROUND(AVG(b."RestingHeartRate"), 1) as avg_rhr,
  ROUND(AVG(b."HeartRateVariability" * 10), 1) as avg_hrv_display,
  ROUND(AVG(b."DeepSleep"), 1) as avg_deep_sleep,
  ROUND(AVG(b."RemSleep"), 1) as avg_rem_sleep,
  ROUND(AVG(b."SpO2"), 1) as avg_spo2
FROM "Athletes" a
LEFT JOIN "BiometricDaily" b ON a."Id" = b."AthleteId"
WHERE a."Id" = ${athleteId}
  AND b."Date" >= '2025-08-31' AND b."Date" <= '2025-09-06'
GROUP BY a."Id", a."FirstName", a."LastName";
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

// Generate SQL scripts for athletes 2-23 (athlete 1 already created)
for (let athleteId = 2; athleteId <= 23; athleteId++) {
  const athleteName = athleteNames[athleteId];
  const data = generateAthleteData(athleteId);
  const sqlContent = sqlTemplate(athleteId, athleteName, data);

  const fileName = `athlete-${athleteId}-biometric.sql`;
  fs.writeFileSync(fileName, sqlContent);
  console.log(`✅ Generated ${fileName} for ${athleteName}`);
}

console.log('🎉 Generated PostgreSQL scripts for athletes 2-23!');
console.log('📝 You can now run each SQL script in PostgreSQL:');
console.log('   psql -d your_database -f scripts/athlete-X-biometric.sql');