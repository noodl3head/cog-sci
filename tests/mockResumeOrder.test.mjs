import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('saved mock progress is checked before a fresh generated mock is constructed', () => {
  const source = fs.readFileSync(new URL('../app/mock/[id]/page.js', import.meta.url), 'utf8');
  const memoStart = source.indexOf('const initialQuiz = useMemo');
  const memoEnd = source.indexOf('}, [id, selectedTopicKey]);', memoStart);
  const block = source.slice(memoStart, memoEnd);
  const loadIndex = block.indexOf('loadMockProgress');
  assert.equal(loadIndex >= 0, true);
  assert.equal(loadIndex < block.indexOf('generateTopicMock'), true);
  assert.equal(loadIndex < block.indexOf('generateRandomMock'), true);
});
