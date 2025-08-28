-- ===========================================
-- Sports Performance Database Setup Script
-- ===========================================
-- This script creates all necessary tables for the Sports Performance Monitoring System

-- Create database (run this separately if needed)
-- CREATE DATABASE sports_performance_db;

-- Connect to the database
-- \c sports_performance_db;

-- ===========================================
-- USER MANAGEMENT TABLES
-- ===========================================

-- User Roles Table
CREATE TABLE IF NOT EXISTS user_roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT INTO user_roles (role_name, description) VALUES
('SuperAdmin', 'Full system access and administration'),
('OrgAdmin', 'Organization-level administration'),
('Coach', 'Team coach with athlete management access'),
('Athlete', 'Athlete with personal data access')
ON CONFLICT (role_name) DO NOTHING;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_number VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    is_email_verified BOOLEAN DEFAULT false,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_date TIMESTAMP
);

-- Organizations Table
CREATE TABLE IF NOT EXISTS organizations (
    organization_id SERIAL PRIMARY KEY,
    organization_name VARCHAR(255) UNIQUE NOT NULL,
    organization_type VARCHAR(50),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default organization
INSERT INTO organizations (organization_name, organization_type) VALUES
('Default Organization', 'Sports Club')
ON CONFLICT (organization_name) DO NOTHING;

-- User Organization Roles Table
CREATE TABLE IF NOT EXISTS user_organization_roles (
    user_organization_role_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    organization_id INTEGER REFERENCES organizations(organization_id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES user_roles(role_id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- ATHLETE MANAGEMENT TABLES
-- ===========================================

-- Sports Table
CREATE TABLE IF NOT EXISTS sports (
    sport_id SERIAL PRIMARY KEY,
    sport_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default sports
INSERT INTO sports (sport_name, description) VALUES
('Rugby', 'Full contact rugby'),
('Soccer', 'Association football'),
('Athletics', 'Track and field sports'),
('Swimming', 'Competitive swimming'),
('Tennis', 'Racket sport'),
('Other', 'Other sports')
ON CONFLICT (sport_name) DO NOTHING;

-- Athletes Table
CREATE TABLE IF NOT EXISTS athletes (
    athlete_id SERIAL PRIMARY KEY,
    athlete_code VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(10),
    height DECIMAL(5,2), -- in cm
    weight DECIMAL(5,2), -- in kg
    nationality VARCHAR(100),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    medical_notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Athlete Organization History Table
CREATE TABLE IF NOT EXISTS athlete_organization_history (
    history_id SERIAL PRIMARY KEY,
    athlete_id INTEGER REFERENCES athletes(athlete_id) ON DELETE CASCADE,
    organization_id INTEGER REFERENCES organizations(organization_id) ON DELETE CASCADE,
    sport_id INTEGER REFERENCES sports(sport_id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE,
    position VARCHAR(100),
    jersey_number INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- BIOMETRIC DATA TABLES
-- ===========================================

-- Biometric Data Table
CREATE TABLE IF NOT EXISTS biometric_data (
    biometric_id SERIAL PRIMARY KEY,
    athlete_id INTEGER REFERENCES athletes(athlete_id) ON DELETE CASCADE,
    measurement_date DATE NOT NULL,
    hrv_night DECIMAL(5,2),
    resting_hr INTEGER,
    spo2_night DECIMAL(5,2),
    respiratory_rate_night DECIMAL(5,2),
    deep_sleep_percent DECIMAL(5,2),
    rem_sleep_percent DECIMAL(5,2),
    light_sleep_percent DECIMAL(5,2),
    sleep_duration_hours DECIMAL(4,2),
    body_temperature DECIMAL(4,2),
    training_load_percent DECIMAL(5,2),
    sleep_onset_time TIME,
    wake_time TIME,
    data_source VARCHAR(50) DEFAULT 'Manual',
    data_quality VARCHAR(20) DEFAULT 'Good',
    notes TEXT,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Body Composition Table
CREATE TABLE IF NOT EXISTS body_composition (
    body_composition_id SERIAL PRIMARY KEY,
    athlete_id INTEGER REFERENCES athletes(athlete_id) ON DELETE CASCADE,
    measurement_date DATE NOT NULL,
    weight_kg DECIMAL(6,2),
    height_cm DECIMAL(5,2),
    bmi DECIMAL(5,2),
    body_fat_rate DECIMAL(5,2),
    muscle_mass_kg DECIMAL(6,2),
    fat_mass_kg DECIMAL(6,2),
    visceral_fat_grade INTEGER,
    bone_mass_kg DECIMAL(5,2),
    body_water_rate DECIMAL(5,2),
    protein_rate DECIMAL(5,2),
    basal_metabolic_rate INTEGER,
    skeletal_muscle_rate DECIMAL(5,2),
    data_source VARCHAR(50) DEFAULT 'Manual',
    notes TEXT,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Body Symmetry Table
CREATE TABLE IF NOT EXISTS body_symmetry (
    body_symmetry_id SERIAL PRIMARY KEY,
    body_composition_id INTEGER REFERENCES body_composition(body_composition_id) ON DELETE CASCADE,
    left_arm_fat DECIMAL(5,2),
    right_arm_fat DECIMAL(5,2),
    left_leg_fat DECIMAL(5,2),
    right_leg_fat DECIMAL(5,2),
    trunk_fat DECIMAL(5,2),
    left_arm_muscle DECIMAL(5,2),
    right_arm_muscle DECIMAL(5,2),
    left_leg_muscle DECIMAL(5,2),
    right_leg_muscle DECIMAL(5,2),
    trunk_muscle DECIMAL(5,2),
    symmetry_score DECIMAL(5,2),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- GENETIC TESTING TABLES
-- ===========================================

-- Genes Table
CREATE TABLE IF NOT EXISTS genes (
    gene_id SERIAL PRIMARY KEY,
    gene_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(100),
    chromosome VARCHAR(10),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Genetic Test Types Table
CREATE TABLE IF NOT EXISTS genetic_test_types (
    test_type_id SERIAL PRIMARY KEY,
    test_name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    lab_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Genetic Test Results Table
CREATE TABLE IF NOT EXISTS genetic_test_results (
    test_result_id SERIAL PRIMARY KEY,
    athlete_id INTEGER REFERENCES athletes(athlete_id) ON DELETE CASCADE,
    test_type_id INTEGER REFERENCES genetic_test_types(test_type_id) ON DELETE CASCADE,
    test_date DATE NOT NULL,
    lab_name VARCHAR(255),
    test_status VARCHAR(50) DEFAULT 'Pending',
    report_url VARCHAR(500),
    notes TEXT,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Genetic Profiles Table
CREATE TABLE IF NOT EXISTS genetic_profiles (
    profile_id SERIAL PRIMARY KEY,
    test_result_id INTEGER REFERENCES genetic_test_results(test_result_id) ON DELETE CASCADE,
    gene_id INTEGER REFERENCES genes(gene_id) ON DELETE CASCADE,
    genotype VARCHAR(50),
    interpretation TEXT,
    risk_level VARCHAR(20),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- READINESS AND PERFORMANCE TABLES
-- ===========================================

-- Readiness Scores Table
CREATE TABLE IF NOT EXISTS readiness_scores (
    readiness_score_id SERIAL PRIMARY KEY,
    athlete_id INTEGER REFERENCES athletes(athlete_id) ON DELETE CASCADE,
    score_date DATE NOT NULL,
    readiness_score INTEGER CHECK (readiness_score >= 0 AND readiness_score <= 100),
    fatigue_level INTEGER CHECK (fatigue_level >= 1 AND fatigue_level <= 10),
    sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
    muscle_soreness INTEGER CHECK (muscle_soreness >= 1 AND muscle_soreness <= 10),
    stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),
    motivation_level INTEGER CHECK (motivation_level >= 1 AND motivation_level <= 10),
    notes TEXT,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Training Load Trends Table
CREATE TABLE IF NOT EXISTS training_load_trends (
    training_load_id SERIAL PRIMARY KEY,
    athlete_id INTEGER REFERENCES athletes(athlete_id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    total_distance_km DECIMAL(8,2),
    total_duration_hours DECIMAL(6,2),
    average_intensity DECIMAL(5,2),
    training_stress_score DECIMAL(6,2),
    monotony DECIMAL(5,2),
    strain DECIMAL(8,2),
    acute_load DECIMAL(8,2),
    chronic_load DECIMAL(8,2),
    acute_chronic_ratio DECIMAL(5,2),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- ALERTS AND MONITORING TABLES
-- ===========================================

-- Alert Types Table
CREATE TABLE IF NOT EXISTS alert_types (
    alert_type_id SERIAL PRIMARY KEY,
    alert_type_name VARCHAR(100) UNIQUE NOT NULL,
    severity VARCHAR(20) CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Athlete Alerts Table
CREATE TABLE IF NOT EXISTS athlete_alerts (
    athlete_alert_id SERIAL PRIMARY KEY,
    athlete_id INTEGER REFERENCES athletes(athlete_id) ON DELETE CASCADE,
    alert_type_id INTEGER REFERENCES alert_types(alert_type_id) ON DELETE CASCADE,
    alert_title VARCHAR(255) NOT NULL,
    alert_message TEXT,
    alert_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_resolved BOOLEAN DEFAULT false,
    resolved_date TIMESTAMP,
    resolved_by INTEGER REFERENCES users(user_id),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- INDEXES FOR PERFORMANCE
-- ===========================================

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Athlete indexes
CREATE INDEX IF NOT EXISTS idx_athletes_code ON athletes(athlete_code);
CREATE INDEX IF NOT EXISTS idx_athletes_active ON athletes(is_active);
CREATE INDEX IF NOT EXISTS idx_athletes_name ON athletes(last_name, first_name);

-- Biometric data indexes
CREATE INDEX IF NOT EXISTS idx_biometric_athlete_date ON biometric_data(athlete_id, measurement_date);
CREATE INDEX IF NOT EXISTS idx_biometric_date ON biometric_data(measurement_date);

-- Body composition indexes
CREATE INDEX IF NOT EXISTS idx_bodycomp_athlete_date ON body_composition(athlete_id, measurement_date);
CREATE INDEX IF NOT EXISTS idx_bodycomp_date ON body_composition(measurement_date);

-- Genetic data indexes
CREATE INDEX IF NOT EXISTS idx_genetic_athlete ON genetic_test_results(athlete_id);
CREATE INDEX IF NOT EXISTS idx_genetic_date ON genetic_test_results(test_date);
CREATE INDEX IF NOT EXISTS idx_genetic_status ON genetic_test_results(test_status);

-- Alert indexes
CREATE INDEX IF NOT EXISTS idx_alerts_athlete ON athlete_alerts(athlete_id);
CREATE INDEX IF NOT EXISTS idx_alerts_date ON athlete_alerts(alert_date);
CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON athlete_alerts(is_resolved);

-- ===========================================
-- DEFAULT DATA INSERTION
-- ===========================================

-- Insert some sample athletes for testing
INSERT INTO athletes (athlete_code, first_name, last_name, date_of_birth, gender) VALUES
('ATH001', 'John', 'Doe', '1995-05-15', 'Male'),
('ATH002', 'Jane', 'Smith', '1997-08-22', 'Female'),
('ATH003', 'Mike', 'Johnson', '1993-12-10', 'Male')
ON CONFLICT (athlete_code) DO NOTHING;

-- Insert sample alert types
INSERT INTO alert_types (alert_type_name, severity, description) VALUES
('High Resting Heart Rate', 'Medium', 'Resting heart rate is above normal range'),
('Low Sleep Duration', 'Medium', 'Sleep duration is below recommended levels'),
('High Training Load', 'High', 'Training load exceeds safe limits'),
('Injury Risk', 'High', 'Multiple indicators suggest injury risk'),
('Recovery Delay', 'Medium', 'Recovery metrics indicate delayed recovery')
ON CONFLICT (alert_type_name) DO NOTHING;

-- ===========================================
-- PERMISSIONS AND SECURITY
-- ===========================================

-- Note: In a production environment, you would also want to:
-- 1. Set up proper database user roles and permissions
-- 2. Implement row-level security policies
-- 3. Set up database triggers for audit logging
-- 4. Configure backup and recovery procedures

COMMIT;

-- Display setup completion message
SELECT
    'Database setup completed successfully!' as status,
    CURRENT_TIMESTAMP as setup_time,
    (SELECT COUNT(*) FROM users) as user_count,
    (SELECT COUNT(*) FROM athletes) as athlete_count,
    (SELECT COUNT(*) FROM organizations) as organization_count;