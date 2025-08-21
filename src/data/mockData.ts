import { Athlete, BiometricData, GeneticProfile, BodyComposition } from '../types';

// === ATHLETES (Rugby Sevens Team) ===
export const athletes: Athlete[] = [
  { athlete_id: 'ATH001', name: 'Aden Oerson', sport: 'Rugby Sevens', age: 22, team: 'Rugby Sevens Team' },
  { athlete_id: 'ATH002', name: 'Aldrich Wichman', sport: 'Rugby Sevens', age: 19, team: 'Rugby Sevens Team' },
  { athlete_id: 'ATH003', name: 'Bowen Bezuidenhoudt', sport: 'Rugby Sevens', age: 23, team: 'Rugby Sevens Team' },
  { athlete_id: 'ATH004', name: 'Christiaan Tromp', sport: 'Rugby Sevens', age: 22, team: 'Rugby Sevens Team' },
  { athlete_id: 'ATH005', name: 'Dijan Labuschagne', sport: 'Rugby Sevens', age: 19, team: 'Rugby Sevens Team' },
  { athlete_id: 'ATH006', name: 'Ethan Gordon', sport: 'Rugby Sevens', age: 20, team: 'Rugby Sevens Team' },
  { athlete_id: 'ATH007', name: 'George Evans', sport: 'Rugby Sevens', age: 18, team: 'Rugby Sevens Team' },
  { athlete_id: 'ATH008', name: 'Ethan Isaacs', sport: 'Rugby Sevens', age: 21, team: 'Rugby Sevens Team', date_of_birth: '2003/09/09' },
  { athlete_id: 'ATH009', name: 'James Nero', sport: 'Rugby Sevens', age: 20, team: 'Rugby Sevens Team' },
  { athlete_id: 'ATH010', name: 'Joshua De Kock', sport: 'Rugby Sevens', age: 23, team: 'Rugby Sevens Team' },
  { athlete_id: 'ATH011', name: 'Juanre De Klerk', sport: 'Rugby Sevens', age: 19, team: 'Rugby Sevens Team' },
  { athlete_id: 'ATH012', name: 'Lezane Botto', sport: 'Rugby Sevens', age: 19, team: 'Rugby Sevens Team' },
  { athlete_id: 'ATH013', name: 'Luke Prest', sport: 'Rugby Sevens', age: 18, team: 'Rugby Sevens Team' },
  { athlete_id: 'ATH014', name: 'Marquel Miller', sport: 'Rugby Sevens', age: 18, team: 'Rugby Sevens Team' },
  { athlete_id: 'ATH015', name: 'Matthew Jacobs', sport: 'Rugby Sevens', age: 23, team: 'Rugby Sevens Team' },
  { athlete_id: 'ATH016', name: 'Michael Maseti', sport: 'Rugby Sevens', age: 21, team: 'Rugby Sevens Team' },
  { athlete_id: 'ATH017', name: 'Nicholas Fritz', sport: 'Rugby Sevens', age: 18, team: 'Rugby Sevens Team' },
  { athlete_id: 'ATH018', name: 'Riego Heath', sport: 'Rugby Sevens', age: 22, team: 'Rugby Sevens Team' },
  { athlete_id: 'ATH019', name: 'Ritchie Mitchell', sport: 'Rugby Sevens', age: 20, team: 'Rugby Sevens Team' },
  { athlete_id: 'ATH020', name: 'Siphiwe Mazibuko', sport: 'Rugby Sevens', age: 27, team: 'Rugby Sevens Team' },
  { athlete_id: 'ATH021', name: 'Souheil Tahiri', sport: 'Rugby Sevens', age: 18, team: 'Rugby Sevens Team' },
  { athlete_id: 'ATH022', name: 'Steffan De Jongh', sport: 'Rugby Sevens', age: 18, team: 'Rugby Sevens Team' },
  { athlete_id: 'ATH023', name: 'Torbyn Visser', sport: 'Rugby Sevens', age: 22, team: 'Rugby Sevens Team' },
  { athlete_id: 'ATH024', name: 'Emile Demant', sport: 'Rugby Sevens', age: 24, team: 'Rugby Sevens Team' }
];

