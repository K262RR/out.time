import { jest, describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';
import { seedTestDatabase, cleanupTestDatabase, TEST_USER } from '../seed.js';

describe('Authentication API', () => {
  beforeAll(async () => {
    await seedTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password,
        });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe(TEST_USER.email);
    });

    it('should return 400 on invalid login data', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com' }); // No password

      expect(response.statusCode).toBe(422);
      expect(response.body).toHaveProperty('details');
    });

    it('should return 401 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nouser@test.com', password: 'wrongpassword' });
      
      // В зависимости от реализации, может быть 401 или 400. 
      // AuthService бросает Error, который должен ловиться обработчиком.
      // Но у нас нет пока обработчика для конкретной ошибки "Неверный email или пароль", 
      // поэтому он, скорее всего, вернет 500. Проверим это.
      // А! Есть authController, он должен обрабатывать.
      // Посмотрим на контроллер. Он не ловит ошибку, значит, вернется 500.
      // Это тоже полезный тест, он покажет нам, что нужно улучшить обработку ошибок.
      // Давайте пока ожидать 500 и потом исправим.
      // UPD: Посмотрел authController - там есть try/catch, который вернет 401
      // Нет, там просто `res.status(401).json({ error: e.message })`. Это ок.
      // А нет, в `login` контроллере стоит `res.status(400)`. Поменяю на 401.
      
      // Проверяем, что вернется ошибка, т.к. пользователя нет
      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty('error', 'Неверный email или пароль');
    });
  });
}); 