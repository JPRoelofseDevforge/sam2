-- Athlete 23: Christiaan Van Zyl
-- Insert 7 days of biometric data with realistic training patterns

INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel", "DeepSleep", "RemSleep", "SpO2", "RespiratoryRate", "BodyTemperature")
VALUES
  (1230, 23, '2025-08-31', 52, 7.16, 7.9, 7.9, 4.9, 15.6, 18.4, 98.7, 13.5, 36.6),
  (1231, 23, '2025-09-01', 53, 7.25, 8, 7.9, 4.9, 15.9, 18.6, 98.8, 13.6, 36.6),
  (1232, 23, '2025-09-02', 52, 7.05, 7.8, 7.8, 4.8, 15.3, 18.2, 98.6, 13.4, 36.5),
  (1233, 23, '2025-09-03', 52, 7.07, 7.8, 7.8, 4.9, 15.3, 18.2, 98.6, 13.4, 36.5),
  (1234, 23, '2025-09-04', 53, 7.22, 8, 7.9, 4.9, 15.8, 18.5, 98.7, 13.6, 36.6),
  (1235, 23, '2025-09-05', 51, 6.89, 7.7, 7.8, 4.8, 14.8, 17.8, 98.4, 13.3, 36.5),
  (1236, 23, '2025-09-06', 53, 7.18, 8, 7.9, 4.9, 15.6, 18.4, 98.7, 13.6, 36.6)
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
WHERE a."Id" = 23
  AND b."Date" >= '2025-08-31' AND b."Date" <= '2025-09-06'
GROUP BY a."Id", a."FirstName", a."LastName";
