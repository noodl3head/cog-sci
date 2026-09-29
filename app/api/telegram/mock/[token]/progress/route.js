import { getSql } from '../../../../../../lib/db.js';
import {
  ensureTelegramMockSchema,
  findTelegramMockSessionByWebToken,
  saveTelegramMockWebProgress,
} from '../../../../../../lib/telegramMockStore.js';
import { publicSession } from '../../../../../../lib/telegramWebMock.js';

const LETTERS = new Set(['A', 'B', 'C', 'D']);

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function object(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

export function validateWebProgress(questions, { responses, reasoning, currentIndex }) {
  if (!object(responses) || !object(reasoning) || !Number.isInteger(currentIndex)
    || currentIndex < 0 || currentIndex >= questions.length) {
    throw new Error('Invalid draft payload');
  }

  const cleanResponses = {};
  const cleanReasoning = {};
  for (const [key, selected] of Object.entries(responses)) {
    const index = Number(key);
    if (!Number.isInteger(index) || index < 0 || index >= questions.length || !Array.isArray(selected)
      || selected.some((letter) => !LETTERS.has(letter)) || new Set(selected).size !== selected.length) {
      throw new Error('Invalid draft selections');
    }
    cleanResponses[index] = selected;
  }

  for (const [key, optionReasoning] of Object.entries(reasoning)) {
    const index = Number(key);
    if (!Number.isInteger(index) || index < 0 || index >= questions.length || !object(optionReasoning)) {
      throw new Error('Invalid draft reasoning');
    }
    cleanReasoning[index] = {};
    for (const [letter, rationale] of Object.entries(optionReasoning)) {
      if (!LETTERS.has(letter) || typeof rationale !== 'string' || rationale.length > 1000) {
        throw new Error('Invalid draft rationale');
      }
      cleanReasoning[index][letter] = rationale.trim();
    }
  }

  return { responses: cleanResponses, reasoning: cleanReasoning, currentIndex };
}

export async function PUT(request, { params }) {
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

    const draft = validateWebProgress(session.questions || [], payload);
    const updated = await saveTelegramMockWebProgress(sql, params.token, draft);
    if (!updated) return Response.json({ error: 'Mock is already completed' }, { status: 409 });
    return Response.json(publicSession(updated));
  } catch (error) {
    if (error instanceof SyntaxError || error.message.startsWith('Invalid draft')) {
      return Response.json({ error: 'Invalid progress payload' }, { status: 400 });
    }
    console.error('Telegram web mock progress save failed:', error);
    return Response.json({ error: 'Could not save progress' }, { status: 500 });
  }
}
