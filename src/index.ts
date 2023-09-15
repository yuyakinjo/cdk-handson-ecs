import { serve, sleep } from 'bun';
import { db, pool } from './db/client';
import { todos } from './db/schema';

let isConnected = false;
let retries = 0;
const maxRetries = 10;

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
