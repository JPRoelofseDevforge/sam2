-- Athlete 15: Hennie Van Niekerk
-- Insert 7 days of biometric data with realistic training patterns

INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel", "DeepSleep", "RemSleep", "SpO2", "RespiratoryRate", "BodyTemperature")
VALUES
  (1150, 15, '2025-08-31', 52, 6.92, 7.6, 7.1, 3, 19.8, 23.5, 98.3, 17.1, 36.8),
  (1151, 15, '2025-09-01', 52, 6.9, 7.6, 7.1, 3, 19.8, 23.5, 98.3, 17.1, 36.8),
  (1152, 15, '2025-09-02', 52, 7.04, 7.7, 7.1, 3, 20.2, 23.8, 98.4, 17.2, 36.9),
  (1153, 15, '2025-09-03', 51, 6.82, 7.5, 7, 2.9, 19.5, 23.3, 98.2, 17, 36.8),
  (1154, 15, '2025-09-04', 51, 6.82, 7.5, 7, 2.9, 19.5, 23.3, 98.2, 17, 36.8),
  (1155, 15, '2025-09-05', 52, 7.04, 7.7, 7.1, 3, 20.2, 23.8, 98.4, 17.2, 36.9),
  (1156, 15, '2025-09-06', 51, 6.88, 7.6, 7.1, 2.9, 19.7, 23.5, 98.2, 17, 36.8)
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
WHERE a."Id" = 15
  AND b."Date" >= '2025-08-31' AND b."Date" <= '2025-09-06'
GROUP BY a."Id", a."FirstName", a."LastName";
