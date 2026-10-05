import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const listSource = await readFile(new URL('../app/pyq/page.js', import.meta.url), 'utf8');
const runnerSource = await readFile(new URL('../app/pyq/[id]/page.js', import.meta.url), 'utf8');

test('PYQ list exposes the MSQ-only practice route', () => {
  assert.match(listSource, /href="\/pyq\/msq"/);
  assert.match(listSource, /MSQ-only practice/);
  assert.match(listSource, /GA has no MSQs in the loaded papers/);
});

test('MSQ practice attempts remain separate from full-paper result history', () => {
  assert.match(runnerSource, /if \(!paper\.isPractice && !savedToDb\)/);
});
