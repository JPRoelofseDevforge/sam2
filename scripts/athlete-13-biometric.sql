-- Athlete 13: Ruan Botha
-- Insert 7 days of biometric data with realistic training patterns

INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel", "DeepSleep", "RemSleep", "SpO2", "RespiratoryRate", "BodyTemperature")
VALUES
  (1130, 13, '2025-08-31', 59, 6.28, 6.5, 8, 2.8, 19.4, 23.9, 99, 12.6, 36.5),
  (1131, 13, '2025-09-01', 60, 6.5, 6.7, 8.1, 2.9, 20, 24.4, 99.2, 12.8, 36.6),
  (1132, 13, '2025-09-02', 58, 6.12, 6.3, 7.9, 2.8, 18.9, 23.6, 98.8, 12.4, 36.5),
  (1133, 13, '2025-09-03', 59, 6.27, 6.5, 8, 2.8, 19.4, 23.9, 98.9, 12.6, 36.5),
  (1134, 13, '2025-09-04', 59, 6.41, 6.6, 8.1, 2.9, 19.8, 24.2, 99.1, 12.7, 36.6),
  (1135, 13, '2025-09-05', 59, 6.35, 6.6, 8.1, 2.9, 19.6, 24.1, 99, 12.7, 36.6),
  (1136, 13, '2025-09-06', 59, 6.36, 6.6, 8.1, 2.9, 19.6, 24.1, 99, 12.7, 36.6)
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
WHERE a."Id" = 13
  AND b."Date" >= '2025-08-31' AND b."Date" <= '2025-09-06'
GROUP BY a."Id", a."FirstName", a."LastName";
