import { query } from '../connection';

export interface GeneticTestResult {
  test_result_id: number;
  athlete_id: number;
  test_type_id: number;
  test_date: string;
  test_lab_id: string;
  test_status: string;
  notes: string;
  created_date: string;
}

export class GeneticTestResultModel {
  // Get all genetic test results
  static async getAllGeneticTestResults(): Promise<GeneticTestResult[]> {
    const sql = `
      SELECT * FROM genetic_test_results
      ORDER BY test_date DESC
    `;

    const result = await query(sql);
    return result.rows;
  }

  // Get genetic test result by ID
  static async getGeneticTestResultById(testResultId: number): Promise<GeneticTestResult | null> {
    const sql = `
      SELECT * FROM genetic_test_results
      WHERE test_result_id = $1
    `;

    const result = await query(sql, [testResultId]);
    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  // Get genetic test results by athlete ID
  static async getGeneticTestResultsByAthleteId(athleteId: number): Promise<GeneticTestResult[]> {
    const sql = `
      SELECT * FROM genetic_test_results
      WHERE athlete_id = $1
      ORDER BY test_date DESC
    `;

    const result = await query(sql, [athleteId]);
    return result.rows;
  }

  // Create new genetic test result
  static async createGeneticTestResult(testResultData: Omit<GeneticTestResult, 'test_result_id' | 'created_date'>): Promise<GeneticTestResult> {
    const sql = `
      INSERT INTO genetic_test_results (
        athlete_id, test_type_id, test_date, test_lab_id, test_status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      testResultData.athlete_id,
      testResultData.test_type_id,
      testResultData.test_date,
      testResultData.test_lab_id,
      testResultData.test_status,
      testResultData.notes
    ];

    const result = await query(sql, values);
    return result.rows[0];
  }

  // Update genetic test result
  static async updateGeneticTestResult(testResultId: number, testResultData: Partial<GeneticTestResult>): Promise<boolean> {
    const fields = Object.keys(testResultData).filter(key => key !== 'test_result_id' && key !== 'created_date');
    if (fields.length === 0) return false;

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = fields.map(field => testResultData[field as keyof GeneticTestResult]);

    const sql = `
      UPDATE genetic_test_results
      SET ${setClause}
      WHERE test_result_id = $1
      RETURNING test_result_id
    `;

    const result = await query(sql, [testResultId, ...values]);
    return result.rows.length > 0;
  }

  // Delete genetic test result
  static async deleteGeneticTestResult(testResultId: number): Promise<boolean> {
    const sql = `
      DELETE FROM genetic_test_results
      WHERE test_result_id = $1
      RETURNING test_result_id
    `;

    const result = await query(sql, [testResultId]);
    return result.rows.length > 0;
  }
}