// === BIOMETRIC DATA (10 weeks: Jul 10 - Sep 18) ===
export const biometricData: BiometricData[] = [
  // Generate biometric data for all 24 rugby players
  ...Array.from({ length: 24 }, (_, athleteIndex) => {
    const athleteId = `ATH${String(athleteIndex + 1).padStart(3, '0')}`;
    return Array.from({ length: 70 }, (_, i) => {
      const date = new Date(2025, 6, 10 + i).toISOString().split('T')[0]; // 2025-07-10 to 2025-09-18
      
      // Generate rugby-specific biometric patterns
      // HRV varies based on training intensity and recovery
      const hrv = 40 + Math.sin(i * 0.4) * 5 + Math.random() * 3;
      
      // Resting heart rate for rugby players (typically 50-70 bpm)
      const restingHr = 55 + Math.random() * 15;
      
      // Blood oxygen saturation (typically 95-100%)
      const spo2 = 96.0 + Math.random() * 3.5;
      
      // Respiratory rate (typically 12-20 breaths per minute)
      const respRate = 14 + Math.random() * 5;
      
      // Sleep patterns for athletes
      const deepSleep = 15 + Math.random() * 10;
      const remSleep = 15 + Math.random() * 8;
      const lightSleep = 100 - deepSleep - remSleep;
      const sleepDuration = 7 + Math.random() * 2;
      
      // Temperature trends
      const tempTrend = 36.8 + Math.random() * 0.4;
      
      // Training load percentage
      const trainingLoad = 70 + Math.random() * 30;
      
      // Sleep timing
      const sleepOnsetHours = 22 + Math.floor(Math.random() * 2);
      const sleepOnsetMinutes = Math.floor(Math.random() * 60);
      const wakeHours = 6 + Math.floor(Math.random() * 2);
      const wakeMinutes = Math.floor(Math.random() * 60);
      const sleepOnsetTime = `${String(sleepOnsetHours).padStart(2, '0')}:${String(sleepOnsetMinutes).padStart(2, '0')}`;
      const wakeTime = `${String(wakeHours).padStart(2, '0')}:${String(wakeMinutes).padStart(2, '0')}`;
      
      return {
        athlete_id: athleteId,
        date,
        hrv_night: Math.round(hrv),
        resting_hr: Math.round(restingHr),
        spo2_night: parseFloat(spo2.toFixed(1)),
        resp_rate_night: parseFloat(respRate.toFixed(1)),
        deep_sleep_pct: Math.round(deepSleep),
        rem_sleep_pct: Math.round(remSleep),
        light_sleep_pct: Math.round(lightSleep),
        sleep_duration_h: parseFloat(sleepDuration.toFixed(1)),
        temp_trend_c: parseFloat(tempTrend.toFixed(1)),
        training_load_pct: Math.round(trainingLoad),
        sleep_onset_time: sleepOnsetTime,
        wake_time: wakeTime
      };
    });
  }).flat()
];

