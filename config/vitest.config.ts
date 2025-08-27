import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './test-output/coverage',
      exclude: [
        'node_modules/**',
        'dist/**',
        'config/**',
        '**/*.config.ts',
        '**/*.config.js',
        '**/types/**',
        'test/**'
      ],
      include: [
        'src/**/*.ts'
      ],
      all: true
    },
    include: [
      'test/**/*.test.ts',
      'test/**/*.spec.ts'
    ],
    exclude: [
      'node_modules/**',
      'dist/**'
    ],
    outputFile: {
      junit: './test-output/junit.xml',
      json: './test-output/results.json'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src')
    }
  }
});