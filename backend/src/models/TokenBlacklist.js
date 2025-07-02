const pool = require('../config/database');
const query = pool.query.bind(pool);

class TokenBlacklist {
  
  // Добавление токена в blacklist
  static async addToken({ tokenJti, userId, expiresAt, reason = 'logout' }) {
    const result = await query(
      `INSERT INTO token_blacklist (token_jti, user_id, expires_at, reason)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (token_jti) DO NOTHING
       RETURNING *`,
      [tokenJti, userId, expiresAt, reason]
    );
    
    return result.rows[0];
  }

  // Проверка токена в blacklist
  static async isTokenBlacklisted(tokenJti) {
    const result = await query(
      `SELECT id FROM token_blacklist 
       WHERE token_jti = $1 
       AND expires_at > CURRENT_TIMESTAMP`,
      [tokenJti]
    );
    
    return result.rows.length > 0;
  }

  // Добавление всех токенов пользователя в blacklist
  static async addAllUserTokens(userId, reason = 'security_logout') {
    // Получаем все активные access токены для пользователя
    // В реальном приложении это может быть сложнее, 
    // но пока добавим запись с wildcard для пользователя
    const result = await query(
      `INSERT INTO token_blacklist (token_jti, user_id, expires_at, reason)
       VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL '1 hour', $3)
       RETURNING *`,
      [`user_${userId}_*`, userId, reason]
    );
    
    return result.rows[0];
  }

  // Очистка истекших записей blacklist
  static async cleanupExpired() {
    const result = await query(
      `DELETE FROM token_blacklist 
       WHERE expires_at < CURRENT_TIMESTAMP`
    );
    
    return result.rowCount;
  }

  // Получение статистики blacklist
  static async getStats() {
    const result = await query(
      `SELECT 
         COUNT(*) as total_blacklisted,
         COUNT(CASE WHEN expires_at > CURRENT_TIMESTAMP THEN 1 END) as active_blacklisted,
         COUNT(CASE WHEN reason = 'logout' THEN 1 END) as logout_count,
         COUNT(CASE WHEN reason = 'security_logout' THEN 1 END) as security_logout_count
       FROM token_blacklist`
    );
    
    return result.rows[0];
  }
}

module.exports = TokenBlacklist; 