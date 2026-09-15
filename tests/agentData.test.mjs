import test from 'node:test';
import assert from 'node:assert/strict';
import {
  serializeMockResponses,
  serializePyqResponses,
  rankWeaknesses,
  collectSyncEntries,
} from '../lib/agentData.js';
import { gradeQuestion } from '../lib/pyqScoring.js';

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

test('serializePyqResponses preserves alternate keys and marks-to-all semantics', () => {
  const paper = { id: '2025', questions: [
    { num: 1, section: 'GA', type: 'MCQ', marks: 1, answer: 'A', acceptedAnswers: ['A', 'D'] },
    { num: 2, section: 'XH-C5', type: 'MSQ', marks: 2, answers: ['A', 'B'], acceptedSets: [['A', 'B'], ['C', 'D']] },
    { num: 3, section: 'XH-C5', type: 'MCQ', marks: 2, answer: null, mta: true },
    { num: 4, section: 'XH-C5', type: 'MCQ', marks: 1, answer: null, mta: true },
  ] };
  const rows = serializePyqResponses(paper, { 1: 'D', 2: ['D', 'C'], 3: 'B' });

  assert.deepEqual(rows[0].acceptedAnswers, ['A', 'D']);
  assert.deepEqual(rows[1].acceptedSets, [['A', 'B'], ['C', 'D']]);
  assert.equal(rows[2].marksToAll, true);
  assert.equal(rows[3].answered, false);
  assert.equal(rows[3].isCorrect, true);
  assert.equal(rows[3].status, 'correct');
  assert.equal(rows.every((row) => row.status === 'correct'), true);
});

test('serialized NAT status matches live grading for malformed and boundary inputs', () => {
  const question = { num: 1, section: 'XH-C5', type: 'NAT', marks: 2, range: [1, 1] };
  const paper = { id: '2026', questions: [question] };

  for (const selectedAnswer of ['1abc', '1.0000000005', '1']) {
    const saved = serializePyqResponses(paper, { 1: selectedAnswer })[0];
    assert.equal(saved.status, gradeQuestion(question, selectedAnswer).status);
  }

  assert.equal(serializePyqResponses(paper, { 1: '1abc' })[0].status, 'wrong');
  assert.equal(serializePyqResponses(paper, { 1: '1.0000000005' })[0].status, 'correct');
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
