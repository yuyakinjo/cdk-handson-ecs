import { serve } from 'bun';
import { db, retryConnect } from './db/client';
import { todos } from './db/schema';

await retryConnect();

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
