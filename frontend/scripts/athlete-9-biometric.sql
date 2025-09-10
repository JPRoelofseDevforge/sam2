-- Athlete 9: Danie Van Zyl
-- Insert 7 days of biometric data with realistic training patterns

INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel", "DeepSleep", "RemSleep", "SpO2", "RespiratoryRate", "BodyTemperature")
VALUES
  (1090, 9, '2025-08-31', 52, 7.42, 7.9, 8.7, 3.7, 17.4, 23.2, 98.5, 14.9, 36.5),
  (1091, 9, '2025-09-01', 53, 7.55, 8, 8.8, 3.8, 17.7, 23.4, 98.7, 15, 36.6),
  (1092, 9, '2025-09-02', 53, 7.47, 7.9, 8.7, 3.8, 17.5, 23.3, 98.6, 14.9, 36.6),
  (1093, 9, '2025-09-03', 53, 7.62, 8.1, 8.8, 3.8, 17.9, 23.6, 98.7, 15.1, 36.6),
  (1094, 9, '2025-09-04', 52, 7.38, 7.8, 8.7, 3.7, 17.2, 23.1, 98.5, 14.8, 36.5),
  (1095, 9, '2025-09-05', 53, 7.62, 8.1, 8.8, 3.8, 17.9, 23.6, 98.7, 15.1, 36.6),
  (1096, 9, '2025-09-06', 53, 7.5, 8, 8.7, 3.8, 17.6, 23.3, 98.6, 15, 36.6)
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
WHERE a."Id" = 9
  AND b."Date" >= '2025-08-31' AND b."Date" <= '2025-09-06'
GROUP BY a."Id", a."FirstName", a."LastName";
