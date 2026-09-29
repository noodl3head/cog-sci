import { getSql } from '../../../../../lib/db.js';
import { ensureTelegramMockSchema, findTelegramMockSessionByWebToken } from '../../../../../lib/telegramMockStore.js';
import { publicSession } from '../../../../../lib/telegramWebMock.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  try {
    const sql = getSql();
    await ensureTelegramMockSchema(sql);
    const session = await findTelegramMockSessionByWebToken(sql, params.token);
    if (!session) return Response.json({ error: 'Mock not found' }, { status: 404 });
    return Response.json(publicSession(session));
  } catch (error) {
    console.error('Telegram web mock read failed:', error);
    return Response.json({ error: 'Could not load mock' }, { status: 500 });
  }
}
