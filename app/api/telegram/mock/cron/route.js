import { getSql } from '../../../../../lib/db.js';
import { getTelegramMockBotIdentity } from '../../../../../lib/telegramMockApi.js';
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
    const [bot, deliveries] = await Promise.all([
      getTelegramMockBotIdentity(),
      sendDailyTelegramMockInvites(getSql(), mockDate),
    ]);
    console.info('Telegram mock bot identity', { username: bot.username || null });
    console.info('Telegram mock cron delivery summary', {
      attempted: deliveries.length,
      delivered: deliveries.filter((delivery) => delivery.delivered).length,
      failed: deliveries.filter((delivery) => !delivery.delivered).length,
    });
    return Response.json({ ok: true, mockDate, deliveries });
  } catch (error) {
    console.error('Telegram mock cron failed:', error);
    return Response.json({ error: 'Delivery failed' }, { status: 500 });
  }
}
