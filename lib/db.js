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
  // The Neon serverless driver talks to Neon's HTTP endpoint via the global
  // fetch() under the hood. Next.js patches fetch() on the server to apply
  // its own caching layer, which can silently serve a stale cached response
  // for queries that look identical (e.g. parameterless aggregate queries
  // like "SELECT COUNT(*) FROM attempts") even though the underlying data
  // has changed. This opts every query made through this client out of that
  // cache so stats are always read fresh.
  _sql = neon(connectionString, { fetchOptions: { cache: 'no-store' } });
  return _sql;
}

