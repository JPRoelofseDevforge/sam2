-- Seed 7 days of biometric data for all athletes
-- Run this script in your PostgreSQL database

-- Create unique constraints for conflict resolution
DO $$
BEGIN
    -- Add unique constraint for BiometricDaily if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'ux_biometric_daily_athlete_date'
    ) THEN
        ALTER TABLE "BiometricDaily"
        ADD CONSTRAINT ux_biometric_daily_athlete_date
        UNIQUE ("AthleteId", "Date");
    END IF;

    -- Add missing columns to BiometricDaily table if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'BiometricDaily' AND column_name = 'DeepSleep'
    ) THEN
        ALTER TABLE "BiometricDaily"
        ADD COLUMN "DeepSleep" DECIMAL(5,2),
        ADD COLUMN "RemSleep" DECIMAL(5,2),
        ADD COLUMN "SpO2" DECIMAL(5,2),
        ADD COLUMN "RespiratoryRate" DECIMAL(5,2),
        ADD COLUMN "BodyTemperature" DECIMAL(5,2);
    END IF;

    -- Add unique constraint for BodyCompositions if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'ux_body_compositions_athlete_date'
    ) THEN
        ALTER TABLE "BodyCompositions"
        ADD CONSTRAINT ux_body_compositions_athlete_date
        UNIQUE ("AthleteId", "MeasurementDate");
    END IF;

    -- Add unique constraint for GeneticProfiles if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'ux_genetic_profiles_athlete_gene_variant'
    ) THEN
        ALTER TABLE "GeneticProfiles"
        ADD CONSTRAINT ux_genetic_profiles_athlete_gene_variant
        UNIQUE ("AthleteId", "GeneName", "Variant");
    END IF;
END $$;

-- Get current date for reference
-- Today: 2025-08-30
-- We'll insert data for the next 7 days: 2025-08-31 to 2025-09-06

-- Insert biometric data with realistic training patterns (skip individual duplicates)

-- Athlete 1: Bowen Bezuidenhoudt (High training load week - shows fatigue/recovery cycle)
INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel")
VALUES (1001, 1, '2025-08-31', 52, 6.55, 7.8, 8.5, 2.5)  -- Monday: Fresh start
ON CONFLICT ("AthleteId", "Date") DO NOTHING;

INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel")
VALUES (1002, 1, '2025-09-01', 54, 6.12, 7.2, 7.8, 3.8)  -- Tuesday: Heavy training - elevated RHR, lower HRV
ON CONFLICT ("AthleteId", "Date") DO NOTHING;

INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel")
VALUES (1003, 1, '2025-09-02', 56, 5.85, 6.8, 7.2, 4.5)  -- Wednesday: Very fatigued - poor sleep, high fatigue
ON CONFLICT ("AthleteId", "Date") DO NOTHING;

INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel")
VALUES (1004, 1, '2025-09-03', 53, 6.35, 7.5, 8.2, 3.2)  -- Thursday: Recovery day - better metrics
ON CONFLICT ("AthleteId", "Date") DO NOTHING;

INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel")
VALUES (1005, 1, '2025-09-04', 55, 6.05, 7.0, 7.5, 4.2)  -- Friday: Another hard session - fatigue building
ON CONFLICT ("AthleteId", "Date") DO NOTHING;

INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel")
VALUES (1006, 1, '2025-09-05', 57, 5.72, 6.5, 6.8, 4.8)  -- Saturday: Overtrained - worst metrics of week
ON CONFLICT ("AthleteId", "Date") DO NOTHING;

INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel")
VALUES (1007, 1, '2025-09-06', 54, 6.28, 7.3, 7.9, 3.5)  -- Sunday: Recovery - improving but still fatigued
ON CONFLICT ("AthleteId", "Date") DO NOTHING;

-- Athlete 2: Lezane Botto (Endurance athlete - steady improvement pattern)
INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel")
VALUES (1008, 2, '2025-08-31', 48, 5.82, 8.2, 7.8, 3.5)  -- Monday: Good baseline
ON CONFLICT ("AthleteId", "Date") DO NOTHING;

INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel")
VALUES (1009, 2, '2025-09-01', 47, 6.15, 8.5, 8.5, 2.8)  -- Tuesday: Long run - good adaptation
ON CONFLICT ("AthleteId", "Date") DO NOTHING;

INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel")
VALUES (1010, 2, '2025-09-02', 46, 6.42, 8.8, 8.8, 2.2)  -- Wednesday: Rest day - excellent recovery
ON CONFLICT ("AthleteId", "Date") DO NOTHING;

INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel")
VALUES (1011, 2, '2025-09-03', 49, 5.95, 8.0, 7.9, 3.2)  -- Thursday: Tempo run - slight fatigue
ON CONFLICT ("AthleteId", "Date") DO NOTHING;

INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel")
VALUES (1012, 2, '2025-09-04', 48, 6.05, 8.3, 8.2, 2.9)  -- Friday: Easy run - recovering
ON CONFLICT ("AthleteId", "Date") DO NOTHING;

INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel")
VALUES (1013, 2, '2025-09-05', 47, 6.28, 8.6, 8.5, 2.5)  -- Saturday: Long weekend run - good adaptation
ON CONFLICT ("AthleteId", "Date") DO NOTHING;

INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel")
VALUES (1014, 2, '2025-09-06', 46, 6.55, 8.9, 9.0, 2.0)  -- Sunday: Full recovery - peak condition
ON CONFLICT ("AthleteId", "Date") DO NOTHING;

-- Athlete 3: Steffan De Jongh (Power athlete - strength training pattern)
INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel", "DeepSleep", "RemSleep", "SpO2", "RespiratoryRate", "BodyTemperature")
VALUES (1015, 3, '2025-08-31', 55, 7.21, 7.5, 8.8, 2.0, 18.5, 22.3, 97.2, 14.8, 36.7)  -- Monday: Fresh
ON CONFLICT ("AthleteId", "Date") DO NOTHING;

INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel", "DeepSleep", "RemSleep", "SpO2", "RespiratoryRate", "BodyTemperature")
VALUES (1016, 3, '2025-09-01', 58, 6.85, 7.0, 8.2, 2.8, 16.8, 20.1, 96.8, 15.2, 36.9)  -- Tuesday: Weight session - muscle stress
ON CONFLICT ("AthleteId", "Date") DO NOTHING;

INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel", "DeepSleep", "RemSleep", "SpO2", "RespiratoryRate", "BodyTemperature")
VALUES (1017, 3, '2025-09-02', 56, 7.05, 7.3, 8.5, 2.5, 19.2, 21.8, 97.5, 14.5, 36.6)  -- Wednesday: Light session - recovering
ON CONFLICT ("AthleteId", "Date") DO NOTHING;

INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel", "DeepSleep", "RemSleep", "SpO2", "RespiratoryRate", "BodyTemperature")
VALUES (1018, 3, '2025-09-03', 59, 6.72, 6.8, 7.8, 3.2, 15.5, 18.9, 96.2, 15.8, 37.1)  -- Thursday: Heavy lifting - significant stress
ON CONFLICT ("AthleteId", "Date") DO NOTHING;

INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel", "DeepSleep", "RemSleep", "SpO2", "RespiratoryRate", "BodyTemperature")
VALUES (1019, 3, '2025-09-04', 57, 6.95, 7.2, 8.3, 2.7, 17.9, 22.5, 97.1, 14.9, 36.8)  -- Friday: Technique work - moderate stress
ON CONFLICT ("AthleteId", "Date") DO NOTHING;

INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel", "DeepSleep", "RemSleep", "SpO2", "RespiratoryRate", "BodyTemperature")
VALUES (1020, 3, '2025-09-05', 60, 6.58, 6.5, 7.5, 3.5, 14.2, 17.3, 95.8, 16.1, 37.2)  -- Saturday: Competition prep - high stress
ON CONFLICT ("AthleteId", "Date") DO NOTHING;

INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel", "DeepSleep", "RemSleep", "SpO2", "RespiratoryRate", "BodyTemperature")
VALUES (1021, 3, '2025-09-06', 56, 7.15, 7.4, 8.6, 2.3, 20.1, 23.2, 97.8, 14.2, 36.5)  -- Sunday: Recovery - much improved
ON CONFLICT ("AthleteId", "Date") DO NOTHING;

-- Athlete 4: Juanre De Klerk (Mixed training - varied pattern)
INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel")
VALUES (1022, 4, '2025-08-31', 50, 6.18, 8.0, 8.2, 2.8)  -- Monday: Steady
ON CONFLICT ("AthleteId", "Date") DO NOTHING;

INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel")
VALUES (1023, 4, '2025-09-01', 52, 5.95, 7.5, 7.8, 3.5)  -- Tuesday: High intensity - stressed
ON CONFLICT ("AthleteId", "Date") DO NOTHING;

INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel")
VALUES (1024, 4, '2025-09-02', 49, 6.35, 8.2, 8.5, 2.5)  -- Wednesday: Recovery - good bounce back
ON CONFLICT ("AthleteId", "Date") DO NOTHING;

INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel")
VALUES (1025, 4, '2025-09-03', 51, 6.05, 7.8, 8.0, 3.0)  -- Thursday: Mixed session - moderate
ON CONFLICT ("AthleteId", "Date") DO NOTHING;

INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel")
VALUES (1026, 4, '2025-09-04', 53, 5.82, 7.2, 7.5, 3.8)  -- Friday: Speed work - fatigued
ON CONFLICT ("AthleteId", "Date") DO NOTHING;

INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel")
VALUES (1027, 4, '2025-09-05', 50, 6.25, 8.0, 8.3, 2.7)  -- Saturday: Rest - recovered
ON CONFLICT ("AthleteId", "Date") DO NOTHING;

INSERT INTO "BiometricDaily" ("Id", "AthleteId", "Date", "RestingHeartRate", "HeartRateVariability", "SleepQuality", "RecoveryScore", "FatigueLevel")
VALUES (1028, 4, '2025-09-06', 49, 6.42, 8.3, 8.6, 2.2)  -- Sunday: Fresh - peak recovery
ON CONFLICT ("AthleteId", "Date") DO NOTHING;

-- Insert body composition data (skip individual duplicates)
INSERT INTO "BodyCompositions" ("Id", "AthleteId", "MeasurementDate", "Weight", "BodyFat", "MuscleMass", "BoneDensity")
VALUES (1001, 1, '2025-09-06', 75.5, 12.5, 65.2, 1.2)
ON CONFLICT ("AthleteId", "MeasurementDate") DO NOTHING;

INSERT INTO "BodyCompositions" ("Id", "AthleteId", "MeasurementDate", "Weight", "BodyFat", "MuscleMass", "BoneDensity")
VALUES (1002, 2, '2025-09-06', 68.2, 15.8, 55.1, 1.1)
ON CONFLICT ("AthleteId", "MeasurementDate") DO NOTHING;

INSERT INTO "BodyCompositions" ("Id", "AthleteId", "MeasurementDate", "Weight", "BodyFat", "MuscleMass", "BoneDensity")
VALUES (1003, 3, '2025-09-06', 82.1, 10.2, 70.8, 1.3)
ON CONFLICT ("AthleteId", "MeasurementDate") DO NOTHING;

INSERT INTO "BodyCompositions" ("Id", "AthleteId", "MeasurementDate", "Weight", "BodyFat", "MuscleMass", "BoneDensity")
VALUES (1004, 4, '2025-09-06', 78.8, 13.7, 63.4, 1.2)
ON CONFLICT ("AthleteId", "MeasurementDate") DO NOTHING;

-- Add genetic profiles (skip individual duplicates)
INSERT INTO "GeneticProfiles" ("Id", "AthleteId", "GeneName", "Variant", "RiskLevel", "Description", "GeneticTestTypeId")
VALUES (1001, 1, 'ACTN3', 'RR', 'Low', 'Power athlete genotype', 1)
ON CONFLICT ("AthleteId", "GeneName", "Variant") DO NOTHING;