// === GENETIC PROFILES (All 23 athletes) ===
export const geneticProfiles: GeneticProfile[] = [
  // Generate genetic profiles for all 24 rugby players
  ...Array.from({ length: 24 }, (_, athleteIndex) => {
    const athleteId = `ATH${String(athleteIndex + 1).padStart(3, '0')}`;
    // Common genetic markers relevant to athletic performance and recovery
    const genes = [
      'ACTN3', 'ACE', 'PPARGC1A', 'ADRB2', 'VDR', 'COL1A1',
      // Additional genes for enhanced features
      'IL6', 'TNF', 'IL10', 'ADRB1', 'CLOCK', 'HSD11B1', 'COMT',
      'MTHFR', 'FTO', 'NOS3', 'SLCO1B1', 'VKORC1', 'CFTR', 'CYP2D6', 'CYP2C19'
    ];
    return genes.map(gene => {
      // Generate random genotypes for each gene
      let genotype = '';
      switch (gene) {
        case 'ACTN3':
          // ACTN3 gene variants (R/R, R/X, X/X)
          const actn3Variants = ['RR', 'RX', 'XX'];
          genotype = actn3Variants[Math.floor(Math.random() * actn3Variants.length)];
          break;
        case 'ACE':
          // ACE gene variants (I/I, I/D, D/D)
          const aceVariants = ['II', 'ID', 'DD'];
          genotype = aceVariants[Math.floor(Math.random() * aceVariants.length)];
          break;
        case 'PPARGC1A':
          // PPARGC1A gene variants
          const ppargc1aVariants = ['Gly482Gly', 'Ser482Ser', 'Gly482Ser'];
          genotype = ppargc1aVariants[Math.floor(Math.random() * ppargc1aVariants.length)];
          break;
        case 'ADRB2':
          // ADRB2 gene variants
          const adrb2Variants = ['Arg16Arg', 'Arg16Gly', 'Gly16Gly'];
          genotype = adrb2Variants[Math.floor(Math.random() * adrb2Variants.length)];
          break;
        case 'VDR':
          // VDR gene variants
          const vdrVariants = ['FF', 'Ff', 'ff'];
          genotype = vdrVariants[Math.floor(Math.random() * vdrVariants.length)];
          break;
        case 'COL1A1':
          // COL1A1 gene variants
          const col1a1Variants = ['SS', 'SP', 'PP'];
          genotype = col1a1Variants[Math.floor(Math.random() * col1a1Variants.length)];
          break;
        case 'IL6':
          // IL6 gene variants (-174 G/C)
          const il6Variants = ['GG', 'GC', 'CC'];
          genotype = il6Variants[Math.floor(Math.random() * il6Variants.length)];
          break;
        case 'TNF':
          // TNF gene variants (-308 G/A)
          const tnfVariants = ['GG', 'GA', 'AA'];
          genotype = tnfVariants[Math.floor(Math.random() * tnfVariants.length)];
          break;
        case 'IL10':
          // IL10 gene variants (-1082 G/A)
          const il10Variants = ['GG', 'GA', 'AA'];
          genotype = il10Variants[Math.floor(Math.random() * il10Variants.length)];
          break;
        case 'ADRB1':
          // ADRB1 gene variants (Arg389Gly)
          const adrb1Variants = ['AA', 'AG', 'GG'];
          genotype = adrb1Variants[Math.floor(Math.random() * adrb1Variants.length)];
          break;
        case 'CLOCK':
          // CLOCK gene variants (3111 T/C)
          const clockVariants = ['TT', 'TC', 'CC'];
          genotype = clockVariants[Math.floor(Math.random() * clockVariants.length)];
          break;
        case 'HSD11B1':
          // HSD11B1 gene variants (537 T/C)
          const hsd11b1Variants = ['TT', 'TC', 'CC'];
          genotype = hsd11b1Variants[Math.floor(Math.random() * hsd11b1Variants.length)];
          break;
        case 'COMT':
          // COMT gene variants (Val158Met)
          const comtVariants = ['AA', 'AG', 'GG']; // Val/Val, Val/Met, Met/Met
          genotype = comtVariants[Math.floor(Math.random() * comtVariants.length)];
          break;
        case 'MTHFR':
          // MTHFR gene variants (C677T)
          const mthfrVariants = ['CC', 'CT', 'TT'];
          genotype = mthfrVariants[Math.floor(Math.random() * mthfrVariants.length)];
          break;
        case 'FTO':
          // FTO gene variants (rs9939609 A/T)
          const ftoVariants = ['AA', 'AT', 'TT'];
          genotype = ftoVariants[Math.floor(Math.random() * ftoVariants.length)];
          break;
        case 'NOS3':
          // NOS3 gene variants (G894T)
          const nos3Variants = ['GG', 'GT', 'TT'];
          genotype = nos3Variants[Math.floor(Math.random() * nos3Variants.length)];
          break;
        case 'SLCO1B1':
          // SLCO1B1 gene variants (521 T/C)
          const slco1b1Variants = ['TT', 'TC', 'CC'];
          genotype = slco1b1Variants[Math.floor(Math.random() * slco1b1Variants.length)];
          break;
        case 'VKORC1':
          // VKORC1 gene variants (-1639 G/A)
          const vkorc1Variants = ['GG', 'GA', 'AA'];
          genotype = vkorc1Variants[Math.floor(Math.random() * vkorc1Variants.length)];
          break;
        case 'CFTR':
          // CFTR gene variants (F508del)
          const cftrVariants = ['FF', 'Fdel', 'deldel'];
          genotype = cftrVariants[Math.floor(Math.random() * cftrVariants.length)];
          break;
        case 'CYP2D6':
          // CYP2D6 gene variants (metabolizer status)
          const cyp2d6Variants = ['Poor', 'Intermediate', 'Extensive', 'Ultra'];
          genotype = cyp2d6Variants[Math.floor(Math.random() * cyp2d6Variants.length)] + ' Metabolizer';
          break;
        case 'CYP2C19':
          // CYP2C19 gene variants (metabolizer status)
          const cyp2c19Variants = ['Poor', 'Intermediate', 'Extensive', 'Ultra'];
          genotype = cyp2c19Variants[Math.floor(Math.random() * cyp2c19Variants.length)] + ' Metabolizer';
          break;
        default:
          genotype = 'Unknown';
      }
      return {
        athlete_id: athleteId,
        gene: gene,
        genotype: genotype
      };
    });
  }).flat()
];

