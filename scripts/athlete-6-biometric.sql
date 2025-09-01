-- Athlete 6: Marco Nel
-- Insert 7 days of biometric data with realistic training patterns

INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel", "DeepSleep", "RemSleep", "SpO2", "RespiratoryRate", "BodyTemperature")
VALUES
  (1060, 6, '2025-08-31', 60, 6.5, 8.9, 7.2, 2.7, 24.1, 25.6, 96.9, 16.3, 36.2),
  (1061, 6, '2025-09-01', 61, 6.7, 9.1, 7.3, 2.8, 24.7, 26, 97.1, 16.5, 36.3),
  (1062, 6, '2025-09-02', 61, 6.79, 9.2, 7.3, 2.8, 25, 26.2, 97.2, 16.6, 36.3),
  (1063, 6, '2025-09-03', 60, 6.64, 9, 7.2, 2.7, 24.5, 25.9, 97.1, 16.5, 36.3),
  (1064, 6, '2025-09-04', 61, 6.73, 9.1, 7.3, 2.8, 24.8, 26.1, 97.2, 16.5, 36.3),
  (1065, 6, '2025-09-05', 61, 6.77, 9.1, 7.3, 2.8, 24.9, 26.1, 97.2, 16.6, 36.3),
  (1066, 6, '2025-09-06', 60, 6.58, 9, 7.2, 2.7, 24.4, 25.8, 97, 16.4, 36.3)
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
WHERE a."Id" = 6
  AND b."Date" >= '2025-08-31' AND b."Date" <= '2025-09-06'
GROUP BY a."Id", a."FirstName", a."LastName";
