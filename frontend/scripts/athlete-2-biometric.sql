-- Athlete 2: Aldrich Wichman
-- Insert 7 days of biometric data with realistic training patterns

INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel", "DeepSleep", "RemSleep", "SpO2", "RespiratoryRate", "BodyTemperature")
VALUES
  (1020, 2, '2025-08-31', 63, 6.1, 7.7, 8.6, 4.6, 24.5, 21.8, 96.8, 14.6, 36.5),
  (1021, 2, '2025-09-01', 63, 6.22, 7.9, 8.6, 4.7, 24.9, 22.1, 96.9, 14.7, 36.5),
  (1022, 2, '2025-09-02', 63, 6.2, 7.8, 8.6, 4.7, 24.8, 22, 96.9, 14.7, 36.5),
  (1023, 2, '2025-09-03', 62, 6.05, 7.7, 8.5, 4.6, 24.4, 21.7, 96.7, 14.5, 36.5),
  (1024, 2, '2025-09-04', 62, 6.05, 7.7, 8.5, 4.6, 24.4, 21.7, 96.7, 14.5, 36.5),
  (1025, 2, '2025-09-05', 63, 6.3, 7.9, 8.7, 4.7, 25.1, 22.2, 97, 14.8, 36.6),
  (1026, 2, '2025-09-06', 63, 6.21, 7.8, 8.6, 4.7, 24.8, 22, 96.9, 14.7, 36.5)
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
WHERE a."Id" = 2
  AND b."Date" >= '2025-08-31' AND b."Date" <= '2025-09-06'
GROUP BY a."Id", a."FirstName", a."LastName";
