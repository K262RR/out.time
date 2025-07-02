import { jest, describe, it, expect, afterEach } from '@jest/globals';
import AuthService from '../../src/services/authService.js';
import User from '../../src/models/User.js';
import Company from '../../src/models/Company.js';
import { generateAuthTokens } from '../../src/utils/jwt.js';

jest.mock('../../src/models/User.js');
jest.mock('../../src/models/Company.js');
jest.mock('../../src/utils/jwt.js');

describe('AuthService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user and company successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        companyName: 'Test Corp',
      };
      const mockCompany = { id: 1, name: userData.companyName };
      const mockUser = { id: 1, email: userData.email, companyId: mockCompany.id };
      const mockTokens = { accessToken: 'access', refreshToken: 'refresh' };

      User.findByEmail.mockResolvedValue(null);
      Company.create.mockResolvedValue(mockCompany);
      User.create.mockResolvedValue(mockUser);
      generateAuthTokens.mockReturnValue(mockTokens);

      const result = await AuthService.register(userData);

      expect(User.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(Company.create).toHaveBeenCalledWith({ name: userData.companyName });
      expect(User.create).toHaveBeenCalledWith({
        email: userData.email,
        password: userData.password,
        companyId: mockCompany.id,
      });
      expect(generateAuthTokens).toHaveBeenCalledWith({
        id: mockUser.id,
        email: mockUser.email,
        company_id: mockCompany.id,
      });
      expect(result.user.email).toBe(userData.email);
      expect(result.accessToken).toBe(mockTokens.accessToken);
    });

    it('should throw an error if user already exists', async () => {
      const userData = { email: 'exists@example.com', password: 'password', companyName: 'Any' };
      User.findByEmail.mockResolvedValue({ id: 1, email: userData.email });

      await expect(AuthService.register(userData)).rejects.toThrow('Пользователь с таким email уже существует');

      expect(Company.create).not.toHaveBeenCalled();
      expect(User.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const credentials = { email: 'test@example.com', password: 'password123' };
    const mockUser = {
      id: 1,
      email: credentials.email,
      password_hash: 'hashed_password',
      company_id: 1,
      company_name: 'Test Corp',
    };
    const mockTokens = { accessToken: 'access', refreshToken: 'refresh' };

    it('should login a user successfully', async () => {
      User.findByEmail.mockResolvedValue(mockUser);
      User.validatePassword.mockResolvedValue(true);
      User.updateLastLogin.mockResolvedValue();
      generateAuthTokens.mockReturnValue(mockTokens);

      const result = await AuthService.login(credentials);

      expect(User.findByEmail).toHaveBeenCalledWith(credentials.email);
      expect(User.validatePassword).toHaveBeenCalledWith(credentials.password, mockUser.password_hash);
      expect(User.updateLastLogin).toHaveBeenCalledWith(mockUser.id);
      expect(generateAuthTokens).toHaveBeenCalledWith(mockUser);
      expect(result.user.email).toBe(credentials.email);
      expect(result.accessToken).toBe(mockTokens.accessToken);
    });

    it('should throw an error for non-existent user', async () => {
      User.findByEmail.mockResolvedValue(null);

      await expect(AuthService.login(credentials)).rejects.toThrow('Неверный email или пароль');
      
      expect(User.validatePassword).not.toHaveBeenCalled();
      expect(generateAuthTokens).not.toHaveBeenCalled();
    });

    it('should throw an error for invalid password', async () => {
      User.findByEmail.mockResolvedValue(mockUser);
      User.validatePassword.mockResolvedValue(false);

      await expect(AuthService.login(credentials)).rejects.toThrow('Неверный email или пароль');

      expect(User.updateLastLogin).not.toHaveBeenCalled();
      expect(generateAuthTokens).not.toHaveBeenCalled();
    });
  });
}); 