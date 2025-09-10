-- Athlete 22: Jan-Hendrik Van Der Berg
-- Insert 7 days of biometric data with realistic training patterns

INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel", "DeepSleep", "RemSleep", "SpO2", "RespiratoryRate", "BodyTemperature")
VALUES
  (1220, 22, '2025-08-31', 55, 7.45, 7.2, 7, 2.4, 19.8, 22.5, 96.3, 13, 36.5),
  (1221, 22, '2025-09-01', 57, 7.76, 7.5, 7.1, 2.5, 20.8, 23.1, 96.6, 13.3, 36.6),
  (1222, 22, '2025-09-02', 55, 7.41, 7.1, 7, 2.3, 19.7, 22.4, 96.3, 12.9, 36.5),
  (1223, 22, '2025-09-03', 56, 7.54, 7.3, 7, 2.4, 20.1, 22.7, 96.4, 13.1, 36.5),
  (1224, 22, '2025-09-04', 56, 7.63, 7.4, 7.1, 2.5, 20.4, 22.8, 96.5, 13.2, 36.6),
  (1225, 22, '2025-09-05', 56, 7.66, 7.4, 7.1, 2.5, 20.5, 22.9, 96.5, 13.2, 36.6),
  (1226, 22, '2025-09-06', 57, 7.72, 7.5, 7.1, 2.5, 20.6, 23, 96.6, 13.2, 36.6)
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
WHERE a."Id" = 22
  AND b."Date" >= '2025-08-31' AND b."Date" <= '2025-09-06'
GROUP BY a."Id", a."FirstName", a."LastName";
