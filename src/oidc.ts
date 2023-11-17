import { serve } from 'bun';

const server = serve({
  port: 3000,
  async fetch(req: Request) {
    const url = new URL(req.url);

    // Get all todos
    if (url.pathname === '/headers') {
      return new Response(JSON.stringify(req.headers));
    }

    return new Response(JSON.stringify(req.headers));
  },
});

console.log(`Listening on http://localhost:${server.port}...`);