INSERT INTO "GeneticProfiles" ("Id", "AthleteId", "GeneName", "Variant", "RiskLevel", "Description", "GeneticTestTypeId")
VALUES (1002, 1, 'PPARGC1A', 'Ser', 'Low', 'Good endurance capacity', 1)
ON CONFLICT ("AthleteId", "GeneName", "Variant") DO NOTHING;

INSERT INTO "GeneticProfiles" ("Id", "AthleteId", "GeneName", "Variant", "RiskLevel", "Description", "GeneticTestTypeId")
VALUES (1003, 2, 'ACTN3', 'XX', 'High', 'Endurance athlete genotype', 1)
ON CONFLICT ("AthleteId", "GeneName", "Variant") DO NOTHING;

INSERT INTO "GeneticProfiles" ("Id", "AthleteId", "GeneName", "Variant", "RiskLevel", "Description", "GeneticTestTypeId")
VALUES (1004, 3, 'CLOCK', 'AA', 'Low', 'Morning chronotype', 1)
ON CONFLICT ("AthleteId", "GeneName", "Variant") DO NOTHING;

INSERT INTO "GeneticProfiles" ("Id", "AthleteId", "GeneName", "Variant", "RiskLevel", "Description", "GeneticTestTypeId")
VALUES (1005, 4, 'MTHFR', 'CT', 'Medium', 'Heterozygous MTHFR variant', 1)
ON CONFLICT ("AthleteId", "GeneName", "Variant") DO NOTHING;

INSERT INTO "GeneticProfiles" ("Id", "AthleteId", "GeneName", "Variant", "RiskLevel", "Description", "GeneticTestTypeId")
VALUES (1006, 1, 'BDNF', 'Val/Val', 'Low', 'Optimal BDNF expression', 1)
ON CONFLICT ("AthleteId", "GeneName", "Variant") DO NOTHING;

INSERT INTO "GeneticProfiles" ("Id", "AthleteId", "GeneName", "Variant", "RiskLevel", "Description", "GeneticTestTypeId")
VALUES (1007, 2, 'PER3', 'long', 'Medium', 'Evening chronotype', 1)
ON CONFLICT ("AthleteId", "GeneName", "Variant") DO NOTHING;

INSERT INTO "GeneticProfiles" ("Id", "AthleteId", "GeneName", "Variant", "RiskLevel", "Description", "GeneticTestTypeId")
VALUES (1008, 3, 'ADRB2', 'Arg/Arg', 'Low', 'Good fat metabolism', 1)
ON CONFLICT ("AthleteId", "GeneName", "Variant") DO NOTHING;

INSERT INTO "GeneticProfiles" ("Id", "AthleteId", "GeneName", "Variant", "RiskLevel", "Description", "GeneticTestTypeId")
VALUES (1009, 4, 'COL5A1', 'TT', 'High', 'Increased injury risk', 1)
ON CONFLICT ("AthleteId", "GeneName", "Variant") DO NOTHING;

INSERT INTO "GeneticProfiles" ("Id", "AthleteId", "GeneName", "Variant", "RiskLevel", "Description", "GeneticTestTypeId")
VALUES (1010, 1, 'ACE', 'DD', 'Medium', 'Power/endurance balance', 1)
ON CONFLICT ("AthleteId", "GeneName", "Variant") DO NOTHING;

-- Verify the data was inserted
SELECT
    a."FirstName",
    a."LastName",
    COUNT(b."Id") as biometric_records,
    MIN(b."Date") as earliest_date,
    MAX(b."Date") as latest_date,
    ROUND(AVG(b."HeartRateVariability" * 10), 2) as avg_hrv_display,
    ROUND(AVG(b."RestingHeartRate"), 1) as avg_rhr,
    ROUND(AVG(b."SleepQuality"), 1) as avg_sleep
FROM "Athletes" a
LEFT JOIN "BiometricDaily" b ON a."Id" = b."AthleteId"
WHERE a."Id" IN (1, 2, 3, 4)
  AND b."Date" >= '2025-08-31' AND b."Date" <= '2025-09-06'
GROUP BY a."Id", a."FirstName", a."LastName"
ORDER BY a."Id";