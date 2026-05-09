/**
 * setup-migration-history.ts
 *
 * One-time script to initialize Drizzle's migration tracking table and mark
 * the 0000 migration as already applied (since the database was originally
 * set up via db:push with no history tracking).
 *
 * Run once: npx tsx src/db/setup-migration-history.ts
 * Then use: npm run db:migrate for all future migrations.
 */

import postgres from 'postgres';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const client = postgres(process.env.DATABASE_URL, { max: 1 });

async function setupMigrationHistory() {
  // 1. Ensure the drizzle schema exists (newer Drizzle uses drizzle.__drizzle_migrations)
  await client`CREATE SCHEMA IF NOT EXISTS drizzle`;

  // 2. Create the migrations table in the drizzle schema
  await client`
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id         SERIAL PRIMARY KEY,
      hash       text NOT NULL,
      created_at bigint
    )
  `;
  console.log('✓ drizzle.__drizzle_migrations table ready');

  // 3. Stamp both migrations as already applied (0000 was applied via db:push,
  //    0001 was applied manually via Drizzle Studio)
  const migrations = [
    { tag: '0000_parched_toxin', when: 1776276938652 },
    { tag: '0001_multi_tenant_isolation', when: 1746576000000 },
  ];

  for (const m of migrations) {
    const alreadyApplied = await client`
      SELECT id FROM drizzle.__drizzle_migrations WHERE created_at = ${m.when}
    `;
    if (alreadyApplied.length > 0) {
      console.log(`✓ ${m.tag} already recorded — skipping`);
      continue;
    }
    const sqlPath = resolve(`./drizzle/${m.tag}.sql`);
    const sqlContent = readFileSync(sqlPath, 'utf8');
    const hash = createHash('sha256').update(sqlContent).digest('hex');
    await client`
      INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
      VALUES (${hash}, ${m.when})
    `;
    console.log(`✓ ${m.tag} marked as applied`);
  }

  console.log('');
  console.log('Migration history is now set up. Run: npm run db:migrate for future migrations.');

  await client.end();
}

setupMigrationHistory().catch((err) => {
  console.error('Setup failed:', err);
  process.exit(1);
});
