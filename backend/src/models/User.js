const pool = require('../config/database');
const bcrypt = require('bcrypt');

class User {
  static async create(data) {
    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;
    const passwordHash = await bcrypt.hash(data.password, saltRounds);
    
    const query = `
      INSERT INTO users (email, password_hash, company_id)
      VALUES ($1, $2, $3)
      RETURNING id, email, company_id, created_at
    `;
    const values = [data.email, passwordHash, data.companyId];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = `
      SELECT u.*, c.name as company_name 
      FROM users u 
      LEFT JOIN companies c ON u.company_id = c.id 
      WHERE u.email = $1
    `;
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT u.*, c.name as company_name 
      FROM users u 
      LEFT JOIN companies c ON u.company_id = c.id 
      WHERE u.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async updateLastLogin(id) {
    const query = `
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP 
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async validatePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  static async updatePassword(id, newPassword) {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    
    const query = `
      UPDATE users 
      SET password_hash = $2 
      WHERE id = $1
      RETURNING id, email, company_id
    `;
    const result = await pool.query(query, [id, passwordHash]);
    return result.rows[0];
  }
}

module.exports = User; 