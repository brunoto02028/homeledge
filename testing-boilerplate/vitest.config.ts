import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      // Adjust '@' to match your project's tsconfig paths
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    // Test file patterns
    include: ['__tests__/**/*.test.ts', '__tests__/**/*.test.tsx'],

    // Global timeout per test (ms)
    testTimeout: 10000,

    // Run tests in parallel
    pool: 'forks',

    // Coverage configuration (run with: vitest run --coverage)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['lib/**/*.ts', 'app/**/*.ts', 'app/**/*.tsx'],
      exclude: [
        'node_modules',
        '__tests__',
        'e2e',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types.ts',
      ],
      thresholds: {
        // Fail CI if coverage drops below these
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60,
      },
    },

    // Environment (use 'jsdom' if testing React components)
    // environment: 'jsdom',
  },
});
