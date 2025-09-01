-- Athlete 12: Pieter Van Wyk
-- Insert 7 days of biometric data with realistic training patterns

INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel", "DeepSleep", "RemSleep", "SpO2", "RespiratoryRate", "BodyTemperature")
VALUES
  (1120, 12, '2025-08-31', 49, 5.43, 7.6, 8.2, 2.3, 21.8, 22, 96.4, 13.9, 36.8),
  (1121, 12, '2025-09-01', 49, 5.49, 7.7, 8.3, 2.3, 22, 22.2, 96.4, 13.9, 36.9),
  (1122, 12, '2025-09-02', 50, 5.6, 7.8, 8.3, 2.3, 22.3, 22.4, 96.5, 14, 36.9),
  (1123, 12, '2025-09-03', 50, 5.58, 7.8, 8.3, 2.3, 22.2, 22.3, 96.5, 14, 36.9),
  (1124, 12, '2025-09-04', 51, 5.77, 8, 8.4, 2.4, 22.8, 22.7, 96.7, 14.2, 36.9),
  (1125, 12, '2025-09-05', 50, 5.54, 7.7, 8.3, 2.3, 22.1, 22.3, 96.5, 14, 36.9),
  (1126, 12, '2025-09-06', 50, 5.52, 7.7, 8.3, 2.3, 22.1, 22.2, 96.5, 14, 36.9)
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
WHERE a."Id" = 12
  AND b."Date" >= '2025-08-31' AND b."Date" <= '2025-09-06'
GROUP BY a."Id", a."FirstName", a."LastName";
