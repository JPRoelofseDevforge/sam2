import { query, getClient } from '../connection';
import bcryptPkg from 'bcryptjs';
const { genSalt, hash, compare } = bcryptPkg;

export interface User {
  user_id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  is_active: boolean;
  is_email_verified: boolean;
  role_id?: number;
  role_name?: string;
  created_date?: string;
  modified_date?: string;
  last_login_date?: string;
}

export interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  role_id: number;
}

export interface UpdateUserInput {
  username?: string;
  email?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  is_active?: boolean;
  role_id?: number;
}

export class UserModel {
  // Get all users with their roles
  static async getAllUsers(): Promise<User[]> {
    const sqlQuery = `
      SELECT
        u.user_id,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        u.phone_number,
        u.is_active,
        u.is_email_verified,
        u.created_date::TEXT,
        u.modified_date::TEXT,
        u.last_login_date::TEXT,
        ur.role_id,
        ur.role_name
      FROM users u
      LEFT JOIN user_organization_roles uor ON u.user_id = uor.user_id AND uor.is_active = TRUE
      LEFT JOIN user_roles ur ON uor.role_id = ur.role_id
      ORDER BY u.username
    `;

    const result = await query(sqlQuery);
    console.log('Executed query', { text: sqlQuery, rows: result.rowCount });
    return result.rows;
  }

  // Get user by ID
  static async getUserById(userId: number): Promise<User | null> {
    const sqlQuery = `
      SELECT
        u.user_id,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        u.phone_number,
        u.is_active,
        u.is_email_verified,
        u.created_date::TEXT,
        u.modified_date::TEXT,
        u.last_login_date::TEXT,
        ur.role_id,
        ur.role_name
      FROM users u
      LEFT JOIN user_organization_roles uor ON u.user_id = uor.user_id AND uor.is_active = TRUE
      LEFT JOIN user_roles ur ON uor.role_id = ur.role_id
      WHERE u.user_id = $1
    `;

    const result = await query(sqlQuery, [userId]);
    console.log('Executed query', { text: sqlQuery, rows: result.rowCount });
    return result.rows[0] || null;
  }

  // Get user by username (for authentication)
  static async getUserByUsername(username: string): Promise<any> {
    const sqlQuery = `
      SELECT
        u.*,
        ur.role_id,
        ur.role_name
      FROM users u
      LEFT JOIN user_organization_roles uor ON u.user_id = uor.user_id AND uor.is_active = TRUE
      LEFT JOIN user_roles ur ON uor.role_id = ur.role_id
      WHERE u.username = $1 AND u.is_active = TRUE
    `;

    const result = await query(sqlQuery, [username]);
    console.log('Executed query', { text: sqlQuery, rows: result.rowCount });
    return result.rows[0] || null;
  }

  // Create new user
  static async createUser(userData: CreateUserInput): Promise<{ user_id: number }> {
    const { query: clientQuery, release } = await getClient();

    try {
      await clientQuery('BEGIN');

      // Hash password
      const salt = await genSalt(10);
      const passwordHash = await hash(userData.password, salt);

      // Insert user
      const insertUserQuery = `
        INSERT INTO users (
          username, email, password_hash, salt,
          first_name, last_name, phone_number,
          is_active, is_email_verified
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, FALSE)
        RETURNING user_id
      `;

      const userResult = await clientQuery(insertUserQuery, [
        userData.username,
        userData.email,
        passwordHash,
        salt,
        userData.first_name,
        userData.last_name,
        userData.phone_number || null
      ]);

      const userId = userResult.rows[0].user_id;

      // Assign role to user (assuming organization_id = 1 for now)
      const assignRoleQuery = `
        INSERT INTO user_organization_roles (
          user_id, organization_id, role_id, is_active
        ) VALUES ($1, $2, $3, TRUE)
      `;

      await clientQuery(assignRoleQuery, [userId, 1, userData.role_id]);

      await clientQuery('COMMIT');

      console.log('User created successfully', { user_id: userId });
      return { user_id: userId };

    } catch (error) {
      await clientQuery('ROLLBACK');
      throw error;
    } finally {
      release();
    }
  }

