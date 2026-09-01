import { hasHeaderSecret } from '../../../../../lib/telegramMockAuth.js';
import { getTelegramMockWebhookInfo, setTelegramMockWebhook } from '../../../../../lib/telegramMockApi.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function authorized(request) {
  return hasHeaderSecret(request.headers.get('x-setup-secret'), process.env.TELEGRAM_MOCK_SETUP_SECRET);
}

export async function GET(request) {
  if (!authorized(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    return Response.json({ ok: true, webhook: await getTelegramMockWebhookInfo() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  if (!authorized(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const webhookUrl = `${origin.replace(/\/$/, '')}/api/telegram/mock/webhook`;
    const result = await setTelegramMockWebhook(webhookUrl, process.env.TELEGRAM_MOCK_WEBHOOK_SECRET);
    return Response.json({ ok: true, webhookUrl, result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
