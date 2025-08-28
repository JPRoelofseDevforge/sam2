import { query } from '../connection';
import { BodyComposition } from '../../types';
import { AthleteModel } from './athletes';

export class BodyCompositionModel {
  // Get body composition data for a specific athlete
  static async getBodyCompositionByAthlete(
    athleteCode: string,
    startDate?: string,
    endDate?: string
  ): Promise<BodyComposition[]> {
    // Get the actual athlete_id from athlete_code
    const athleteId = await AthleteModel.getAthleteIdMapping(athleteCode);
    if (!athleteId) {
      return [];
    }

    let sql = `
      SELECT 
        a.athlete_code AS athlete_id,
        bc.measurement_date::TEXT AS date,
        bc.weight_kg,
        bc.weight_range_min,
        bc.weight_range_max,
        bc.target_weight_kg,
        bc.weight_control_kg,
        bc.fat_mass_kg,
        bc.fat_mass_range_min,
        bc.fat_mass_range_max,
        bc.body_fat_rate,
        bc.fat_control_kg,
        bc.subcutaneous_fat_percent,
        bc.visceral_fat_grade,
        bc.muscle_mass_kg,
        bc.muscle_mass_range_min,
        bc.muscle_mass_range_max,
        bc.skeletal_muscle_kg,
        bc.muscle_control_kg,
        bc.bmi,
        bc.basal_metabolic_rate_kcal,
        bc.fat_free_body_weight_kg,
        bc.smi_kg_m2,
        bc.body_age,
        bs.arm_mass_left_kg,
        bs.arm_mass_right_kg,
        bs.leg_mass_left_kg,
        bs.leg_mass_right_kg,
        bs.trunk_mass_kg
      FROM body_composition bc
      INNER JOIN athletes a ON bc.athlete_id = a.athlete_id
      LEFT JOIN body_symmetry bs ON bc.body_composition_id = bs.body_composition_id
      WHERE bc.athlete_id = $1
    `;
    
    const params: any[] = [athleteId];
    
    if (startDate) {
      sql += ` AND bc.measurement_date >= $${params.length + 1}`;
      params.push(startDate);
    }
    
    if (endDate) {
      sql += ` AND bc.measurement_date <= $${params.length + 1}`;
      params.push(endDate);
    }
    
    sql += ` ORDER BY bc.measurement_date DESC`;
    
    const result = await query(sql, params);
    return result.rows.map(row => ({
      athlete_id: row.athlete_id,
      date: row.date,
      weight_kg: parseFloat(row.weight_kg) || 0,
      weight_range_min: parseFloat(row.weight_range_min) || 0,
      weight_range_max: parseFloat(row.weight_range_max) || 0,
      target_weight_kg: parseFloat(row.target_weight_kg) || 0,
      weight_control_kg: parseFloat(row.weight_control_kg) || 0,
      fat_mass_kg: parseFloat(row.fat_mass_kg) || 0,
      fat_mass_range_min: parseFloat(row.fat_mass_range_min) || 0,
      fat_mass_range_max: parseFloat(row.fat_mass_range_max) || 0,
      body_fat_rate: parseFloat(row.body_fat_rate) || 0,
      fat_control_kg: parseFloat(row.fat_control_kg) || 0,
      subcutaneous_fat_percent: parseFloat(row.subcutaneous_fat_percent) || 0,
      visceral_fat_grade: row.visceral_fat_grade || 0,
      muscle_mass_kg: parseFloat(row.muscle_mass_kg) || 0,
      muscle_mass_range_min: parseFloat(row.muscle_mass_range_min) || 0,
      muscle_mass_range_max: parseFloat(row.muscle_mass_range_max) || 0,
      skeletal_muscle_kg: parseFloat(row.skeletal_muscle_kg) || 0,
      muscle_control_kg: parseFloat(row.muscle_control_kg) || 0,
      bmi: parseFloat(row.bmi) || 0,
      basal_metabolic_rate_kcal: row.basal_metabolic_rate_kcal || 0,
      fat_free_body_weight_kg: parseFloat(row.fat_free_body_weight_kg) || 0,
      smi_kg_m2: parseFloat(row.smi_kg_m2) || 0,
      body_age: row.body_age || 0,
      symmetry: row.arm_mass_left_kg ? {
        arm_mass_left_kg: parseFloat(row.arm_mass_left_kg) || 0,
        arm_mass_right_kg: parseFloat(row.arm_mass_right_kg) || 0,
        leg_mass_left_kg: parseFloat(row.leg_mass_left_kg) || 0,
        leg_mass_right_kg: parseFloat(row.leg_mass_right_kg) || 0,
        trunk_mass_kg: parseFloat(row.trunk_mass_kg) || 0
      } : undefined
    }));
  }