// === BODY COMPOSITION (Daily measurements from 2025-07-01) ===
export const bodyCompositionData: BodyComposition[] = [
  // Generate body composition data for all 24 rugby players
  ...Array.from({ length: 24 }, (_, athleteIndex) => {
    const athleteId = `ATH${String(athleteIndex + 1).padStart(3, '0')}`;
    
    // Generate 30 days of data for each athlete (from 2025-07-01 to 2025-07-30)
    return Array.from({ length: 30 }, (_, dayIndex) => {
      // Base values for rugby players
      const baseWeight = 80 + Math.random() * 20; // 80-100 kg
      const weightChange = (Math.random() - 0.5) * 0.2; // +/- 0.1 kg per day
      const weight = baseWeight + weightChange * dayIndex;
      
      // Fat mass (typically 10-20% for male rugby players)
      const fatPercent = 12 + Math.random() * 8;
      const fatMass = weight * (fatPercent / 100);
      
      // Muscle mass (typically 40-50% of body weight for athletes)
      const musclePercent = 45 + Math.random() * 5;
      const muscleMass = weight * (musclePercent / 100);
      
      // Skeletal muscle (typically 80-90% of muscle mass)
      const skeletalMuscle = muscleMass * (0.85 + Math.random() * 0.05);
      
      // Body fat rate
      const bodyFatRate = fatPercent;
      
      // BMI calculation (assuming average height of 1.8m for rugby players)
      const height = 1.75 + Math.random() * 0.15; // 1.75-1.9m
      const bmi = weight / (height * height);
      
      // Weight range (target weight +/- 0.5-1 kg)
      const weightRangeMin = weight - 0.5 - Math.random() * 0.5;
      const weightRangeMax = weight + 0.5 + Math.random() * 0.5;
      
      // Fat mass range
      const fatMassRangeMin = fatMass * 0.9;
      const fatMassRangeMax = fatMass * 1.1;
      
      // Muscle mass range
      const muscleMassRangeMin = muscleMass * 0.95;
      const muscleMassRangeMax = muscleMass * 1.05;
      
      // Weight control (change from previous day)
      const weightControl = dayIndex === 0 ? 0 : weightChange;
      
      // Fat control (change from previous day)
      const fatControl = dayIndex === 0 ? 0 : (fatMass - (weight * (12 + Math.random() * 8) / 100)) / dayIndex;
      
      // Muscle control (change from previous day)
      const muscleControl = dayIndex === 0 ? 0 : (muscleMass - (weight * (45 + Math.random() * 5) / 100)) / dayIndex;
      
      // Visceral fat grade (1-4, with 1-2 being healthy for athletes)
      const visceralFatGrade = 1 + Math.floor(Math.random() * 2);
      
      // Basal metabolic rate (based on weight and muscle mass)
      const basalMetabolicRate = 1500 + weight * 10 + Math.random() * 200;
      
      // Fat free body weight
      const fatFreeBodyWeight = weight - fatMass;
      
      // Subcutaneous fat percent
      const subcutaneousFatPercent = bodyFatRate * (0.7 + Math.random() * 0.2);
      
      // Skeletal muscle index (SMI)
      const smi = skeletalMuscle / (height * height);
      
      // Body age (typically close to chronological age for athletes)
      const chronologicalAge = [22, 19, 23, 22, 19, 20, 18, 23, 20, 23, 19, 19, 18, 18, 23, 21, 18, 22, 20, 27, 18, 18, 22, 24][athleteIndex];
      const bodyAge = chronologicalAge + Math.floor(Math.random() * 3) - 1;
      
      // Symmetry measurements (arm and leg mass)
      const armMassLeft = (muscleMass * 0.15) * (0.95 + Math.random() * 0.1);
      const armMassRight = (muscleMass * 0.15) * (0.95 + Math.random() * 0.1);
      const legMassLeft = (muscleMass * 0.35) * (0.95 + Math.random() * 0.1);
      const legMassRight = (muscleMass * 0.35) * (0.95 + Math.random() * 0.1);
      const trunkMass = muscleMass * 0.35;
      
      // Generate daily dates starting from 2025-07-01
      const startDate = new Date(2025, 6, 1); // July is month 6 (0-indexed)
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + dayIndex);
      
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const date = `${year}-${month}-${day}`;
      
      return {
        athlete_id: athleteId,
        date: date,
        weight_kg: parseFloat(weight.toFixed(1)),
        weight_range_min: parseFloat(weightRangeMin.toFixed(1)),
        weight_range_max: parseFloat(weightRangeMax.toFixed(1)),
        fat_mass_kg: parseFloat(fatMass.toFixed(1)),
        fat_mass_range_min: parseFloat(fatMassRangeMin.toFixed(1)),
        fat_mass_range_max: parseFloat(fatMassRangeMax.toFixed(1)),
        muscle_mass_kg: parseFloat(muscleMass.toFixed(1)),
        muscle_mass_range_min: parseFloat(muscleMassRangeMin.toFixed(1)),
        muscle_mass_range_max: parseFloat(muscleMassRangeMax.toFixed(1)),
        skeletal_muscle_kg: parseFloat(skeletalMuscle.toFixed(1)),
        body_fat_rate: parseFloat(bodyFatRate.toFixed(1)),
        bmi: parseFloat(bmi.toFixed(1)),
        target_weight_kg: parseFloat(weight.toFixed(1)),
        weight_control_kg: parseFloat(weightControl.toFixed(1)),
        fat_control_kg: parseFloat(fatControl.toFixed(1)),
        muscle_control_kg: parseFloat(muscleControl.toFixed(1)),
        visceral_fat_grade: visceralFatGrade,
        basal_metabolic_rate_kcal: Math.round(basalMetabolicRate),
        fat_free_body_weight_kg: parseFloat(fatFreeBodyWeight.toFixed(1)),
        subcutaneous_fat_percent: parseFloat(subcutaneousFatPercent.toFixed(1)),
        smi_kg_m2: parseFloat(smi.toFixed(1)),
        body_age: bodyAge,
        symmetry: {
          arm_mass_left_kg: parseFloat(armMassLeft.toFixed(1)),
          arm_mass_right_kg: parseFloat(armMassRight.toFixed(1)),
          leg_mass_left_kg: parseFloat(legMassLeft.toFixed(1)),
          leg_mass_right_kg: parseFloat(legMassRight.toFixed(1)),
          trunk_mass_kg: parseFloat(trunkMass.toFixed(1)),
        }
      };
    });
  }).flat()
];