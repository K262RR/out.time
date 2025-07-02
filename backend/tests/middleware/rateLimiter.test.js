import { jest, describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { apiLimiter, authLimiter, publicLimiter, botLimiter } from '../../src/middleware/rateLimiter.js';

describe('Rate Limiting Middleware', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use('/api', apiLimiter);
    app.use('/api/auth', authLimiter);
    app.use('/api/public', publicLimiter);
    app.use('/api/bot', botLimiter);

    app.get('/api/test', (req, res) => res.send('test'));
    app.post('/api/auth/login', (req, res) => res.send('login'));
    app.get('/api/public/info', (req, res) => res.send('info'));
    app.post('/api/bot/webhook', (req, res) => res.send('webhook'));
  });

  it('should allow requests within rate limit', async () => {
    const response = await request(app).get('/api/test');
    expect(response.status).toBe(200);
  });

  it('should block requests exceeding rate limit', async () => {
    // Make multiple requests to exceed the limit
    for (let i = 0; i < 101; i++) {
      await request(app).get('/api/test');
    }

    const response = await request(app).get('/api/test');
    expect(response.status).toBe(429);
    expect(response.body.error).toBe('Слишком много запросов. Попробуйте позже.');
  });

  it('should apply stricter limits to auth endpoints', async () => {
    // Make multiple requests to exceed the auth limit
    for (let i = 0; i < 6; i++) {
      await request(app).post('/api/auth/login');
    }

    const response = await request(app).post('/api/auth/login');
    expect(response.status).toBe(429);
    expect(response.body.error).toBe('Слишком много попыток входа. Попробуйте позже.');
  });

  it('should apply public API limits', async () => {
    // Make multiple requests to exceed the public limit
    for (let i = 0; i < 31; i++) {
      await request(app).get('/api/public/info');
    }

    const response = await request(app).get('/api/public/info');
    expect(response.status).toBe(429);
    expect(response.body.error).toBe('Превышен лимит запросов к публичному API');
  });

  it('should apply bot API limits', async () => {
    // Make multiple requests to exceed the bot limit
    for (let i = 0; i < 21; i++) {
      await request(app).post('/api/bot/webhook');
    }

    const response = await request(app).post('/api/bot/webhook');
    expect(response.status).toBe(429);
    expect(response.body.error).toBe('Слишком много запросов к боту');
  });
}); 