  // Get latest body composition for all athletes
  static async getLatestBodyComposition(): Promise<BodyComposition[]> {
    const sql = `
      SELECT 
        a.athlete_code AS athlete_id,
        bc.measurement_date::TEXT AS date,
        bc.weight_kg,
        bc.weight_range_min,
        bc.weight_range_max,
        bc.target_weight_kg,
        bc.weight_control_kg,
        bc.fat_mass_kg,
        bc.fat_mass_range_min,
        bc.fat_mass_range_max,
        bc.body_fat_rate,
        bc.fat_control_kg,
        bc.subcutaneous_fat_percent,
        bc.visceral_fat_grade,
        bc.muscle_mass_kg,
        bc.muscle_mass_range_min,
        bc.muscle_mass_range_max,
        bc.skeletal_muscle_kg,
        bc.muscle_control_kg,
        bc.bmi,
        bc.basal_metabolic_rate_kcal,
        bc.fat_free_body_weight_kg,
        bc.smi_kg_m2,
        bc.body_age,
        bs.arm_mass_left_kg,
        bs.arm_mass_right_kg,
        bs.leg_mass_left_kg,
        bs.leg_mass_right_kg,
        bs.trunk_mass_kg
      FROM body_composition bc
      INNER JOIN athletes a ON bc.athlete_id = a.athlete_id
      LEFT JOIN body_symmetry bs ON bc.body_composition_id = bs.body_composition_id
      INNER JOIN (
        SELECT athlete_id, MAX(measurement_date) AS latest_date
        FROM body_composition
        GROUP BY athlete_id
      ) latest ON bc.athlete_id = latest.athlete_id 
        AND bc.measurement_date = latest.latest_date
      WHERE a.is_active = TRUE
      ORDER BY a.athlete_code
    `;
    
    const result = await query(sql);
    return result.rows.map(row => ({
      athlete_id: row.athlete_id,
      date: row.date,
      weight_kg: parseFloat(row.weight_kg) || 0,
      weight_range_min: parseFloat(row.weight_range_min) || 0,
      weight_range_max: parseFloat(row.weight_range_max) || 0,
      target_weight_kg: parseFloat(row.target_weight_kg) || 0,
      weight_control_kg: parseFloat(row.weight_control_kg) || 0,
      fat_mass_kg: parseFloat(row.fat_mass_kg) || 0,
      fat_mass_range_min: parseFloat(row.fat_mass_range_min) || 0,
      fat_mass_range_max: parseFloat(row.fat_mass_range_max) || 0,
      body_fat_rate: parseFloat(row.body_fat_rate) || 0,
      fat_control_kg: parseFloat(row.fat_control_kg) || 0,
      subcutaneous_fat_percent: parseFloat(row.subcutaneous_fat_percent) || 0,
      visceral_fat_grade: row.visceral_fat_grade || 0,
      muscle_mass_kg: parseFloat(row.muscle_mass_kg) || 0,
      muscle_mass_range_min: parseFloat(row.muscle_mass_range_min) || 0,
      muscle_mass_range_max: parseFloat(row.muscle_mass_range_max) || 0,
      skeletal_muscle_kg: parseFloat(row.skeletal_muscle_kg) || 0,
      muscle_control_kg: parseFloat(row.muscle_control_kg) || 0,
      bmi: parseFloat(row.bmi) || 0,
      basal_metabolic_rate_kcal: row.basal_metabolic_rate_kcal || 0,
      fat_free_body_weight_kg: parseFloat(row.fat_free_body_weight_kg) || 0,
      smi_kg_m2: parseFloat(row.smi_kg_m2) || 0,
      body_age: row.body_age || 0,
      symmetry: row.arm_mass_left_kg ? {
        arm_mass_left_kg: parseFloat(row.arm_mass_left_kg) || 0,
        arm_mass_right_kg: parseFloat(row.arm_mass_right_kg) || 0,
        leg_mass_left_kg: parseFloat(row.leg_mass_left_kg) || 0,
        leg_mass_right_kg: parseFloat(row.leg_mass_right_kg) || 0,
        trunk_mass_kg: parseFloat(row.trunk_mass_kg) || 0
      } : undefined
    }));
  }

