import { query } from '../connection';
import { BiometricData } from '../../types';
import { AthleteModel } from './athletes';

export class BiometricDataModel {
  // Get biometric data for an athlete within a date range
  static async getBiometricDataByAthlete(
    athleteCode: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<BiometricData[]> {
    // Get the actual athlete_id from athlete_code
    const athleteId = await AthleteModel.getAthleteIdMapping(athleteCode);
    if (!athleteId) {
      return [];
    }

    let sql = `
      SELECT 
        a.athlete_code AS athlete_id,
        bd.measurement_date::TEXT AS date,
        bd.hrv_night,
        bd.resting_hr,
        bd.spo2_night,
        bd.respiratory_rate_night AS resp_rate_night,
        bd.deep_sleep_percent AS deep_sleep_pct,
        bd.rem_sleep_percent AS rem_sleep_pct,
        bd.light_sleep_percent AS light_sleep_pct,
        bd.sleep_duration_hours AS sleep_duration_h,
        bd.body_temperature AS temp_trend_c,
        bd.training_load_percent AS training_load_pct,
        bd.sleep_onset_time::TEXT AS sleep_onset_time,
        bd.wake_time::TEXT AS wake_time
      FROM biometric_data bd
      INNER JOIN athletes a ON bd.athlete_id = a.athlete_id
      WHERE bd.athlete_id = $1
    `;
    
    const params: any[] = [athleteId];
    
    if (startDate) {
      sql += ` AND bd.measurement_date >= $${params.length + 1}`;
      params.push(startDate);
    }
    
    if (endDate) {
      sql += ` AND bd.measurement_date <= $${params.length + 1}`;
      params.push(endDate);
    }
    
    sql += ` ORDER BY bd.measurement_date DESC`;
    
    const result = await query(sql, params);
    return result.rows.map(row => ({
      athlete_id: row.athlete_id,
      date: row.date,
      hrv_night: row.hrv_night || 0,
      resting_hr: row.resting_hr || 0,
      spo2_night: parseFloat(row.spo2_night) || 0,
      resp_rate_night: parseFloat(row.resp_rate_night) || 0,
      deep_sleep_pct: row.deep_sleep_pct || 0,
      rem_sleep_pct: row.rem_sleep_pct || 0,
      light_sleep_pct: row.light_sleep_pct || 0,
      sleep_duration_h: parseFloat(row.sleep_duration_h) || 0,
      temp_trend_c: parseFloat(row.temp_trend_c) || 0,
      training_load_pct: row.training_load_pct || 0,
      sleep_onset_time: row.sleep_onset_time,
      wake_time: row.wake_time
    }));
  }

  // Get latest biometric data for all athletes
  static async getLatestBiometricData(): Promise<BiometricData[]> {
    const sql = `
      SELECT 
        a.athlete_code AS athlete_id,
        bd.measurement_date::TEXT AS date,
        bd.hrv_night,
        bd.resting_hr,
        bd.spo2_night,
        bd.respiratory_rate_night AS resp_rate_night,
        bd.deep_sleep_percent AS deep_sleep_pct,
        bd.rem_sleep_percent AS rem_sleep_pct,
        bd.light_sleep_percent AS light_sleep_pct,
        bd.sleep_duration_hours AS sleep_duration_h,
        bd.body_temperature AS temp_trend_c,
        bd.training_load_percent AS training_load_pct,
        bd.sleep_onset_time::TEXT AS sleep_onset_time,
        bd.wake_time::TEXT AS wake_time
      FROM biometric_data bd
      INNER JOIN athletes a ON bd.athlete_id = a.athlete_id
      INNER JOIN (
        SELECT athlete_id, MAX(measurement_date) AS latest_date
        FROM biometric_data
        GROUP BY athlete_id
      ) latest ON bd.athlete_id = latest.athlete_id 
        AND bd.measurement_date = latest.latest_date
      WHERE a.is_active = TRUE
      ORDER BY a.athlete_code
    `;
    
    const result = await query(sql);
    return result.rows.map(row => ({
      athlete_id: row.athlete_id,
      date: row.date,
      hrv_night: row.hrv_night || 0,
      resting_hr: row.resting_hr || 0,
      spo2_night: parseFloat(row.spo2_night) || 0,
      resp_rate_night: parseFloat(row.resp_rate_night) || 0,
      deep_sleep_pct: row.deep_sleep_pct || 0,
      rem_sleep_pct: row.rem_sleep_pct || 0,
      light_sleep_pct: row.light_sleep_pct || 0,
      sleep_duration_h: parseFloat(row.sleep_duration_h) || 0,
      temp_trend_c: parseFloat(row.temp_trend_c) || 0,
      training_load_pct: row.training_load_pct || 0,
      sleep_onset_time: row.sleep_onset_time,
      wake_time: row.wake_time
    }));
  }

  // Get all biometric data for multiple athletes
  static async getAllBiometricData(startDate?: string, endDate?: string): Promise<BiometricData[]> {
    let sql = `
      SELECT 
        a.athlete_code AS athlete_id,
        bd.measurement_date::TEXT AS date,
        bd.hrv_night,
        bd.resting_hr,
        bd.spo2_night,
        bd.respiratory_rate_night AS resp_rate_night,
        bd.deep_sleep_percent AS deep_sleep_pct,
        bd.rem_sleep_percent AS rem_sleep_pct,
        bd.light_sleep_percent AS light_sleep_pct,
        bd.sleep_duration_hours AS sleep_duration_h,
        bd.body_temperature AS temp_trend_c,
        bd.training_load_percent AS training_load_pct,
        bd.sleep_onset_time::TEXT AS sleep_onset_time,
        bd.wake_time::TEXT AS wake_time
      FROM biometric_data bd
      INNER JOIN athletes a ON bd.athlete_id = a.athlete_id
      WHERE a.is_active = TRUE
    `;
    
    const params: any[] = [];
    
    if (startDate) {
      sql += ` AND bd.measurement_date >= $${params.length + 1}`;
      params.push(startDate);
    }
    
    if (endDate) {
      sql += ` AND bd.measurement_date <= $${params.length + 1}`;
      params.push(endDate);
    }
    
    sql += ` ORDER BY a.athlete_code, bd.measurement_date DESC`;
    
    const result = await query(sql, params);
    return result.rows.map(row => ({
      athlete_id: row.athlete_id,
      date: row.date,
      hrv_night: row.hrv_night || 0,
      resting_hr: row.resting_hr || 0,
      spo2_night: parseFloat(row.spo2_night) || 0,
      resp_rate_night: parseFloat(row.resp_rate_night) || 0,
      deep_sleep_pct: row.deep_sleep_pct || 0,
      rem_sleep_pct: row.rem_sleep_pct || 0,
      light_sleep_pct: row.light_sleep_pct || 0,
      sleep_duration_h: parseFloat(row.sleep_duration_h) || 0,
      temp_trend_c: parseFloat(row.temp_trend_c) || 0,
      training_load_pct: row.training_load_pct || 0,
      sleep_onset_time: row.sleep_onset_time,
      wake_time: row.wake_time
    }));
  }

  // Insert new biometric data
  static async insertBiometricData(data: BiometricData): Promise<void> {
    const athleteId = await AthleteModel.getAthleteIdMapping(data.athlete_id);
    if (!athleteId) {
      throw new Error(`Athlete with code ${data.athlete_id} not found`);
    }

    const sql = `
      INSERT INTO biometric_data (
        athlete_id, measurement_date, hrv_night, resting_hr,
        spo2_night, respiratory_rate_night, deep_sleep_percent,
        rem_sleep_percent, light_sleep_percent, sleep_duration_hours,
        body_temperature, training_load_percent, sleep_onset_time, wake_time,
        data_source
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (athlete_id, measurement_date)
      DO UPDATE SET
        hrv_night = EXCLUDED.hrv_night,
        resting_hr = EXCLUDED.resting_hr,
        spo2_night = EXCLUDED.spo2_night,
        respiratory_rate_night = EXCLUDED.respiratory_rate_night,
        deep_sleep_percent = EXCLUDED.deep_sleep_percent,
        rem_sleep_percent = EXCLUDED.rem_sleep_percent,
        light_sleep_percent = EXCLUDED.light_sleep_percent,
        sleep_duration_hours = EXCLUDED.sleep_duration_hours,
        body_temperature = EXCLUDED.body_temperature,
        training_load_percent = EXCLUDED.training_load_percent,
        sleep_onset_time = EXCLUDED.sleep_onset_time,
        wake_time = EXCLUDED.wake_time,
        modified_date = NOW()
    `;

    await query(sql, [
      athleteId,
      data.date,
      data.hrv_night,
      data.resting_hr,
      data.spo2_night,
      data.resp_rate_night,
      data.deep_sleep_pct,
      data.rem_sleep_pct,
      data.light_sleep_pct,
      data.sleep_duration_h,
      data.temp_trend_c,
      data.training_load_pct,
      data.sleep_onset_time || null,
      data.wake_time || null,
      'API'
    ]);
  }

  // Get all biometric data for admin (with full details)
  static async getAllBiometricDataAdmin(): Promise<any[]> {
    const sql = `
      SELECT
        bd.biometric_id,
        a.athlete_id,
        a.athlete_code,
        a.first_name,
        a.last_name,
        bd.measurement_date::TEXT AS measurement_date,
        bd.hrv_night,
        bd.resting_hr,
        bd.spo2_night,
        bd.respiratory_rate_night,
        bd.deep_sleep_percent,
        bd.rem_sleep_percent,
        bd.light_sleep_percent,
        bd.sleep_duration_hours,
        bd.body_temperature,
        bd.training_load_percent,
        bd.sleep_onset_time::TEXT,
        bd.wake_time::TEXT,
        bd.data_source,
        bd.data_quality,
        bd.notes,
        bd.created_date::TEXT,
        bd.modified_date::TEXT
      FROM biometric_data bd
      INNER JOIN athletes a ON bd.athlete_id = a.athlete_id
      ORDER BY bd.measurement_date DESC, a.athlete_code
    `;

    const result = await query(sql);
    return result.rows;
  }

  // Get single biometric data record by ID
  static async getBiometricDataById(id: number): Promise<any> {
    const sql = `
      SELECT
        bd.biometric_id,
        a.athlete_id,
        a.athlete_code,
        a.first_name,
        a.last_name,
        bd.measurement_date::TEXT AS measurement_date,
        bd.hrv_night,
        bd.resting_hr,
        bd.spo2_night,
        bd.respiratory_rate_night,
        bd.deep_sleep_percent,
        bd.rem_sleep_percent,
        bd.light_sleep_percent,
        bd.sleep_duration_hours,
        bd.body_temperature,
        bd.training_load_percent,
        bd.sleep_onset_time::TEXT,
        bd.wake_time::TEXT,
        bd.data_source,
        bd.data_quality,
        bd.notes,
        bd.created_date::TEXT,
        bd.modified_date::TEXT
      FROM biometric_data bd
      INNER JOIN athletes a ON bd.athlete_id = a.athlete_id
      WHERE bd.biometric_id = $1
    `;

    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }

  // Create new biometric data record
  static async createBiometricData(data: any): Promise<any> {
    const athleteId = await AthleteModel.getAthleteIdMapping(data.athlete_id);
    if (!athleteId) {
      throw new Error(`Athlete with code ${data.athlete_id} not found`);
    }

    const sql = `
      INSERT INTO biometric_data (
        athlete_id, measurement_date, hrv_night, resting_hr,
        spo2_night, respiratory_rate_night, deep_sleep_percent,
        rem_sleep_percent, light_sleep_percent, sleep_duration_hours,
        body_temperature, training_load_percent, sleep_onset_time, wake_time,
        data_source, data_quality, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING biometric_id
    `;

    const result = await query(sql, [
      athleteId,
      data.measurement_date,
      data.hrv_night || null,
      data.resting_hr || null,
      data.spo2_night || null,
      data.respiratory_rate_night || null,
      data.deep_sleep_percent || null,
      data.rem_sleep_percent || null,
      data.light_sleep_percent || null,
      data.sleep_duration_hours || null,
      data.body_temperature || null,
      data.training_load_percent || null,
      data.sleep_onset_time || null,
      data.wake_time || null,
      data.data_source || 'Manual',
      data.data_quality || 'Good',
      data.notes || null
    ]);

    return result.rows[0];
  }

  // Update biometric data record
  static async updateBiometricData(id: number, data: any): Promise<boolean> {
    const sql = `
      UPDATE biometric_data SET
        hrv_night = $1,
        resting_hr = $2,
        spo2_night = $3,
        respiratory_rate_night = $4,
        deep_sleep_percent = $5,
        rem_sleep_percent = $6,
        light_sleep_percent = $7,
        sleep_duration_hours = $8,
        body_temperature = $9,
        training_load_percent = $10,
        sleep_onset_time = $11,
        wake_time = $12,
        data_source = $13,
        data_quality = $14,
        notes = $15,
        modified_date = NOW()
      WHERE biometric_id = $16
    `;

    const result = await query(sql, [
      data.hrv_night || null,
      data.resting_hr || null,
      data.spo2_night || null,
      data.respiratory_rate_night || null,
      data.deep_sleep_percent || null,
      data.rem_sleep_percent || null,
      data.light_sleep_percent || null,
      data.sleep_duration_hours || null,
      data.body_temperature || null,
      data.training_load_percent || null,
      data.sleep_onset_time || null,
      data.wake_time || null,
      data.data_source || 'Manual',
      data.data_quality || 'Good',
      data.notes || null,
      id
    ]);

    return (result.rowCount ?? 0) > 0;
  }

  // Delete biometric data record
  static async deleteBiometricData(id: number): Promise<boolean> {
    const sql = `DELETE FROM biometric_data WHERE biometric_id = $1`;
    const result = await query(sql, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}