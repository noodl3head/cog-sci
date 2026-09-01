import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildQuestionKeyboard,
  buildQuestionMessage,
  buildResultSummary,
  parseCallbackData,
  scoreResponse,
  selectDailyQuestions,
} from '../lib/telegramMockCore.js';

test('scoreResponse applies GATE negative marking only to MCQs', () => {
  assert.deepEqual(
    scoreResponse({ type: 'MCQ', marks: 1, answer: 'B' }, 'A'),
    { correct: false, marksAwarded: -1 / 3 },
  );
  assert.deepEqual(
    scoreResponse({ type: 'MCQ', marks: 2, answer: 'B' }, 'A'),
    { correct: false, marksAwarded: -2 / 3 },
  );
  assert.deepEqual(
    scoreResponse({ type: 'MSQ', marks: 2, answers: ['A', 'C'] }, ['A']),
    { correct: false, marksAwarded: 0 },
  );
  assert.deepEqual(
    scoreResponse({ type: 'NAT', marks: 2, range: [1.49, 1.51] }, '1.5'),
    { correct: true, marksAwarded: 2 },
  );
});

test('scoreResponse gives zero marks for a skipped question', () => {
  assert.deepEqual(scoreResponse({ type: 'MCQ', marks: 2, answer: 'A' }, null), { correct: false, marksAwarded: 0 });
  assert.deepEqual(scoreResponse({ type: 'MSQ', marks: 2, acceptedSets: [['A']] }, null), { correct: false, marksAwarded: 0 });
  assert.deepEqual(scoreResponse({ type: 'NAT', marks: 2, answer: 4 }, null), { correct: false, marksAwarded: 0 });
});

test('buildQuestionKeyboard makes MSQ options toggleable before submission', () => {
  const keyboard = buildQuestionKeyboard(
    { type: 'MSQ', options: { A: 'Alpha', B: 'Beta', C: 'Gamma', D: 'Delta' } },
    { sessionId: 'mock-1', questionIndex: 2, selected: ['B', 'D'] },
  );
  assert.deepEqual(keyboard.inline_keyboard, [
    [{ text: 'A', callback_data: 'tm:q:mock-1:2:A' }, { text: '✅ B', callback_data: 'tm:q:mock-1:2:B' }],
    [{ text: 'C', callback_data: 'tm:q:mock-1:2:C' }, { text: '✅ D', callback_data: 'tm:q:mock-1:2:D' }],
    [{ text: 'Submit selections (2 selected)', callback_data: 'tm:submit:mock-1:2' }, { text: 'Skip', callback_data: 'tm:skip:mock-1:2' }],
  ]);
  assert.deepEqual(buildQuestionKeyboard(
    { type: 'NAT' },
    { sessionId: 'mock-1', questionIndex: 3 },
  ), { inline_keyboard: [[{ text: 'Skip', callback_data: 'tm:skip:mock-1:3' }]] });
});

test('buildQuestionMessage shows GATE metadata without leaking source or answer', () => {
  const text = buildQuestionMessage({
    type: 'MCQ', marks: 2, question: 'A < B & C?',
    options: { A: 'First', B: 'Second', C: 'Third', D: 'Fourth' },
    answer: 'B', chapterTitle: 'Memory', sourceName: 'Hidden source',
  }, 0, 10);
  assert.match(text, /Question 1\/10 · MCQ · 2 marks/);
  assert.match(text, /A &lt; B &amp; C\?/);
  assert.match(text, /A\. First/);
  assert.doesNotMatch(text, /Memory|Hidden source|Correct answer/);
});

