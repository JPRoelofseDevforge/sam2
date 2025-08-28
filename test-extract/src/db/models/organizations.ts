import { query } from '../connection';

export interface Organization {
  organization_id: number;
  organization_name: string;
  organization_type: 'Team' | 'Club' | 'Academy' | 'Federation';
  country?: string;
  city?: string;
  address?: string;
  contact_email?: string;
  contact_phone?: string;
  website?: string;
  is_active: boolean;
  created_date: string;
  modified_date: string;
}

export class OrganizationModel {
  // Get all organizations
  static async getAllOrganizations(): Promise<Organization[]> {
    const sql = `
      SELECT * FROM organizations
      WHERE is_active = TRUE
      ORDER BY organization_name
    `;

    const result = await query(sql);
    return result.rows;
  }

  // Get organization by ID
  static async getOrganizationById(organizationId: number): Promise<Organization | null> {
    const sql = `
      SELECT * FROM organizations
      WHERE organization_id = $1 AND is_active = TRUE
    `;

    const result = await query(sql, [organizationId]);
    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  // Create new organization
  static async createOrganization(organizationData: Omit<Organization, 'organization_id' | 'created_date' | 'modified_date'>): Promise<Organization> {
    const sql = `
      INSERT INTO organizations (
        organization_name, organization_type, country, city, address,
        contact_email, contact_phone, website, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      organizationData.organization_name,
      organizationData.organization_type,
      organizationData.country,
      organizationData.city,
      organizationData.address,
      organizationData.contact_email,
      organizationData.contact_phone,
      organizationData.website,
      organizationData.is_active
    ];

    const result = await query(sql, values);
    return result.rows[0];
  }

  // Update organization
  static async updateOrganization(organizationId: number, organizationData: Partial<Organization>): Promise<boolean> {
    const fields = Object.keys(organizationData).filter(key => key !== 'organization_id' && key !== 'created_date');
    if (fields.length === 0) return false;

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = fields.map(field => organizationData[field as keyof Organization]);

    const sql = `
      UPDATE organizations
      SET ${setClause}
      WHERE organization_id = $1
      RETURNING organization_id
    `;

    const result = await query(sql, [organizationId, ...values]);
    return result.rows.length > 0;
  }

  // Delete organization (soft delete)
  static async deleteOrganization(organizationId: number): Promise<boolean> {
    const sql = `
      UPDATE organizations
      SET is_active = FALSE
      WHERE organization_id = $1
      RETURNING organization_id
    `;

    const result = await query(sql, [organizationId]);
    return result.rows.length > 0;
  }
}