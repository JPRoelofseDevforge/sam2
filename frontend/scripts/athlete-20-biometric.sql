-- Athlete 20: Sarel Pretorius
-- Insert 7 days of biometric data with realistic training patterns

INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel", "DeepSleep", "RemSleep", "SpO2", "RespiratoryRate", "BodyTemperature")
VALUES
  (1200, 20, '2025-08-31', 63, 7.05, 8.9, 8.1, 4.4, 21.3, 21.1, 96, 12.7, 36.8),
  (1201, 20, '2025-09-01', 63, 6.96, 8.8, 8.1, 4.3, 21, 20.9, 95.9, 12.6, 36.8),
  (1202, 20, '2025-09-02', 64, 7.22, 9.1, 8.2, 4.5, 21.8, 21.5, 96.2, 12.9, 36.9),
  (1203, 20, '2025-09-03', 63, 7, 8.9, 8.1, 4.3, 21.1, 21, 96, 12.7, 36.8),
  (1204, 20, '2025-09-04', 63, 6.95, 8.8, 8.1, 4.3, 21, 20.9, 95.9, 12.6, 36.8),
  (1205, 20, '2025-09-05', 64, 7.15, 9, 8.2, 4.4, 21.6, 21.3, 96.1, 12.8, 36.9),
  (1206, 20, '2025-09-06', 64, 7.22, 9.1, 8.2, 4.5, 21.8, 21.5, 96.2, 12.9, 36.9)
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
WHERE a."Id" = 20
  AND b."Date" >= '2025-08-31' AND b."Date" <= '2025-09-06'
GROUP BY a."Id", a."FirstName", a."LastName";
