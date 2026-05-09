import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const client = postgres(process.env.DATABASE_URL, { max: 1 });
const db = drizzle(client);

async function runMigrations() {
  console.log('Running migrations...');
  await migrate(db, {
    migrationsFolder: './drizzle',
    migrationsSchema: 'drizzle',  // newer Drizzle stores history in drizzle.__drizzle_migrations
  });
  console.log('Migrations complete.');
  await client.end();
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
