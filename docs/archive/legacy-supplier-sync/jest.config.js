module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/lib', '<rootDir>/inventory'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'lib/**/*.ts',
    'inventory/**/*.ts',
    '!lib/**/*.d.ts',
    '!lib/**/*.test.ts',
    '!lib/**/__tests__/**',
    '!inventory/**/*.test.ts',
    '!inventory/**/__tests__/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  testTimeout: 10000,
};
