import type { Config } from 'drizzle-kit';

export default {
  schema: './src/models/db.ts',
  out: './drizzle',
  dialect: 'sqlite',
  driver: 'expo',
} satisfies Config;
