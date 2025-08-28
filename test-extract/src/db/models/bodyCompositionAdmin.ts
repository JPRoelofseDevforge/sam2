import { query } from '../connection';

export interface BodyCompositionAdmin {
  body_composition_id: number;
  athlete_id: number;
  measurement_date: string;
  weight_kg: number;
  weight_range_min: number;
  weight_range_max: number;
  target_weight_kg: number;
  weight_control_kg: number;
  fat_mass_kg: number;
  fat_mass_range_min: number;
  fat_mass_range_max: number;
  body_fat_rate: number;
  fat_control_kg: number;
  subcutaneous_fat_percent: number;
  visceral_fat_grade: number;
  muscle_mass_kg: number;
  muscle_mass_range_min: number;
  muscle_mass_range_max: number;
  skeletal_muscle_kg: number;
  muscle_control_kg: number;
  bmi: number;
  basal_metabolic_rate_kcal: number;
  fat_free_body_weight_kg: number;
  smi_kg_m2: number;
  body_age: number;
  measurement_method: string;
  measurement_device: string;
  technician_id: number;
  notes: string;
  created_date: string;
}

export class BodyCompositionAdminModel {
  // Get all body composition records
  static async getAllBodyComposition(): Promise<BodyCompositionAdmin[]> {
    const sql = `
      SELECT * FROM body_composition
      ORDER BY measurement_date DESC, athlete_id
    `;

    const result = await query(sql);
    return result.rows;
  }

  // Get body composition by ID
  static async getBodyCompositionById(compositionId: number): Promise<BodyCompositionAdmin | null> {
    const sql = `
      SELECT * FROM body_composition
      WHERE body_composition_id = $1
    `;

    const result = await query(sql, [compositionId]);
    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  // Get body composition by athlete ID
  static async getBodyCompositionByAthleteId(athleteId: number): Promise<BodyCompositionAdmin[]> {
    const sql = `
      SELECT * FROM body_composition
      WHERE athlete_id = $1
      ORDER BY measurement_date DESC
    `;

    const result = await query(sql, [athleteId]);
    return result.rows;
  }

  // Get body composition by date range
  static async getBodyCompositionByDateRange(startDate: string, endDate: string): Promise<BodyCompositionAdmin[]> {
    const sql = `
      SELECT * FROM body_composition
      WHERE measurement_date >= $1 AND measurement_date <= $2
      ORDER BY measurement_date DESC, athlete_id
    `;

    const result = await query(sql, [startDate, endDate]);
    return result.rows;
  }

  // Create new body composition record
  static async createBodyComposition(compositionData: Omit<BodyCompositionAdmin, 'body_composition_id' | 'created_date'>): Promise<BodyCompositionAdmin> {
    const sql = `
      INSERT INTO body_composition (
        athlete_id, measurement_date, weight_kg, weight_range_min, 
        weight_range_max, target_weight_kg, weight_control_kg,
        fat_mass_kg, fat_mass_range_min, fat_mass_range_max,
        body_fat_rate, fat_control_kg, subcutaneous_fat_percent,
        visceral_fat_grade, muscle_mass_kg, muscle_mass_range_min,
        muscle_mass_range_max, skeletal_muscle_kg, muscle_control_kg,
        bmi, basal_metabolic_rate_kcal, fat_free_body_weight_kg,
        smi_kg_m2, body_age, measurement_method, measurement_device,
        technician_id, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)
      RETURNING *
    `;

    const values = [
      compositionData.athlete_id,
      compositionData.measurement_date,
      compositionData.weight_kg,
      compositionData.weight_range_min,
      compositionData.weight_range_max,
      compositionData.target_weight_kg,
      compositionData.weight_control_kg,
      compositionData.fat_mass_kg,
      compositionData.fat_mass_range_min,
      compositionData.fat_mass_range_max,
      compositionData.body_fat_rate,
      compositionData.fat_control_kg,
      compositionData.subcutaneous_fat_percent,
      compositionData.visceral_fat_grade,
      compositionData.muscle_mass_kg,
      compositionData.muscle_mass_range_min,
      compositionData.muscle_mass_range_max,
      compositionData.skeletal_muscle_kg,
      compositionData.muscle_control_kg,
      compositionData.bmi,
      compositionData.basal_metabolic_rate_kcal,
      compositionData.fat_free_body_weight_kg,
      compositionData.smi_kg_m2,
      compositionData.body_age,
      compositionData.measurement_method,
      compositionData.measurement_device,
      compositionData.technician_id,
      compositionData.notes
    ];

    const result = await query(sql, values);
    return result.rows[0];
  }

  // Update body composition record
  static async updateBodyComposition(compositionId: number, compositionData: Partial<BodyCompositionAdmin>): Promise<boolean> {
    const fields = Object.keys(compositionData).filter(key => key !== 'body_composition_id' && key !== 'created_date');
    if (fields.length === 0) return false;

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = fields.map(field => compositionData[field as keyof BodyCompositionAdmin]);

    const sql = `
      UPDATE body_composition
      SET ${setClause}
      WHERE body_composition_id = $1
      RETURNING body_composition_id
    `;

    const result = await query(sql, [compositionId, ...values]);
    return result.rows.length > 0;
  }

  // Delete body composition record
  static async deleteBodyComposition(compositionId: number): Promise<boolean> {
    const sql = `
      DELETE FROM body_composition
      WHERE body_composition_id = $1
      RETURNING body_composition_id
    `;

    const result = await query(sql, [compositionId]);
    return result.rows.length > 0;
  }
}