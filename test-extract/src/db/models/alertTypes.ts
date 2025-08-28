import { query } from '../connection';

export interface AlertType {
  alert_type_id: number;
  alert_type_name: string;
  alert_category?: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  description?: string;
  is_active: boolean;
}

export class AlertTypeModel {
  // Get all alert types
  static async getAllAlertTypes(): Promise<AlertType[]> {
    const sql = `
      SELECT * FROM alert_types
      WHERE is_active = TRUE
      ORDER BY alert_type_name
    `;

    const result = await query(sql);
    return result.rows;
  }

  // Get alert type by ID
  static async getAlertTypeById(alertTypeId: number): Promise<AlertType | null> {
    const sql = `
      SELECT * FROM alert_types
      WHERE alert_type_id = $1 AND is_active = TRUE
    `;

    const result = await query(sql, [alertTypeId]);
    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  // Get alert types by category
  static async getAlertTypesByCategory(category: string): Promise<AlertType[]> {
    const sql = `
      SELECT * FROM alert_types
      WHERE alert_category = $1 AND is_active = TRUE
      ORDER BY alert_type_name
    `;

    const result = await query(sql, [category]);
    return result.rows;
  }

  // Get alert types by severity
  static async getAlertTypesBySeverity(severity: string): Promise<AlertType[]> {
    const sql = `
      SELECT * FROM alert_types
      WHERE severity = $1 AND is_active = TRUE
      ORDER BY alert_type_name
    `;

    const result = await query(sql, [severity]);
    return result.rows;
  }

  // Create new alert type
  static async createAlertType(alertTypeData: Omit<AlertType, 'alert_type_id'>): Promise<AlertType> {
    const sql = `
      INSERT INTO alert_types (alert_type_name, alert_category, severity, description, is_active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      alertTypeData.alert_type_name,
      alertTypeData.alert_category,
      alertTypeData.severity,
      alertTypeData.description,
      alertTypeData.is_active
    ];

    const result = await query(sql, values);
    return result.rows[0];
  }

  // Update alert type
  static async updateAlertType(alertTypeId: number, alertTypeData: Partial<AlertType>): Promise<boolean> {
    const fields = Object.keys(alertTypeData).filter(key => key !== 'alert_type_id');
    if (fields.length === 0) return false;

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = fields.map(field => alertTypeData[field as keyof AlertType]);

    const sql = `
      UPDATE alert_types
      SET ${setClause}
      WHERE alert_type_id = $1
      RETURNING alert_type_id
    `;

    const result = await query(sql, [alertTypeId, ...values]);
    return result.rows.length > 0;
  }

  // Delete alert type (soft delete)
  static async deleteAlertType(alertTypeId: number): Promise<boolean> {
    const sql = `
      UPDATE alert_types
      SET is_active = FALSE
      WHERE alert_type_id = $1
      RETURNING alert_type_id
    `;

    const result = await query(sql, [alertTypeId]);
    return result.rows.length > 0;
  }
}