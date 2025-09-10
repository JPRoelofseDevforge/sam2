-- Athlete 17: Tiaan Van Rensburg
-- Insert 7 days of biometric data with realistic training patterns

INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel", "DeepSleep", "RemSleep", "SpO2", "RespiratoryRate", "BodyTemperature")
VALUES
  (1170, 17, '2025-08-31', 60, 6.46, 7.1, 7.4, 4.2, 17.6, 18.4, 97.2, 12.4, 37),
  (1171, 17, '2025-09-01', 60, 6.42, 7.1, 7.4, 4.1, 17.5, 18.4, 97.1, 12.4, 37),
  (1172, 17, '2025-09-02', 61, 6.63, 7.3, 7.5, 4.2, 18.2, 18.8, 97.4, 12.6, 37),
  (1173, 17, '2025-09-03', 61, 6.6, 7.3, 7.5, 4.2, 18.1, 18.7, 97.3, 12.6, 37),
  (1174, 17, '2025-09-04', 61, 6.64, 7.3, 7.5, 4.3, 18.2, 18.8, 97.4, 12.6, 37),
  (1175, 17, '2025-09-05', 61, 6.56, 7.2, 7.5, 4.2, 17.9, 18.6, 97.3, 12.5, 37),
  (1176, 17, '2025-09-06', 60, 6.44, 7.1, 7.4, 4.2, 17.6, 18.4, 97.2, 12.4, 37)
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
WHERE a."Id" = 17
  AND b."Date" >= '2025-08-31' AND b."Date" <= '2025-09-06'
GROUP BY a."Id", a."FirstName", a."LastName";
