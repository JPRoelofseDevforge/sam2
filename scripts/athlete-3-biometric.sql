-- Athlete 3: Steffan De Jongh
-- Insert 7 days of biometric data with realistic training patterns

INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel", "DeepSleep", "RemSleep", "SpO2", "RespiratoryRate", "BodyTemperature")
VALUES
  (1030, 3, '2025-08-31', 54, 6.92, 8.7, 8, 2, 17.8, 22.5, 96.1, 14.3, 36.6),
  (1031, 3, '2025-09-01', 56, 7.21, 9, 8.2, 2.2, 18.7, 23.1, 96.4, 14.6, 36.7),
  (1032, 3, '2025-09-02', 55, 7.04, 8.8, 8.1, 2.1, 18.2, 22.8, 96.2, 14.4, 36.6),
  (1033, 3, '2025-09-03', 56, 7.24, 9, 8.2, 2.2, 18.8, 23.2, 96.4, 14.6, 36.7),
  (1034, 3, '2025-09-04', 55, 7.01, 8.8, 8.1, 2.1, 18.1, 22.7, 96.2, 14.4, 36.6),
  (1035, 3, '2025-09-05', 54, 6.92, 8.7, 8, 2, 17.8, 22.5, 96.1, 14.3, 36.6),
  (1036, 3, '2025-09-06', 54, 6.92, 8.7, 8, 2, 17.8, 22.5, 96.1, 14.3, 36.6)
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
WHERE a."Id" = 3
  AND b."Date" >= '2025-08-31' AND b."Date" <= '2025-09-06'
GROUP BY a."Id", a."FirstName", a."LastName";
