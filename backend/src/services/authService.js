import User from '../models/User.js';
import Company from '../models/Company.js';
import RefreshToken from '../models/RefreshToken.js';
import TokenBlacklist from '../models/TokenBlacklist.js';
import { generateAuthTokens, verifyToken, parseTimeToSeconds, JWT_REFRESH_EXPIRATION } from '../utils/jwt.js';
import ApiError from '../utils/ApiError.js';

class AuthService {
  static async register(userData, requestInfo = {}) {
    const { email, password, companyName } = userData;
    const { ipAddress, userAgent } = requestInfo;

    // Проверяем существование пользователя
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new ApiError(400, 'Пользователь с таким email уже существует');
    }

    // Создаем компанию
    const company = await Company.create({ name: companyName });
    
    // Создаем пользователя
    const user = await User.create({
      email,
      password,
      companyId: company.id
    });

    // Генерируем токены с информацией об устройстве
    const tokens = generateAuthTokens({
      id: user.id,
      email: user.email,
      company_id: company.id
    }, userAgent);

    // Сохраняем refresh токен в базе данных
    const refreshExpiresAt = new Date(Date.now() + parseTimeToSeconds(JWT_REFRESH_EXPIRATION) * 1000);
    await RefreshToken.create({
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt: refreshExpiresAt,
      deviceInfo: userAgent,
      ipAddress: ipAddress
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        companyId: company.id,
        companyName: company.name,
        createdAt: user.created_at
      },
      ...tokens
    };
  }

  static async login(credentials, requestInfo = {}) {
    const { email, password } = credentials;
    const { ipAddress, userAgent } = requestInfo;

    // Находим пользователя
    const user = await User.findByEmail(email);
    if (!user) {
      throw new ApiError(401, 'Неверный email или пароль');
    }

    // Проверяем пароль
    const isValidPassword = await User.validatePassword(password, user.password_hash);
    if (!isValidPassword) {
      throw new ApiError(401, 'Неверный email или пароль');
    }

    // Обновляем время последнего входа
    await User.updateLastLogin(user.id);

    // Ограничиваем количество активных токенов
    await RefreshToken.limitUserTokens(user.id, 5);

    // Генерируем токены
    const tokens = generateAuthTokens(user, userAgent);

    // Сохраняем refresh токен в базе данных
    const refreshExpiresAt = new Date(Date.now() + parseTimeToSeconds(JWT_REFRESH_EXPIRATION) * 1000);
    await RefreshToken.create({
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt: refreshExpiresAt,
      deviceInfo: userAgent,
      ipAddress: ipAddress
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        companyId: user.company_id,
        companyName: user.company_name,
        lastLogin: new Date().toISOString()
      },
      ...tokens
    };
  }

  static async refreshToken(refreshTokenString, requestInfo = {}) {
    const { ipAddress, userAgent } = requestInfo;

    // Проверяем refresh токен
    try {
      const decoded = verifyToken(refreshTokenString, 'refresh');
      
      // Проверяем токен в базе данных
      const validation = await RefreshToken.validateToken(refreshTokenString);
      if (!validation.valid) {
        throw new ApiError(401, `Недействительный refresh токен: ${validation.reason}`);
      }

      const tokenData = validation.tokenData;
      
      // Находим пользователя
      const user = await User.findById(tokenData.userId);
      if (!user) {
        throw new ApiError(404, 'Пользователь не найден');
      }

      // Генерируем новую пару токенов
      const tokens = generateAuthTokens(user, userAgent);

      // Сохраняем новый refresh токен
      const refreshExpiresAt = new Date(Date.now() + parseTimeToSeconds(JWT_REFRESH_EXPIRATION) * 1000);
      const newRefreshTokenRecord = await RefreshToken.create({
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: refreshExpiresAt,
        deviceInfo: userAgent,
        ipAddress: ipAddress
      });

      // Token rotation: отзываем старый токен и указываем замену
      await RefreshToken.revoke(tokenData.id, newRefreshTokenRecord.id);

      return {
        user: {
          id: user.id,
          email: user.email,
          companyId: user.company_id,
          companyName: user.company_name
        },
        ...tokens
      };
      
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(401, 'Недействительный refresh токен');
    }
  }

  static async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'Пользователь не найден');
    }

    // Проверяем текущий пароль
    const isValidPassword = await User.validatePassword(currentPassword, user.password_hash);
    if (!isValidPassword) {
      throw new ApiError(400, 'Неверный текущий пароль');
    }

    // Обновляем пароль
    await User.updatePassword(userId, newPassword);

    return { message: 'Пароль успешно изменен' };
  }

  // Полный logout с отзывом всех токенов
  static async logout(refreshTokenString, accessToken, requestInfo = {}) {
    try {
      // Проверяем refresh токен и отзываем его
      if (refreshTokenString) {
        const validation = await RefreshToken.validateToken(refreshTokenString);
        if (validation.valid) {
          await RefreshToken.revoke(validation.tokenData.id);
        }
      }

      // Добавляем access токен в blacklist
      if (accessToken) {
        const decoded = verifyToken(accessToken, 'access');
        const expiresAt = new Date(decoded.exp * 1000);
        
        await TokenBlacklist.addToken({
          tokenJti: decoded.jti,
          userId: decoded.userId,
          expiresAt,
          reason: 'logout'
        });
      }

      return { message: 'Выход выполнен успешно' };
    } catch (error) {
      // Даже если токены невалидны, считаем logout успешным
      return { message: 'Выход выполнен успешно' };
    }
  }

  // Logout со всех устройств
  static async logoutAllDevices(userId, currentRefreshToken = null) {
    try {
      // Отзываем все refresh токены кроме текущего (если указан)
      const revokedTokens = await RefreshToken.revokeAllUserTokens(userId, 'security_logout');
      
      // Добавляем все access токены пользователя в blacklist
      await TokenBlacklist.addAllUserTokens(userId, 'security_logout');

      return { 
        message: 'Выход выполнен со всех устройств',
        revokedTokensCount: revokedTokens.length
      };
    } catch (error) {
      throw new ApiError(500, 'Ошибка при выходе со всех устройств');
    }
  }

  // Получение активных сессий пользователя
  static async getUserActiveSessions(userId) {
    try {
      const activeSessions = await RefreshToken.getUserActiveTokens(userId);
      
      return {
        activeSessions: activeSessions.map(session => ({
          id: session.id,
          deviceInfo: session.device_info || 'Неизвестное устройство',
          ipAddress: session.ip_address,
          createdAt: session.created_at,
          expiresAt: session.expires_at,
          isCurrent: false // Можно определить по IP или device info
        }))
      };
    } catch (error) {
      throw new ApiError(500, 'Ошибка при получении активных сессий');
    }
  }

  // Отзыв конкретной сессии
  static async revokeSession(userId, sessionId) {
    try {
      // Проверяем что сессия принадлежит пользователю
      const activeSessions = await RefreshToken.getUserActiveTokens(userId);
      const session = activeSessions.find(s => s.id === parseInt(sessionId));
      
      if (!session) {
        throw new ApiError(404, 'Сессия не найдена');
      }

      await RefreshToken.revoke(sessionId);
      
      return { message: 'Сессия успешно отозвана' };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'Ошибка при отзыве сессии');
    }
  }
}

export default AuthService; 