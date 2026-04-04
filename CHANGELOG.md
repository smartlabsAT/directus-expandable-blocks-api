# Changelog

All notable changes to the Directus Expandable Blocks API extension are documented here.

## [Unreleased]

## [0.3.0] - 2026-04-04

### Changed
- **Dependencies**: Updated all 13 outdated packages to latest versions
  - @directus/extensions-sdk 11 -> 17, @directus/types 13 -> 15
  - TypeScript 5 -> 6, ESLint 8 -> 10, Vitest 1 -> 4
  - @typescript-eslint/* 8.41 -> 8.58, @eslint/js 9 -> 10
  - @vitest/coverage-v8 1 -> 4, @vitest/ui 1 -> 4
  - @types/node 20 -> 22, @types/express 5.0.3 -> 5.0.6, knex 3.1 -> 3.2
- **Removed**: `@types/knex` (deprecated, knex ships own types)
- **tsconfig.json**: `moduleResolution` changed from `"node"` to `"bundler"` (TS6 deprecation)
- **ESLint**: Removed legacy `.eslintrc.json`, using flat config only (`config/eslint.config.js`)
- **CI**: Updated to Node 20/22 and pnpm 10
- **Node.js**: Minimum version raised from 16 to 20

### Fixed
- Fixed `vitest.config.ts` `__dirname` usage for ESM compatibility
- Removed `coverage.all` option (removed in Vitest 4)
- Added explicit type annotation for `mockDirectusContext` (Vitest 4 spy types)
- Added non-null assertion in health test (TS6 stricter null checks)
- Added error `cause` in ServiceFactory (ESLint 10 `preserve-caught-error` rule)

### Security
- Reduced vulnerabilities from 58 (24 high) to 12 (5 high)
- Resolved axios SSRF, rollup XSS/path traversal, minimatch ReDoS vulnerabilities

## [0.2.1] - 2026-03-28

### Fixed
- Resolved TypeScript type issues for CI/CD compatibility

## [0.2.0] - 2026-03-28

### Added
- Comprehensive quality tools and GitHub workflows
- ESLint, TypeScript strict mode, Vitest test suite

## [0.1.0] - 2026-03-27

### Added
- Initial API endpoint extension for expandable blocks
- Health check and detail endpoints
- Service-based architecture with ServiceFactory
- Rate limiting, security headers, error handling middleware
