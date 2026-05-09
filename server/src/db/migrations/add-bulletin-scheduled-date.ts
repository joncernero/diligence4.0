/**
 * Migration: add scheduled_date column to bulletins table
 * Run once: npm run db:migrate:bulletin-date
 */
import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });

  try {
    console.log('Adding scheduled_date column to bulletins…');
    await sql`
      ALTER TABLE bulletins
      ADD COLUMN IF NOT EXISTS scheduled_date TIMESTAMP;
    `;
    console.log('✅ Done — scheduled_date column added.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

run();
