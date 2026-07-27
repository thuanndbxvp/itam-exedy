import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  moduleNameMapper: {
    '^@/lib/prisma$': '<rootDir>/tests/setup/prisma-mock.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  collectCoverageFrom: [
    'src/lib/commands/**/*.ts',
    'src/lib/locking.ts',
    'src/lib/errors.ts',
    'src/lib/auth-guard.ts',
    'src/lib/rate-limit.ts',
    'src/lib/audit.ts',
    'src/app/actions/**/*.ts',
    'src/components/RoleGate.tsx',
    'src/components/Toast.tsx',
    'src/components/ui/Modal.tsx',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'html', 'lcov'],
  clearMocks: true,
  testTimeout: 30_000,
}

export default config
