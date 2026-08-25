import { getSql } from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sql = getSql();

    const perPaper = await sql`
      SELECT
        paper_id,
        COUNT(*)::int                     AS attempts,
        MAX(total_marks)                  AS best_score,
        AVG(total_marks)::numeric(6,2)    AS avg_total,
        AVG(positive_marks)::numeric(6,2) AS avg_positive,
        AVG(negative_marks)::numeric(6,2) AS avg_negative,
        AVG(ga_net)::numeric(6,2)         AS avg_ga,
        AVG(b1_net)::numeric(6,2)         AS avg_b1,
        AVG(c5_net)::numeric(6,2)         AS avg_c5,
        AVG(time_seconds)::int            AS avg_time
      FROM pyq_results
      GROUP BY paper_id
      ORDER BY paper_id
    `;

    const overall = await sql`
      SELECT
        COUNT(*)::int                     AS total_attempts,
        AVG(total_marks)::numeric(6,2)    AS avg_total,
        MAX(total_marks)                  AS best_score,
        AVG(time_seconds)::int            AS avg_time
      FROM pyq_results
    `;

    const recent = await sql`
      SELECT paper_id, positive_marks, negative_marks, total_marks, time_seconds,
             ga_net, b1_net, c5_net, created_at
      FROM pyq_results
      ORDER BY created_at DESC
      LIMIT 15
    `;

    return Response.json({ perPaper, overall: overall[0], recent });
  } catch (err) {
    console.error('pyq-results GET failed:', err);
    return Response.json({ error: 'Could not load PYQ results.' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const sql = getSql();
    const {
      paperId, positiveMarks, negativeMarks, totalMarks, timeSeconds,
      gaNet, b1Net, c5Net, sections, responses = null,
    } = await req.json();

    await sql`ALTER TABLE pyq_results ADD COLUMN IF NOT EXISTS responses JSONB`;
    await sql`
      INSERT INTO pyq_results
        (paper_id, positive_marks, negative_marks, total_marks, time_seconds,
         ga_net, b1_net, c5_net, sections, responses)
      VALUES
        (${paperId}, ${positiveMarks}, ${negativeMarks}, ${totalMarks}, ${timeSeconds},
         ${gaNet}, ${b1Net}, ${c5Net}, ${JSON.stringify(sections)},
         ${responses == null ? null : JSON.stringify(responses)})
    `;

    return Response.json({ ok: true });
  } catch (err) {
    console.error('pyq-results POST failed:', err);
    return Response.json({ error: 'Could not save PYQ result.' }, { status: 500 });
  }
}
