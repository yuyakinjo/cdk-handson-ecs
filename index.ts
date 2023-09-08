import { serve } from 'bun';

const server = serve({
  port: 3000,
  async fetch(req: Request) {
    return new Response(process.env.MESSAGE);
  },
});

console.log(`Listening on http://localhost:${server.port}...`);
console.log(`env: ${Bun.env.MESSAGE}`);
