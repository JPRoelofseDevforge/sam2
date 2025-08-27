import { query } from '../connection';

export interface BiometricDataAdmin {
  biometric_id: number;
  athlete_id: number;
  measurement_date: string;
  hrv_night: number;
  resting_hr: number;
  spo2_night: number;
  respiratory_rate_night: number;
  sleep_duration_hours: number;
  deep_sleep_percent: number;
  rem_sleep_percent: number;
  light_sleep_percent: number;
  sleep_onset_time: string;
  wake_time: string;
  body_temperature: number;
  training_load_percent: number;
  data_source: string;
  data_quality: string;
  notes: string;
  created_date: string;
  modified_date: string;
}

export class BiometricDataAdminModel {
  // Get all biometric data records
  static async getAllBiometricData(): Promise<BiometricDataAdmin[]> {
    const sql = `
      SELECT * FROM biometric_data
      ORDER BY measurement_date DESC, athlete_id
    `;

    const result = await query(sql);
    return result.rows;
  }

  // Get biometric data by ID
  static async getBiometricDataById(biometricId: number): Promise<BiometricDataAdmin | null> {
    const sql = `
      SELECT * FROM biometric_data
      WHERE biometric_id = $1
    `;

    const result = await query(sql, [biometricId]);
    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  // Get biometric data by athlete ID
  static async getBiometricDataByAthleteId(athleteId: number): Promise<BiometricDataAdmin[]> {
    const sql = `
      SELECT * FROM biometric_data
      WHERE athlete_id = $1
      ORDER BY measurement_date DESC
    `;

    const result = await query(sql, [athleteId]);
    return result.rows;
  }

  // Get biometric data by date range
  static async getBiometricDataByDateRange(startDate: string, endDate: string): Promise<BiometricDataAdmin[]> {
    const sql = `
      SELECT * FROM biometric_data
      WHERE measurement_date >= $1 AND measurement_date <= $2
      ORDER BY measurement_date DESC, athlete_id
    `;

    const result = await query(sql, [startDate, endDate]);
    return result.rows;
  }

  // Create new biometric data record
  static async createBiometricData(biometricData: Omit<BiometricDataAdmin, 'biometric_id' | 'created_date' | 'modified_date'>): Promise<BiometricDataAdmin> {
    const sql = `
      INSERT INTO biometric_data (
        athlete_id, measurement_date, hrv_night, resting_hr, 
        spo2_night, respiratory_rate_night, sleep_duration_hours,
        deep_sleep_percent, rem_sleep_percent, light_sleep_percent,
        sleep_onset_time, wake_time, body_temperature,
        training_load_percent, data_source, data_quality, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `;

    const values = [
      biometricData.athlete_id,
      biometricData.measurement_date,
      biometricData.hrv_night,
      biometricData.resting_hr,
      biometricData.spo2_night,
      biometricData.respiratory_rate_night,
      biometricData.sleep_duration_hours,
      biometricData.deep_sleep_percent,
      biometricData.rem_sleep_percent,
      biometricData.light_sleep_percent,
      biometricData.sleep_onset_time,
      biometricData.wake_time,
      biometricData.body_temperature,
      biometricData.training_load_percent,
      biometricData.data_source,
      biometricData.data_quality,
      biometricData.notes
    ];

    const result = await query(sql, values);
    return result.rows[0];
  }

  // Update biometric data record
  static async updateBiometricData(biometricId: number, biometricData: Partial<BiometricDataAdmin>): Promise<boolean> {
    const fields = Object.keys(biometricData).filter(key => key !== 'biometric_id' && key !== 'created_date');
    if (fields.length === 0) return false;

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = fields.map(field => biometricData[field as keyof BiometricDataAdmin]);

    const sql = `
      UPDATE biometric_data
      SET ${setClause}
      WHERE biometric_id = $1
      RETURNING biometric_id
    `;

    const result = await query(sql, [biometricId, ...values]);
    return result.rows.length > 0;
  }

  // Delete biometric data record
  static async deleteBiometricData(biometricId: number): Promise<boolean> {
    const sql = `
      DELETE FROM biometric_data
      WHERE biometric_id = $1
      RETURNING biometric_id
    `;

    const result = await query(sql, [biometricId]);
    return result.rows.length > 0;
  }
}