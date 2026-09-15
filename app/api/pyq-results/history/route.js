import { getSql } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sql = getSql();
    const history = await sql`
      SELECT id, paper_id, positive_marks, negative_marks, total_marks, time_seconds,
             ga_net, b1_net, c5_net, created_at
      FROM pyq_results
      ORDER BY created_at DESC
    `;
    return Response.json({ history }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (error) {
    console.error('pyq-results history GET failed:', error);
    return Response.json({ error: 'Could not load PYQ history.' }, { status: 500 });
  }
}