import { sleep } from 'bun';
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

export const retryConnect = async (maxRetries = 10): Promise<void> => {
  let isConnected = false;
  let retries = 0;

  while (!isConnected && retries < maxRetries) {
    console.error('db connecting...');
    await pool
      .connect()
      .then(() => {
        isConnected = true;
        retries = 0;
        console.log('db connected successfully');
      })
      .catch(async () => {
        console.error('db connection error. retry db connection...');
        await sleep(2000);
        isConnected = false;
        retries++;
      });
  }
};
