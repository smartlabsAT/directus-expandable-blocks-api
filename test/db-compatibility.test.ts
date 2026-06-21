import { describe, it, expect } from 'vitest';
import knex, { type Knex } from 'knex';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * SQL compatibility tests for PostgreSQL, MySQL, MariaDB and SQLite (Issue #37).
 *
 * The whole database access of this endpoint lives in DetailHandler and goes through
 * the Knex query builder (no raw SQL). These tests verify that:
 *   1. The generated SQL is valid, parameterized standard SQL on every dialect.
 *   2. The queries actually execute and return correct results on a real engine
 *      (SQLite via the built-in node:sqlite module - no driver install required).
 *   3. DetailHandler.ts never introduces dialect-specific raw SQL (regression guard).
 *
 * MySQL/MariaDB/PostgreSQL share the same builder code and the same `mysql2`/`pg`
 * Knex dialects; their generated SQL is asserted here and was additionally verified
 * end-to-end against real engines (see test/integration/db-matrix.cjs).
 */

// --- Query patterns mirrored 1:1 from src/handlers/DetailHandler.ts -----------------
// Keep in sync with DetailHandler. The source guard below fails the build if raw SQL
// is ever introduced there, which is the actual cross-database risk.

const COLLECTION = 'blocks_text';
const NUMERIC_IDS = [1, 2, 3];
const STRING_IDS = NUMERIC_IDS.map(String);

/** DetailHandler.loadItems */
function buildItemsQuery(db: Knex, fields: string[] = ['id', 'title', 'status']) {
    return db.select(fields).from(COLLECTION).whereIn('id', NUMERIC_IDS);
}

/** DetailHandler.batchFindPageUsages */
function buildPageUsageQuery(db: Knex) {
    return db
        .select([
            'm2a.id',
            'm2a.pages_id',
            'm2a.collection',
            'm2a.item',
            'm2a.sort',
            'p.id as page_id',
            'p.title as page_title',
            'p.status as page_status',
            'p.slug as page_slug',
        ])
        .from('pages_m2a as m2a')
        .leftJoin('pages as p', 'm2a.pages_id', 'p.id')
        .where('m2a.collection', COLLECTION)
        .whereIn('m2a.item', STRING_IDS);
}

/** DetailHandler.batchFindExpandableUsages */
function buildExpandableUsageQuery(db: Knex) {
    return db
        .select([
            'ee.id',
            'ee.expandable_id',
            'ee.collection',
            'ee.item',
            'ee.sort',
            'ee.area',
            'e.id as parent_id',
            'e.status as parent_status',
            'e.area as parent_area',
        ])
        .from('expandable_expandable as ee')
        .leftJoin('expandable as e', 'ee.expandable_id', 'e.id')
        .where('ee.collection', COLLECTION)
        .whereIn('ee.item', STRING_IDS);
}

const QUERY_BUILDERS = [
    { label: 'loadItems', build: buildItemsQuery },
    { label: 'pageUsage', build: buildPageUsageQuery },
    { label: 'expandableUsage', build: buildExpandableUsageQuery },
];

// Tokens that would tie a query to one specific database engine.
const DIALECT_SPECIFIC_SQL = [
    /->>?/, // PostgreSQL JSON operators
    /\bjson_extract\b/i, // MySQL/SQLite JSON function
    /\bjsonb\b/i, // PostgreSQL JSONB
    /\bconcat\s*\(/i, // MySQL string concatenation
    /\bcollate\b/i, // explicit collation
    /\bilike\b/i, // PostgreSQL case-insensitive LIKE
    /::\w/, // PostgreSQL cast syntax
];

const DIALECTS = [
    { name: 'PostgreSQL', client: 'pg', quote: '"' },
    { name: 'MySQL', client: 'mysql2', quote: '`' },
    { name: 'MariaDB', client: 'mysql2', quote: '`' },
    { name: 'SQLite', client: 'sqlite3', quote: '`' },
];

describe('DB compatibility: SQL generation across dialects (Issue #37)', () => {
    for (const dialect of DIALECTS) {
        describe(dialect.name, () => {
            const db = knex({ client: dialect.client, useNullAsDefault: true });

            for (const { label, build } of QUERY_BUILDERS) {
                it(`builds parameterized standard SQL for ${label}`, () => {
                    const compiled = build(db).toSQL();

                    // Values are bound as placeholders, never inlined -> safe + portable.
                    expect(compiled.sql).toContain('?');
                    expect(compiled.bindings.length).toBeGreaterThan(0);

                    // Identifiers use the dialect's own quoting character.
                    expect(compiled.sql).toContain(`${dialect.quote}id${dialect.quote}`);

                    // No engine-specific constructs leak into the SQL.
                    for (const forbidden of DIALECT_SPECIFIC_SQL) {
                        expect(compiled.sql).not.toMatch(forbidden);
                    }
                });
            }

            it('uses identical bindings on every dialect', () => {
                expect(buildItemsQuery(db).toSQL().bindings).toEqual(NUMERIC_IDS);
                expect(buildPageUsageQuery(db).toSQL().bindings).toEqual([COLLECTION, ...STRING_IDS]);
                expect(buildExpandableUsageQuery(db).toSQL().bindings).toEqual([COLLECTION, ...STRING_IDS]);
            });
        });
    }
});

describe('DB compatibility: real execution on SQLite via node:sqlite (Issue #37)', () => {
    // node:sqlite is built into Node >= 22 - a real engine, no driver/install needed.
    const require = createRequire(import.meta.url);
    let DatabaseSync: any;
    try {
        ({ DatabaseSync } = require('node:sqlite'));
    } catch {
        DatabaseSync = null;
    }

    const sqliteIt = DatabaseSync ? it : it.skip;

    sqliteIt('executes all DetailHandler queries and returns correct rows', () => {
        const sqlite = new DatabaseSync(':memory:');
        sqlite.exec(`
            CREATE TABLE blocks_text (id INTEGER PRIMARY KEY, title TEXT, status TEXT);
            CREATE TABLE pages (id INTEGER PRIMARY KEY, title TEXT, status TEXT, slug TEXT);
            CREATE TABLE pages_m2a (id INTEGER PRIMARY KEY, pages_id INTEGER, collection TEXT, item TEXT, sort INTEGER);
            CREATE TABLE expandable (id INTEGER PRIMARY KEY, status TEXT, area TEXT);
            CREATE TABLE expandable_expandable (id INTEGER PRIMARY KEY, expandable_id INTEGER, collection TEXT, item TEXT, sort INTEGER, area TEXT);
            INSERT INTO blocks_text VALUES (1,'Hero','published'),(2,'Intro','draft'),(3,'Footer','published');
            INSERT INTO pages VALUES (10,'Landing','published','landing');
            INSERT INTO pages_m2a VALUES (101,10,'blocks_text','1',1),(102,10,'blocks_text','3',2);
            INSERT INTO expandable VALUES (20,'draft','main');
            INSERT INTO expandable_expandable VALUES (201,20,'blocks_text','2',1,'main');
        `);

        const db = knex({ client: 'sqlite3', useNullAsDefault: true });
        const run = (qb: Knex.QueryBuilder) => {
            const compiled = qb.toSQL();
            return sqlite.prepare(compiled.sql).all(...compiled.bindings);
        };

        try {
            const items = run(buildItemsQuery(db));
            expect(items).toHaveLength(3);
            expect(items.map((r: any) => r.id)).toEqual([1, 2, 3]);

            // Cross-DB risk from #37: numeric ids compared as strings against a TEXT column.
            const pageUsage = run(buildPageUsageQuery(db));
            expect(pageUsage).toHaveLength(2);
            expect(pageUsage.map((r: any) => r.item).sort()).toEqual(['1', '3']);
            expect(pageUsage[0].page_title).toBe('Landing');

            const expandableUsage = run(buildExpandableUsageQuery(db));
            expect(expandableUsage).toHaveLength(1);
            expect(expandableUsage[0].item).toBe('2');
            expect(expandableUsage[0].parent_status).toBe('draft');
        } finally {
            sqlite.close();
            db.destroy();
        }
    });
});

describe('DB compatibility: DetailHandler stays database-agnostic (Issue #37)', () => {
    it('contains no raw or dialect-specific SQL', () => {
        const source = readFileSync(
            path.resolve(__dirname, '../src/handlers/DetailHandler.ts'),
            'utf8',
        );

        // Raw query escape hatches bypass Knex's portable SQL generation.
        expect(source).not.toMatch(/\.raw\s*\(/);
        expect(source).not.toMatch(/\bwhereRaw\b/);
        expect(source).not.toMatch(/\bselectRaw\b/);
        expect(source).not.toMatch(/\bjoinRaw\b/);

        // Engine-specific SQL fragments.
        expect(source).not.toMatch(/\bjson_extract\b/i);
        expect(source).not.toMatch(/\bjsonb\b/i);
        expect(source).not.toMatch(/->>?["'`]/); // JSON path operators in a string
    });
});
