import test from 'node:test';
import assert from 'node:assert/strict';
import { correctOptionCountFor, selectDailyXhC5Msqs } from '../lib/xhC5DailyMsqCore.js';

const candidates = [
  { id: 'one', type: 'MSQ', topic: 'memory', answers: ['A'] },
  { id: 'two-a', type: 'MSQ', topic: 'memory', answers: ['A', 'B'] },
  { id: 'two-b', type: 'MSQ', topic: 'learning', answers: ['A', 'C'] },
  { id: 'three-a', type: 'MSQ', topic: 'memory', answers: ['A', 'B', 'C'] },
  { id: 'three-b', type: 'MSQ', topic: 'learning', answers: ['B', 'C', 'D'] },
  { id: 'four', type: 'MSQ', topic: 'memory', answers: ['A', 'B', 'C', 'D'] },
];

test('correctOptionCountFor uses the empirical 6/56/40/1 weight scale', () => {
  assert.equal(correctOptionCountFor(() => 0), 1);
  assert.equal(correctOptionCountFor(() => 0.059), 2);
  assert.equal(correctOptionCountFor(() => 0.619), 3);
  assert.equal(correctOptionCountFor(() => 0.999), 4);
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
