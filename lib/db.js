import { neon } from '@neondatabase/serverless';

let _sql = null;

function getConnectionString() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED
  );
}

// Lazily creates the Neon client on first use, instead of at module import
// time. Next.js evaluates route modules during the build's "collecting page
// data" step even for dynamic routes, so calling neon() eagerly at the top
// of this file would crash the build whenever DATABASE_URL isn't set yet
// (e.g. before you've connected a Postgres integration in Vercel).
export function getSql() {
  if (_sql) return _sql;
  const connectionString = getConnectionString();
  if (!connectionString) {
    throw new Error(
      'No DATABASE_URL/POSTGRES_URL env var found. Add a Postgres integration in Vercel (Storage tab) and redeploy.'
    );
  }
  _sql = neon(connectionString);
  return _sql;
}

