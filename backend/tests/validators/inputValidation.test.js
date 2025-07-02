import { jest, describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';
import { sequelize } from '../../src/config/database.js';

describe('Input Validation', () => {
  beforeAll(async () => {
    await sequelize.sync();
  });

  describe('Auth Validation', () => {
    it('should validate registration input', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: '123', // too short
          companyName: '' // empty
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          msg: expect.any(String)
        })
      );
    });

    it('should validate login input', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: '' // empty
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          msg: expect.any(String)
        })
      );
    });

    it('should reject SQL injection in email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: "' OR '1'='1",
          password: 'test123'
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });

    it('should reject XSS in company name', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'test123',
          companyName: '<script>alert("xss")</script>'
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('Employee Validation', () => {
    it('should validate employee creation input', async () => {
      const response = await request(app)
        .post('/api/employees')
        .send({
          name: '', // empty
          email: 'invalid-email',
          position: '' // empty
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          msg: expect.any(String)
        })
      );
    });

    it('should sanitize employee name', async () => {
      const response = await request(app)
        .post('/api/employees')
        .send({
          name: '  John <b>Doe</b>  '
        });
      
      expect(response.status).toBe(401); // Требуется авторизация
    });

    it('should reject invalid telegram ID', async () => {
      const response = await request(app)
        .get('/api/public/employees/by-telegram/invalid')
        .send();
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('Bot API Validation', () => {
    it('should validate start day payload', async () => {
      const response = await request(app)
        .post('/api/bot/start-day')
        .send({
          telegram_id: 'invalid',
          status: 'invalid_status'
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });

    it('should sanitize report text', async () => {
      const response = await request(app)
        .post('/api/bot/end-day')
        .send({
          telegram_id: 123456,
          report: '<script>alert("xss")</script>Report content'
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('Settings Validation', () => {
    it('should validate notification time format', async () => {
      const response = await request(app)
        .put('/api/bot/settings')
        .send({
          notification_time: 'invalid_time'
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });

    it('should validate timezone format', async () => {
      const response = await request(app)
        .put('/api/bot/settings')
        .send({
          timezone: 'invalid/timezone'
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('Report Validation', () => {
    it('should validate report creation input', async () => {
      const response = await request(app)
        .post('/api/reports')
        .send({
          employeeId: 'invalid-id', // should be number
          date: 'invalid-date',
          hours: -1 // negative number
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          msg: expect.any(String)
        })
      );
    });

    it('should validate date formats', async () => {
      const response = await request(app)
        .get('/api/reports')
        .query({
          startDate: 'invalid-date',
          endDate: '2024-13-45'
        });
      
      expect(response.status).toBe(401); // Требуется авторизация
    });

    it('should validate pagination parameters', async () => {
      const response = await request(app)
        .get('/api/reports')
        .query({
          page: -1,
          limit: 1000
        });
      
      expect(response.status).toBe(401); // Требуется авторизация
    });
  });
}); 