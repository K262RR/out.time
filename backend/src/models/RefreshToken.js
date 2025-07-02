const pool = require('../config/database');
const query = pool.query.bind(pool);
const crypto = require('crypto');

class RefreshToken {
  
  // Создание нового refresh токена
  static async create({ userId, token, expiresAt, deviceInfo = null, ipAddress = null }) {
    // Хешируем токен для безопасности
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    const result = await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, device_info, ip_address)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, tokenHash, expiresAt, deviceInfo, ipAddress]
    );
    
    return result.rows[0];
  }

  // Поиск токена по хешу
  static async findByToken(token) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    const result = await query(
      `SELECT rt.*, u.email, u.company_id, c.name as company_name
       FROM refresh_tokens rt
       JOIN users u ON rt.user_id = u.id
       LEFT JOIN companies c ON u.company_id = c.id
       WHERE rt.token_hash = $1 
       AND rt.is_revoked = FALSE 
       AND rt.expires_at > CURRENT_TIMESTAMP`,
      [tokenHash]
    );
    
    return result.rows[0] || null;
  }

  // Отзыв токена (soft delete)
  static async revoke(tokenId, replacedByTokenId = null) {
    const result = await query(
      `UPDATE refresh_tokens 
       SET is_revoked = TRUE, 
           revoked_at = CURRENT_TIMESTAMP,
           replaced_by_token_id = $2
       WHERE id = $1
       RETURNING *`,
      [tokenId, replacedByTokenId]
    );
    
    return result.rows[0];
  }

  // Отзыв всех токенов пользователя
  static async revokeAllUserTokens(userId, reason = 'security_logout') {
    const result = await query(
      `UPDATE refresh_tokens 
       SET is_revoked = TRUE, 
           revoked_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 
       AND is_revoked = FALSE
       RETURNING *`,
      [userId]
    );
    
    return result.rows;
  }

  // Получение активных токенов пользователя
  static async getUserActiveTokens(userId) {
    const result = await query(
      `SELECT id, created_at, device_info, ip_address, expires_at
       FROM refresh_tokens 
       WHERE user_id = $1 
       AND is_revoked = FALSE 
       AND expires_at > CURRENT_TIMESTAMP
       ORDER BY created_at DESC`,
      [userId]
    );
    
    return result.rows;
  }

  // Очистка истекших токенов
  static async cleanupExpired() {
    const result = await query(
      `DELETE FROM refresh_tokens 
       WHERE expires_at < CURRENT_TIMESTAMP - INTERVAL '7 days'
       OR (is_revoked = TRUE AND revoked_at < CURRENT_TIMESTAMP - INTERVAL '7 days')`
    );
    
    return result.rowCount;
  }

  // Ограничение количества активных токенов на пользователя
  static async limitUserTokens(userId, maxTokens = 5) {
    // Получаем все активные токены, отсортированные по дате создания
    const tokens = await query(
      `SELECT id FROM refresh_tokens 
       WHERE user_id = $1 
       AND is_revoked = FALSE 
       AND expires_at > CURRENT_TIMESTAMP
       ORDER BY created_at DESC`,
      [userId]
    );
    
    // Если токенов больше лимита, отзываем старые
    if (tokens.rows.length >= maxTokens) {
      const tokensToRevoke = tokens.rows.slice(maxTokens - 1);
      
      for (const token of tokensToRevoke) {
        await this.revoke(token.id);
      }
      
      return tokensToRevoke.length;
    }
    
    return 0;
  }

  // Проверка токена на валидность
  static async validateToken(token) {
    const tokenData = await this.findByToken(token);
    
    if (!tokenData) {
      return { valid: false, reason: 'Token not found or expired' };
    }
    
    if (tokenData.is_revoked) {
      return { valid: false, reason: 'Token is revoked' };
    }
    
    if (new Date(tokenData.expires_at) <= new Date()) {
      return { valid: false, reason: 'Token is expired' };
    }
    
    return { 
      valid: true, 
      tokenData: {
        id: tokenData.id,
        userId: tokenData.user_id,
        email: tokenData.email,
        companyId: tokenData.company_id,
        companyName: tokenData.company_name,
        expiresAt: tokenData.expires_at
      }
    };
  }
}

module.exports = RefreshToken; 