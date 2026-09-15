import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../app/pyq/[id]/page.js', import.meta.url), 'utf8');

test('PYQ hooks execute before the first conditional return', () => {
  const effectiveQuestionsHook = source.indexOf('const effectiveQuestions = useMemo(');
  const firstConditionalReturn = source.indexOf('if (!paper)');

  assert.ok(effectiveQuestionsHook >= 0, 'effectiveQuestions useMemo hook must exist');
  assert.ok(
    effectiveQuestionsHook < firstConditionalReturn,
    'effectiveQuestions useMemo must run before the paper-dependent return so every render uses the same hook order'
  );
});
