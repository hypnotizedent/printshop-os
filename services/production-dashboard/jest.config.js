module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
  roots: ['<rootDir>'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],
  testTimeout: 10000,
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true
      }
    }]
  }
=======
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
=======
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
=======
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  moduleNameMapper: {
    '^@analytics/(.*)$': '<rootDir>/src/analytics/$1',
    '^@tests/(.*)$': '<rootDir>/src/__tests__/$1',
>>>>>>> origin/copilot/build-productivity-dashboard
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!**/*.d.ts',
<<<<<<< HEAD
>>>>>>> origin/copilot/build-time-clock-job-detail
=======
>>>>>>> origin/copilot/build-productivity-dashboard
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
<<<<<<< HEAD
  globals: {
    'ts-jest': {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    },
  },
<<<<<<< HEAD
>>>>>>> origin/copilot/build-sop-library-dashboard
=======
>>>>>>> origin/copilot/build-time-clock-job-detail
=======
>>>>>>> origin/copilot/build-productivity-dashboard
};
