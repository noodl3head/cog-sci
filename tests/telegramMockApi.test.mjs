import test from 'node:test';
import assert from 'node:assert/strict';
import { setTelegramMockWebhook } from '../lib/telegramMockApi.js';

test('setTelegramMockWebhook rejects a missing webhook secret before making a request', async () => {
  await assert.rejects(
    () => setTelegramMockWebhook('https://example.com/api/telegram/mock/webhook', ''),
    /TELEGRAM_MOCK_WEBHOOK_SECRET is not configured/,
  );
});