  // Get all body composition data
  static async getAllBodyComposition(startDate?: string, endDate?: string): Promise<BodyComposition[]> {
    let sql = `
      SELECT 
        a.athlete_code AS athlete_id,
        bc.measurement_date::TEXT AS date,
        bc.weight_kg,
        bc.weight_range_min,
        bc.weight_range_max,
        bc.target_weight_kg,
        bc.weight_control_kg,
        bc.fat_mass_kg,
        bc.fat_mass_range_min,
        bc.fat_mass_range_max,
        bc.body_fat_rate,
        bc.fat_control_kg,
        bc.subcutaneous_fat_percent,
        bc.visceral_fat_grade,
        bc.muscle_mass_kg,
        bc.muscle_mass_range_min,
        bc.muscle_mass_range_max,
        bc.skeletal_muscle_kg,
        bc.muscle_control_kg,
        bc.bmi,
        bc.basal_metabolic_rate_kcal,
        bc.fat_free_body_weight_kg,
        bc.smi_kg_m2,
        bc.body_age,
        bs.arm_mass_left_kg,
        bs.arm_mass_right_kg,
        bs.leg_mass_left_kg,
        bs.leg_mass_right_kg,
        bs.trunk_mass_kg
      FROM body_composition bc
      INNER JOIN athletes a ON bc.athlete_id = a.athlete_id
      LEFT JOIN body_symmetry bs ON bc.body_composition_id = bs.body_composition_id
      WHERE a.is_active = TRUE
    `;
    
    const params: any[] = [];
    
    if (startDate) {
      sql += ` AND bc.measurement_date >= $${params.length + 1}`;
      params.push(startDate);
    }
    
    if (endDate) {
      sql += ` AND bc.measurement_date <= $${params.length + 1}`;
      params.push(endDate);
    }
    
    sql += ` ORDER BY a.athlete_code, bc.measurement_date DESC`;
    
    const result = await query(sql, params);
    return result.rows.map(row => ({
      athlete_id: row.athlete_id,
      date: row.date,
      weight_kg: parseFloat(row.weight_kg) || 0,
      weight_range_min: parseFloat(row.weight_range_min) || 0,
      weight_range_max: parseFloat(row.weight_range_max) || 0,
      target_weight_kg: parseFloat(row.target_weight_kg) || 0,
      weight_control_kg: parseFloat(row.weight_control_kg) || 0,
      fat_mass_kg: parseFloat(row.fat_mass_kg) || 0,
      fat_mass_range_min: parseFloat(row.fat_mass_range_min) || 0,
      fat_mass_range_max: parseFloat(row.fat_mass_range_max) || 0,
      body_fat_rate: parseFloat(row.body_fat_rate) || 0,
      fat_control_kg: parseFloat(row.fat_control_kg) || 0,
      subcutaneous_fat_percent: parseFloat(row.subcutaneous_fat_percent) || 0,
      visceral_fat_grade: row.visceral_fat_grade || 0,
      muscle_mass_kg: parseFloat(row.muscle_mass_kg) || 0,
      muscle_mass_range_min: parseFloat(row.muscle_mass_range_min) || 0,
      muscle_mass_range_max: parseFloat(row.muscle_mass_range_max) || 0,
      skeletal_muscle_kg: parseFloat(row.skeletal_muscle_kg) || 0,
      muscle_control_kg: parseFloat(row.muscle_control_kg) || 0,
      bmi: parseFloat(row.bmi) || 0,
      basal_metabolic_rate_kcal: row.basal_metabolic_rate_kcal || 0,
      fat_free_body_weight_kg: parseFloat(row.fat_free_body_weight_kg) || 0,
      smi_kg_m2: parseFloat(row.smi_kg_m2) || 0,
      body_age: row.body_age || 0,
      symmetry: row.arm_mass_left_kg ? {
        arm_mass_left_kg: parseFloat(row.arm_mass_left_kg) || 0,
        arm_mass_right_kg: parseFloat(row.arm_mass_right_kg) || 0,
        leg_mass_left_kg: parseFloat(row.leg_mass_left_kg) || 0,
        leg_mass_right_kg: parseFloat(row.leg_mass_right_kg) || 0,
        trunk_mass_kg: parseFloat(row.trunk_mass_kg) || 0
      } : undefined
    }));
  }

