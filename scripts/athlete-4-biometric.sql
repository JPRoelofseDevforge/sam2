-- Athlete 4: Juanre De Klerk
-- Insert 7 days of biometric data with realistic training patterns

INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel", "DeepSleep", "RemSleep", "SpO2", "RespiratoryRate", "BodyTemperature")
VALUES
  (1040, 4, '2025-08-31', 63, 6.65, 8.1, 8.2, 3.1, 20, 20.8, 97.3, 16.2, 36.4),
  (1041, 4, '2025-09-01', 63, 6.66, 8.1, 8.2, 3.1, 20, 20.8, 97.4, 16.2, 36.4),
  (1042, 4, '2025-09-02', 63, 6.72, 8.2, 8.2, 3.2, 20.2, 20.9, 97.4, 16.3, 36.4),
  (1043, 4, '2025-09-03', 62, 6.63, 8.1, 8.2, 3.1, 19.9, 20.8, 97.3, 16.2, 36.4),
  (1044, 4, '2025-09-04', 62, 6.59, 8, 8.1, 3.1, 19.8, 20.7, 97.3, 16.1, 36.4),
  (1045, 4, '2025-09-05', 62, 6.63, 8.1, 8.2, 3.1, 19.9, 20.7, 97.3, 16.2, 36.4),
  (1046, 4, '2025-09-06', 63, 6.84, 8.3, 8.3, 3.2, 20.5, 21.2, 97.5, 16.4, 36.4)
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
WHERE a."Id" = 4
  AND b."Date" >= '2025-08-31' AND b."Date" <= '2025-09-06'
GROUP BY a."Id", a."FirstName", a."LastName";
