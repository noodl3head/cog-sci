import { getSql } from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const sql = getSql();
    await sql`TRUNCATE TABLE attempts`;
    return Response.json({ ok: true });
  } catch (err) {
    console.error('Failed to reset stats:', err);
    return Response.json({ error: 'Failed to reset stats' }, { status: 500 });
  }
}
