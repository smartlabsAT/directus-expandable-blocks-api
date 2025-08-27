/**
 * Test Setup File
 * Global configuration for all test files
 */

import { vi, beforeEach } from 'vitest';

// Mock console methods to keep test output clean
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  // Keep warn and error for important messages
  warn: console.warn,
  error: console.error,
};

// Mock Directus context for tests
export const mockDirectusContext = {
  services: {
    ItemsService: vi.fn(),
  },
  database: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    whereIn: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
  },
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
  schema: {
    collections: {},
    relations: [],
  },
};

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});