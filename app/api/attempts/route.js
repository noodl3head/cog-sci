import { getSql } from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const sql = getSql();
    const body = await request.json();
    const { bookId, chapterId, questionNumber, selectedLetter, correctLetter, isCorrect } = body;

    if (!bookId || !chapterId || !questionNumber || !selectedLetter || !correctLetter) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await sql`
      INSERT INTO attempts (book_id, chapter_id, question_number, selected_letter, correct_letter, is_correct)
      VALUES (${bookId}, ${chapterId}, ${questionNumber}, ${selectedLetter}, ${correctLetter}, ${Boolean(isCorrect)})
    `;

    return Response.json({ ok: true });
  } catch (err) {
    console.error('Failed to record attempt:', err);
    return Response.json(
      { error: 'Failed to record attempt. Is DATABASE_URL configured?' },
      { status: 500 }
    );
  }
}
