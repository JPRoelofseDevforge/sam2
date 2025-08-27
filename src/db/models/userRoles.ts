import { query } from '../connection';

export interface UserRole {
  role_id: number;
  role_name: string;
  description: string;
  permissions: any;
  is_active: boolean;
}

export class UserRoleModel {
  // Get all user roles
  static async getAllRoles(): Promise<UserRole[]> {
    const sql = `
      SELECT * FROM user_roles
      ORDER BY role_id
    `;

    const result = await query(sql);
    return result.rows;
  }

  // Get role by ID
  static async getRoleById(roleId: number): Promise<UserRole | null> {
    const sql = `
      SELECT * FROM user_roles
      WHERE role_id = $1
    `;

    const result = await query(sql, [roleId]);
    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  // Create new role
  static async createRole(roleData: Omit<UserRole, 'role_id'>): Promise<UserRole> {
    const sql = `
      INSERT INTO user_roles (
        role_name, description, permissions
      ) VALUES ($1, $2, $3)
      RETURNING *
    `;

    const values = [
      roleData.role_name,
      roleData.description,
      roleData.permissions
    ];

    const result = await query(sql, values);
    return result.rows[0];
  }

  // Update role
  static async updateRole(roleId: number, roleData: Partial<UserRole>): Promise<boolean> {
    const fields = Object.keys(roleData).filter(key => key !== 'role_id');
    if (fields.length === 0) return false;

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = fields.map(field => roleData[field as keyof UserRole]);

    const sql = `
      UPDATE user_roles
      SET ${setClause}
      WHERE role_id = $1
      RETURNING role_id
    `;

    const result = await query(sql, [roleId, ...values]);
    return result.rows.length > 0;
  }

  // Delete role (soft delete)
  static async deleteRole(roleId: number): Promise<boolean> {
    const sql = `
      UPDATE user_roles
      SET is_active = FALSE
      WHERE role_id = $1
      RETURNING role_id
    `;

    const result = await query(sql, [roleId]);
    return result.rows.length > 0;
  }
}