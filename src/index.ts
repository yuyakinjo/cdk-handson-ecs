import { serve, sleep } from 'bun';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { todos } from './db/schema';

const pool = new Pool({
  host: 'psql',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'zon100',
});

const db = drizzle(pool);

pool.once('connect', async () => {
  await migrate(db, { migrationsFolder: './src/db/migrations' });
  console.log('First migration complete');
});

let isConnected = false;
let retries = 0;
const maxRetries = 10;

while (!isConnected && retries < maxRetries) {
  console.error('db connecting...');
  await pool
    .connect()
    .then(() => {
      isConnected = true;
      console.log('db connected successfully');
    })
    .catch(async () => {
      console.error('db connection error. retry db connection...');
      await sleep(1000);
      isConnected = false;
      retries++;
    });
}

const server = serve({
  port: 3000,
  async fetch(req: Request) {
    const url = new URL(req.url);

    if (url.pathname === '/todos') {
      const res = await db.select().from(todos);
      return new Response(JSON.stringify(res));
    }

    return new Response('hi mom');
  },
});

console.log(`Listening on http://localhost:${server.port}...`);
