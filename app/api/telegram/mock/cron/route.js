import { getSql } from '../../../../../lib/db.js';
import { hasBearerSecret } from '../../../../../lib/telegramMockAuth.js';
import { indiaDate, sendDailyTelegramMockInvites } from '../../../../../lib/telegramMockService.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request) {
  if (!hasBearerSecret(request.headers.get('authorization'), process.env.CRON_SECRET)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const mockDate = indiaDate();
    const deliveries = await sendDailyTelegramMockInvites(getSql(), mockDate);
    return Response.json({ ok: true, mockDate, deliveries });
  } catch (error) {
    console.error('Telegram mock cron failed:', error);
    return Response.json({ error: 'Delivery failed' }, { status: 500 });
  }
}
