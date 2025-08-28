import { query } from '../connection';
import { Athlete } from '../../types';

export class AthleteModel {
  // Get all athletes with their current organization and sport
  static async getAllAthletes(): Promise<Athlete[]> {
    const sql = `
      SELECT 
        a.athlete_id,
        a.athlete_code,
        a.first_name || ' ' || a.last_name AS name,
        EXTRACT(YEAR FROM AGE(a.date_of_birth))::INTEGER AS age,
        a.date_of_birth::TEXT,
        s.sport_name AS sport,
        o.organization_name AS team
      FROM athletes a
      LEFT JOIN athlete_organization_history aoh ON a.athlete_id = aoh.athlete_id
        AND aoh.is_active = TRUE 
        AND aoh.end_date IS NULL
      LEFT JOIN organizations o ON aoh.organization_id = o.organization_id
      LEFT JOIN sports s ON aoh.sport_id = s.sport_id
      WHERE a.is_active = TRUE
      ORDER BY a.athlete_code
    `;
    
    const result = await query(sql);
    return result.rows.map(row => ({
      athlete_id: row.athlete_code, // Using athlete_code as the ID for consistency with frontend
      name: row.name,
      sport: row.sport || 'Unknown',
      age: row.age,
      team: row.team || 'Unassigned',
      date_of_birth: row.date_of_birth
    }));
  }

  // Get a single athlete by ID
  static async getAthleteById(athleteCode: string): Promise<Athlete | null> {
    const sql = `
      SELECT 
        a.athlete_id,
        a.athlete_code,
        a.first_name || ' ' || a.last_name AS name,
        EXTRACT(YEAR FROM AGE(a.date_of_birth))::INTEGER AS age,
        a.date_of_birth::TEXT,
        s.sport_name AS sport,
        o.organization_name AS team
      FROM athletes a
      LEFT JOIN athlete_organization_history aoh ON a.athlete_id = aoh.athlete_id
        AND aoh.is_active = TRUE 
        AND aoh.end_date IS NULL
      LEFT JOIN organizations o ON aoh.organization_id = o.organization_id
      LEFT JOIN sports s ON aoh.sport_id = s.sport_id
      WHERE a.athlete_code = $1 AND a.is_active = TRUE
    `;
    
    const result = await query(sql, [athleteCode]);
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      athlete_id: row.athlete_code,
      name: row.name,
      sport: row.sport || 'Unknown',
      age: row.age,
      team: row.team || 'Unassigned',
      date_of_birth: row.date_of_birth
    };
  }

  // Get athletes by team/organization
  static async getAthletesByTeam(organizationId: number): Promise<Athlete[]> {
    const sql = `
      SELECT 
        a.athlete_id,
        a.athlete_code,
        a.first_name || ' ' || a.last_name AS name,
        EXTRACT(YEAR FROM AGE(a.date_of_birth))::INTEGER AS age,
        a.date_of_birth::TEXT,
        s.sport_name AS sport,
        o.organization_name AS team,
        aoh.position,
        aoh.jersey_number
      FROM athletes a
      INNER JOIN athlete_organization_history aoh ON a.athlete_id = aoh.athlete_id
      INNER JOIN organizations o ON aoh.organization_id = o.organization_id
      INNER JOIN sports s ON aoh.sport_id = s.sport_id
      WHERE aoh.organization_id = $1 
        AND a.is_active = TRUE
        AND aoh.is_active = TRUE 
        AND aoh.end_date IS NULL
      ORDER BY aoh.jersey_number, a.athlete_code
    `;
    
    const result = await query(sql, [organizationId]);
    return result.rows.map(row => ({
      athlete_id: row.athlete_code,
      name: row.name,
      sport: row.sport,
      age: row.age,
      team: row.team,
      date_of_birth: row.date_of_birth
    }));
  }

  // Get athlete ID mapping (athlete_code to athlete_id)
  static async getAthleteIdMapping(athleteCode: string): Promise<number | null> {
    const sql = `
      SELECT athlete_id
      FROM athletes
      WHERE athlete_code = $1 AND is_active = TRUE
    `;

    const result = await query(sql, [athleteCode]);
    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0].athlete_id;
  }

  // Create new athlete
  static async createAthlete(athleteData: {
    athlete_code: string;
    user_id?: number;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    gender: 'M' | 'F' | 'O';
    height?: number;
    nationality?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    medical_notes?: string;
  }): Promise<any> {
    const sql = `
      INSERT INTO athletes (
        athlete_code, user_id, first_name, last_name, date_of_birth,
        gender, height, nationality, emergency_contact_name,
        emergency_contact_phone, medical_notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      athleteData.athlete_code,
      athleteData.user_id,
      athleteData.first_name,
      athleteData.last_name,
      athleteData.date_of_birth,
      athleteData.gender,
      athleteData.height,
      athleteData.nationality,
      athleteData.emergency_contact_name,
      athleteData.emergency_contact_phone,
      athleteData.medical_notes
    ];

    const result = await query(sql, values);
    return result.rows[0];
  }

  // Update athlete
  static async updateAthlete(athleteCode: string, athleteData: Partial<{
    first_name: string;
    last_name: string;
    date_of_birth: string;
    gender: 'M' | 'F' | 'O';
    height: number;
    nationality: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
    medical_notes: string;
  }>): Promise<boolean> {
    const fields = Object.keys(athleteData);
    if (fields.length === 0) return false;

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = fields.map(field => athleteData[field as keyof typeof athleteData]);

    const sql = `
      UPDATE athletes
      SET ${setClause}
      WHERE athlete_code = $1
      RETURNING athlete_id
    `;

    const result = await query(sql, [athleteCode, ...values]);
    return result.rows.length > 0;
  }

  // Delete athlete (soft delete)
  static async deleteAthlete(athleteCode: string): Promise<boolean> {
    const sql = `
      UPDATE athletes
      SET is_active = FALSE
      WHERE athlete_code = $1
      RETURNING athlete_id
    `;

    const result = await query(sql, [athleteCode]);
    return result.rows.length > 0;
  }
}