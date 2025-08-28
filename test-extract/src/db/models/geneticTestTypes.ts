import { query } from '../connection';

export interface GeneticTestType {
  test_type_id: number;
  test_name: string;
  test_provider?: string;
  test_description?: string;
  test_version?: string;
  is_active: boolean;
}

export class GeneticTestTypeModel {
  // Get all genetic test types
  static async getAllGeneticTestTypes(): Promise<GeneticTestType[]> {
    const sql = `
      SELECT * FROM genetic_test_types
      WHERE is_active = TRUE
      ORDER BY test_name
    `;

    const result = await query(sql);
    return result.rows;
  }

  // Get genetic test type by ID
  static async getGeneticTestTypeById(testTypeId: number): Promise<GeneticTestType | null> {
    const sql = `
      SELECT * FROM genetic_test_types
      WHERE test_type_id = $1 AND is_active = TRUE
    `;

    const result = await query(sql, [testTypeId]);
    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  // Create new genetic test type
  static async createGeneticTestType(testTypeData: Omit<GeneticTestType, 'test_type_id'>): Promise<GeneticTestType> {
    const sql = `
      INSERT INTO genetic_test_types (test_name, test_provider, test_description, test_version, is_active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      testTypeData.test_name,
      testTypeData.test_provider,
      testTypeData.test_description,
      testTypeData.test_version,
      testTypeData.is_active
    ];

    const result = await query(sql, values);
    return result.rows[0];
  }

  // Update genetic test type
  static async updateGeneticTestType(testTypeId: number, testTypeData: Partial<GeneticTestType>): Promise<boolean> {
    const fields = Object.keys(testTypeData).filter(key => key !== 'test_type_id');
    if (fields.length === 0) return false;

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = fields.map(field => testTypeData[field as keyof GeneticTestType]);

    const sql = `
      UPDATE genetic_test_types
      SET ${setClause}
      WHERE test_type_id = $1
      RETURNING test_type_id
    `;

    const result = await query(sql, [testTypeId, ...values]);
    return result.rows.length > 0;
  }

  // Delete genetic test type (soft delete)
  static async deleteGeneticTestType(testTypeId: number): Promise<boolean> {
    const sql = `
      UPDATE genetic_test_types
      SET is_active = FALSE
      WHERE test_type_id = $1
      RETURNING test_type_id
    `;

    const result = await query(sql, [testTypeId]);
    return result.rows.length > 0;
  }
}