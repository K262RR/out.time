import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

export const JWT_ACCESS_EXPIRATION = '15m';
export const JWT_REFRESH_EXPIRATION = '7d';

export const generateAuthTokens = (user, deviceInfo = '') => {
  const tokenPayload = {
    userId: user.id,
    email: user.email,
    company_id: user.company_id || user.companyId,
    jti: uuidv4(),
    deviceInfo
  };

  const accessToken = jwt.sign(tokenPayload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRATION
  });

  const refreshToken = jwt.sign(tokenPayload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRATION
  });

  return { accessToken, refreshToken };
};

export const verifyToken = (token, type = 'access') => {
  try {
    const secret = type === 'access' ? process.env.JWT_ACCESS_SECRET : process.env.JWT_REFRESH_SECRET;
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error(`Invalid ${type} token: ${error.message}`);
  }
};

export const parseTimeToSeconds = (timeString) => {
  const units = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400
  };

  const match = timeString.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error('Invalid time format');
  }

  const [, value, unit] = match;
  return parseInt(value) * units[unit];
}; 