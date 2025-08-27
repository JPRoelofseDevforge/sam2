import { query } from '../connection';

export interface BodySymmetry {
  body_symmetry_id: number;
  body_composition_id: number;
  arm_mass_left_kg: number;
  arm_mass_right_kg: number;
  leg_mass_left_kg: number;
  leg_mass_right_kg: number;
  trunk_mass_kg: number;
  arm_imbalance_percent: number;
  leg_imbalance_percent: number;
  created_date: string;
}

export class BodySymmetryModel {
  // Get all body symmetry records
  static async getAllBodySymmetry(): Promise<BodySymmetry[]> {
    const sql = `
      SELECT * FROM body_symmetry
      ORDER BY created_date DESC
    `;

    const result = await query(sql);
    return result.rows;
  }

  // Get body symmetry by ID
  static async getBodySymmetryById(symmetryId: number): Promise<BodySymmetry | null> {
    const sql = `
      SELECT * FROM body_symmetry
      WHERE body_symmetry_id = $1
    `;

    const result = await query(sql, [symmetryId]);
    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  // Get body symmetry by body composition ID
  static async getBodySymmetryByBodyCompositionId(bodyCompositionId: number): Promise<BodySymmetry | null> {
    const sql = `
      SELECT * FROM body_symmetry
      WHERE body_composition_id = $1
    `;

    const result = await query(sql, [bodyCompositionId]);
    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  // Create new body symmetry record
  static async createBodySymmetry(symmetryData: Omit<BodySymmetry, 'body_symmetry_id' | 'created_date'>): Promise<BodySymmetry> {
    const sql = `
      INSERT INTO body_symmetry (
        body_composition_id, arm_mass_left_kg, arm_mass_right_kg,
        leg_mass_left_kg, leg_mass_right_kg, trunk_mass_kg,
        arm_imbalance_percent, leg_imbalance_percent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      symmetryData.body_composition_id,
      symmetryData.arm_mass_left_kg,
      symmetryData.arm_mass_right_kg,
      symmetryData.leg_mass_left_kg,
      symmetryData.leg_mass_right_kg,
      symmetryData.trunk_mass_kg,
      symmetryData.arm_imbalance_percent,
      symmetryData.leg_imbalance_percent
    ];

    const result = await query(sql, values);
    return result.rows[0];
  }

  // Update body symmetry record
  static async updateBodySymmetry(symmetryId: number, symmetryData: Partial<BodySymmetry>): Promise<boolean> {
    const fields = Object.keys(symmetryData).filter(key => key !== 'body_symmetry_id' && key !== 'created_date');
    if (fields.length === 0) return false;

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = fields.map(field => symmetryData[field as keyof BodySymmetry]);

    const sql = `
      UPDATE body_symmetry
      SET ${setClause}
      WHERE body_symmetry_id = $1
      RETURNING body_symmetry_id
    `;

    const result = await query(sql, [symmetryId, ...values]);
    return result.rows.length > 0;
  }

  // Delete body symmetry record
  static async deleteBodySymmetry(symmetryId: number): Promise<boolean> {
    const sql = `
      DELETE FROM body_symmetry
      WHERE body_symmetry_id = $1
      RETURNING body_symmetry_id
    `;

    const result = await query(sql, [symmetryId]);
    return result.rows.length > 0;
  }
}