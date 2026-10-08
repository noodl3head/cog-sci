import test from 'node:test';
import assert from 'node:assert/strict';
import {
  deriveTopicWeights,
  generateDailyTelegramMock,
  msqCycleIndexForDate,
  XH_C5_DAILY_MSQ_BANK_VERSION,
} from '../lib/telegramMockGenerator.js';
import { msqTypesForCycle } from '../lib/xhC5MsqTypes.js';


test('deriveTopicWeights includes only attempted chapters and weights weaker performance higher', () => {
  const questions = [
    { bookId: 'book', chapterId: 'weak-chapter', topics: ['memory'] },
    { bookId: 'book', chapterId: 'strong-chapter', topics: ['learning'] },
    { bookId: 'book', chapterId: 'untouched', topics: ['social'] },
  ];
  const weights = deriveTopicWeights([
    { book_id: 'book', chapter_id: 'weak-chapter', attempted: 20, correct: 8 },
    { book_id: 'book', chapter_id: 'strong-chapter', attempted: 20, correct: 18 },
  ], questions);
  assert.equal(weights.memory > weights.learning, true);
  assert.equal(weights.social, undefined);
});

test('deriveTopicWeights maps real chapter attempts through the playable question bank', () => {
  const weights = deriveTopicWeights([
    { book_id: '500q', chapter_id: '500q-2', attempted: 23, correct: 17 },
  ]);
  assert.equal(Object.keys(weights).length > 0, true);
  assert.equal(weights['research-methods-statistics'] > 0, true);
});

test('generateDailyTelegramMock builds ten fresh PYQ-profiled XH-C5 MSQs only', () => {
  assert.equal(XH_C5_DAILY_MSQ_BANK_VERSION, 4);
  const mock = generateDailyTelegramMock({
    'research-methods-statistics': 5,
    psychometrics: 5,
    'biological-evolutionary': 3,
    'perception-learning-memory': 4,
    cognition: 2,
  }, [], () => 0.42, 1);
  assert.equal(mock.length, 10);
  assert.equal(new Set(mock.map((question) => question.id)).size, 10);
  assert.equal(mock.every((question) => question.type === 'MSQ'), true);
  assert.equal(mock.every((question) => [1, 2].includes(question.marks)), true);
  assert.equal(mock.every((question) => question.answers.length >= 1 && question.answers.length <= 4), true);
  assert.equal(mock.every((question) => question.bankVersion === XH_C5_DAILY_MSQ_BANK_VERSION), true);
  assert.equal(mock.every((question) => msqTypesForCycle(1).includes(question.msqType)), true);
  assert.deepEqual([...new Set(mock.map((question) => question.msqType))].sort(), [...msqTypesForCycle(1)].sort());
});

test('Sphinx advances to the next four MSQ types on each India-date mock', () => {
  assert.equal(msqCycleIndexForDate('2026-10-08'), 0);
  assert.equal(msqCycleIndexForDate('2026-10-09'), 1);
  assert.equal(msqCycleIndexForDate('2026-10-12'), 4);
  assert.equal(msqCycleIndexForDate('2026-10-13'), 0);
  assert.throws(() => msqCycleIndexForDate('2026-02-31'), /valid calendar date/);
});

test('Sphinx relaxes old-question exclusions when a rotating archetype is exhausted', () => {
  const topicWeights = Object.fromEntries([
    'research-methods-statistics', 'psychometrics', 'biological-evolutionary',
    'perception-learning-memory', 'cognition', 'personality',
    'motivation-emotion-stress', 'social', 'development',
    'clinical-organizational', 'applications',
  ].map((topic) => [topic, 1]));
  const usedIds = [];
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const cycleIndex = attempt % 5;
    const mock = generateDailyTelegramMock(topicWeights, usedIds, () => 0.37, cycleIndex);
    assert.equal(mock.length, 10);
    assert.deepEqual([...new Set(mock.map((q) => q.msqType))].sort(), [...msqTypesForCycle(cycleIndex)].sort());
    usedIds.push(...mock.map((q) => q.id));
  }
});

test('Sphinx keeps four rotating focus types even when one covered topic needs overflow types to fill ten questions', () => {
  for (const topic of [
    'research-methods-statistics', 'psychometrics', 'biological-evolutionary',
    'perception-learning-memory', 'cognition', 'personality',
    'motivation-emotion-stress', 'social', 'development',
    'clinical-organizational', 'applications',
  ]) {
    for (let cycleIndex = 0; cycleIndex < 5; cycleIndex += 1) {
      const mock = generateDailyTelegramMock({ [topic]: 1 }, [], () => 0.37, cycleIndex);
      assert.equal(mock.length, 10, `${topic} cycle ${cycleIndex}`);
      assert.equal(new Set(mock.map((question) => question.msqType)).size >= 4, true);
    }
  }
});
