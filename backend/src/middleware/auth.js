const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const TokenBlacklist = require('../models/TokenBlacklist');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Токен доступа отсутствует' 
      });
    }

    // Проверяем токен
    const decoded = verifyToken(token, 'access');
    
    // Проверяем токен в blacklist
    if (decoded.jti) {
      const isBlacklisted = await TokenBlacklist.isTokenBlacklisted(decoded.jti);
      if (isBlacklisted) {
        return res.status(401).json({ 
          error: 'Токен отозван' 
        });
      }
    }
    
    // Проверяем существование пользователя
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ 
        error: 'Пользователь не найден' 
      });
    }

    // Добавляем пользователя в запрос
    req.user = {
      id: user.id,
      email: user.email,
      companyId: user.company_id || decoded.companyId,
      companyName: user.company_name
    };

    next();
  } catch (error) {
    console.error('Ошибка авторизации:', error.message);
    
    if (error.message === 'Недействительный токен') {
      return res.status(401).json({ 
        error: 'Недействительный или истекший токен' 
      });
    }
    
    return res.status(500).json({ 
      error: 'Ошибка сервера при авторизации' 
    });
  }
};

// Middleware для проверки принадлежности сотрудника к компании
const checkEmployeeAccess = async (req, res, next) => {
  try {
    const Employee = require('../models/Employee');
    const employeeId = req.params.id || req.params.employeeId;
    
    if (!employeeId) {
      return res.status(400).json({ 
        error: 'ID сотрудника не указан' 
      });
    }

    const employee = await Employee.findById(employeeId);
    
    if (!employee) {
      return res.status(404).json({ 
        error: 'Сотрудник не найден' 
      });
    }

    if (employee.company_id !== req.user.companyId) {
      return res.status(403).json({ 
        error: 'Доступ запрещен к данным этого сотрудника' 
      });
    }

    req.employee = employee;
    next();
  } catch (error) {
    console.error('Ошибка проверки доступа к сотруднику:', error);
    return res.status(500).json({ 
      error: 'Ошибка сервера при проверке доступа' 
    });
  }
};

module.exports = {
  authenticateToken,
  checkEmployeeAccess
}; 