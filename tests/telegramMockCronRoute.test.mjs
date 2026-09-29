import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('cron route logs a delivery summary without exposing chat IDs', async () => {
  const source = await readFile(new URL('../app/api/telegram/mock/cron/route.js', import.meta.url), 'utf8');
  assert.match(source, /console\.info\('Telegram mock cron delivery summary'/);
  assert.match(source, /attempted:/);
  assert.match(source, /delivered:/);
  assert.match(source, /failed:/);
  assert.doesNotMatch(source, /console\.info[\s\S]*chatId/);
});
