import dotenv from 'dotenv';
import pool from '../src/config/database.js';
import logger from '../src/config/logger.js';
import { jest } from '@jest/globals';

dotenv.config();

// Mute console logs during tests for cleaner output
if (process.env.NODE_ENV === 'test') {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'info').mockImplementation(() => {});
}

// Mute winston logs during tests for cleaner output
if (process.env.NODE_ENV === 'test') {
  logger.transports.forEach((t) => (t.silent = true));
}

// Увеличиваем timeout для тестов производительности
jest.setTimeout(30000);

// Close database connection after all tests
afterAll(async () => {
  try {
    await pool.end();
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
}); 