import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveTopicWeights, generateDailyTelegramMock } from '../lib/telegramMockGenerator.js';
import { TELEGRAM_NAT_QUESTIONS } from '../lib/telegramMockQuestionBank.js';

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

test('generateDailyTelegramMock builds ten fresh GATE-format questions', () => {
  const mock = generateDailyTelegramMock({
    'research-methods-statistics': 5,
    psychometrics: 5,
    'biological-evolutionary': 3,
    'perception-learning-memory': 4,
    cognition: 2,
  }, [], () => 0.42);
  assert.equal(mock.length, 10);
  assert.equal(new Set(mock.map((question) => question.id)).size, 10);
  assert.deepEqual(
    Object.fromEntries(['MCQ', 'MSQ', 'NAT'].map((type) => [type, mock.filter((question) => question.type === type).length])),
    { MCQ: 5, MSQ: 4, NAT: 1 },
  );
  assert.equal(mock.every((question) => question.question && question.explanation && [1, 2].includes(question.marks)), true);
});

test('generateDailyTelegramMock keeps NAT fresh after the static numerical bank is exhausted', () => {
  const excluded = TELEGRAM_NAT_QUESTIONS.map((question) => question.id);
  const mock = generateDailyTelegramMock({ 'research-methods-statistics': 5 }, excluded, () => 0.37);
  const nat = mock.find((question) => question.type === 'NAT');
  assert.ok(nat);
  assert.equal(excluded.includes(nat.id), false);
});
