-- Athlete 5: Francois Rossouw
-- Insert 7 days of biometric data with realistic training patterns

INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel", "DeepSleep", "RemSleep", "SpO2", "RespiratoryRate", "BodyTemperature")
VALUES
  (1050, 5, '2025-08-31', 63, 5.84, 7.5, 8, 4.3, 15, 18.4, 95, 14.3, 36.8),
  (1051, 5, '2025-09-01', 63, 5.81, 7.5, 7.9, 4.3, 14.9, 18.4, 94.9, 14.3, 36.8),
  (1052, 5, '2025-09-02', 63, 5.83, 7.5, 8, 4.3, 15, 18.4, 95, 14.3, 36.8),
  (1053, 5, '2025-09-03', 65, 6.2, 7.9, 8.1, 4.5, 16.1, 19.1, 95.3, 14.7, 36.9),
  (1054, 5, '2025-09-04', 64, 5.96, 7.6, 8, 4.4, 15.3, 18.6, 95.1, 14.4, 36.8),
  (1055, 5, '2025-09-05', 64, 6.03, 7.7, 8.1, 4.4, 15.5, 18.8, 95.2, 14.5, 36.8),
  (1056, 5, '2025-09-06', 63, 5.86, 7.5, 8, 4.3, 15, 18.5, 95, 14.4, 36.8)
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
WHERE a."Id" = 5
  AND b."Date" >= '2025-08-31' AND b."Date" <= '2025-09-06'
GROUP BY a."Id", a."FirstName", a."LastName";
