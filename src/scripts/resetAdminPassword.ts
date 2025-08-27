import bcrypt from 'bcryptjs';
import pool from '../db/connection';

async function resetAdminPassword() {
  const client = await pool.connect();
  
  try {
    // Check if admin user exists
    const checkUser = await client.query(
      'SELECT user_id FROM users WHERE username = $1',
      ['admin']
    );
    
    if (checkUser.rows.length === 0) {
      console.log('Admin user does not exist. Creating new admin user...');
      
      // Hash the password
      const password = 'qwe12345_';
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      
      // Begin transaction
      await client.query('BEGIN');
      
      // Insert admin user
      const insertUser = await client.query(
        `INSERT INTO users (
          username, email, password_hash, salt, 
          first_name, last_name, phone_number,
          is_active, is_email_verified
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING user_id`,
        [
          'admin',
          'admin@system.com',
          passwordHash,
          salt,
          'System',
          'Administrator',
          '+27123456789',
          true,
          true
        ]
      );
      
      const userId = insertUser.rows[0].user_id;
      
      // Assign SuperAdmin role (role_id = 1)
      await client.query(
        `INSERT INTO user_organization_roles (
          user_id, organization_id, role_id, is_active
        ) VALUES ($1, $2, $3, $4)`,
        [userId, 1, 1, true]
      );
      
      // Commit transaction
      await client.query('COMMIT');
      
      console.log('Admin user created successfully!');
    } else {
      // Update existing admin user password
      const password = 'qwe12345_';
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      
      await client.query(
        `UPDATE users 
         SET password_hash = $1, salt = $2, modified_date = NOW() 
         WHERE username = $3`,
        [passwordHash, salt, 'admin']
      );
      
      console.log('Admin password reset successfully!');
    }
    
    console.log('-----------------------------------');
    console.log('Admin Login Credentials:');
    console.log('Username: admin');
    console.log('Password: qwe12345_');
    console.log('-----------------------------------');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error resetting admin password:', error);
  } finally {
    client.release();
    process.exit();
  }
}

resetAdminPassword();