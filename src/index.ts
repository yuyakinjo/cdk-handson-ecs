import { serve } from 'bun';
import { eq } from 'drizzle-orm';
import { db, retryConnect } from './db/client';
import { todos } from './db/schema';

await retryConnect();

const server = serve({
  port: 3000,
  async fetch(req: Request) {
    const url = new URL(req.url);

    // Create a todo
    if (url.pathname === '/todos' && req.method === 'POST') {
      const body = await req.json();
      const created = await db.insert(todos).values({ title: body.title }).returning();
      return new Response(JSON.stringify(created));
    }

    // Update a todo
    if (url.pathname === '/todos' && req.method === 'PUT') {
      const body = await req.json();
      if (!body.id) return new Response(JSON.stringify({ update: false }));
      const updated = await db.update(todos).set(body).where(eq(todos.id, body.id)).returning();
      return new Response(JSON.stringify(updated));
    }

    // Delete a todo
    if (url.pathname === '/todos' && req.method === 'DELETE') {
      const body = await req.json();
      if (!body.id) return new Response(JSON.stringify({ delete: false }));
      const deleted = await db.delete(todos).where(eq(todos.id, body.id)).returning();
      return new Response(JSON.stringify(deleted));
    }

    // Get all todos
    if (url.pathname === '/todos' && req.method === 'GET') {
      const res = await db.select().from(todos);
      return new Response(JSON.stringify(res));
    }

    return new Response('hi mom');
  },
});

console.log(`Listening on http://localhost:${server.port}...`);
