import { query } from '../connection';

export interface Gene {
  gene_id: number;
  gene_name: string;
  gene_description?: string;
  chromosome?: string;
  function?: string;
  category?: string;
}

export class GeneModel {
  // Get all genes
  static async getAllGenes(): Promise<Gene[]> {
    const sql = `
      SELECT
        gene_id,
        gene_name,
        gene_description,
        chromosome,
        "function" as function,
        category
      FROM genes
      ORDER BY gene_name
    `;

    const result = await query(sql);
    return result.rows;
  }

  // Get gene by ID
  static async getGeneById(geneId: number): Promise<Gene | null> {
    const sql = `
      SELECT
        gene_id,
        gene_name,
        gene_description,
        chromosome,
        "function" as function,
        category
      FROM genes
      WHERE gene_id = $1
    `;

    const result = await query(sql, [geneId]);
    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  // Get genes by category
  static async getGenesByCategory(category: string): Promise<Gene[]> {
    const sql = `
      SELECT
        gene_id,
        gene_name,
        gene_description,
        chromosome,
        "function" as function,
        category
      FROM genes
      WHERE category = $1
      ORDER BY gene_name
    `;

    const result = await query(sql, [category]);
    return result.rows;
  }

  // Create new gene
  static async createGene(geneData: Omit<Gene, 'gene_id'>): Promise<Gene> {
    const sql = `
      INSERT INTO genes (gene_name, gene_description, chromosome, "function", category)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      geneData.gene_name,
      geneData.gene_description,
      geneData.chromosome,
      geneData.function,
      geneData.category
    ];

    const result = await query(sql, values);
    return result.rows[0];
  }

  // Update gene
  static async updateGene(geneId: number, geneData: Partial<Gene>): Promise<boolean> {
    const fields = Object.keys(geneData).filter(key => key !== 'gene_id');
    if (fields.length === 0) return false;

    // Quote reserved column names
    const toColumn = (field: string) => (field === 'function' ? '"function"' : field);

    const setClause = fields.map((field, index) => `${toColumn(field)} = $${index + 2}`).join(', ');
    const values = fields.map(field => geneData[field as keyof Gene]);

    const sql = `
      UPDATE genes
      SET ${setClause}
      WHERE gene_id = $1
      RETURNING gene_id
    `;

    const result = await query(sql, [geneId, ...values]);
    return result.rows.length > 0;
  }

  // Delete gene (soft delete)
  static async deleteGene(geneId: number): Promise<boolean> {
    const sql = `
      DELETE FROM genes
      WHERE gene_id = $1
      RETURNING gene_id
    `;

    const result = await query(sql, [geneId]);
    return result.rows.length > 0;
  }
}