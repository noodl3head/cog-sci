import test from 'node:test';
import assert from 'node:assert/strict';
import {
  XH_C5_MSQ_TYPES,
  msqTypesForAvailableCycle,
  msqTypesForCycle,
} from '../lib/xhC5MsqTypes.js';
import { selectDailyXhC5Msqs } from '../lib/xhC5DailyMsqCore.js';
import { XH_C5_DAILY_MSQ_QUESTIONS } from '../lib/xhC5DailyMsqQuestionBank.js';
import { GATE_STYLE_MOCK_QUESTIONS } from '../lib/mockQuestionBank.js';

function syntheticCandidates() {
  return XH_C5_MSQ_TYPES.flatMap((msqType) =>
    Array.from({ length: 3 }, (_, index) => ({
      id: `${msqType}-${index}`,
      type: 'MSQ',
      topic: index % 2 ? 'memory' : 'methods',
      marks: 2,
      answers: index === 0 ? ['A'] : index === 1 ? ['A', 'C'] : ['A', 'B', 'D'],
      msqType,
      options: {
        A: 'A plausible proposition tied to the shared question context.',
        B: 'A nearby proposition that changes one relevant boundary condition.',
        C: 'A second plausible interpretation of the same evidence pattern.',
        D: 'A competing interpretation that remains initially credible.',
      },
    })),
  );
}

test('MSQ type rotation advances four archetypes at a time and wraps after five tests', () => {
  assert.deepEqual(msqTypesForCycle(0), [
    'category-membership', 'theory-audit', 'adjacent-construct', 'negation-exclusion',
  ]);
  assert.deepEqual(msqTypesForCycle(1), [
    'vignette-application', 'methods-statistics', 'data-interpretation', 'paired-contrast',
  ]);
  assert.deepEqual(msqTypesForCycle(2), [
    'completion-matching', 'scope-qualifier', 'category-membership', 'theory-audit',
  ]);
  assert.deepEqual(msqTypesForCycle(5), msqTypesForCycle(0));
});

test('constrained topic drills keep four distinct available structures in cycle order', () => {
  const available = new Set(['negation-exclusion', 'methods-statistics', 'data-interpretation', 'scope-qualifier']);
  assert.deepEqual(msqTypesForAvailableCycle(0, available), [
    'negation-exclusion', 'methods-statistics', 'data-interpretation', 'scope-qualifier',
  ]);
  assert.equal(msqTypesForAvailableCycle(3, available).length, 4);
});

test('daily selector uses only the four active types and represents every one', () => {
  for (const cycleIndex of [0, 1, 2, 3, 4]) {
    const active = msqTypesForCycle(cycleIndex);
    const output = selectDailyXhC5Msqs({
      candidates: syntheticCandidates(),
      topicWeights: { memory: 2, methods: 1 },
      size: 10,
      cycleIndex,
      rng: () => 0.31,
    });
    assert.equal(output.length, 10);
    assert.equal(output.every((question) => active.includes(question.msqType)), true);
    assert.deepEqual([...new Set(output.map((question) => question.msqType))].sort(), [...active].sort());
  }
});

test('both authored C5 MSQ banks carry a valid structural type', () => {
  for (const question of [
    ...XH_C5_DAILY_MSQ_QUESTIONS,
    ...GATE_STYLE_MOCK_QUESTIONS.filter((item) => item.type === 'MSQ'),
  ]) {
    assert.equal(XH_C5_MSQ_TYPES.includes(question.msqType), true, question.id);
  }
});
