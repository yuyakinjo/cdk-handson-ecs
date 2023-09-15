import type { Config } from 'drizzle-kit';

export default {
  schema: './src/**/schema.ts',
  driver: 'pg',
  out: './src/db/migrations',
  verbose: true,
} satisfies Config;
