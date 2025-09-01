-- Athlete 7: Wian Van Der Merwe
-- Insert 7 days of biometric data with realistic training patterns

INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel", "DeepSleep", "RemSleep", "SpO2", "RespiratoryRate", "BodyTemperature")
VALUES
  (1070, 7, '2025-08-31', 64, 6.04, 7, 8.1, 4.1, 22.5, 20.7, 98.7, 15.2, 37),
  (1071, 7, '2025-09-01', 63, 5.85, 6.8, 8, 4, 21.9, 20.4, 98.5, 15, 37),
  (1072, 7, '2025-09-02', 65, 6.13, 7.1, 8.1, 4.1, 22.7, 20.9, 98.8, 15.3, 37.1),
  (1073, 7, '2025-09-03', 64, 6.02, 7, 8.1, 4.1, 22.4, 20.7, 98.7, 15.2, 37),
  (1074, 7, '2025-09-04', 64, 6.01, 7, 8.1, 4.1, 22.4, 20.7, 98.7, 15.1, 37),
  (1075, 7, '2025-09-05', 64, 6.03, 7, 8.1, 4.1, 22.4, 20.7, 98.7, 15.2, 37),
  (1076, 7, '2025-09-06', 63, 5.84, 6.8, 8, 4, 21.8, 20.3, 98.5, 15, 37)
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
WHERE a."Id" = 7
  AND b."Date" >= '2025-08-31' AND b."Date" <= '2025-09-06'
GROUP BY a."Id", a."FirstName", a."LastName";
