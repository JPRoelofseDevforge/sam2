import { query } from '../connection';
import { GeneticProfile } from '../../types';
import { AthleteModel } from './athletes';

export class GeneticProfileModel {
  // Get genetic profile for a specific athlete
  static async getGeneticProfileByAthlete(athleteCode: string): Promise<GeneticProfile[]> {
    // Get the actual athlete_id from athlete_code
    const athleteId = await AthleteModel.getAthleteIdMapping(athleteCode);
    if (!athleteId) {
      return [];
    }

    const sql = `
      SELECT 
        a.athlete_code AS athlete_id,
        g.gene_name AS gene,
        gp.genotype
      FROM genetic_profiles gp
      INNER JOIN genetic_test_results gtr ON gp.test_result_id = gtr.test_result_id
      INNER JOIN genes g ON gp.gene_id = g.gene_id
      INNER JOIN athletes a ON gtr.athlete_id = a.athlete_id
      WHERE gtr.athlete_id = $1
        AND gtr.test_status = 'Completed'
        AND gtr.test_date = (
          SELECT MAX(gtr_sub.test_date)
          FROM genetic_test_results gtr_sub
          WHERE gtr_sub.athlete_id = $1 AND gtr_sub.test_status = 'Completed'
        )
      ORDER BY g.gene_name
    `;
    
    const result = await query(sql, [athleteId]);
    return result.rows.map(row => ({
      athlete_id: row.athlete_id,
      gene: row.gene,
      genotype: row.genotype
    }));
  }

  // Get all genetic profiles for all athletes
  static async getAllGeneticProfiles(): Promise<GeneticProfile[]> {
    const sql = `
      WITH latest_tests AS (
        SELECT 
          athlete_id,
          MAX(test_date) AS latest_date
        FROM genetic_test_results
        WHERE test_status = 'Completed'
        GROUP BY athlete_id
      )
      SELECT 
        a.athlete_code AS athlete_id,
        g.gene_name AS gene,
        gp.genotype
      FROM genetic_profiles gp
      INNER JOIN genetic_test_results gtr ON gp.test_result_id = gtr.test_result_id
      INNER JOIN latest_tests lt ON gtr.athlete_id = lt.athlete_id 
        AND gtr.test_date = lt.latest_date
      INNER JOIN genes g ON gp.gene_id = g.gene_id
      INNER JOIN athletes a ON gtr.athlete_id = a.athlete_id
      WHERE a.is_active = TRUE
        AND gtr.test_status = 'Completed'
      ORDER BY a.athlete_code, g.gene_name
    `;
    
    const result = await query(sql);
    return result.rows.map(row => ({
      athlete_id: row.athlete_id,
      gene: row.gene,
      genotype: row.genotype
    }));
  }

  // Get genetic profiles by gene category
  static async getGeneticProfilesByCategory(category: string): Promise<GeneticProfile[]> {
    const sql = `
      WITH latest_tests AS (
        SELECT 
          athlete_id,
          MAX(test_date) AS latest_date
        FROM genetic_test_results
        WHERE test_status = 'Completed'
        GROUP BY athlete_id
      )
      SELECT 
        a.athlete_code AS athlete_id,
        g.gene_name AS gene,
        gp.genotype,
        g.gene_description,
        g.category
      FROM genetic_profiles gp
      INNER JOIN genetic_test_results gtr ON gp.test_result_id = gtr.test_result_id
      INNER JOIN latest_tests lt ON gtr.athlete_id = lt.athlete_id 
        AND gtr.test_date = lt.latest_date
      INNER JOIN genes g ON gp.gene_id = g.gene_id
      INNER JOIN athletes a ON gtr.athlete_id = a.athlete_id
      WHERE a.is_active = TRUE
        AND gtr.test_status = 'Completed'
        AND g.category = $1
      ORDER BY a.athlete_code, g.gene_name
    `;
    
    const result = await query(sql, [category]);
    return result.rows.map(row => ({
      athlete_id: row.athlete_id,
      gene: row.gene,
      genotype: row.genotype
    }));
  }

  // Get specific genes for all athletes (for recovery panel, etc.)
  static async getSpecificGenes(geneNames: string[]): Promise<GeneticProfile[]> {
    const sql = `
      WITH latest_tests AS (
        SELECT 
          athlete_id,
          MAX(test_date) AS latest_date
        FROM genetic_test_results
        WHERE test_status = 'Completed'
        GROUP BY athlete_id
      )
      SELECT 
        a.athlete_code AS athlete_id,
        g.gene_name AS gene,
        gp.genotype
      FROM genetic_profiles gp
      INNER JOIN genetic_test_results gtr ON gp.test_result_id = gtr.test_result_id
      INNER JOIN latest_tests lt ON gtr.athlete_id = lt.athlete_id 
        AND gtr.test_date = lt.latest_date
      INNER JOIN genes g ON gp.gene_id = g.gene_id
      INNER JOIN athletes a ON gtr.athlete_id = a.athlete_id
      WHERE a.is_active = TRUE
        AND gtr.test_status = 'Completed'
        AND g.gene_name = ANY($1::text[])
      ORDER BY a.athlete_code, g.gene_name
    `;
    
    const result = await query(sql, [geneNames]);
    return result.rows.map(row => ({
      athlete_id: row.athlete_id,
      gene: row.gene,
      genotype: row.genotype
    }));
  }

  // Insert genetic test result and profiles
  static async insertGeneticTestResult(
    athleteCode: string,
    testTypeId: number,
    testDate: string,
    profiles: { gene: string; genotype: string }[]
  ): Promise<void> {
    const athleteId = await AthleteModel.getAthleteIdMapping(athleteCode);
    if (!athleteId) {
      throw new Error(`Athlete with code ${athleteCode} not found`);
    }

    // Start a transaction
    const client = await query('BEGIN');
    
    try {
      // Insert test result
      const testResultSql = `
        INSERT INTO genetic_test_results (
          athlete_id, test_type_id, test_date, test_status
        ) VALUES ($1, $2, $3, 'Completed')
        RETURNING test_result_id
      `;
      
      const testResult = await query(testResultSql, [athleteId, testTypeId, testDate]);
      const testResultId = testResult.rows[0].test_result_id;
      
      // Insert genetic profiles
      for (const profile of profiles) {
        // Get gene_id
        const geneSql = `SELECT gene_id FROM genes WHERE gene_name = $1`;
        const geneResult = await query(geneSql, [profile.gene]);
        
        if (geneResult.rows.length > 0) {
          const geneId = geneResult.rows[0].gene_id;
          
          const profileSql = `
            INSERT INTO genetic_profiles (
              test_result_id, gene_id, genotype, confidence
            ) VALUES ($1, $2, $3, 95.0)
            ON CONFLICT (test_result_id, gene_id) 
            DO UPDATE SET genotype = EXCLUDED.genotype
          `;
          
          await query(profileSql, [testResultId, geneId, profile.genotype]);
        }
      }
      
      await query('COMMIT');
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  }

  // Get available genes list
  static async getAvailableGenes(): Promise<{ gene_name: string; description: string; category: string }[]> {
    const sql = `
      SELECT 
        gene_name,
        gene_description AS description,
        category
      FROM genes
      ORDER BY category, gene_name
    `;
    
    const result = await query(sql);
    return result.rows;
  }
}