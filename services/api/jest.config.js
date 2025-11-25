module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
  roots: ['<rootDir>/tests', '<rootDir>/scripts', '<rootDir>/lib', '<rootDir>/src', '<rootDir>/src/__tests__'],
=======
  roots: ['<rootDir>/tests', '<rootDir>/scripts', '<rootDir>/src'],
>>>>>>> origin/copilot/add-role-based-access-control
=======
  roots: ['<rootDir>/tests', '<rootDir>/scripts', '<rootDir>/routes'],
>>>>>>> origin/copilot/add-order-history-view
=======
  roots: ['<rootDir>/tests', '<rootDir>/scripts', '<rootDir>/src'],
>>>>>>> origin/copilot/add-quote-approval-system
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  moduleNameMapper: {
    '^@lib/(.*)$': '<rootDir>/lib/$1',
    '^@mocks/(.*)$': '<rootDir>/mocks/$1',
    '^@scripts/(.*)$': '<rootDir>/scripts/$1',
<<<<<<< HEAD
    '^@/(.*)$': '<rootDir>/src/$1',
=======
    '^uuid$': '<rootDir>/node_modules/uuid/dist/index.js',
>>>>>>> origin/copilot/build-press-ready-checklist-system
  },
  collectCoverageFrom: [
    'lib/**/*.ts',
    'scripts/**/*.ts',
    'src/**/*.ts',
<<<<<<< HEAD

=======
>>>>>>> origin/copilot/add-role-based-access-control
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/__tests__/**',
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
  globals: {
    'ts-jest': {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    },
  },
};
