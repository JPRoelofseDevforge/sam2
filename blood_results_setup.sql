-- ===========================================
-- Blood Results Database Setup Script
-- ===========================================
-- This script creates the blood_results table and inserts all athlete data

-- Create sequence for blood_results table
CREATE SEQUENCE IF NOT EXISTS blood_results_id_seq;

-- Create the blood_results table
CREATE TABLE IF NOT EXISTS public.blood_results (
    id integer DEFAULT nextval('blood_results_id_seq'::regclass) NOT NULL PRIMARY KEY,
    athlete_id character varying(20) NOT NULL,
    name character varying(255) NOT NULL,
    code integer NOT NULL,
    date date DEFAULT CURRENT_DATE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,

    -- Hormones
    cortisol_nmol_l numeric(8,2),
    vitamin_d numeric(8,2),
    testosterone numeric(8,2),

    -- Muscle & Metabolic
    ck numeric(8,2), -- Creatine Kinase
    fasting_glucose numeric(8,2),
    hba1c numeric(5,2),
    hba1c_ifcc numeric(8,2),
    estimated_average_glucose numeric(8,2),

    -- Kidney Function
    urea numeric(8,2),
    creatinine numeric(8,2),
    egfr numeric(8,2),
    uric_acid numeric(8,2),

    -- Liver Function
    s_glutamyl_transferase numeric(8,2), -- GGT
    s_alanine_transaminase numeric(8,2), -- ALT
    s_aspartate_transaminase numeric(8,2), -- AST
    lactate_dehydrogenase numeric(8,2), -- LDH

    -- Minerals & Proteins
    calcium_adjusted numeric(5,2),
    calcium_measured numeric(5,2),
    magnesium numeric(5,2),
    albumin_bcg numeric(5,2),
    c_reactive_protein numeric(8,2), -- CRP
    total_protein numeric(5,2),

    -- Inflammation
    esr numeric(5,2), -- Erythrocyte Sedimentation Rate

    -- Complete Blood Count (CBC)
    erythrocyte_count numeric(5,2), -- RBC
    hemoglobin numeric(5,2),
    hematocrit numeric(5,2),
    mcv numeric(5,2), -- Mean Corpuscular Volume
    mch numeric(5,2), -- Mean Corpuscular Hemoglobin
    mchc numeric(5,2), -- Mean Corpuscular Hemoglobin Concentration
    rdw numeric(5,2), -- Red Cell Distribution Width

    -- White Blood Cells
    leucocyte_count numeric(5,2), -- WBC
    neutrophils_pct numeric(5,2),
    neutrophil_absolute_count numeric(5,2),
    lymphocytes_pct numeric(5,2),
    lymphocytes_absolute_count numeric(5,2),
    monocytes_pct numeric(5,2),
    monocytes_absolute_count numeric(5,2),
    eosinophils_pct numeric(5,2),
    eosinophils_absolute_count numeric(5,2),
    basophils_pct numeric(5,2),
    basophils_absolute_count numeric(5,2),
    nlr numeric(5,2), -- Neutrophil-to-Lymphocyte Ratio

    -- Platelets
    platelets numeric(8,2),

    -- Metadata
    lab_name character varying(255),
    test_method character varying(100),
    reference_ranges jsonb, -- Store reference ranges for each test
    notes text,
    is_abnormal boolean DEFAULT false,
    flagged_values jsonb -- Store which values are outside normal range
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blood_results_athlete_id ON public.blood_results(athlete_id);
CREATE INDEX IF NOT EXISTS idx_blood_results_date ON public.blood_results(date);
CREATE INDEX IF NOT EXISTS idx_blood_results_created_at ON public.blood_results(created_at);

-- Insert blood results data for all athletes
INSERT INTO public.blood_results (
    athlete_id, name, code, cortisol_nmol_l, vitamin_d, testosterone, ck, fasting_glucose,
    hba1c, hba1c_ifcc, estimated_average_glucose, urea, creatinine, egfr, uric_acid,
    s_glutamyl_transferase, s_alanine_transaminase, s_aspartate_transaminase, lactate_dehydrogenase,
    calcium_adjusted, calcium_measured, magnesium, albumin_bcg, c_reactive_protein, total_protein,
    esr, erythrocyte_count, hemoglobin, hematocrit, mcv, mch, mchc, rdw, leucocyte_count,
    neutrophils_pct, neutrophil_absolute_count, lymphocytes_pct, lymphocytes_absolute_count,
    monocytes_pct, monocytes_absolute_count, eosinophils_pct, eosinophils_absolute_count,
    basophils_pct, basophils_absolute_count, nlr, platelets
) VALUES
('1', 'Lezane Botto', 1, 480, 32, 44.5, 149, 5.2, 5.6, 38, 6.3, 5.4, 105, 88, 0.27, 10, 11, 24, 161, 2.25, 2.45, 0.84, 50, 1, 76, NULL, 5.35, 15.8, 0.47, 87.7, 29.5, 33.7, 12.2, 7.89, 49.4, 3.90, 40.4, 3.19, 6.6, 0.52, 3.2, 0.25, 0.4, 0.03, 1.22, 289),
('2', 'Torbyn Visser', 2, 366, 41, NULL, 259, 4.3, 5.2, 33, 5.7, 6.1, 90, 89, 0.34, 30, 32, 29, NULL, 2.30, 2.50, 0.90, 50, 1, 75, NULL, 5.38, 16.5, 0.49, 91.6, 30.7, 33.5, 11.8, 5.98, 52.2, 3.12, 38.5, 2.30, 8.0, 0.48, 0.8, 0.05, 0.5, 0.03, 1.36, 258),
('3', 'Steffan De Jongh', 3, 280, 27, 20.6, 95, 5.0, NULL, NULL, NULL, 5.7, 83, 89, 0.41, 15, 22, 24, 231, 2.24, 2.44, 0.90, 50, 1, 79, 3, 5.30, 15.8, 0.47, 89.1, 29.8, 33.5, 12.7, 6.82, 54.3, 3.70, 32.4, 2.21, 10.6, 0.72, 2.3, 0.16, 0.4, 0.03, 1.67, 278),
('4', 'Marquel Miller', 4, 401, 32, 20.4, 1423, 4.7, 5.8, 40, 6.6, 7.6, 125, 72, 0.37, 12, 77, 66, 343, 2.32, 2.46, 0.83, 47, 10.1, 69, NULL, 5.37, 13.8, 0.43, 79.9, 25.7, 32.2, 14.1, 6.73, 43.0, 2.89, 47.0, 3.16, 10.0, 0.67, 0.0, 0.00, 0.0, 0.00, 0.91, 326),
('5', 'Emile Damant', 5, 512, NULL, NULL, 279, 4.4, 5.1, 32, 5.5, 11.0, 143, 59, 0.44, 16, 26, 29, 212, 2.30, 2.50, 0.94, 50, 1, 72, NULL, 5.62, 16.7, 0.48, 85.4, 29.7, 34.8, 11.3, 4.85, 44.0, 2.13, 44.5, 2.16, 8.2, 0.40, 2.1, 0.10, 1.2, 0.06, 0.99, 184),
('6', 'George Evans', 6, 258, NULL, 30.6, 196, 5.1, 5.3, 34, 5.8, 7.4, 106, 88, 0.39, 15, 18, 22, 194, 2.27, 2.47, 0.87, 50, 1.3, 81, NULL, 5.37, 16.3, 0.48, 89.6, 30.4, 33.9, 13.1, 8.59, 36.2, 3.11, 51.3, 4.41, 9.2, 0.79, 2.6, 0.22, 0.7, 0.06, 0.71, 269),
('7', 'Ethan Gordon', 7, 286, 32, 22.6, 254, 4.6, 5.2, 33, 5.7, 8.0, 95, 89, 0.33, 27, 24, 24, 209, 2.26, 2.50, 0.94, 52, 1, 79, NULL, 5.25, 15.8, 0.48, 91.8, 30.1, 32.8, 12.3, 7.40, 58.7, 4.34, 30.0, 2.22, 9.7, 0.72, 1.2, 0.09, 0.4, 0.03, 1.95, 324),
('8', 'Dijan Labuschagne', 8, 738, 42, 32.1, 149, 5.1, 5.4, 36, 6.0, 6.9, 109, 84, 0.35, 23, 18, 23, 197, 2.33, 2.57, 0.90, 52, 1, 79, NULL, 5.06, 16.1, 0.47, 93.7, 31.8, 34.0, 11.8, 5.43, 57.7, 3.13, 30.8, 1.67, 9.9, 0.54, 0.9, 0.05, 0.7, 0.04, 1.87, 268),
('9', 'Souheil Tahiri', 9, 429, 18, 22.1, 93, 4.4, 5.3, 34, 5.8, 7.5, 82, 89, 0.36, 17, 19, 24, 228, 2.28, 2.46, 0.82, 49, 1, 77, 1, 5.18, 16.0, 0.48, 93.4, 30.9, 33.1, 12.7, 7.30, 45.9, 3.35, 36.7, 2.68, 10.4, 0.76, 6.0, 0.44, 1.0, 0.07, 1.25, 264),
('10', 'Luke Prest', 10, 229, 65, 14.8, NULL, 5.2, 5.4, 36, 6.0, 4.8, 86, 89, 0.30, 19, 20, 28, 226, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 5.34, 15.6, 0.46, 86.0, 29.2, 34.0, 12.4, 8.69, 59.0, 5.13, 28.2, 2.45, 8.4, 0.73, 3.9, 0.34, 0.5, 0.04, 2.09, 298),
('11', 'Ritchie Mitchell', 11, 490, 49, 23.3, 145, 5.3, 5.7, 39, 6.5, 6.5, 89, 89, 0.48, 15, 16, 26, 252, 2.33, 2.53, 0.87, 50, 1, 79, NULL, 5.39, 16.5, 0.48, 89.4, 30.6, 34.2, 11.8, 7.69, 53.5, 4.11, 29.4, 2.26, 9.2, 0.71, 7.4, 0.57, 0.5, 0.04, 1.82, 312),
('12', 'Christiaan Tromp', 12, 280, NULL, 21.2, 82, 5.3, 5.2, 33, 5.7, 6.4, 80, 89, 0.34, 42, 29, 15, 222, 2.28, 2.54, 0.88, 53, 3.1, 79, NULL, 6.08, 17.2, 0.51, 83.7, 28.3, 33.8, 12.6, 15.01, 73.5, 11.03, 18.1, 2.71, 6.9, 1.04, 1.1, 0.17, 0.4, 0.06, 4.07, 388),
('13', 'Ethan Isaacs', 13, 410, 14, NULL, 654, 4.2, 5.1, 32, 5.5, 5.6, 108, 84, NULL, 22, 17, 30, 338, 2.28, 2.48, 1.01, 50, 1.3, 76, NULL, 5.44, 15.8, 0.45, 83.3, 29.0, 34.9, 11.6, 10.03, 45.0, 4.51, 46.0, 4.61, 7.0, 0.70, 2.0, 0.20, 0.0, 0.00, 0.98, 316),
('14', 'Bowen Bezuidenhout', 14, 327, NULL, 20.8, 126, 4.7, 5.5, 37, 6.2, 8.8, 103, 88, 0.45, 23, 29, 28, 304, 2.20, 2.44, 0.91, 52, 1, 80, NULL, 5.44, 16.2, 0.47, 86.0, 29.8, 34.6, 11.4, 5.25, 51.0, 2.68, 34.0, 1.79, 8.0, 0.42, 3.0, 0.16, 0.0, 0.00, 1.50, 375),
('15', 'James Nero', 15, 469, NULL, 27.9, 378, 5.0, 5.3, 34, 5.8, 4.1, 80, 89, 0.38, 33, 37, 36, 277, 2.28, 2.44, 0.84, 48, 1, 77, NULL, 5.63, 16.3, 0.50, 88.8, 29.0, 32.6, 12.0, 9.56, 49.1, 4.68, 39.4, 3.77, 7.9, 0.76, 3.2, 0.31, 0.4, 0.04, 1.24, 144),
('16', 'Nicholas Fritz', 16, 474, 32, 23.3, 119, 4.6, 5.3, 34, 5.8, 5.7, 98, 89, 0.45, 35, 16, 21, 199, 2.42, 2.70, 0.90, 54, 1, 89, NULL, 5.18, 16.4, 0.49, 94.8, 31.7, 33.4, 12.8, 9.35, 56.9, 5.32, 30.5, 2.85, 9.1, 0.85, 2.8, 0.26, 0.7, 0.07, 1.87, 375),
('17', 'Matthew S Jacobs', 17, 438, 15, 31.6, 542, 4.5, 5.4, 36, 6.0, 7.1, 103, 88, 0.36, 19, 17, 26, 275, 2.24, 2.30, 0.88, 43, 3.1, 79, NULL, 6.08, 17.2, 0.51, 83.7, 28.3, 33.8, 12.6, 15.01, 73.5, 11.03, 18.1, 2.71, 6.9, 1.04, 1.1, 0.17, 0.4, 0.06, 4.07, 388),
('18', 'Michael Maseti', 18, 497, 11, 28.8, 380, 4.6, 5.4, 36, 6.0, 5.0, 115, 78, 0.35, 61, 32, 26, 242, 2.34, 2.48, 0.87, 47, 1, 93, NULL, 5.13, 14.9, 0.45, 88.3, 29.0, 32.9, 12.2, 3.91, 31.8, 1.24, 56.5, 2.21, 8.4, 0.33, 2.8, 0.11, 0.5, 0.02, 0.56, 276),
('19', 'Aden Oerson', 19, 618, 18, 23.7, 109, 4.6, 5.8, 40, 6.6, 8.2, 98, 89, 0.31, 34, 18, 19, 193, 2.33, 2.51, 0.89, 49, 3.5, 78, NULL, 4.99, 15.4, 0.46, 93.0, 30.9, 33.2, 11.8, 6.26, 49.8, 3.12, 39.3, 2.46, 8.5, 0.53, 1.8, 0.11, 0.6, 0.04, 1.27, 251),
('20', 'Riego Heath', 20, 578, 21, 20.8, 174, 5.2, 5.3, 34, 5.8, 6.0, 93, 89, 0.38, 48, 32, 21, 184, 2.31, 2.43, 0.95, 46, NULL, NULL, NULL, 5.75, 17.3, 0.50, 86.4, 30.1, 34.8, 11.4, 5.84, 41.8, 2.44, 46.6, 2.72, 6.3, 0.37, 4.6, 0.27, 0.7, 0.04, 0.90, 218),
('21', 'Aldrich Wichman', 21, 541, 44, 28.5, 176, 5.4, 5.2, 33, 5.7, 5.5, 89, 89, 0.35, 34, 25, 25, 220, 2.25, 2.49, 0.88, 52, 1, 80, NULL, 5.22, 16.1, 0.47, 89.3, 30.8, 34.5, 12.1, 7.59, 51.5, 3.91, 34.5, 2.62, 6.7, 0.51, 6.9, 0.52, 0.4, 0.03, 1.49, 346),
('22', 'Juane De Klerk', 22, 416, 25, 22.9, 181, 4.5, 5.1, 32, 5.5, 7.6, 101, 89, 0.35, 11, 20, 25, 195, 2.32, 2.48, 0.82, 48, 1, 71, NULL, 4.84, 15.1, 0.44, 90.7, 31.2, 34.4, 12.1, 4.62, 27.5, 1.27, 54.5, 2.52, 10.4, 0.48, 6.7, 0.31, 0.9, 0.04, 0.50, 183);

-- Verify data insertion
SELECT
    COUNT(*) as total_records,
    COUNT(DISTINCT athlete_id) as unique_athletes,
    MIN(created_at) as earliest_record,
    MAX(created_at) as latest_record
FROM public.blood_results;

-- Show sample data
SELECT
    athlete_id,
    name,
    code,
    cortisol_nmol_l,
    vitamin_d,
    testosterone,
    hemoglobin,
    platelets,
    created_at
FROM public.blood_results
ORDER BY code
LIMIT 5;

COMMIT;