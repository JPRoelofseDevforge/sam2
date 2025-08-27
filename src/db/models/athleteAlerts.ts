import { query } from '../connection';

export interface AthleteAlert {
  alert_id: number;
  athlete_id: number;
  alert_type_id: number;
  alert_title: string;
  alert_cause: string;
  recommendation: string;
  alert_date: string;
  is_resolved: boolean;
  resolved_date: string;
  resolved_by_user_id: number;
  notes: string;
}

export class AthleteAlertModel {
  // Get all athlete alerts
  static async getAllAthleteAlerts(): Promise<AthleteAlert[]> {
    const sql = `
      SELECT * FROM athlete_alerts
      ORDER BY alert_date DESC
    `;

    const result = await query(sql);
    return result.rows;
  }

  // Get athlete alert by ID
  static async getAthleteAlertById(alertId: number): Promise<AthleteAlert | null> {
    const sql = `
      SELECT * FROM athlete_alerts
      WHERE alert_id = $1
    `;

    const result = await query(sql, [alertId]);
    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  // Get athlete alerts by athlete ID
  static async getAthleteAlertsByAthleteId(athleteId: number): Promise<AthleteAlert[]> {
    const sql = `
      SELECT * FROM athlete_alerts
      WHERE athlete_id = $1
      ORDER BY alert_date DESC
    `;

    const result = await query(sql, [athleteId]);
    return result.rows;
  }

  // Get unresolved athlete alerts
  static async getUnresolvedAthleteAlerts(): Promise<AthleteAlert[]> {
    const sql = `
      SELECT * FROM athlete_alerts
      WHERE is_resolved = FALSE
      ORDER BY alert_date DESC
    `;

    const result = await query(sql);
    return result.rows;
  }

  // Create new athlete alert
  static async createAthleteAlert(alertData: Omit<AthleteAlert, 'alert_id'>): Promise<AthleteAlert> {
    const sql = `
      INSERT INTO athlete_alerts (
        athlete_id, alert_type_id, alert_title, alert_cause, recommendation,
        alert_date, is_resolved, resolved_date, resolved_by_user_id, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      alertData.athlete_id,
      alertData.alert_type_id,
      alertData.alert_title,
      alertData.alert_cause,
      alertData.recommendation,
      alertData.alert_date,
      alertData.is_resolved,
      alertData.resolved_date,
      alertData.resolved_by_user_id,
      alertData.notes
    ];

    const result = await query(sql, values);
    return result.rows[0];
  }

  // Update athlete alert
  static async updateAthleteAlert(alertId: number, alertData: Partial<AthleteAlert>): Promise<boolean> {
    const fields = Object.keys(alertData).filter(key => key !== 'alert_id');
    if (fields.length === 0) return false;

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = fields.map(field => alertData[field as keyof AthleteAlert]);

    const sql = `
      UPDATE athlete_alerts
      SET ${setClause}
      WHERE alert_id = $1
      RETURNING alert_id
    `;

    const result = await query(sql, [alertId, ...values]);
    return result.rows.length > 0;
  }

  // Delete athlete alert
  static async deleteAthleteAlert(alertId: number): Promise<boolean> {
    const sql = `
      DELETE FROM athlete_alerts
      WHERE alert_id = $1
      RETURNING alert_id
    `;

    const result = await query(sql, [alertId]);
    return result.rows.length > 0;
  }
}