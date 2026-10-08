import test from 'node:test';
import assert from 'node:assert/strict';
import { correctOptionCountFor, gateMsqChallengeScore, selectDailyXhC5Msqs } from '../lib/xhC5DailyMsqCore.js';

const candidates = [
  { id: 'one', type: 'MSQ', topic: 'memory', answers: ['A'], msqType: 'category-membership' },
  { id: 'two-a', type: 'MSQ', topic: 'memory', answers: ['A', 'B'], msqType: 'category-membership' },
  { id: 'two-b', type: 'MSQ', topic: 'learning', answers: ['A', 'C'], msqType: 'theory-audit' },
  { id: 'three-a', type: 'MSQ', topic: 'memory', answers: ['A', 'B', 'C'], msqType: 'adjacent-construct' },
  { id: 'three-b', type: 'MSQ', topic: 'learning', answers: ['B', 'C', 'D'], msqType: 'category-membership' },
  { id: 'four', type: 'MSQ', topic: 'memory', answers: ['A', 'B', 'C', 'D'], msqType: 'theory-audit' },
];

test('correctOptionCountFor uses the empirical 6/56/40/1 weight scale', () => {
  assert.equal(correctOptionCountFor(() => 0), 1);
  assert.equal(correctOptionCountFor(() => 0.059), 2);
  assert.equal(correctOptionCountFor(() => 0.619), 3);
  assert.equal(correctOptionCountFor(() => 0.999), 4);
});

test('gate challenge scoring penalizes giveaway wording and rewards parallel plausible options', () => {
  const nuanced = {
    answers: ['A', 'C'],
    options: {
      A: 'The manipulation may alter retrieval by changing the match between encoding and test conditions.',
      B: 'The manipulation may alter encoding strength even if retrieval conditions are held constant.',
      C: 'The observed interaction is compatible with a context-dependent retrieval account.',
      D: 'The observed interaction is compatible with unequal baseline learning across the two groups.',
    },
  };
  const obvious = {
    answers: ['A', 'C'],
    options: {
      A: 'The manipulation can affect retrieval under the stated conditions.',
      B: 'The manipulation can never affect memory in any participant.',
      C: 'The result is consistent with context-dependent retrieval.',
      D: 'The result proves that all other explanations are impossible.',
    },
  };
  assert.equal(gateMsqChallengeScore(nuanced) > gateMsqChallengeScore(obvious), true);
});

test('daily selector prefers the strongest challenge band before topic weighting', () => {
  const nuanced = {
    id: 'nuanced', type: 'MSQ', topic: 'memory', answers: ['A', 'C'], msqType: 'category-membership',
    options: {
      A: 'Performance may depend on the match between encoding operations and the final retrieval demand.',
      B: 'Performance may depend on initial item strength even when the retrieval demand is unchanged.',
      C: 'A crossover pattern can be consistent with transfer-appropriate processing rather than a single best encoding method.',
      D: 'A crossover pattern can also arise from a group difference that existed before either encoding task.',
    },
  };
  const giveaway = {
    id: 'giveaway', type: 'MSQ', topic: 'memory', answers: ['A', 'C'], msqType: 'category-membership',
    options: {
      A: 'Encoding operations can influence later retrieval.',
      B: 'Encoding operations never influence memory under any circumstances.',
      C: 'The retrieval task matters for observed performance.',
      D: 'One result proves that every alternative account is impossible.',
    },
  };
  const output = selectDailyXhC5Msqs({
    candidates: [giveaway, nuanced], topicWeights: { memory: 1 }, size: 1, rng: () => 0.2,
  });
  assert.equal(output[0].id, 'nuanced');
});
test('daily selector gives authored GATE-hard items priority over generic bank items', () => {
  const authoredHard = {
    id: 'authored-hard', type: 'MSQ', topic: 'memory', answers: ['A', 'C'], msqType: 'category-membership', challengeLevel: 'gate-hard-v1',
    options: {
      A: 'The encoding manipulation may affect later access when the retrieval cue reinstates the same operation.',
      B: 'The encoding manipulation may affect later access because one condition provides a modestly stronger trace.',
      C: 'The crossover is compatible with an interaction between encoding operation and retrieval demand.',
      D: 'The crossover is compatible with a pre-existing group difference unless assignment was randomized.',
    },
  };
  const generic = {
    id: 'generic', type: 'MSQ', topic: 'memory', answers: ['A', 'C'], msqType: 'category-membership',
    options: {
      A: 'The procedure may influence encoding under the stated test conditions.',
      B: 'The procedure may influence retrieval under the stated test conditions.',
      C: 'The observed contrast is compatible with the proposed account.',
      D: 'The observed contrast is compatible with a rival account.',
    },
  };
  const output = selectDailyXhC5Msqs({
    candidates: [generic, authoredHard], topicWeights: { memory: 1 }, size: 1, rng: () => 0.2,
  });
  assert.equal(output[0].id, 'authored-hard');
});

test('daily selector emits only unique MSQs from eligible topics with matching authored cardinality', () => {
  const output = selectDailyXhC5Msqs({
    candidates,
    topicWeights: { memory: 2, learning: 1 },
    excludedIds: ['two-a'],
    size: 3,
    rng: (() => { const values = [0.2, 0.1, 0.8, 0.95, 0.3, 0.5]; let i = 0; return () => values[i++ % values.length]; })(),
  });
  assert.equal(output.length, 3);
  assert.equal(output.every((q) => q.type === 'MSQ'), true);
  assert.equal(new Set(output.map((q) => q.id)).size, 3);
  assert.equal(output.some((q) => q.id === 'two-a'), false);
  assert.equal(output.every((q) => q.answers.length >= 1 && q.answers.length <= 4), true);
});
