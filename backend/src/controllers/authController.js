const AuthService = require('../services/authService');
const ApiError = require('../utils/ApiError');

class AuthController {
  static async register(req, res, next) {
    try {
      const { email, password, companyName } = req.body;
      const requestInfo = {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      };
      
      const result = await AuthService.register({ email, password, companyName }, requestInfo);

      res.status(201).json({
        message: 'Компания и администратор успешно зарегистрированы',
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const requestInfo = {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      };
      
      const result = await AuthService.login({ email, password }, requestInfo);

      res.json({
        message: 'Успешная авторизация',
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh токен обязателен' });
      }
      
      const requestInfo = {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      };
      
      const result = await AuthService.refreshToken(refreshToken, requestInfo);
      res.json({ message: 'Токен обновлен', ...result });
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await AuthService.changePassword(req.user.id, currentPassword, newPassword);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const accessToken = req.headers['authorization']?.split(' ')[1];
      
      const requestInfo = {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      };
      
      const result = await AuthService.logout(refreshToken, accessToken, requestInfo);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async me(req, res, next) {
    try {
      res.json({ user: req.user });
    } catch (error) {
      next(error);
    }
  }

  static async logoutAllDevices(req, res, next) {
    try {
      const userId = req.user.id;
      const result = await AuthService.logoutAllDevices(userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getActiveSessions(req, res, next) {
    try {
      const userId = req.user.id;
      const result = await AuthService.getUserActiveSessions(userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async revokeSession(req, res, next) {
    try {
      const userId = req.user.id;
      const { sessionId } = req.params;
      const result = await AuthService.revokeSession(userId, sessionId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController; 