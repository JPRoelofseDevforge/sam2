-- Athlete 18: Lourens De Villiers
-- Insert 7 days of biometric data with realistic training patterns

INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel", "DeepSleep", "RemSleep", "SpO2", "RespiratoryRate", "BodyTemperature")
VALUES
  (1180, 18, '2025-08-31', 57, 7.5, 7.8, 7.2, 4.8, 22.7, 23, 98.5, 18, 36.6),
  (1181, 18, '2025-09-01', 55, 7.19, 7.5, 7, 4.7, 21.8, 22.4, 98.2, 17.7, 36.5),
  (1182, 18, '2025-09-02', 56, 7.35, 7.7, 7.1, 4.7, 22.2, 22.7, 98.3, 17.8, 36.6),
  (1183, 18, '2025-09-03', 57, 7.58, 7.9, 7.2, 4.8, 22.9, 23.2, 98.6, 18.1, 36.7),
  (1184, 18, '2025-09-04', 56, 7.29, 7.6, 7.1, 4.7, 22.1, 22.6, 98.3, 17.8, 36.6),
  (1185, 18, '2025-09-05', 56, 7.34, 7.7, 7.1, 4.7, 22.2, 22.7, 98.3, 17.8, 36.6),
  (1186, 18, '2025-09-06', 55, 7.26, 7.6, 7.1, 4.7, 22, 22.5, 98.2, 17.7, 36.6)
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
WHERE a."Id" = 18
  AND b."Date" >= '2025-08-31' AND b."Date" <= '2025-09-06'
GROUP BY a."Id", a."FirstName", a."LastName";
