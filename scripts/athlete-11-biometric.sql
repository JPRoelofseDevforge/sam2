-- Athlete 11: Andre Van Der Westhuizen
-- Insert 7 days of biometric data with realistic training patterns

INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel", "DeepSleep", "RemSleep", "SpO2", "RespiratoryRate", "BodyTemperature")
VALUES
  (1110, 11, '2025-08-31', 51, 7.62, 8.6, 7.6, 3.5, 17.4, 20, 96, 17.7, 37.1),
  (1111, 11, '2025-09-01', 50, 7.43, 8.4, 7.5, 3.4, 16.8, 19.6, 95.8, 17.5, 37),
  (1112, 11, '2025-09-02', 50, 7.42, 8.4, 7.5, 3.4, 16.8, 19.6, 95.8, 17.5, 37),
  (1113, 11, '2025-09-03', 51, 7.54, 8.5, 7.6, 3.5, 17.1, 19.8, 95.9, 17.6, 37.1),
  (1114, 11, '2025-09-04', 51, 7.59, 8.6, 7.6, 3.5, 17.3, 19.9, 96, 17.6, 37.1),
  (1115, 11, '2025-09-05', 51, 7.61, 8.6, 7.6, 3.5, 17.4, 20, 96, 17.7, 37.1),
  (1116, 11, '2025-09-06', 51, 7.63, 8.6, 7.6, 3.5, 17.4, 20, 96, 17.7, 37.1)
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
WHERE a."Id" = 11
  AND b."Date" >= '2025-08-31' AND b."Date" <= '2025-09-06'
GROUP BY a."Id", a."FirstName", a."LastName";
