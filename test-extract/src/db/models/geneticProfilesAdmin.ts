import { query } from '../connection';

export interface GeneticProfile {
  genetic_profile_id: number;
  test_result_id: number;
  gene_id: number;
  genotype: string;
  confidence: number;
  raw_data: string;
  created_date: string;
}

export class GeneticProfileAdminModel {
  // Get all genetic profiles
  static async getAllGeneticProfiles(): Promise<GeneticProfile[]> {
    const sql = `
      SELECT * FROM genetic_profiles
      ORDER BY created_date DESC
    `;

    const result = await query(sql);
    return result.rows;
  }

  // Get genetic profile by ID
  static async getGeneticProfileById(profileId: number): Promise<GeneticProfile | null> {
    const sql = `
      SELECT * FROM genetic_profiles
      WHERE genetic_profile_id = $1
    `;

    const result = await query(sql, [profileId]);
    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  // Get genetic profiles by test result ID
  static async getGeneticProfilesByTestResultId(testResultId: number): Promise<GeneticProfile[]> {
    const sql = `
      SELECT * FROM genetic_profiles
      WHERE test_result_id = $1
      ORDER BY gene_id
    `;

    const result = await query(sql, [testResultId]);
    return result.rows;
  }

  // Create new genetic profile
  static async createGeneticProfile(profileData: Omit<GeneticProfile, 'genetic_profile_id' | 'created_date'>): Promise<GeneticProfile> {
    const sql = `
      INSERT INTO genetic_profiles (
        test_result_id, gene_id, genotype, confidence, raw_data
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      profileData.test_result_id,
      profileData.gene_id,
      profileData.genotype,
      profileData.confidence,
      profileData.raw_data
    ];

    const result = await query(sql, values);
    return result.rows[0];
  }

  // Update genetic profile
  static async updateGeneticProfile(profileId: number, profileData: Partial<GeneticProfile>): Promise<boolean> {
    const fields = Object.keys(profileData).filter(key => key !== 'genetic_profile_id' && key !== 'created_date');
    if (fields.length === 0) return false;

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = fields.map(field => profileData[field as keyof GeneticProfile]);

    const sql = `
      UPDATE genetic_profiles
      SET ${setClause}
      WHERE genetic_profile_id = $1
      RETURNING genetic_profile_id
    `;

    const result = await query(sql, [profileId, ...values]);
    return result.rows.length > 0;
  }

  // Delete genetic profile
  static async deleteGeneticProfile(profileId: number): Promise<boolean> {
    const sql = `
      DELETE FROM genetic_profiles
      WHERE genetic_profile_id = $1
      RETURNING genetic_profile_id
    `;

    const result = await query(sql, [profileId]);
    return result.rows.length > 0;
  }
}