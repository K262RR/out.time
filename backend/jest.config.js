export default {
  testEnvironment: 'node',
  clearMocks: true,
  coverageProvider: 'v8',
  setupFilesAfterEnv: ['./tests/setup.js'],
  testEnvironmentOptions: {
    NODE_ENV: 'test',
  },
  transform: {},
}; 