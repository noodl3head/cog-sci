import test from 'node:test';
import assert from 'node:assert/strict';
import { getMsqPracticeModules, getPaper, PYQ_PAPERS } from '../lib/pyqData.js';

test('MSQs are divided into section-specific modules of at most 20 without omissions', () => {
  const sections = getMsqPracticeModules();
  assert.deepEqual(sections.map((section) => section.code), ['XH-B1', 'XH-C5']);
  const source = PYQ_PAPERS.flatMap((paper) => paper.questions
    .filter((question) => question.type === 'MSQ')
    .map((question) => `${paper.year}:${question.num}`));
  const modules = sections.flatMap((section) => section.modules);
  for (const section of sections) {
    const items = section.modules.flatMap((module) => module.questions);
    assert.ok(section.modules.every((module) => module.questions.length > 0 && module.questions.length <= 20));
    assert.ok(section.modules.slice(0, -1).every((module) => module.questions.length === 20));
    assert.ok(items.every((question) => question.section === section.code && question.type === 'MSQ'));
    assert.deepEqual(section.modules.map((module) => module.number), section.modules.map((_, i) => i + 1));
  }
  const collected = modules.flatMap((module) => module.questions.map((q) => `${q.sourceYear}:${q.sourceQuestionNum}`));
  assert.equal(new Set(collected).size, source.length);
  assert.deepEqual(collected.sort(), source.sort());
  for (const module of modules) {
    const paper = getPaper(module.id);
    assert.ok(paper?.isPractice);
    assert.deepEqual(paper.sections.map((section) => section.code), [module.section]);
    assert.deepEqual(paper.questions, module.questions);
    assert.equal(new Set(paper.questions.map((question) => question.num)).size, paper.questions.length);
    assert.equal(paper.totalMarks, paper.questions.reduce((sum, question) => sum + question.marks, 0));
  }
  assert.equal(getPaper('msq'), null);
  assert.equal(getPaper('msq-xh-b1-0'), null);
  assert.equal(getPaper('msq-xh-c5-999'), null);
});
