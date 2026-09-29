import test from 'node:test';
import assert from 'node:assert/strict';
import { getTelegramMockBotIdentity, setTelegramMockWebhook } from '../lib/telegramMockApi.js';

test('getTelegramMockBotIdentity returns the configured bot identity without exposing its token', async () => {
  const previousToken = process.env.TELEGRAM_MOCK_BOT_TOKEN;
  const previousFetch = globalThis.fetch;
  process.env.TELEGRAM_MOCK_BOT_TOKEN = 'test-token';
  globalThis.fetch = async (url) => {
    assert.match(String(url), /\/getMe$/);
    return { ok: true, json: async () => ({ ok: true, result: { id: 123, username: 'daily_psych_mock_bot' } }) };
  };
  try {
    assert.deepEqual(await getTelegramMockBotIdentity(), { id: 123, username: 'daily_psych_mock_bot' });
  } finally {
    globalThis.fetch = previousFetch;
    if (previousToken === undefined) delete process.env.TELEGRAM_MOCK_BOT_TOKEN;
    else process.env.TELEGRAM_MOCK_BOT_TOKEN = previousToken;
  }
});

test('setTelegramMockWebhook rejects a missing webhook secret before making a request', async () => {
  await assert.rejects(
    () => setTelegramMockWebhook('https://example.com/api/telegram/mock/webhook', ''),
    /TELEGRAM_MOCK_WEBHOOK_SECRET is not configured/,
  );
});
