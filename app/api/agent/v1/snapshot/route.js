import { getSql } from '../../../../../lib/db';
import { QUIZ_DATA } from '../../../../../lib/quizData';
import { rankWeaknesses } from '../../../../../lib/agentData';

export const dynamic = 'force-dynamic';

async function ensureAgentSchema(sql) {
  await sql`ALTER TABLE mock_results ADD COLUMN IF NOT EXISTS responses JSONB`;
  await sql`ALTER TABLE pyq_results ADD COLUMN IF NOT EXISTS responses JSONB`;
  await sql`
    CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY,
      value JSONB,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
}

function chapterLabels() {
  return Object.fromEntries(
    QUIZ_DATA.books.flatMap((book) => book.chapters.map((chapter) => [
      `${book.id}::${chapter.id}`,
      { book: book.name, chapter: chapter.title },
    ]))
  );
}

export async function GET(request) {
  try {
    const sql = getSql();
    await ensureAgentSchema(sql);
    const url = new URL(request.url);
    const rawLimit = Number(url.searchParams.get('attemptLimit') || 5000);
    const attemptLimit = Math.max(1, Math.min(10000, Number.isFinite(rawLimit) ? rawLimit : 5000));

    const [attempts, chapterRows, overallRows, mockResults, pyqResults, stateRows, activeDays] = await Promise.all([
      sql`
        SELECT id, book_id, chapter_id, question_number, selected_letter,
               correct_letter, is_correct, created_at
        FROM attempts ORDER BY created_at DESC LIMIT ${attemptLimit}
      `,
      sql`
        SELECT book_id, chapter_id,
               COUNT(*)::int AS attempted,
               COUNT(*) FILTER (WHERE is_correct)::int AS correct,
               COUNT(DISTINCT question_number)::int AS distinct_questions,
               MAX(created_at) AS last_attempted
        FROM attempts GROUP BY book_id, chapter_id
      `,
      sql`
        SELECT COUNT(*)::int AS attempts,
               COUNT(*) FILTER (WHERE is_correct)::int AS correct,
               COUNT(DISTINCT (book_id, chapter_id, question_number))::int AS unique_questions,
               MIN(created_at) AS first_attempt,
               MAX(created_at) AS last_attempt
        FROM attempts
      `,
      sql`
        SELECT id, mock_id, positive_marks, negative_marks, total_marks,
               time_seconds, s1_correct, s1_wrong, s1_skipped,
               s2_correct, s2_wrong, s2_skipped, responses, created_at
        FROM mock_results ORDER BY created_at DESC
      `,
      sql`
        SELECT id, paper_id, positive_marks, negative_marks, total_marks,
               time_seconds, ga_net, b1_net, c5_net, sections, responses, created_at
        FROM pyq_results ORDER BY created_at DESC
      `,
      sql`SELECT key, value, updated_at FROM app_state ORDER BY key`,
      sql`SELECT DISTINCT DATE(created_at) AS day FROM attempts ORDER BY day DESC LIMIT 365`,
    ]);

    const labels = chapterLabels();
    const weaknesses = rankWeaknesses(chapterRows.map((row) => ({
      key: `${row.book_id}::${row.chapter_id}`,
      bookId: row.book_id,
      chapterId: row.chapter_id,
      ...labels[`${row.book_id}::${row.chapter_id}`],
      attempted: row.attempted,
      correct: row.correct,
      uniqueQuestions: row.distinct_questions,
      lastAttempted: row.last_attempted,
    })));
    const overall = overallRows[0] || { attempts: 0, correct: 0, unique_questions: 0 };
    const accuracy = overall.attempts
      ? Math.round((Number(overall.correct) / Number(overall.attempts)) * 1000) / 10
      : null;

    return Response.json({
      generatedAt: new Date().toISOString(),
      chapterPractice: {
        summary: { ...overall, accuracy },
        weaknesses,
        attempts,
        attemptsReturned: attempts.length,
        activeDays: activeDays.map((row) => row.day),
      },
      mocks: mockResults,
      pyqs: pyqResults,
      state: Object.fromEntries(stateRows.map((row) => [row.key, row.value])),
      stateUpdatedAt: Object.fromEntries(stateRows.map((row) => [row.key, row.updated_at])),
    }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (error) {
    console.error('agent snapshot failed:', error);
    return Response.json({ error: 'Could not produce live analytics snapshot.' }, { status: 500 });
  }
}
