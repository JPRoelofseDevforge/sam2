import { query } from '../connection';

export interface ReadinessScore {
  readiness_score_id: number;
  athlete_id: number;
  score_date: string;
  readiness_score: number;
  hrv_score: number;
  resting_hr_score: number;
  sleep_score: number;
  spo2_score: number;
  calculation_method: string;
  created_date: string;
}

export class ReadinessScoreModel {
  // Get all readiness scores
  static async getAllReadinessScores(): Promise<ReadinessScore[]> {
    const sql = `
      SELECT * FROM readiness_scores
      ORDER BY athlete_id, score_date DESC
    `;

    const result = await query(sql);
    return result.rows;
  }

  // Get readiness score by ID
  static async getReadinessScoreById(scoreId: number): Promise<ReadinessScore | null> {
    const sql = `
      SELECT * FROM readiness_scores
      WHERE readiness_score_id = $1
    `;

    const result = await query(sql, [scoreId]);
    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  // Get readiness scores by athlete ID
  static async getReadinessScoresByAthleteId(athleteId: number): Promise<ReadinessScore[]> {
    const sql = `
      SELECT * FROM readiness_scores
      WHERE athlete_id = $1
      ORDER BY score_date DESC
    `;

    const result = await query(sql, [athleteId]);
    return result.rows;
  }

  // Create new readiness score
  static async createReadinessScore(scoreData: Omit<ReadinessScore, 'readiness_score_id' | 'created_date'>): Promise<ReadinessScore> {
    const sql = `
      INSERT INTO readiness_scores (
        athlete_id, score_date, readiness_score, hrv_score, resting_hr_score,
        sleep_score, spo2_score, calculation_method
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (athlete_id, score_date) 
      DO UPDATE SET 
        readiness_score = EXCLUDED.readiness_score,
        hrv_score = EXCLUDED.hrv_score,
        resting_hr_score = EXCLUDED.resting_hr_score,
        sleep_score = EXCLUDED.sleep_score,
        spo2_score = EXCLUDED.spo2_score,
        calculation_method = EXCLUDED.calculation_method
      RETURNING *
    `;

    const values = [
      scoreData.athlete_id,
      scoreData.score_date,
      scoreData.readiness_score,
      scoreData.hrv_score,
      scoreData.resting_hr_score,
      scoreData.sleep_score,
      scoreData.spo2_score,
      scoreData.calculation_method
    ];

    const result = await query(sql, values);
    return result.rows[0];
  }

  // Update readiness score
  static async updateReadinessScore(scoreId: number, scoreData: Partial<ReadinessScore>): Promise<boolean> {
    const fields = Object.keys(scoreData).filter(key => key !== 'readiness_score_id' && key !== 'created_date');
    if (fields.length === 0) return false;

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = fields.map(field => scoreData[field as keyof ReadinessScore]);

    const sql = `
      UPDATE readiness_scores
      SET ${setClause}
      WHERE readiness_score_id = $1
      RETURNING readiness_score_id
    `;

    const result = await query(sql, [scoreId, ...values]);
    return result.rows.length > 0;
  }

  // Delete readiness score
  static async deleteReadinessScore(scoreId: number): Promise<boolean> {
    const sql = `
      DELETE FROM readiness_scores
      WHERE readiness_score_id = $1
      RETURNING readiness_score_id
    `;

    const result = await query(sql, [scoreId]);
    return result.rows.length > 0;
  }
}