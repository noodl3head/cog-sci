import { getSql } from '../../../../../lib/db.js';
import { hasHeaderSecret } from '../../../../../lib/telegramMockAuth.js';
import { handleTelegramMockUpdate } from '../../../../../lib/telegramMockService.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request) {
  if (!hasHeaderSecret(
    request.headers.get('x-telegram-bot-api-secret-token'),
    process.env.TELEGRAM_MOCK_WEBHOOK_SECRET,
  )) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const update = await request.json();
    await handleTelegramMockUpdate(getSql(), update);
    return Response.json({ ok: true });
  } catch (error) {
    console.error('Telegram mock webhook failed:', error);
    return Response.json({ error: 'Update failed' }, { status: 500 });
  }
}
