import { query } from '../connection';

export interface UserOrganizationRole {
  user_org_role_id: number;
  user_id: number;
  organization_id: number;
  role_id: number;
  is_active: boolean;
  assigned_date: string;
  assigned_by_user_id: number;
}

export class UserOrganizationRoleModel {
  // Get all user organization roles
  static async getAllUserOrganizationRoles(): Promise<UserOrganizationRole[]> {
    const sql = `
      SELECT * FROM user_organization_roles
      ORDER BY user_org_role_id
    `;

    const result = await query(sql);
    return result.rows;
  }

  // Get user organization role by ID
  static async getUserOrganizationRoleById(userOrgRoleId: number): Promise<UserOrganizationRole | null> {
    const sql = `
      SELECT * FROM user_organization_roles
      WHERE user_org_role_id = $1
    `;

    const result = await query(sql, [userOrgRoleId]);
    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  // Get user organization roles by user ID
  static async getUserOrganizationRolesByUserId(userId: number): Promise<UserOrganizationRole[]> {
    const sql = `
      SELECT * FROM user_organization_roles
      WHERE user_id = $1
      ORDER BY assigned_date DESC
    `;

    const result = await query(sql, [userId]);
    return result.rows;
  }

  // Create new user organization role
  static async createUserOrganizationRole(roleData: Omit<UserOrganizationRole, 'user_org_role_id' | 'assigned_date'>): Promise<UserOrganizationRole> {
    const sql = `
      INSERT INTO user_organization_roles (
        user_id, organization_id, role_id, is_active, assigned_by_user_id
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      roleData.user_id,
      roleData.organization_id,
      roleData.role_id,
      roleData.is_active,
      roleData.assigned_by_user_id
    ];

    const result = await query(sql, values);
    return result.rows[0];
  }

  // Update user organization role
  static async updateUserOrganizationRole(userOrgRoleId: number, roleData: Partial<UserOrganizationRole>): Promise<boolean> {
    const fields = Object.keys(roleData).filter(key => key !== 'user_org_role_id' && key !== 'assigned_date');
    if (fields.length === 0) return false;

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = fields.map(field => roleData[field as keyof UserOrganizationRole]);

    const sql = `
      UPDATE user_organization_roles
      SET ${setClause}
      WHERE user_org_role_id = $1
      RETURNING user_org_role_id
    `;

    const result = await query(sql, [userOrgRoleId, ...values]);
    return result.rows.length > 0;
  }

  // Delete user organization role (soft delete)
  static async deleteUserOrganizationRole(userOrgRoleId: number): Promise<boolean> {
    const sql = `
      UPDATE user_organization_roles
      SET is_active = FALSE
      WHERE user_org_role_id = $1
      RETURNING user_org_role_id
    `;

    const result = await query(sql, [userOrgRoleId]);
    return result.rows.length > 0;
  }
}