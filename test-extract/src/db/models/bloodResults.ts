import { query } from '../connection';
import { BloodResults } from '../../types';

export class BloodResultsModel {
  // Get all blood results for an athlete by athlete_id
  static async getBloodResultsByAthleteId(AthleteId: number): Promise<BloodResults[]> {
    const sql = `
      SELECT *
      FROM blood_results
      WHERE "AthleteId" = $1
      ORDER BY date DESC, created_at DESC
    `;

    const result = await query(sql, [AthleteId]);
    return result.rows.map(row => ({
      id: row.id,
      AthleteId: row.AthleteId,
      name: row.name,
      code: row.code,
      date: row.date,
      created_at: row.created_at,
      lab_name: row.lab_name,
      test_method: row.test_method,
      reference_ranges: row.reference_ranges,
      notes: row.notes,
      is_abnormal: row.is_abnormal,
      flagged_values: row.flagged_values,
      cortisol_nmol_l: row.cortisol_nmol_l,
      vitamin_d: row.vitamin_d,
      testosterone: row.testosterone,
      ck: row.ck,
      fasting_glucose: row.fasting_glucose,
      hba1c: row.hba1c,
      hba1c_ifcc: row.hba1c_ifcc,
      estimated_average_glucose: row.estimated_average_glucose,
      urea: row.urea,
      creatinine: row.creatinine,
      egfr: row.egfr,
      uric_acid: row.uric_acid,
      s_glutamyl_transferase: row.s_glutamyl_transferase,
      s_alanine_transaminase: row.s_alanine_transaminase,
      s_aspartate_transaminase: row.s_aspartate_transaminase,
      lactate_dehydrogenase: row.lactate_dehydrogenase,
      calcium_adjusted: row.calcium_adjusted,
      calcium_measured: row.calcium_measured,
      magnesium: row.magnesium,
      albumin_bcg: row.albumin_bcg,
      c_reactive_protein: row.c_reactive_protein,
      total_protein: row.total_protein,
      esr: row.esr,
      erythrocyte_count: row.erythrocyte_count,
      hemoglobin: row.hemoglobin,
      hematocrit: row.hematocrit,
      mcv: row.mcv,
      mch: row.mch,
      mchc: row.mchc,
      rdw: row.rdw,
      leucocyte_count: row.leucocyte_count,
      neutrophils_pct: row.neutrophils_pct,
      neutrophil_absolute_count: row.neutrophil_absolute_count,
      lymphocytes_pct: row.lymphocytes_pct,
      lymphocytes_absolute_count: row.lymphocytes_absolute_count,
      monocytes_pct: row.monocytes_pct,
      monocytes_absolute_count: row.monocytes_absolute_count,
      eosinophils_pct: row.eosinophils_pct,
      eosinophils_absolute_count: row.eosinophils_absolute_count,
      basophils_pct: row.basophils_pct,
      basophils_absolute_count: row.basophils_absolute_count,
      nlr: row.nlr,
      platelets: row.platelets
    }));
  }

  // Get all blood results for an athlete by athlete_code
  static async getBloodResultsByAthleteCode(athleteCode: string): Promise<BloodResults[]> {
    const sql = `
      SELECT br.*
      FROM blood_results br
      JOIN athletes a ON br."AthleteId" = a.athlete_id
      WHERE a.athlete_code = $1
      ORDER BY br.date DESC, br.created_at DESC
    `;

    const result = await query(sql, [athleteCode]);
    return result.rows.map(row => ({
      id: row.id,
      AthleteId: row.AthleteId,
      name: row.name,
      code: row.code,
      date: row.date,
      created_at: row.created_at,
      lab_name: row.lab_name,
      test_method: row.test_method,
      reference_ranges: row.reference_ranges,
      notes: row.notes,
      is_abnormal: row.is_abnormal,
      flagged_values: row.flagged_values,
      cortisol_nmol_l: row.cortisol_nmol_l,
      vitamin_d: row.vitamin_d,
      testosterone: row.testosterone,
      ck: row.ck,
      fasting_glucose: row.fasting_glucose,
      hba1c: row.hba1c,
      hba1c_ifcc: row.hba1c_ifcc,
      estimated_average_glucose: row.estimated_average_glucose,
      urea: row.urea,
      creatinine: row.creatinine,
      egfr: row.egfr,
      uric_acid: row.uric_acid,
      s_glutamyl_transferase: row.s_glutamyl_transferase,
      s_alanine_transaminase: row.s_alanine_transaminase,
      s_aspartate_transaminase: row.s_aspartate_transaminase,
      lactate_dehydrogenase: row.lactate_dehydrogenase,
      calcium_adjusted: row.calcium_adjusted,
      calcium_measured: row.calcium_measured,
      magnesium: row.magnesium,
      albumin_bcg: row.albumin_bcg,
      c_reactive_protein: row.c_reactive_protein,
      total_protein: row.total_protein,
      esr: row.esr,
      erythrocyte_count: row.erythrocyte_count,
      hemoglobin: row.hemoglobin,
      hematocrit: row.hematocrit,
      mcv: row.mcv,
      mch: row.mch,
      mchc: row.mchc,
      rdw: row.rdw,
      leucocyte_count: row.leucocyte_count,
      neutrophils_pct: row.neutrophils_pct,
      neutrophil_absolute_count: row.neutrophil_absolute_count,
      lymphocytes_pct: row.lymphocytes_pct,
      lymphocytes_absolute_count: row.lymphocytes_absolute_count,
      monocytes_pct: row.monocytes_pct,
      monocytes_absolute_count: row.monocytes_absolute_count,
      eosinophils_pct: row.eosinophils_pct,
      eosinophils_absolute_count: row.eosinophils_absolute_count,
      basophils_pct: row.basophils_pct,
      basophils_absolute_count: row.basophils_absolute_count,
      nlr: row.nlr,
      platelets: row.platelets
    }));
  }

