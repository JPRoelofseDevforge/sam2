-- Athlete 10: Jaco Pretorius
-- Insert 7 days of biometric data with realistic training patterns

INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel", "DeepSleep", "RemSleep", "SpO2", "RespiratoryRate", "BodyTemperature")
VALUES
  (1100, 10, '2025-08-31', 55, 6.79, 8.5, 7.4, 3.5, 15.7, 25.4, 95.3, 14.2, 37.2),
  (1101, 10, '2025-09-01', 55, 6.79, 8.5, 7.4, 3.5, 15.7, 25.4, 95.3, 14.2, 37.2),
  (1102, 10, '2025-09-02', 53, 6.47, 8.2, 7.2, 3.3, 14.7, 24.8, 95, 13.9, 37.1),
  (1103, 10, '2025-09-03', 53, 6.49, 8.2, 7.2, 3.3, 14.8, 24.8, 95, 13.9, 37.1),
  (1104, 10, '2025-09-04', 54, 6.56, 8.3, 7.3, 3.4, 15, 25, 95, 13.9, 37.1),
  (1105, 10, '2025-09-05', 55, 6.82, 8.6, 7.4, 3.5, 15.7, 25.5, 95.3, 14.2, 37.2),
  (1106, 10, '2025-09-06', 54, 6.69, 8.4, 7.3, 3.4, 15.4, 25.2, 95.2, 14.1, 37.2)
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
WHERE a."Id" = 10
  AND b."Date" >= '2025-08-31' AND b."Date" <= '2025-09-06'
GROUP BY a."Id", a."FirstName", a."LastName";
