import { getSql } from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sql = getSql();

    const perMock = await sql`
      SELECT
        mock_id,
        COUNT(*)::int            AS attempts,
        MAX(total_marks)         AS best_score,
        AVG(total_marks)::numeric(6,2)   AS avg_total,
        AVG(positive_marks)::numeric(6,2) AS avg_positive,
        AVG(negative_marks)::numeric(6,2) AS avg_negative,
        AVG(time_seconds)::int   AS avg_time
      FROM mock_results
      GROUP BY mock_id
      ORDER BY mock_id
    `;

    const overall = await sql`
      SELECT
        COUNT(*)::int              AS total_attempts,
        AVG(total_marks)::numeric(6,2)    AS avg_total,
        AVG(positive_marks)::numeric(6,2) AS avg_positive,
        AVG(negative_marks)::numeric(6,2) AS avg_negative,
        AVG(time_seconds)::int     AS avg_time,
        MAX(total_marks)           AS best_score
      FROM mock_results
    `;

    const recent = await sql`
      SELECT mock_id, positive_marks, negative_marks, total_marks, time_seconds, created_at
      FROM mock_results
      ORDER BY created_at DESC
      LIMIT 15
    `;

    return Response.json({ perMock, overall: overall[0], recent });
  } catch (err) {
    console.error('mock-results GET failed:', err);
    return Response.json({ error: 'Could not load mock results.' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const sql = getSql();
    const {
      mockId, positiveMarks, negativeMarks, totalMarks, timeSeconds,
      s1Correct, s1Wrong, s1Skipped, s2Correct, s2Wrong, s2Skipped,
    } = await req.json();

    await sql`
      INSERT INTO mock_results
        (mock_id, positive_marks, negative_marks, total_marks, time_seconds,
         s1_correct, s1_wrong, s1_skipped, s2_correct, s2_wrong, s2_skipped)
      VALUES
        (${mockId}, ${positiveMarks}, ${negativeMarks}, ${totalMarks}, ${timeSeconds},
         ${s1Correct}, ${s1Wrong}, ${s1Skipped}, ${s2Correct}, ${s2Wrong}, ${s2Skipped})
    `;

    return Response.json({ ok: true });
  } catch (err) {
    console.error('mock-results POST failed:', err);
    return Response.json({ error: 'Could not save mock result.' }, { status: 500 });
  }
}
