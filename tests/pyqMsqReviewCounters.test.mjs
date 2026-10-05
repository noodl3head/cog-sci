import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../app/pyq/[id]/page.js', import.meta.url), 'utf8');

test('PYQ review uses stable question IDs when locating overridden questions', () => {
  assert.match(source, /sectionQuestions\.findIndex\(\(question\) => question\.num === qq\.num\)/);
  assert.match(source, /questions\.findIndex\(\(question\) => question\.num === qq\.num\)/);
});