  // Insert body composition data
  static async insertBodyComposition(data: BodyComposition): Promise<void> {
    const athleteId = await AthleteModel.getAthleteIdMapping(data.athlete_id);
    if (!athleteId) {
      throw new Error(`Athlete with code ${data.athlete_id} not found`);
    }

    // Start a transaction
    const client = await query('BEGIN');
    
    try {
      // Insert body composition
      const bcSql = `
        INSERT INTO body_composition (
          athlete_id, measurement_date, weight_kg, weight_range_min, weight_range_max,
          target_weight_kg, weight_control_kg, fat_mass_kg, fat_mass_range_min,
          fat_mass_range_max, body_fat_rate, fat_control_kg, subcutaneous_fat_percent,
          visceral_fat_grade, muscle_mass_kg, muscle_mass_range_min, muscle_mass_range_max,
          skeletal_muscle_kg, muscle_control_kg, bmi, basal_metabolic_rate_kcal,
          fat_free_body_weight_kg, smi_kg_m2, body_age, measurement_method
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
          $18, $19, $20, $21, $22, $23, $24, $25
        )
        ON CONFLICT (athlete_id, measurement_date) 
        DO UPDATE SET 
          weight_kg = EXCLUDED.weight_kg,
          weight_range_min = EXCLUDED.weight_range_min,
          weight_range_max = EXCLUDED.weight_range_max,
          target_weight_kg = EXCLUDED.target_weight_kg,
          weight_control_kg = EXCLUDED.weight_control_kg,
          fat_mass_kg = EXCLUDED.fat_mass_kg,
          fat_mass_range_min = EXCLUDED.fat_mass_range_min,
          fat_mass_range_max = EXCLUDED.fat_mass_range_max,
          body_fat_rate = EXCLUDED.body_fat_rate,
          fat_control_kg = EXCLUDED.fat_control_kg,
          subcutaneous_fat_percent = EXCLUDED.subcutaneous_fat_percent,
          visceral_fat_grade = EXCLUDED.visceral_fat_grade,
          muscle_mass_kg = EXCLUDED.muscle_mass_kg,
          muscle_mass_range_min = EXCLUDED.muscle_mass_range_min,
          muscle_mass_range_max = EXCLUDED.muscle_mass_range_max,
          skeletal_muscle_kg = EXCLUDED.skeletal_muscle_kg,
          muscle_control_kg = EXCLUDED.muscle_control_kg,
          bmi = EXCLUDED.bmi,
          basal_metabolic_rate_kcal = EXCLUDED.basal_metabolic_rate_kcal,
          fat_free_body_weight_kg = EXCLUDED.fat_free_body_weight_kg,
          smi_kg_m2 = EXCLUDED.smi_kg_m2,
          body_age = EXCLUDED.body_age
        RETURNING body_composition_id
      `;
      
      const bcResult = await query(bcSql, [
        athleteId,
        data.date,
        data.weight_kg,
        data.weight_range_min,
        data.weight_range_max,
        data.target_weight_kg,
        data.weight_control_kg,
        data.fat_mass_kg,
        data.fat_mass_range_min,
        data.fat_mass_range_max,
        data.body_fat_rate,
        data.fat_control_kg,
        data.subcutaneous_fat_percent,
        data.visceral_fat_grade,
        data.muscle_mass_kg,
        data.muscle_mass_range_min,
        data.muscle_mass_range_max,
        data.skeletal_muscle_kg,
        data.muscle_control_kg,
        data.bmi,
        data.basal_metabolic_rate_kcal,
        data.fat_free_body_weight_kg,
        data.smi_kg_m2,
        data.body_age,
        'InBody'
      ]);
      
      const bodyCompositionId = bcResult.rows[0].body_composition_id;
      
      // Insert body symmetry if provided
      if (data.symmetry) {
        const bsSql = `
          INSERT INTO body_symmetry (
            body_composition_id, arm_mass_left_kg, arm_mass_right_kg,
            leg_mass_left_kg, leg_mass_right_kg, trunk_mass_kg,
            arm_imbalance_percent, leg_imbalance_percent
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (body_composition_id) 
          DO UPDATE SET 
            arm_mass_left_kg = EXCLUDED.arm_mass_left_kg,
            arm_mass_right_kg = EXCLUDED.arm_mass_right_kg,
            leg_mass_left_kg = EXCLUDED.leg_mass_left_kg,
            leg_mass_right_kg = EXCLUDED.leg_mass_right_kg,
            trunk_mass_kg = EXCLUDED.trunk_mass_kg,
            arm_imbalance_percent = EXCLUDED.arm_imbalance_percent,
            leg_imbalance_percent = EXCLUDED.leg_imbalance_percent
        `;
        
        const armImbalance = Math.abs(
          (data.symmetry.arm_mass_left_kg - data.symmetry.arm_mass_right_kg) / 
          data.symmetry.arm_mass_right_kg * 100
        );
        
        const legImbalance = Math.abs(
          (data.symmetry.leg_mass_left_kg - data.symmetry.leg_mass_right_kg) / 
          data.symmetry.leg_mass_right_kg * 100
        );
        
        await query(bsSql, [
          bodyCompositionId,
          data.symmetry.arm_mass_left_kg,
          data.symmetry.arm_mass_right_kg,
          data.symmetry.leg_mass_left_kg,
          data.symmetry.leg_mass_right_kg,
          data.symmetry.trunk_mass_kg,
          armImbalance,
          legImbalance
        ]);
      }
      
      await query('COMMIT');
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  }

  // Get all body composition data for admin (with full details)
  static async getAllBodyCompositionAdmin(): Promise<any[]> {
    const sql = `
      SELECT
        bc.body_composition_id,
        a.athlete_id,
        a.athlete_code,
        a.first_name,
        a.last_name,
        bc.measurement_date::TEXT AS measurement_date,
        bc.weight_kg,
        bc.weight_range_min,
        bc.weight_range_max,
        bc.target_weight_kg,
        bc.weight_control_kg,
        bc.fat_mass_kg,
        bc.fat_mass_range_min,
        bc.fat_mass_range_max,
        bc.body_fat_rate,
        bc.fat_control_kg,
        bc.subcutaneous_fat_percent,
        bc.visceral_fat_grade,
        bc.muscle_mass_kg,
        bc.muscle_mass_range_min,
        bc.muscle_mass_range_max,
        bc.skeletal_muscle_kg,
        bc.muscle_control_kg,
        bc.bmi,
        bc.basal_metabolic_rate_kcal,
        bc.fat_free_body_weight_kg,
        bc.smi_kg_m2,
        bc.body_age,
        bc.measurement_method,
        bc.measurement_device,
        bc.technician_id,
        bc.notes,
        bc.created_date::TEXT
      FROM body_composition bc
      INNER JOIN athletes a ON bc.athlete_id = a.athlete_id
      ORDER BY bc.measurement_date DESC, a.athlete_code
    `;

    const result = await query(sql);
    return result.rows;
  }

  // Get single body composition record by ID
  static async getBodyCompositionById(id: number): Promise<any> {
    const sql = `
      SELECT
        bc.body_composition_id,
        a.athlete_id,
        a.athlete_code,
        a.first_name,
        a.last_name,
        bc.measurement_date::TEXT AS measurement_date,
        bc.weight_kg,
        bc.weight_range_min,
        bc.weight_range_max,
        bc.target_weight_kg,
        bc.weight_control_kg,
        bc.fat_mass_kg,
        bc.fat_mass_range_min,
        bc.fat_mass_range_max,
        bc.body_fat_rate,
        bc.fat_control_kg,
        bc.subcutaneous_fat_percent,
        bc.visceral_fat_grade,
        bc.muscle_mass_kg,
        bc.muscle_mass_range_min,
        bc.muscle_mass_range_max,
        bc.skeletal_muscle_kg,
        bc.muscle_control_kg,
        bc.bmi,
        bc.basal_metabolic_rate_kcal,
        bc.fat_free_body_weight_kg,
        bc.smi_kg_m2,
        bc.body_age,
        bc.measurement_method,
        bc.measurement_device,
        bc.technician_id,
        bc.notes,
        bc.created_date::TEXT
      FROM body_composition bc
      INNER JOIN athletes a ON bc.athlete_id = a.athlete_id
      WHERE bc.body_composition_id = $1
    `;

    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }

  // Create new body composition record
  static async createBodyComposition(data: any): Promise<any> {
    const athleteId = await AthleteModel.getAthleteIdMapping(data.athlete_id);
    if (!athleteId) {
      throw new Error(`Athlete with code ${data.athlete_id} not found`);
    }

    const sql = `
      INSERT INTO body_composition (
        athlete_id, measurement_date, weight_kg, weight_range_min, weight_range_max,
        target_weight_kg, weight_control_kg, fat_mass_kg, fat_mass_range_min,
        fat_mass_range_max, body_fat_rate, fat_control_kg, subcutaneous_fat_percent,
        visceral_fat_grade, muscle_mass_kg, muscle_mass_range_min, muscle_mass_range_max,
        skeletal_muscle_kg, muscle_control_kg, bmi, basal_metabolic_rate_kcal,
        fat_free_body_weight_kg, smi_kg_m2, body_age, measurement_method,
        measurement_device, technician_id, notes
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
        $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28
      ) RETURNING body_composition_id
    `;

    const result = await query(sql, [
      athleteId,
      data.measurement_date,
      data.weight_kg || null,
      data.weight_range_min || null,
      data.weight_range_max || null,
      data.target_weight_kg || null,
      data.weight_control_kg || null,
      data.fat_mass_kg || null,
      data.fat_mass_range_min || null,
      data.fat_mass_range_max || null,
      data.body_fat_rate || null,
      data.fat_control_kg || null,
      data.subcutaneous_fat_percent || null,
      data.visceral_fat_grade || null,
      data.muscle_mass_kg || null,
      data.muscle_mass_range_min || null,
      data.muscle_mass_range_max || null,
      data.skeletal_muscle_kg || null,
      data.muscle_control_kg || null,
      data.bmi || null,
      data.basal_metabolic_rate_kcal || null,
      data.fat_free_body_weight_kg || null,
      data.smi_kg_m2 || null,
      data.body_age || null,
      data.measurement_method || 'InBody',
      data.measurement_device || null,
      data.technician_id || null,
      data.notes || null
    ]);

    return result.rows[0];
  }

  // Update body composition record
  static async updateBodyComposition(id: number, data: any): Promise<boolean> {
    const sql = `
      UPDATE body_composition SET
        weight_kg = $1,
        weight_range_min = $2,
        weight_range_max = $3,
        target_weight_kg = $4,
        weight_control_kg = $5,
        fat_mass_kg = $6,
        fat_mass_range_min = $7,
        fat_mass_range_max = $8,
        body_fat_rate = $9,
        fat_control_kg = $10,
        subcutaneous_fat_percent = $11,
        visceral_fat_grade = $12,
        muscle_mass_kg = $13,
        muscle_mass_range_min = $14,
        muscle_mass_range_max = $15,
        skeletal_muscle_kg = $16,
        muscle_control_kg = $17,
        bmi = $18,
        basal_metabolic_rate_kcal = $19,
        fat_free_body_weight_kg = $20,
        smi_kg_m2 = $21,
        body_age = $22,
        measurement_method = $23,
        measurement_device = $24,
        technician_id = $25,
        notes = $26
      WHERE body_composition_id = $27
    `;

    const result = await query(sql, [
      data.weight_kg || null,
      data.weight_range_min || null,
      data.weight_range_max || null,
      data.target_weight_kg || null,
      data.weight_control_kg || null,
      data.fat_mass_kg || null,
      data.fat_mass_range_min || null,
      data.fat_mass_range_max || null,
      data.body_fat_rate || null,
      data.fat_control_kg || null,
      data.subcutaneous_fat_percent || null,
      data.visceral_fat_grade || null,
      data.muscle_mass_kg || null,
      data.muscle_mass_range_min || null,
      data.muscle_mass_range_max || null,
      data.skeletal_muscle_kg || null,
      data.muscle_control_kg || null,
      data.bmi || null,
      data.basal_metabolic_rate_kcal || null,
      data.fat_free_body_weight_kg || null,
      data.smi_kg_m2 || null,
      data.body_age || null,
      data.measurement_method || 'InBody',
      data.measurement_device || null,
      data.technician_id || null,
      data.notes || null,
      id
    ]);

    return (result.rowCount ?? 0) > 0;
  }

  // Delete body composition record
  static async deleteBodyComposition(id: number): Promise<boolean> {
    const sql = `DELETE FROM body_composition WHERE body_composition_id = $1`;
    const result = await query(sql, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}