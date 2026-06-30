import { getSql } from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sql = getSql();
    const overallRows = await sql`
      SELECT
        COUNT(*)::int AS total_attempts,
        COUNT(*) FILTER (WHERE is_correct)::int AS total_correct
      FROM attempts
    `;
    const overall = overallRows[0] || { total_attempts: 0, total_correct: 0 };

    const byChapter = await sql`
      SELECT
        book_id,
        chapter_id,
        COUNT(*)::int AS attempts,
        COUNT(*) FILTER (WHERE is_correct)::int AS correct,
        COUNT(DISTINCT question_number)::int AS distinct_questions,
        MAX(created_at) AS last_attempted
      FROM attempts
      GROUP BY book_id, chapter_id
      ORDER BY book_id, chapter_id
    `;

    const byBook = await sql`
      SELECT
        book_id,
        COUNT(*)::int AS attempts,
        COUNT(*) FILTER (WHERE is_correct)::int AS correct
      FROM attempts
      GROUP BY book_id
    `;

    // Per-question miss counts, useful for a "questions to review" list.
    const missedQuestions = await sql`
      SELECT
        book_id,
        chapter_id,
        question_number,
        COUNT(*)::int AS times_seen,
        COUNT(*) FILTER (WHERE is_correct)::int AS times_correct,
        COUNT(*) FILTER (WHERE NOT is_correct)::int AS times_missed,
        MAX(created_at) AS last_attempted
      FROM attempts
      GROUP BY book_id, chapter_id, question_number
      HAVING COUNT(*) FILTER (WHERE NOT is_correct) > 0
      ORDER BY times_missed DESC, last_attempted DESC
      LIMIT 30
    `;

    // Distinct active days, used client-side to compute a streak.
    const activeDays = await sql`
      SELECT DISTINCT DATE(created_at) AS day
      FROM attempts
      ORDER BY day DESC
      LIMIT 365
    `;

    const recent = await sql`
      SELECT book_id, chapter_id, question_number, is_correct, created_at
      FROM attempts
      ORDER BY created_at DESC
      LIMIT 25
    `;

    return Response.json(
      {
        totalAttempts: overall.total_attempts,
        totalCorrect: overall.total_correct,
        byChapter,
        byBook,
        missedQuestions,
        activeDays: activeDays.map((r) => r.day),
        recent,
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (err) {
    console.error('Failed to load stats:', err);
    return Response.json(
      { error: 'Failed to load stats. Is DATABASE_URL configured and has sql/schema.sql been run?' },
      { status: 500 }
    );
  }
}
