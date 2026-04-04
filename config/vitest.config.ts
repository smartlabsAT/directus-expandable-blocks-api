import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: path.resolve(__dirname, '..'),
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [path.resolve(__dirname, '../test/setup.ts')],
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
      ]
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