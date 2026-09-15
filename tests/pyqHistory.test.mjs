import test from 'node:test';
import assert from 'node:assert/strict';
import { getPyqReviewAnswerState, normalizePyqAttempt, parsePyqAttemptId, responseMapForAttempt } from '../lib/pyqHistory.js';

test('normalizePyqAttempt makes database result values usable by result screens', () => {
  const attempt = normalizePyqAttempt({
    id: '42',
    paper_id: '2026',
    positive_marks: '37.00',
    negative_marks: '2.33',
    total_marks: '34.67',
    time_seconds: '4200',
    sections: '[{"code":"GA","net":"8.67"}]',
    responses: '[{"questionNumber":2,"status":"correct","selectedAnswer":"B"}]',
    created_at: '2026-09-15T08:00:00.000Z',
  });

  assert.equal(attempt.id, 42);
  assert.equal(attempt.totalMarks, 34.67);
  assert.equal(attempt.timeSeconds, 4200);
  assert.deepEqual(attempt.sections, [{ code: 'GA', net: '8.67' }]);
  assert.equal(attempt.responses[0].selectedAnswer, 'B');
});

test('responseMapForAttempt indexes saved answers and tolerates legacy attempts', () => {
  assert.deepEqual(responseMapForAttempt({ responses: null }), {});
  assert.deepEqual(
    responseMapForAttempt({ responses: [{ questionNumber: 2, selectedAnswer: 'B' }] }),
    { 2: { questionNumber: 2, selectedAnswer: 'B' } }
  );
});

test('parsePyqAttemptId accepts positive integer IDs only', () => {
  assert.equal(parsePyqAttemptId('42'), 42);
  assert.equal(parsePyqAttemptId('0'), null);
  assert.equal(parsePyqAttemptId('4.2'), null);
  assert.equal(parsePyqAttemptId('abc'), null);
});

test('getPyqReviewAnswerState honors alternate accepted answers and sets', () => {
  const mcq = getPyqReviewAnswerState(
    { type: 'MCQ', answer: 'A', acceptedAnswers: ['A', 'D'] },
    { selectedAnswer: 'D', correctAnswer: 'A', status: 'correct' }
  );
  assert.deepEqual(mcq.correct, ['A', 'D']);
  assert.equal(mcq.correct.includes('D'), true);

  const msq = getPyqReviewAnswerState(
    { type: 'MSQ', answers: ['A', 'B'], acceptedSets: [['A', 'B'], ['C', 'D']] },
    { selectedAnswer: ['D', 'C'], correctAnswer: ['A', 'B'], status: 'correct' }
  );
  assert.deepEqual(msq.correct, ['C', 'D']);
});

test('getPyqReviewAnswerState identifies marks-to-all without inventing a key', () => {
  const state = getPyqReviewAnswerState(
    { type: 'MCQ', answer: null, mta: true },
    { selectedAnswer: 'B', correctAnswer: null, status: 'correct' }
  );
  assert.equal(state.marksToAll, true);
  assert.deepEqual(state.correct, []);
});
