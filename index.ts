import { serve } from 'bun';

const server = serve({
  port: 3000,
  async fetch(req: Request) {
    return new Response('hi mom');
  },
});

console.log(`Listening on http://localhost:${server.port}...`);
