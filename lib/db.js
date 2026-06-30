import { neon } from '@neondatabase/serverless';

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL_UNPOOLED;

if (!connectionString) {
  // Don't throw at import time during build; routes will surface a clear error instead.
  console.warn(
    'No DATABASE_URL/POSTGRES_URL env var found. Set this in Vercel after adding a Postgres integration.'
  );
}

export const sql = neon(connectionString || '');
