import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Telegram /start subscribes users without offering the retired callback mock', async () => {
  const source = await readFile(new URL('../lib/telegramMockService.js', import.meta.url), 'utf8');
  assert.match(source, /Daily Psychology MSQ Mock Bot is ready\./);
  assert.doesNotMatch(source, /Daily Psychology MSQ Mock Bot is ready\.[\s\S]{0,500}inviteKeyboard\(indiaDate\(\)\)/);
  assert.match(source, /MSQ-only web mock/);
});
