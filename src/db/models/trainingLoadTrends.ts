import { query } from '../connection';

export interface TrainingLoadTrend {
  trend_id: number;
  athlete_id: number;
  week_start_date: string;
  average_load: number;
  load_trend: string;
  trend_value: number;
  created_date: string;
}

export class TrainingLoadTrendModel {
  // Get all training load trends
  static async getAllTrainingLoadTrends(): Promise<TrainingLoadTrend[]> {
    const sql = `
      SELECT * FROM training_load_trends
      ORDER BY athlete_id, week_start_date DESC
    `;

    const result = await query(sql);
    return result.rows;
  }

  // Get training load trend by ID
  static async getTrainingLoadTrendById(trendId: number): Promise<TrainingLoadTrend | null> {
    const sql = `
      SELECT * FROM training_load_trends
      WHERE trend_id = $1
    `;

    const result = await query(sql, [trendId]);
    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  // Get training load trends by athlete ID
  static async getTrainingLoadTrendsByAthleteId(athleteId: number): Promise<TrainingLoadTrend[]> {
    const sql = `
      SELECT * FROM training_load_trends
      WHERE athlete_id = $1
      ORDER BY week_start_date DESC
    `;

    const result = await query(sql, [athleteId]);
    return result.rows;
  }

  // Create new training load trend
  static async createTrainingLoadTrend(trendData: Omit<TrainingLoadTrend, 'trend_id' | 'created_date'>): Promise<TrainingLoadTrend> {
    const sql = `
      INSERT INTO training_load_trends (
        athlete_id, week_start_date, average_load, load_trend, trend_value
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      trendData.athlete_id,
      trendData.week_start_date,
      trendData.average_load,
      trendData.load_trend,
      trendData.trend_value
    ];

    const result = await query(sql, values);
    return result.rows[0];
  }

  // Update training load trend
  static async updateTrainingLoadTrend(trendId: number, trendData: Partial<TrainingLoadTrend>): Promise<boolean> {
    const fields = Object.keys(trendData).filter(key => key !== 'trend_id' && key !== 'created_date');
    if (fields.length === 0) return false;

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = fields.map(field => trendData[field as keyof TrainingLoadTrend]);

    const sql = `
      UPDATE training_load_trends
      SET ${setClause}
      WHERE trend_id = $1
      RETURNING trend_id
    `;

    const result = await query(sql, [trendId, ...values]);
    return result.rows.length > 0;
  }

  // Delete training load trend
  static async deleteTrainingLoadTrend(trendId: number): Promise<boolean> {
    const sql = `
      DELETE FROM training_load_trends
      WHERE trend_id = $1
      RETURNING trend_id
    `;

    const result = await query(sql, [trendId]);
    return result.rows.length > 0;
  }
}