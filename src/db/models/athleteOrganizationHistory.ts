import { query } from '../connection';

export interface AthleteOrganizationHistory {
  athlete_org_history_id: number;
  athlete_id: number;
  organization_id: number;
  sport_id: number;
  position: string;
  jersey_number: number;
  start_date: string;
  end_date: string;
  contract_type: string;
  is_active: boolean;
  created_date: string;
}

export class AthleteOrganizationHistoryModel {
  // Get all athlete organization history records
  static async getAllAthleteOrganizationHistory(): Promise<AthleteOrganizationHistory[]> {
    const sql = `
      SELECT * FROM athlete_organization_history
      ORDER BY created_date DESC
    `;

    const result = await query(sql);
    return result.rows;
  }

  // Get athlete organization history by ID
  static async getAthleteOrganizationHistoryById(historyId: number): Promise<AthleteOrganizationHistory | null> {
    const sql = `
      SELECT * FROM athlete_organization_history
      WHERE athlete_org_history_id = $1
    `;

    const result = await query(sql, [historyId]);
    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  // Get athlete organization history by athlete ID
  static async getAthleteOrganizationHistoryByAthleteId(athleteId: number): Promise<AthleteOrganizationHistory[]> {
    const sql = `
      SELECT * FROM athlete_organization_history
      WHERE athlete_id = $1
      ORDER BY start_date DESC
    `;

    const result = await query(sql, [athleteId]);
    return result.rows;
  }

  // Create new athlete organization history record
  static async createAthleteOrganizationHistory(historyData: Omit<AthleteOrganizationHistory, 'athlete_org_history_id' | 'created_date'>): Promise<AthleteOrganizationHistory> {
    const sql = `
      INSERT INTO athlete_organization_history (
        athlete_id, organization_id, sport_id, position, jersey_number, 
        start_date, end_date, contract_type, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      historyData.athlete_id,
      historyData.organization_id,
      historyData.sport_id,
      historyData.position,
      historyData.jersey_number,
      historyData.start_date,
      historyData.end_date,
      historyData.contract_type,
      historyData.is_active
    ];

    const result = await query(sql, values);
    return result.rows[0];
  }

  // Update athlete organization history record
  static async updateAthleteOrganizationHistory(historyId: number, historyData: Partial<AthleteOrganizationHistory>): Promise<boolean> {
    const fields = Object.keys(historyData).filter(key => key !== 'athlete_org_history_id' && key !== 'created_date');
    if (fields.length === 0) return false;

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = fields.map(field => historyData[field as keyof AthleteOrganizationHistory]);

    const sql = `
      UPDATE athlete_organization_history
      SET ${setClause}
      WHERE athlete_org_history_id = $1
      RETURNING athlete_org_history_id
    `;

    const result = await query(sql, [historyId, ...values]);
    return result.rows.length > 0;
  }

  // Delete athlete organization history record (soft delete)
  static async deleteAthleteOrganizationHistory(historyId: number): Promise<boolean> {
    const sql = `
      UPDATE athlete_organization_history
      SET is_active = FALSE
      WHERE athlete_org_history_id = $1
      RETURNING athlete_org_history_id
    `;

    const result = await query(sql, [historyId]);
    return result.rows.length > 0;
  }
}