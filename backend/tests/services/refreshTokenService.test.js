import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import AuthService from '../../src/services/authService.js';
import RefreshToken from '../../src/models/RefreshToken.js';
import TokenBlacklist from '../../src/models/TokenBlacklist.js';
import { verifyToken, generateAuthTokens } from '../../src/utils/jwt.js';
import pool from '../../src/config/database.js';

describe('Refresh Token System', () => {
  let testUser;
  let testCompany;

  beforeAll(async () => {
    // Создаем тестовую компанию
    const companyResult = await pool.query(
      'INSERT INTO companies (name) VALUES ($1) RETURNING *',
      ['Test Company for Refresh Tokens']
    );
    testCompany = companyResult.rows[0];

    // Создаем тестового пользователя
    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash('testpass123', 10);
    
    const userResult = await pool.query(
      'INSERT INTO users (email, password_hash, company_id) VALUES ($1, $2, $3) RETURNING *',
      ['refreshtest@example.com', passwordHash, testCompany.id]
    );
    testUser = userResult.rows[0];
  });

  afterAll(async () => {
    // Очистка тестовых данных
    if (testUser?.id) {
      await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [testUser.id]);
      await pool.query('DELETE FROM token_blacklist WHERE user_id = $1', [testUser.id]);
      await pool.query('DELETE FROM users WHERE id = $1', [testUser.id]);
    }
    if (testCompany?.id) {
      await pool.query('DELETE FROM companies WHERE id = $1', [testCompany.id]);
    }
  });

  beforeEach(async () => {
    // Очищаем токены перед каждым тестом
    if (testUser?.id) {
      await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [testUser.id]);
      await pool.query('DELETE FROM token_blacklist WHERE user_id = $1', [testUser.id]);
    }
  });

  describe('Login with Refresh Tokens', () => {
    it('should create refresh token on login', async () => {
      const requestInfo = {
        ipAddress: '127.0.0.1',
        userAgent: 'Test Browser'
      };

      const result = await AuthService.login({
        email: 'refreshtest@example.com',
        password: 'testpass123'
      }, requestInfo);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('tokenType', 'Bearer');
      expect(result).toHaveProperty('expiresAt');
      expect(result).toHaveProperty('refreshExpiresAt');

      // Проверяем что refresh токен сохранен в БД
      const dbTokens = await RefreshToken.getUserActiveTokens(testUser.id);
      expect(dbTokens).toHaveLength(1);
      expect(dbTokens[0].device_info).toBe('Test Browser');
      expect(dbTokens[0].ip_address).toBe('127.0.0.1');
    });

    it('should limit number of active tokens per user', async () => {
      const requestInfo = { ipAddress: '127.0.0.1', userAgent: 'Test Browser' };

      // Создаем 6 токенов (лимит 5)
      for (let i = 0; i < 6; i++) {
        await AuthService.login({
          email: 'refreshtest@example.com',
          password: 'testpass123'
        }, { ...requestInfo, userAgent: `Browser ${i}` });
      }

      // Должно остаться только 5 активных токенов
      const activeTokens = await RefreshToken.getUserActiveTokens(testUser.id);
      expect(activeTokens).toHaveLength(5);
    });
  });

  describe('Token Refresh', () => {
    let refreshToken;
    let accessToken;

    beforeEach(async () => {
      const loginResult = await AuthService.login({
        email: 'refreshtest@example.com',
        password: 'testpass123'
      }, { ipAddress: '127.0.0.1', userAgent: 'Test Browser' });

      refreshToken = loginResult.refreshToken;
      accessToken = loginResult.accessToken;
    });

    it('should refresh tokens successfully', async () => {
      const requestInfo = { ipAddress: '127.0.0.1', userAgent: 'Test Browser' };
      
      const result = await AuthService.refreshToken(refreshToken, requestInfo);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.accessToken).not.toBe(accessToken);
      expect(result.refreshToken).not.toBe(refreshToken);

      // Старый refresh токен должен быть недействительным
      const validation = await RefreshToken.validateToken(refreshToken);
      expect(validation.valid).toBe(false);
      // Может быть либо отозван, либо не найден (оба варианта корректны)
      expect(['Token is revoked', 'Token not found or expired']).toContain(validation.reason);
    });

    it('should reject invalid refresh token', async () => {
      const invalidToken = 'invalid.refresh.token';
      
      await expect(
        AuthService.refreshToken(invalidToken, {})
      ).rejects.toThrow('Недействительный refresh токен');
    });

    it('should reject revoked refresh token', async () => {
      // Отзываем токен
      const validation = await RefreshToken.validateToken(refreshToken);
      await RefreshToken.revoke(validation.tokenData.id);

      await expect(
        AuthService.refreshToken(refreshToken, {})
      ).rejects.toThrow(/Недействительный refresh токен/);
    });
  });

  describe('Logout', () => {
    let refreshToken;
    let accessToken;

    beforeEach(async () => {
      const loginResult = await AuthService.login({
        email: 'refreshtest@example.com',
        password: 'testpass123'
      }, { ipAddress: '127.0.0.1', userAgent: 'Test Browser' });

      refreshToken = loginResult.refreshToken;
      accessToken = loginResult.accessToken;
    });

    it('should logout successfully', async () => {
      const result = await AuthService.logout(refreshToken, accessToken, {});

      expect(result).toHaveProperty('message', 'Выход выполнен успешно');

      // Refresh токен должен быть отозван
      const validation = await RefreshToken.validateToken(refreshToken);
      expect(validation.valid).toBe(false);

      // Access токен должен быть в blacklist
      const decoded = verifyToken(accessToken, 'access');
      const isBlacklisted = await TokenBlacklist.isTokenBlacklisted(decoded.jti);
      expect(isBlacklisted).toBe(true);
    });

    it('should logout from all devices', async () => {
      // Создаем несколько сессий
      const session2 = await AuthService.login({
        email: 'refreshtest@example.com',
        password: 'testpass123'
      }, { ipAddress: '192.168.1.1', userAgent: 'Another Browser' });

      const result = await AuthService.logoutAllDevices(testUser.id);

      expect(result).toHaveProperty('message', 'Выход выполнен со всех устройств');
      expect(result.revokedTokensCount).toBeGreaterThan(0);

      // Все refresh токены должны быть отозваны
      const activeTokens = await RefreshToken.getUserActiveTokens(testUser.id);
      expect(activeTokens).toHaveLength(0);
    });
  });

  describe('Session Management', () => {
    beforeEach(async () => {
      // Создаем несколько сессий
      for (let i = 0; i < 3; i++) {
        await AuthService.login({
          email: 'refreshtest@example.com',
          password: 'testpass123'
        }, { 
          ipAddress: `192.168.1.${i + 1}`, 
          userAgent: `Browser ${i + 1}` 
        });
      }
    });

    it('should get active sessions', async () => {
      const result = await AuthService.getUserActiveSessions(testUser.id);

      expect(result).toHaveProperty('activeSessions');
      expect(result.activeSessions).toHaveLength(3);
      
      const session = result.activeSessions[0];
      expect(session).toHaveProperty('id');
      expect(session).toHaveProperty('deviceInfo');
      expect(session).toHaveProperty('ipAddress');
      expect(session).toHaveProperty('createdAt');
      expect(session).toHaveProperty('expiresAt');
    });

    it('should revoke specific session', async () => {
      const sessions = await AuthService.getUserActiveSessions(testUser.id);
      const sessionToRevoke = sessions.activeSessions[0];

      const result = await AuthService.revokeSession(testUser.id, sessionToRevoke.id);
      expect(result).toHaveProperty('message', 'Сессия успешно отозвана');

      // Проверяем что сессия отозвана
      const updatedSessions = await AuthService.getUserActiveSessions(testUser.id);
      expect(updatedSessions.activeSessions).toHaveLength(2);
    });
  });

  describe('Token Validation', () => {
    it('should validate access token type', () => {
      const tokens = generateAuthTokens(testUser);
      
      // Access токен должен валидироваться как access
      expect(() => verifyToken(tokens.accessToken, 'access')).not.toThrow();
      
      // Refresh токен не должен валидироваться как access
      expect(() => verifyToken(tokens.refreshToken, 'access')).toThrow('Неверный тип токена');
    });

    it('should include JTI in tokens', () => {
      const tokens = generateAuthTokens(testUser);
      
      const accessDecoded = verifyToken(tokens.accessToken, 'access');
      const refreshDecoded = verifyToken(tokens.refreshToken, 'refresh');
      
      expect(accessDecoded).toHaveProperty('jti');
      expect(refreshDecoded).toHaveProperty('jti');
      expect(accessDecoded.jti).not.toBe(refreshDecoded.jti);
    });
  });

  describe('Cleanup Functions', () => {
    it('should cleanup expired tokens', async () => {
      // Создаем истекший токен (устанавливаем дату истечения в прошлом)
      const expiredDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 8); // 8 дней назад
      
      await pool.query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, $3)`,
        [testUser.id, 'expired_token_hash', expiredDate]
      );

      const deletedCount = await RefreshToken.cleanupExpired();
      expect(deletedCount).toBeGreaterThanOrEqual(1);
    });
  });
}); 