-- Athlete 21: Frik Fourie
-- Insert 7 days of biometric data with realistic training patterns

INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel", "DeepSleep", "RemSleep", "SpO2", "RespiratoryRate", "BodyTemperature")
VALUES
  (1210, 21, '2025-08-31', 50, 5.97, 8.5, 8.2, 3.5, 18.3, 19.8, 95.4, 14.3, 36.7),
  (1211, 21, '2025-09-01', 50, 5.91, 8.5, 8.2, 3.5, 18.2, 19.7, 95.4, 14.2, 36.7),
  (1212, 21, '2025-09-02', 51, 6.08, 8.7, 8.3, 3.5, 18.6, 20.1, 95.5, 14.4, 36.8),
  (1213, 21, '2025-09-03', 50, 5.85, 8.4, 8.2, 3.4, 18, 19.6, 95.3, 14.1, 36.7),
  (1214, 21, '2025-09-04', 50, 5.99, 8.6, 8.2, 3.5, 18.4, 19.9, 95.4, 14.3, 36.7),
  (1215, 21, '2025-09-05', 50, 5.84, 8.4, 8.2, 3.4, 17.9, 19.6, 95.3, 14.1, 36.7),
  (1216, 21, '2025-09-06', 50, 5.86, 8.4, 8.2, 3.4, 18, 19.6, 95.3, 14.1, 36.7)
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
WHERE a."Id" = 21
  AND b."Date" >= '2025-08-31' AND b."Date" <= '2025-09-06'
GROUP BY a."Id", a."FirstName", a."LastName";
