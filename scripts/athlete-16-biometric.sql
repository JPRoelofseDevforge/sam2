-- Athlete 16: Kobus Van Der Walt
-- Insert 7 days of biometric data with realistic training patterns

INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel", "DeepSleep", "RemSleep", "SpO2", "RespiratoryRate", "BodyTemperature")
VALUES
  (1160, 16, '2025-08-31', 61, 6.83, 7.5, 8.8, 4.8, 20.9, 21.8, 99.1, 15.6, 37.1),
  (1161, 16, '2025-09-01', 62, 6.9, 7.6, 8.8, 4.9, 21.1, 21.9, 99.2, 15.7, 37.1),
  (1162, 16, '2025-09-02', 62, 6.87, 7.6, 8.8, 4.9, 21, 21.9, 99.1, 15.7, 37.1),
  (1163, 16, '2025-09-03', 62, 6.93, 7.6, 8.8, 4.9, 21.2, 22, 99.2, 15.7, 37.1),
  (1164, 16, '2025-09-04', 60, 6.58, 7.3, 8.6, 4.7, 20.1, 21.3, 98.8, 15.4, 37),
  (1165, 16, '2025-09-05', 60, 6.57, 7.3, 8.6, 4.7, 20.1, 21.3, 98.8, 15.3, 37),
  (1166, 16, '2025-09-06', 62, 6.88, 7.6, 8.8, 4.9, 21, 21.9, 99.1, 15.7, 37.1)
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
WHERE a."Id" = 16
  AND b."Date" >= '2025-08-31' AND b."Date" <= '2025-09-06'
GROUP BY a."Id", a."FirstName", a."LastName";
