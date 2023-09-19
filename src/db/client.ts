import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

export const pool = new Pool({
  user: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASS ?? 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT) ?? 5432,
  database: process.env.DB_NAME ?? 'zon100',
});

export const db = drizzle(pool);

pool.once('connect', async () => {
  await migrate(db, { migrationsFolder: './src/db/migrations' });
  console.log('First migration complete');
});
