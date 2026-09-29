import { getSql } from '../../../../../../lib/db.js';
import {
  ensureTelegramMockSchema,
  findTelegramMockSessionByWebToken,
  submitTelegramMockWebSession,
} from '../../../../../../lib/telegramMockStore.js';
import {
  gradeWebMsqSession,
  publicSession,
  validateWebSubmission,
} from '../../../../../../lib/telegramWebMock.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return Response.json({ error: 'Expected JSON body' }, { status: 400 });
  }

  try {
    const payload = await request.json();
    const sql = getSql();
    await ensureTelegramMockSchema(sql);
    const session = await findTelegramMockSessionByWebToken(sql, params.token);
    if (!session) return Response.json({ error: 'Mock not found' }, { status: 404 });
    if (session.status !== 'in_progress') return Response.json({ error: 'Mock is already completed' }, { status: 409 });

    const { responses, reasoning } = validateWebSubmission(session.questions || [], payload.responses, payload.reasoning);
    const result = gradeWebMsqSession(session.questions || [], responses, reasoning);
    const completed = await submitTelegramMockWebSession(sql, params.token, { responses, reasoning, result });
    if (!completed) return Response.json({ error: 'Mock is already completed' }, { status: 409 });
    return Response.json(publicSession(completed));
  } catch (error) {
    if (error instanceof SyntaxError || /Invalid selections|Missing or oversized rationale/.test(error.message)) {
      return Response.json({ error: 'Invalid submission payload' }, { status: 400 });
    }
    console.error('Telegram web mock submit failed:', error);
    return Response.json({ error: 'Could not submit mock' }, { status: 500 });
  }
}