  // Get latest blood results for an athlete by athlete_id
  static async getLatestBloodResults(AthleteId: number): Promise<BloodResults | null> {
    const sql = `
      SELECT *
      FROM blood_results
      WHERE "AthleteId" = $1
      ORDER BY date DESC, created_at DESC
      LIMIT 1
    `;

    const result = await query(sql, [AthleteId]);
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      AthleteId: row.AthleteId,
      name: row.name,
      code: row.code,
      date: row.date,
      created_at: row.created_at,
      lab_name: row.lab_name,
      test_method: row.test_method,
      reference_ranges: row.reference_ranges,
      notes: row.notes,
      is_abnormal: row.is_abnormal,
      flagged_values: row.flagged_values,
      cortisol_nmol_l: row.cortisol_nmol_l,
      vitamin_d: row.vitamin_d,
      testosterone: row.testosterone,
      ck: row.ck,
      fasting_glucose: row.fasting_glucose,
      hba1c: row.hba1c,
      hba1c_ifcc: row.hba1c_ifcc,
      estimated_average_glucose: row.estimated_average_glucose,
      urea: row.urea,
      creatinine: row.creatinine,
      egfr: row.egfr,
      uric_acid: row.uric_acid,
      s_glutamyl_transferase: row.s_glutamyl_transferase,
      s_alanine_transaminase: row.s_alanine_transaminase,
      s_aspartate_transaminase: row.s_aspartate_transaminase,
      lactate_dehydrogenase: row.lactate_dehydrogenase,
      calcium_adjusted: row.calcium_adjusted,
      calcium_measured: row.calcium_measured,
      magnesium: row.magnesium,
      albumin_bcg: row.albumin_bcg,
      c_reactive_protein: row.c_reactive_protein,
      total_protein: row.total_protein,
      esr: row.esr,
      erythrocyte_count: row.erythrocyte_count,
      hemoglobin: row.hemoglobin,
      hematocrit: row.hematocrit,
      mcv: row.mcv,
      mch: row.mch,
      mchc: row.mchc,
      rdw: row.rdw,
      leucocyte_count: row.leucocyte_count,
      neutrophils_pct: row.neutrophils_pct,
      neutrophil_absolute_count: row.neutrophil_absolute_count,
      lymphocytes_pct: row.lymphocytes_pct,
      lymphocytes_absolute_count: row.lymphocytes_absolute_count,
      monocytes_pct: row.monocytes_pct,
      monocytes_absolute_count: row.monocytes_absolute_count,
      eosinophils_pct: row.eosinophils_pct,
      eosinophils_absolute_count: row.eosinophils_absolute_count,
      basophils_pct: row.basophils_pct,
      basophils_absolute_count: row.basophils_absolute_count,
      nlr: row.nlr,
      platelets: row.platelets
    };
  }

  // Create new blood results
  static async createBloodResults(bloodData: Partial<BloodResults>): Promise<BloodResults> {
    const fields = Object.keys(bloodData).filter(key => key !== 'id');
    const values = fields.map(field => bloodData[field as keyof BloodResults]);
    const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');

    const sql = `
      INSERT INTO blood_results (${fields.map(f => `"${f}"`).join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;

    const result = await query(sql, values);
    const row = result.rows[0];

    return {
      id: row.id,
      AthleteId: row.AthleteId,
      name: row.name,
      code: row.code,
      date: row.date,
      created_at: row.created_at,
      lab_name: row.lab_name,
      test_method: row.test_method,
      reference_ranges: row.reference_ranges,
      notes: row.notes,
      is_abnormal: row.is_abnormal,
      flagged_values: row.flagged_values,
      cortisol_nmol_l: row.cortisol_nmol_l,
      vitamin_d: row.vitamin_d,
      testosterone: row.testosterone,
      ck: row.ck,
      fasting_glucose: row.fasting_glucose,
      hba1c: row.hba1c,
      hba1c_ifcc: row.hba1c_ifcc,
      estimated_average_glucose: row.estimated_average_glucose,
      urea: row.urea,
      creatinine: row.creatinine,
      egfr: row.egfr,
      uric_acid: row.uric_acid,
      s_glutamyl_transferase: row.s_glutamyl_transferase,
      s_alanine_transaminase: row.s_alanine_transaminase,
      s_aspartate_transaminase: row.s_aspartate_transaminase,
      lactate_dehydrogenase: row.lactate_dehydrogenase,
      calcium_adjusted: row.calcium_adjusted,
      calcium_measured: row.calcium_measured,
      magnesium: row.magnesium,
      albumin_bcg: row.albumin_bcg,
      c_reactive_protein: row.c_reactive_protein,
      total_protein: row.total_protein,
      esr: row.esr,
      erythrocyte_count: row.erythrocyte_count,
      hemoglobin: row.hemoglobin,
      hematocrit: row.hematocrit,
      mcv: row.mcv,
      mch: row.mch,
      mchc: row.mchc,
      rdw: row.rdw,
      leucocyte_count: row.leucocyte_count,
      neutrophils_pct: row.neutrophils_pct,
      neutrophil_absolute_count: row.neutrophil_absolute_count,
      lymphocytes_pct: row.lymphocytes_pct,
      lymphocytes_absolute_count: row.lymphocytes_absolute_count,
      monocytes_pct: row.monocytes_pct,
      monocytes_absolute_count: row.monocytes_absolute_count,
      eosinophils_pct: row.eosinophils_pct,
      eosinophils_absolute_count: row.eosinophils_absolute_count,
      basophils_pct: row.basophils_pct,
      basophils_absolute_count: row.basophils_absolute_count,
      nlr: row.nlr,
      platelets: row.platelets
    };
  }

  // Update blood results
  static async updateBloodResults(id: number, bloodData: Partial<BloodResults>): Promise<boolean> {
    const fields = Object.keys(bloodData);
    if (fields.length === 0) return false;

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = fields.map(field => bloodData[field as keyof BloodResults]);

    const sql = `
      UPDATE blood_results
      SET ${setClause}
      WHERE id = $1
      RETURNING id
    `;

    const result = await query(sql, [id, ...values]);
    return result.rows.length > 0;
  }

  // Delete blood results
  static async deleteBloodResults(id: number): Promise<boolean> {
    const sql = `
      DELETE FROM blood_results
      WHERE id = $1
      RETURNING id
    `;

    const result = await query(sql, [id]);
    return result.rows.length > 0;
  }

  // Get all blood results (for admin purposes)
  static async getAllBloodResults(): Promise<BloodResults[]> {
    const sql = `
      SELECT *
      FROM blood_results
      ORDER BY created_at DESC
    `;

    const result = await query(sql);
    return result.rows.map(row => ({
      id: row.id,
      AthleteId: row.AthleteId,
      name: row.name,
      code: row.code,
      date: row.date,
      created_at: row.created_at,
      lab_name: row.lab_name,
      test_method: row.test_method,
      reference_ranges: row.reference_ranges,
      notes: row.notes,
      is_abnormal: row.is_abnormal,
      flagged_values: row.flagged_values,
      cortisol_nmol_l: row.cortisol_nmol_l,
      vitamin_d: row.vitamin_d,
      testosterone: row.testosterone,
      ck: row.ck,
      fasting_glucose: row.fasting_glucose,
      hba1c: row.hba1c,
      hba1c_ifcc: row.hba1c_ifcc,
      estimated_average_glucose: row.estimated_average_glucose,
      urea: row.urea,
      creatinine: row.creatinine,
      egfr: row.egfr,
      uric_acid: row.uric_acid,
      s_glutamyl_transferase: row.s_glutamyl_transferase,
      s_alanine_transaminase: row.s_alanine_transaminase,
      s_aspartate_transaminase: row.s_aspartate_transaminase,
      lactate_dehydrogenase: row.lactate_dehydrogenase,
      calcium_adjusted: row.calcium_adjusted,
      calcium_measured: row.calcium_measured,
      magnesium: row.magnesium,
      albumin_bcg: row.albumin_bcg,
      c_reactive_protein: row.c_reactive_protein,
      total_protein: row.total_protein,
      esr: row.esr,
      erythrocyte_count: row.erythrocyte_count,
      hemoglobin: row.hemoglobin,
      hematocrit: row.hematocrit,
      mcv: row.mcv,
      mch: row.mch,
      mchc: row.mchc,
      rdw: row.rdw,
      leucocyte_count: row.leucocyte_count,
      neutrophils_pct: row.neutrophils_pct,
      neutrophil_absolute_count: row.neutrophil_absolute_count,
      lymphocytes_pct: row.lymphocytes_pct,
      lymphocytes_absolute_count: row.lymphocytes_absolute_count,
      monocytes_pct: row.monocytes_pct,
      monocytes_absolute_count: row.monocytes_absolute_count,
      eosinophils_pct: row.eosinophils_pct,
      eosinophils_absolute_count: row.eosinophils_absolute_count,
      basophils_pct: row.basophils_pct,
      basophils_absolute_count: row.basophils_absolute_count,
      nlr: row.nlr,
      platelets: row.platelets
    }));
  }
}