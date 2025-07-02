const pool = require('../src/config/database');
const User = require('../src/models/User');
const Company = require('../src/models/Company');

const TEST_USER = {
  email: 'test@user.com',
  password: 'password123',
  companyName: 'Test Company',
};

async function seedTestDatabase() {
  try {
    // Очищаем таблицы в обратном порядке из-за внешних ключей
    await pool.query('DELETE FROM users');
    await pool.query('DELETE FROM companies');

    const company = await Company.create({ name: TEST_USER.companyName });
    await User.create({
      email: TEST_USER.email,
      password: TEST_USER.password,
      companyId: company.id,
    });

  } catch (error) {
    console.error('Failed to seed test database:', error);
    throw error;
  }
}

async function cleanupTestDatabase() {
  try {
    await pool.query('DELETE FROM users');
    await pool.query('DELETE FROM companies');
  } catch(error) {
    console.error('Failed to cleanup test database:', error);
  }
}


module.exports = {
  seedTestDatabase,
  cleanupTestDatabase,
  TEST_USER,
}; 