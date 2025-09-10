-- Athlete 19: Gerrit Van Der Linde
-- Insert 7 days of biometric data with realistic training patterns

INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel", "DeepSleep", "RemSleep", "SpO2", "RespiratoryRate", "BodyTemperature")
VALUES
  (1190, 19, '2025-08-31', 56, 6.93, 6.9, 7.3, 3.4, 15.2, 25.5, 95.1, 16.7, 36.3),
  (1191, 19, '2025-09-01', 56, 6.92, 6.9, 7.2, 3.4, 15.2, 25.5, 95, 16.6, 36.3),
  (1192, 19, '2025-09-02', 57, 7.17, 7.1, 7.4, 3.5, 15.9, 26, 95.3, 16.9, 36.4),
  (1193, 19, '2025-09-03', 58, 7.26, 7.2, 7.4, 3.6, 16.2, 26.2, 95.4, 17, 36.4),
  (1194, 19, '2025-09-04', 56, 6.93, 6.9, 7.3, 3.4, 15.2, 25.5, 95.1, 16.7, 36.3),
  (1195, 19, '2025-09-05', 56, 6.92, 6.9, 7.2, 3.4, 15.2, 25.5, 95, 16.6, 36.3),
  (1196, 19, '2025-09-06', 57, 7, 7, 7.3, 3.4, 15.4, 25.6, 95.1, 16.7, 36.4)
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
WHERE a."Id" = 19
  AND b."Date" >= '2025-08-31' AND b."Date" <= '2025-09-06'
GROUP BY a."Id", a."FirstName", a."LastName";
