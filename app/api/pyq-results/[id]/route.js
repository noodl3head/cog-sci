import { getSql } from '../../../../lib/db';
import { parsePyqAttemptId } from '../../../../lib/pyqHistory';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const id = parsePyqAttemptId(params.id);
  if (!id) return Response.json({ error: 'Invalid PYQ attempt ID.' }, { status: 400 });

  try {
    const sql = getSql();
    const rows = await sql`
      SELECT id, paper_id, positive_marks, negative_marks, total_marks, time_seconds,
             ga_net, b1_net, c5_net, sections, responses, created_at
      FROM pyq_results
      WHERE id = ${id}
      LIMIT 1
    `;

    if (!rows[0]) return Response.json({ error: 'PYQ attempt not found.' }, { status: 404 });
    return Response.json({ attempt: rows[0] }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (error) {
    console.error('pyq-result detail GET failed:', error);
    return Response.json({ error: 'Could not load PYQ attempt.' }, { status: 500 });
  }
}