test('selectDailyQuestions returns a fresh 5 MCQ 4 MSQ 1 NAT mock from covered topics', () => {
  const candidates = [
    ...Array.from({ length: 7 }, (_, index) => ({ id: `m${index}`, type: 'MCQ', topic: index < 4 ? 'weak' : 'strong', marks: index < 3 ? 1 : 2 })),
    ...Array.from({ length: 5 }, (_, index) => ({ id: `s${index}`, type: 'MSQ', topic: index < 3 ? 'weak' : 'strong', marks: 2 })),
    { id: 'n0', type: 'NAT', topic: 'weak', marks: 2 },
    { id: 'n1', type: 'NAT', topic: 'strong', marks: 2 },
    { id: 'outside', type: 'MCQ', topic: 'uncovered', marks: 1 },
  ];
  const picked = selectDailyQuestions({
    candidates,
    topicWeights: { weak: 10, strong: 1 },
    excludedIds: ['m0'],
    size: 10,
    rng: () => 0,
  });
  assert.equal(picked.length, 10);
  assert.equal(new Set(picked.map((question) => question.id)).size, 10);
  assert.equal(picked.some((question) => question.id === 'm0' || question.topic === 'uncovered'), false);
  assert.deepEqual(
    Object.fromEntries(['MCQ', 'MSQ', 'NAT'].map((type) => [type, picked.filter((question) => question.type === type).length])),
    { MCQ: 5, MSQ: 4, NAT: 1 },
  );
  assert.equal(picked[0].topic, 'weak');
});

test('selectDailyQuestions weights topics rather than rewarding larger source pools', () => {
  const candidates = [
    ...Array.from({ length: 100 }, (_, index) => ({ id: `strong-${index}`, type: 'MCQ', topic: 'strong' })),
    { id: 'weak-only', type: 'MCQ', topic: 'weak' },
  ];
  const picked = selectDailyQuestions({
    candidates,
    topicWeights: { strong: 1, weak: 10 },
    excludedIds: [],
    size: 1,
    rng: () => 0.5,
  });
  assert.equal(picked[0].id, 'weak-only');
});

test('selectDailyQuestions prevents one covered topic from dominating the mock', () => {
  const candidates = ['alpha', 'beta', 'gamma', 'delta'].flatMap((topic) =>
    Array.from({ length: 10 }, (_, index) => ({ id: `${topic}-${index}`, type: 'MCQ', topic })),
  );
  const picked = selectDailyQuestions({
    candidates,
    topicWeights: { alpha: 10, beta: 2, gamma: 2, delta: 2 },
    excludedIds: [],
    size: 10,
    rng: () => 0.1,
  });
  const counts = picked.reduce((result, question) => ({ ...result, [question.topic]: (result[question.topic] || 0) + 1 }), {});
  assert.equal(Math.max(...Object.values(counts)) <= 3, true);
});

test('buildResultSummary scores the whole mock and reveals explanations only at the end', () => {
  const result = buildResultSummary([
    { id: 'q1', type: 'MCQ', marks: 1, answer: 'A', explanation: 'MCQ explanation.' },
    { id: 'q2', type: 'MSQ', marks: 2, answers: ['B', 'D'], explanation: 'MSQ explanation.' },
    { id: 'q3', type: 'NAT', marks: 2, answer: 4, tolerance: 0.1, explanation: 'NAT explanation.' },
  ], { 0: 'B', 1: ['D', 'B'], 2: '4.05' });
  assert.equal(result.score, 3.67);
  assert.equal(result.maxMarks, 5);
  assert.deepEqual(result.rows.map((row) => row.correct), [false, true, true]);
  assert.match(result.text, /3\.67\/5/);
  assert.match(result.text, /MCQ explanation\./);
  assert.match(result.text, /Correct: B, D/);
});

test('parseCallbackData rejects malformed data and parses every mock action', () => {
  assert.deepEqual(parseCallbackData('tm:start:2026-09-01'), { action: 'start', mockDate: '2026-09-01' });
  assert.deepEqual(parseCallbackData('tm:q:abc123:4:C'), { action: 'q', sessionId: 'abc123', questionIndex: 4, value: 'C' });
  assert.deepEqual(parseCallbackData('tm:submit:abc123:4'), { action: 'submit', sessionId: 'abc123', questionIndex: 4 });
  assert.deepEqual(parseCallbackData('tm:skip:abc123:4'), { action: 'skip', sessionId: 'abc123', questionIndex: 4 });
  assert.equal(parseCallbackData('other:q:abc'), null);
  assert.equal(parseCallbackData('tm:q:abc:not-a-number:A'), null);
});
