-- Athlete 14: Jacques Du Plessis
-- Insert 7 days of biometric data with realistic training patterns

INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel", "DeepSleep", "RemSleep", "SpO2", "RespiratoryRate", "BodyTemperature")
VALUES
  (1140, 14, '2025-08-31', 65, 6.51, 8.4, 8.8, 4.4, 25.2, 24, 96.2, 14.7, 36.8),
  (1141, 14, '2025-09-01', 64, 6.38, 8.3, 8.7, 4.3, 24.8, 23.7, 96.1, 14.5, 36.7),
  (1142, 14, '2025-09-02', 64, 6.47, 8.4, 8.8, 4.4, 25.1, 23.9, 96.2, 14.6, 36.8),
  (1143, 14, '2025-09-03', 64, 6.51, 8.4, 8.8, 4.4, 25.2, 23.9, 96.2, 14.7, 36.8),
  (1144, 14, '2025-09-04', 65, 6.55, 8.4, 8.8, 4.4, 25.3, 24, 96.2, 14.7, 36.8),
  (1145, 14, '2025-09-05', 64, 6.34, 8.2, 8.7, 4.3, 24.7, 23.6, 96, 14.5, 36.7),
  (1146, 14, '2025-09-06', 64, 6.38, 8.3, 8.7, 4.3, 24.8, 23.7, 96.1, 14.5, 36.7)
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
WHERE a."Id" = 14
  AND b."Date" >= '2025-08-31' AND b."Date" <= '2025-09-06'
GROUP BY a."Id", a."FirstName", a."LastName";
