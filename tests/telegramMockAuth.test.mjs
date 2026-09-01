import test from 'node:test';
import assert from 'node:assert/strict';
import { hasBearerSecret, hasHeaderSecret } from '../lib/telegramMockAuth.js';

test('hasBearerSecret accepts only the exact configured bearer token', () => {
  assert.equal(hasBearerSecret('Bearer cron-secret', 'cron-secret'), true);
  assert.equal(hasBearerSecret('Bearer wrong', 'cron-secret'), false);
  assert.equal(hasBearerSecret(null, 'cron-secret'), false);
  assert.equal(hasBearerSecret('Bearer ', ''), false);
});

test('hasHeaderSecret fails closed when either side is missing', () => {
  assert.equal(hasHeaderSecret('webhook-secret', 'webhook-secret'), true);
  assert.equal(hasHeaderSecret('wrong', 'webhook-secret'), false);
  assert.equal(hasHeaderSecret(null, 'webhook-secret'), false);
  assert.equal(hasHeaderSecret('anything', ''), false);
});
