"CREATE TABLE public.alert_types (
    alert_type_id integer(32,0) DEFAULT nextval('alert_types_alert_type_id_seq'::regclass) NOT NULL,
    alert_type_name character varying(50) NOT NULL,
    alert_category character varying(50),
    severity character varying(20) NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL
);
"
"CREATE TABLE public.athlete_alerts (
    alert_id integer(32,0) DEFAULT nextval('athlete_alerts_alert_id_seq'::regclass) NOT NULL,
    athlete_id integer(32,0) NOT NULL,
    alert_type_id integer(32,0) NOT NULL,
    alert_title character varying(255) NOT NULL,
    alert_cause text,
    recommendation text,
    alert_date timestamp with time zone DEFAULT now() NOT NULL,
    is_resolved boolean DEFAULT false NOT NULL,
    resolved_date timestamp with time zone,
    resolved_by_user_id integer(32,0),
    notes text
);
"
"CREATE TABLE public.athlete_organization_history (
    athlete_org_history_id integer(32,0) DEFAULT nextval('athlete_organization_history_athlete_org_history_id_seq'::regclass) NOT NULL,
    athlete_id integer(32,0) NOT NULL,
    organization_id integer(32,0) NOT NULL,
    sport_id integer(32,0) NOT NULL,
    position character varying(100),
    jersey_number integer(32,0),
    start_date date NOT NULL,
    end_date date,
    contract_type character varying(50),
    is_active boolean DEFAULT true NOT NULL,
    created_date timestamp with time zone DEFAULT now() NOT NULL
);
"
"CREATE TABLE public.athletes (
    athlete_id integer(32,0) DEFAULT nextval('athletes_athlete_id_seq'::regclass) NOT NULL,
    athlete_code character varying(20) NOT NULL,
    user_id integer(32,0),
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    date_of_birth date NOT NULL,
    gender character(1) NOT NULL,
    height numeric(5,2),
    nationality character varying(100),
    emergency_contact_name character varying(200),
    emergency_contact_phone character varying(50),
    medical_notes text,
    is_active boolean DEFAULT true NOT NULL,
    created_date timestamp with time zone DEFAULT now() NOT NULL,
    modified_date timestamp with time zone DEFAULT now() NOT NULL
);
"
"CREATE TABLE public.biometric_data (
    biometric_id integer(32,0) DEFAULT nextval('biometric_data_biometric_id_seq'::regclass) NOT NULL,
    athlete_id integer(32,0) NOT NULL,
    measurement_date date NOT NULL,
    hrv_night integer(32,0),
    resting_hr integer(32,0),
    sleep_duration_hours numeric(4,2),
    deep_sleep_percent integer(32,0),
    rem_sleep_percent integer(32,0),
    light_sleep_percent integer(32,0),
    sleep_onset_time time without time zone,
    wake_time time without time zone,
    spo2_night numeric(5,2),
    respiratory_rate_night numeric(5,2),
    body_temperature numeric(4,2),
    training_load_percent integer(32,0),
    data_source character varying(100),
    data_quality character varying(50) DEFAULT 'Good'::character varying,
    notes text,
    created_date timestamp with time zone DEFAULT now() NOT NULL,
    modified_date timestamp with time zone DEFAULT now() NOT NULL
);
"
"CREATE TABLE public.body_composition (
    body_composition_id integer(32,0) DEFAULT nextval('body_composition_body_composition_id_seq'::regclass) NOT NULL,
    athlete_id integer(32,0) NOT NULL,
    measurement_date date NOT NULL,
    weight_kg numeric(5,2) NOT NULL,
    weight_range_min numeric(5,2),
    weight_range_max numeric(5,2),
    target_weight_kg numeric(5,2),
    weight_control_kg numeric(5,2),
    fat_mass_kg numeric(5,2),
    fat_mass_range_min numeric(5,2),
    fat_mass_range_max numeric(5,2),
    body_fat_rate numeric(5,2),
    fat_control_kg numeric(5,2),
    subcutaneous_fat_percent numeric(5,2),
    visceral_fat_grade integer(32,0),
    muscle_mass_kg numeric(5,2),
    muscle_mass_range_min numeric(5,2),
    muscle_mass_range_max numeric(5,2),
    skeletal_muscle_kg numeric(5,2),
    muscle_control_kg numeric(5,2),
    bmi numeric(5,2),
    basal_metabolic_rate_kcal integer(32,0),
    fat_free_body_weight_kg numeric(5,2),
    smi_kg_m2 numeric(5,2),
    body_age integer(32,0),
    measurement_method character varying(100),
    measurement_device character varying(100),
    technician_id integer(32,0),
    notes text,
    created_date timestamp with time zone DEFAULT now() NOT NULL
);
"
"CREATE TABLE public.body_symmetry (
    body_symmetry_id integer(32,0) DEFAULT nextval('body_symmetry_body_symmetry_id_seq'::regclass) NOT NULL,
    body_composition_id integer(32,0) NOT NULL,
    arm_mass_left_kg numeric(5,2),
    arm_mass_right_kg numeric(5,2),
    leg_mass_left_kg numeric(5,2),
    leg_mass_right_kg numeric(5,2),
    trunk_mass_kg numeric(5,2),
    arm_imbalance_percent numeric(5,2),
    leg_imbalance_percent numeric(5,2),
    created_date timestamp with time zone DEFAULT now() NOT NULL
);
"
"CREATE TABLE public.genes (
    gene_id integer(32,0) DEFAULT nextval('genes_gene_id_seq'::regclass) NOT NULL,
    gene_name character varying(50) NOT NULL,
    gene_description text,
    chromosome character varying(10),
    function text,
    category character varying(100)
);
"
"CREATE TABLE public.genetic_profiles (
    genetic_profile_id integer(32,0) DEFAULT nextval('genetic_profiles_genetic_profile_id_seq'::regclass) NOT NULL,
    test_result_id integer(32,0) NOT NULL,
    gene_id integer(32,0) NOT NULL,
    genotype character varying(50) NOT NULL,
    confidence numeric(5,2),
    raw_data text,
    created_date timestamp with time zone DEFAULT now() NOT NULL
);
"
"CREATE TABLE public.genetic_test_results (
    test_result_id integer(32,0) DEFAULT nextval('genetic_test_results_test_result_id_seq'::regclass) NOT NULL,
    athlete_id integer(32,0) NOT NULL,
    test_type_id integer(32,0) NOT NULL,
    test_date date NOT NULL,
    test_lab_id character varying(100),
    test_status character varying(50) DEFAULT 'Completed'::character varying NOT NULL,
    notes text,
    created_date timestamp with time zone DEFAULT now() NOT NULL
);
"
"CREATE TABLE public.genetic_test_types (
    test_type_id integer(32,0) DEFAULT nextval('genetic_test_types_test_type_id_seq'::regclass) NOT NULL,
    test_name character varying(100) NOT NULL,
    test_provider character varying(100),
    test_description text,
    test_version character varying(50),
    is_active boolean DEFAULT true NOT NULL
);
"
"CREATE TABLE public.organizations (
    organization_id integer(32,0) DEFAULT nextval('organizations_organization_id_seq'::regclass) NOT NULL,
    organization_name character varying(255) NOT NULL,
    organization_type character varying(50) NOT NULL,
    country character varying(100),
    city character varying(100),
    address text,
    contact_email character varying(255),
    contact_phone character varying(50),
    website character varying(255),
    is_active boolean DEFAULT true NOT NULL,
    created_date timestamp with time zone DEFAULT now() NOT NULL,
    modified_date timestamp with time zone DEFAULT now() NOT NULL
);
"
"CREATE TABLE public.readiness_scores (
    readiness_score_id integer(32,0) DEFAULT nextval('readiness_scores_readiness_score_id_seq'::regclass) NOT NULL,
    athlete_id integer(32,0) NOT NULL,
    score_date date NOT NULL,
    readiness_score numeric(5,2) NOT NULL,
    hrv_score numeric(5,2),
    resting_hr_score numeric(5,2),
    sleep_score numeric(5,2),
    spo2_score numeric(5,2),
    calculation_method character varying(100),
    created_date timestamp with time zone DEFAULT now() NOT NULL
);
"
"CREATE TABLE public.sports (
    sport_id integer(32,0) DEFAULT nextval('sports_sport_id_seq'::regclass) NOT NULL,
    sport_name character varying(100) NOT NULL,
    sport_category character varying(50),
    description text,
    is_active boolean DEFAULT true NOT NULL
);
"
"CREATE TABLE public.training_load_trends (
    trend_id integer(32,0) DEFAULT nextval('training_load_trends_trend_id_seq'::regclass) NOT NULL,
    athlete_id integer(32,0) NOT NULL,
    week_start_date date NOT NULL,
    average_load numeric(5,2),
    load_trend character varying(50),
    trend_value numeric(5,2),
    created_date timestamp with time zone DEFAULT now() NOT NULL
);
"
"CREATE TABLE public.user_organization_roles (
    user_org_role_id integer(32,0) DEFAULT nextval('user_organization_roles_user_org_role_id_seq'::regclass) NOT NULL,
    user_id integer(32,0) NOT NULL,
    organization_id integer(32,0) NOT NULL,
    role_id integer(32,0) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    assigned_date timestamp with time zone DEFAULT now() NOT NULL,
    assigned_by_user_id integer(32,0)
);
"
"CREATE TABLE public.user_roles (
    role_id integer(32,0) DEFAULT nextval('user_roles_role_id_seq'::regclass) NOT NULL,
    role_name character varying(50) NOT NULL,
    description character varying(255),
    permissions jsonb
);
"
"CREATE TABLE public.users (
    user_id integer(32,0) DEFAULT nextval('users_user_id_seq'::regclass) NOT NULL,
    username character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    salt character varying(255) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    phone_number character varying(50),
    is_active boolean DEFAULT true NOT NULL,
    is_email_verified boolean DEFAULT false NOT NULL,
    last_login_date timestamp with time zone,
    created_date timestamp with time zone DEFAULT now() NOT NULL,
    modified_date timestamp with time zone DEFAULT now() NOT NULL
);
"
"CREATE TABLE public.vw_current_athletes (
    athlete_id integer(32,0),
    athlete_code character varying(20),
    first_name character varying(100),
    last_name character varying(100),
    date_of_birth date,
    age numeric,
    gender character(1),
    height numeric(5,2),
    team character varying(255),
    sport character varying(100),
    position character varying(100),
    jersey_number integer(32,0),
    start_date date
);
"
"CREATE TABLE public.vw_latest_biometric_data (
    biometric_id integer(32,0),
    athlete_id integer(32,0),
    measurement_date date,
    hrv_night integer(32,0),
    resting_hr integer(32,0),
    sleep_duration_hours numeric(4,2),
    deep_sleep_percent integer(32,0),
    rem_sleep_percent integer(32,0),
    light_sleep_percent integer(32,0),
    sleep_onset_time time without time zone,
    wake_time time without time zone,
    spo2_night numeric(5,2),
    respiratory_rate_night numeric(5,2),
    body_temperature numeric(4,2),
    training_load_percent integer(32,0),
    data_source character varying(100),
    data_quality character varying(50),
    notes text,
    created_date timestamp with time zone,
    modified_date timestamp with time zone,
    athlete_code character varying(20),
    first_name character varying(100),
    last_name character varying(100)
);
"
"CREATE TABLE public.vw_latest_body_composition (
    body_composition_id integer(32,0),
    athlete_id integer(32,0),
    measurement_date date,
    weight_kg numeric(5,2),
    weight_range_min numeric(5,2),
    weight_range_max numeric(5,2),
    target_weight_kg numeric(5,2),
    weight_control_kg numeric(5,2),
    fat_mass_kg numeric(5,2),
    fat_mass_range_min numeric(5,2),
    fat_mass_range_max numeric(5,2),
    body_fat_rate numeric(5,2),
    fat_control_kg numeric(5,2),
    subcutaneous_fat_percent numeric(5,2),
    visceral_fat_grade integer(32,0),
    muscle_mass_kg numeric(5,2),
    muscle_mass_range_min numeric(5,2),
    muscle_mass_range_max numeric(5,2),
    skeletal_muscle_kg numeric(5,2),
    muscle_control_kg numeric(5,2),
    bmi numeric(5,2),
    basal_metabolic_rate_kcal integer(32,0),
    fat_free_body_weight_kg numeric(5,2),
    smi_kg_m2 numeric(5,2),
    body_age integer(32,0),
    measurement_method character varying(100),
    measurement_device character varying(100),
    technician_id integer(32,0),
    notes text,
    created_date timestamp with time zone,
    arm_mass_left_kg numeric(5,2),
    arm_mass_right_kg numeric(5,2),
    leg_mass_left_kg numeric(5,2),
    leg_mass_right_kg numeric(5,2),
    trunk_mass_kg numeric(5,2),
    athlete_code character varying(20),
    first_name character varying(100),
    last_name character varying(100)
);
"
"CREATE TABLE public.blood_results (
    id integer(32,0) DEFAULT nextval('blood_results_id_seq'::regclass) NOT NULL,
    athlete_id character varying(20) NOT NULL,
    name character varying(255) NOT NULL,
    code integer(32,0) NOT NULL,
    date date,
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
"