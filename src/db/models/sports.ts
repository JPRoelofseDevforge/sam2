import { query } from '../connection';

export interface Sport {
  sport_id: number;
  sport_name: string;
  sport_category?: string;
  description?: string;
  is_active: boolean;
}

export class SportModel {
  // Get all sports
  static async getAllSports(): Promise<Sport[]> {
    const sql = `
      SELECT * FROM sports
      WHERE is_active = TRUE
      ORDER BY sport_name
    `;

    const result = await query(sql);
    return result.rows;
  }

  // Get sport by ID
  static async getSportById(sportId: number): Promise<Sport | null> {
    const sql = `
      SELECT * FROM sports
      WHERE sport_id = $1 AND is_active = TRUE
    `;

    const result = await query(sql, [sportId]);
    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  // Create new sport
  static async createSport(sportData: Omit<Sport, 'sport_id'>): Promise<Sport> {
    const sql = `
      INSERT INTO sports (sport_name, sport_category, description, is_active)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const values = [
      sportData.sport_name,
      sportData.sport_category,
      sportData.description,
      sportData.is_active
    ];

    const result = await query(sql, values);
    return result.rows[0];
  }

  // Update sport
  static async updateSport(sportId: number, sportData: Partial<Sport>): Promise<boolean> {
    const fields = Object.keys(sportData).filter(key => key !== 'sport_id');
    if (fields.length === 0) return false;

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = fields.map(field => sportData[field as keyof Sport]);

    const sql = `
      UPDATE sports
      SET ${setClause}
      WHERE sport_id = $1
      RETURNING sport_id
    `;

    const result = await query(sql, [sportId, ...values]);
    return result.rows.length > 0;
  }

  // Delete sport (soft delete)
  static async deleteSport(sportId: number): Promise<boolean> {
    const sql = `
      UPDATE sports
      SET is_active = FALSE
      WHERE sport_id = $1
      RETURNING sport_id
    `;

    const result = await query(sql, [sportId]);
    return result.rows.length > 0;
  }
}