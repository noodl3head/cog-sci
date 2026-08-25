import { getSql } from '../../../lib/db';

export const dynamic = 'force-dynamic';

async function ensureTable(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY,
      value JSONB,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
}

export async function GET() {
  try {
    const sql = getSql();
    await ensureTable(sql);
    const rows = await sql`SELECT key, value, updated_at FROM app_state ORDER BY key`;
    return Response.json({ state: Object.fromEntries(rows.map((row) => [row.key, row.value])), rows });
  } catch (error) {
    console.error('app-state GET failed:', error);
    return Response.json({ error: 'Could not load app state.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const sql = getSql();
    await ensureTable(sql);
    const body = await request.json();
    const entries = Array.isArray(body.entries)
      ? body.entries
      : [{ key: body.key, value: body.value }];
    const valid = entries.filter((entry) => typeof entry?.key === 'string' && entry.key.length <= 200);
    if (!valid.length) return Response.json({ error: 'No valid state entries.' }, { status: 400 });
    for (const entry of valid) {
      await sql`
        INSERT INTO app_state (key, value, updated_at)
        VALUES (${entry.key}, ${JSON.stringify(entry.value)}, now())
        ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=now()
      `;
    }
    return Response.json({ ok: true, synced: valid.length });
  } catch (error) {
    console.error('app-state POST failed:', error);
    return Response.json({ error: 'Could not sync app state.' }, { status: 500 });
  }
}
