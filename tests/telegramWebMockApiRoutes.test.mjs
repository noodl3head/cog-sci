import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const base = new URL('../app/api/telegram/mock/[token]/route.js', import.meta.url);
const progress = new URL('../app/api/telegram/mock/[token]/progress/route.js', import.meta.url);
const submit = new URL('../app/api/telegram/mock/[token]/submit/route.js', import.meta.url);

test('tokenized mock API routes use node runtime and sanitize session reads', async () => {
  const source = await readFile(base, 'utf8');
  assert.match(source, /export const runtime = 'nodejs'/);
  assert.match(source, /export const dynamic = 'force-dynamic'/);
  assert.match(source, /ensureTelegramMockSchema/);
  assert.match(source, /findTelegramMockSessionByWebToken/);
  assert.match(source, /publicSession/);
  assert.match(source, /status: 404/);
  assert.doesNotMatch(source, /session\.questions.*answers/);
});

test('progress validates JSON and saves only draft state', async () => {
  const source = await readFile(progress, 'utf8');
  assert.match(source, /export async function PUT/);
  assert.match(source, /content-type/);
  assert.match(source, /status: 400/);
  assert.match(source, /validateWebProgress/);
  assert.match(source, /saveTelegramMockWebProgress/);
  assert.match(source, /publicSession/);
  assert.doesNotMatch(source, /gradeWebMsqSession/);
});

test('submit validates complete payload, grades server-side, and handles completed tokens', async () => {
  const source = await readFile(submit, 'utf8');
  assert.match(source, /export async function POST/);
  assert.match(source, /validateWebSubmission/);
  assert.match(source, /gradeWebMsqSession/);
  assert.match(source, /submitTelegramMockWebSession/);
  assert.match(source, /status: 409/);
  assert.match(source, /status: 404/);
  assert.match(source, /publicSession/);
});
