-- Athlete 8: Heinrich Smit
-- Insert 7 days of biometric data with realistic training patterns

INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel", "DeepSleep", "RemSleep", "SpO2", "RespiratoryRate", "BodyTemperature")
VALUES
  (1080, 8, '2025-08-31', 52, 8, 7.9, 7.4, 2.7, 22.4, 22.3, 98.3, 15.6, 37),
  (1081, 8, '2025-09-01', 50, 7.69, 7.6, 7.3, 2.5, 21.5, 21.7, 98, 15.3, 36.9),
  (1082, 8, '2025-09-02', 51, 7.76, 7.6, 7.3, 2.6, 21.7, 21.8, 98.1, 15.3, 36.9),
  (1083, 8, '2025-09-03', 52, 7.95, 7.8, 7.4, 2.7, 22.3, 22.2, 98.2, 15.5, 37),
  (1084, 8, '2025-09-04', 52, 7.94, 7.8, 7.4, 2.7, 22.3, 22.2, 98.2, 15.5, 37),
  (1085, 8, '2025-09-05', 52, 7.95, 7.8, 7.4, 2.7, 22.3, 22.2, 98.3, 15.5, 37),
  (1086, 8, '2025-09-06', 52, 8.01, 7.9, 7.4, 2.7, 22.5, 22.3, 98.3, 15.6, 37)
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
WHERE a."Id" = 8
  AND b."Date" >= '2025-08-31' AND b."Date" <= '2025-09-06'
GROUP BY a."Id", a."FirstName", a."LastName";
