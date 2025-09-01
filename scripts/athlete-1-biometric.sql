-- Athlete 1: Bowen Bezuidenhoudt - High training load week
-- Insert 7 days of biometric data with realistic training patterns

INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel", "DeepSleep", "RemSleep", "SpO2", "RespiratoryRate", "BodyTemperature")
VALUES
  (1001, 1, '2025-08-31', 52, 7.55, 7.8, 8.5, 2.5, 20.5, 22.8, 97.5, 14.2, 36.8),
  (1002, 1, '2025-09-01', 54, 6.12, 7.2, 7.8, 3.8, 17.8, 19.5, 96.8, 15.1, 37.0),
  (1003, 1, '2025-09-02', 56, 5.85, 6.8, 7.2, 4.5, 15.2, 17.9, 96.2, 15.8, 37.1),
  (1004, 1, '2025-09-03', 53, 6.35, 7.5, 8.2, 3.2, 18.9, 21.2, 97.1, 14.5, 36.9),
  (1005, 1, '2025-09-04', 55, 6.05, 7.0, 7.5, 4.2, 16.5, 18.8, 96.5, 15.2, 37.0),
  (1006, 1, '2025-09-05', 57, 5.72, 6.5, 6.8, 4.8, 14.8, 16.9, 95.9, 16.1, 37.2),
  (1007, 1, '2025-09-06', 54, 6.28, 7.3, 7.9, 3.5, 19.2, 22.1, 97.3, 14.8, 36.7)
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
WHERE a."Id" = 1
  AND b."Date" >= '2025-08-31' AND b."Date" <= '2025-09-06'
GROUP BY a."Id", a."FirstName", a."LastName";