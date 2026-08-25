import test from 'node:test';
import assert from 'node:assert/strict';
import {
  serializeMockResponses,
  serializePyqResponses,
  rankWeaknesses,
  collectSyncEntries,
} from '../lib/agentData.js';

test('serializeMockResponses preserves every selected and correct answer', () => {
  const quiz = {
    section1: [{ id: 'q1', type: 'MCQ', answer: 'B', topic: 'learning', syllabusLeaf: 'conditioning' }],
    section2: [{ id: 'q2', type: 'MSQ', answers: ['A', 'C'], topic: 'methods', syllabusLeaf: 'validity' }],
  };
  const rows = serializeMockResponses(quiz, { 0: 'B', 1: ['A'] }, { 0: ['A', 'B'] });
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], {
    questionId: 'q1', section: 1, questionNumber: 1, type: 'MCQ', marks: 1,
    selectedAnswer: 'B', correctAnswer: 'B', answered: true, isCorrect: true,
    topic: 'learning', syllabusLeaf: 'conditioning', answerHistory: ['A', 'B'],
  });
  assert.equal(rows[1].section, 2);
  assert.deepEqual(rows[1].selectedAnswer, ['A']);
  assert.deepEqual(rows[1].correctAnswer, ['A', 'C']);
  assert.equal(rows[1].isCorrect, false);
});

test('serializePyqResponses supports MCQ MSQ NAT and skipped answers', () => {
  const paper = { questions: [
    { num: 1, section: 'GA', type: 'MCQ', marks: 1, answer: 'A' },
    { num: 2, section: 'XH-C5', type: 'MSQ', marks: 2, answers: ['B', 'D'] },
    { num: 3, section: 'XH-C5', type: 'NAT', marks: 2, range: [4, 5] },
  ] };
  const rows = serializePyqResponses(paper, { 1: 'A', 2: ['D', 'B'] });
  assert.equal(rows.length, 3);
  assert.equal(rows[0].status, 'correct');
  assert.deepEqual(rows[1].correctAnswer, ['B', 'D']);
  assert.equal(rows[1].status, 'correct');
  assert.deepEqual(rows[2].correctAnswer, [4, 5]);
  assert.equal(rows[2].status, 'skipped');
});

test('collectSyncEntries includes study state and excludes unrelated local storage', () => {
  const storage = {
    length: 4,
    key: (index) => ['srs_queue', 'gate_revision_list_v1', 'pyq_key_overrides', 'gate-theme'][index],
    getItem: (key) => ({
      srs_queue: '{"q1":{"due":1}}',
      gate_revision_list_v1: '[{"questionId":"q1"}]',
      pyq_key_overrides: '{"2021:1":{"answer":"B"}}',
      'gate-theme': 'dark',
    })[key],
  };
  const entries = collectSyncEntries(storage);
  assert.equal(entries.length, 3);
  assert.deepEqual(entries.find((entry) => entry.key === 'srs_queue').value, { q1: { due: 1 } });
  assert.equal(entries.some((entry) => entry.key === 'gate-theme'), false);
});

test('rankWeaknesses orders topics by error rate then sample size', () => {
  const ranked = rankWeaknesses([
    { key: 'memory', attempted: 10, correct: 8 },
    { key: 'methods', attempted: 10, correct: 4 },
    { key: 'learning', attempted: 20, correct: 8 },
  ]);
  assert.equal(ranked[0].key, 'learning');
  assert.equal(ranked[0].accuracy, 40);
  assert.equal(ranked[1].key, 'methods');
  assert.equal(ranked[2].accuracy, 80);
});