  // Update user
  static async updateUser(userId: number, userData: UpdateUserInput): Promise<boolean> {
    const { query: clientQuery, release } = await getClient();
    
    try {
      await clientQuery('BEGIN');

      // Build dynamic update query
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (userData.username !== undefined) {
        updateFields.push(`username = $${paramCount++}`);
        values.push(userData.username);
      }
      if (userData.email !== undefined) {
        updateFields.push(`email = $${paramCount++}`);
        values.push(userData.email);
      }
      if (userData.first_name !== undefined) {
        updateFields.push(`first_name = $${paramCount++}`);
        values.push(userData.first_name);
      }
      if (userData.last_name !== undefined) {
        updateFields.push(`last_name = $${paramCount++}`);
        values.push(userData.last_name);
      }
      if (userData.phone_number !== undefined) {
        updateFields.push(`phone_number = $${paramCount++}`);
        values.push(userData.phone_number);
      }
      if (userData.is_active !== undefined) {
        updateFields.push(`is_active = $${paramCount++}`);
        values.push(userData.is_active);
      }

      // Handle password update separately
      if (userData.password) {
        const salt = await genSalt(10);
        const passwordHash = await hash(userData.password, salt);
        updateFields.push(`password_hash = $${paramCount++}`);
        values.push(passwordHash);
        updateFields.push(`salt = $${paramCount++}`);
        values.push(salt);
      }

      if (updateFields.length > 0) {
        values.push(userId);
        const updateUserQuery = `
          UPDATE users
          SET ${updateFields.join(', ')}, modified_date = NOW()
          WHERE user_id = $${paramCount}
        `;

        await clientQuery(updateUserQuery, values);
      }

      // Update role if provided
      if (userData.role_id !== undefined) {
        const updateRoleQuery = `
          UPDATE user_organization_roles
          SET role_id = $1
          WHERE user_id = $2 AND organization_id = 1 AND is_active = TRUE
        `;

        await clientQuery(updateRoleQuery, [userData.role_id, userId]);
      }

      await clientQuery('COMMIT');

      console.log('User updated successfully', { user_id: userId });
      return true;

    } catch (error) {
      await clientQuery('ROLLBACK');
      throw error;
    } finally {
      release();
    }
  }

  // Delete user (soft delete)
  static async deleteUser(userId: number): Promise<boolean> {
    const sqlQuery = `
      UPDATE users
      SET is_active = FALSE, modified_date = NOW()
      WHERE user_id = $1
    `;

    const result = await query(sqlQuery, [userId]);
    console.log('Executed query', { text: sqlQuery, rows: result.rowCount });
    return (result.rowCount ?? 0) > 0;
  }

  // Authenticate user
  static async authenticateUser(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    
    if (!user || !user.is_active) {
      return null;
    }
    
    const isValidPassword = await compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return null;
    }
    
    // Update last login date
    await query(
      'UPDATE users SET last_login_date = NOW() WHERE user_id = $1',
      [user.user_id]
    );
    
    // Remove sensitive data before returning
    delete user.password_hash;
    delete user.salt;
    
    return user;
  }

  // Get all available roles
  static async getAllRoles(): Promise<any[]> {
    const sqlQuery = `
      SELECT role_id, role_name, description
      FROM user_roles
      ORDER BY role_name
    `;

    const result = await query(sqlQuery);
    console.log('Executed query', { text: sqlQuery, rows: result.rowCount });
    return result.rows;
  }

  // Check if user is admin
  static async isUserAdmin(userId: number): Promise<boolean> {
    const sqlQuery = `
      SELECT ur.role_name
      FROM user_organization_roles uor
      INNER JOIN user_roles ur ON uor.role_id = ur.role_id
      WHERE uor.user_id = $1 AND uor.is_active = TRUE
        AND ur.role_name IN ('SuperAdmin', 'OrgAdmin')
    `;

    const result = await query(sqlQuery, [userId]);
    return (result.rowCount ?? 0) > 0;
  }
}