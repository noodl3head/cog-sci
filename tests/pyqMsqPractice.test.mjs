import test from 'node:test';
import assert from 'node:assert/strict';
import { getMsqPracticePaper, PYQ_PAPERS } from '../lib/pyqData.js';

test('MSQ practice paper includes only MSQs from every PYQ and all three sections', () => {
  const practice = getMsqPracticePaper();
  const sourceMsqs = PYQ_PAPERS.flatMap((paper) =>
    paper.questions.filter((question) => question.type === 'MSQ')
  );

  assert.equal(practice.id, 'msq-practice');
  assert.equal(practice.isPractice, true);
  assert.equal(practice.questions.length, sourceMsqs.length);
  assert.equal(practice.questions.every((question) => question.type === 'MSQ'), true);
  assert.deepEqual(
    practice.sections.map((section) => section.code),
    ['GA', 'XH-B1', 'XH-C5']
  );
  for (const question of practice.questions) {
    assert.equal(question.section === 'GA' || question.section === 'XH-B1' || question.section === 'XH-C5', true);
  }
  assert.deepEqual(
    [...new Set(practice.questions.map((question) => question.sourceYear))].sort(),
    PYQ_PAPERS.map((paper) => paper.year).sort()
  );
  assert.equal(new Set(practice.questions.map((question) => question.num)).size, practice.questions.length);
  assert.equal(
    practice.totalMarks,
    sourceMsqs.reduce((total, question) => total + question.marks, 0)
  );
});
