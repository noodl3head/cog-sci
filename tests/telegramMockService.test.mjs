import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildTelegramResultMessages,
  hasUndeliveredCurrentQuestion,
  isAuthorizedPrivateSubscriber,
  parseNatResponse,
  shouldRecoverMissingQuestion,
  startMockDisposition,
} from '../lib/telegramMockService.js';

test('isAuthorizedPrivateSubscriber rejects stale users and non-private chat IDs', () => {
  assert.equal(isAuthorizedPrivateSubscriber({ user_id: '123', chat_id: '123' }, '123'), true);
  assert.equal(isAuthorizedPrivateSubscriber({ user_id: '999', chat_id: '999' }, '123'), false);
  assert.equal(isAuthorizedPrivateSubscriber({ user_id: '123', chat_id: '-100777' }, '123'), false);
});

test('parseNatResponse rejects empty and non-numeric messages while accepting zero', () => {
  assert.equal(parseNatResponse(undefined), null);
  assert.equal(parseNatResponse('   '), null);
  assert.equal(parseNatResponse('not a number'), null);
  assert.equal(parseNatResponse('0'), '0');
  assert.equal(parseNatResponse('1,250.5'), '1,250.5');
  assert.equal(parseNatResponse('1e2'), '1e2');
});

test('hasUndeliveredCurrentQuestion detects a failed next-question send for any answer type', () => {
  const questions = Array.from({ length: 4 }, (_, index) => ({ id: `q${index}` }));
  assert.equal(hasUndeliveredCurrentQuestion({ status: 'in_progress', current_index: 2, last_question_index: 1, questions }), true);
  assert.equal(hasUndeliveredCurrentQuestion({ status: 'in_progress', current_index: 2, last_question_index: 2, questions }), false);
  assert.equal(hasUndeliveredCurrentQuestion({ status: 'in_progress', current_index: 4, last_question_index: 3, questions }), false);
});

test('shouldRecoverMissingQuestion retries only an undelivered advanced question', () => {
  const questions = Array.from({ length: 4 }, (_, index) => ({ id: `q${index}` }));
  assert.equal(shouldRecoverMissingQuestion({ status: 'in_progress', current_index: 3, last_question_index: 2, questions }, 2), true);
  assert.equal(shouldRecoverMissingQuestion({ status: 'in_progress', current_index: 3, last_question_index: 3, questions }, 2), false);
  assert.equal(shouldRecoverMissingQuestion({ status: 'completed', current_index: 3, last_question_index: 2, questions }, 2), false);
});

test('startMockDisposition does not resend an already delivered active question', () => {
  const questions = [{ id: 'q1' }];
  assert.equal(startMockDisposition(null), 'create');
  assert.equal(startMockDisposition({ status: 'completed', questions }), 'completed');
  assert.equal(startMockDisposition({ status: 'finishing', questions }), 'finishing');
  assert.equal(startMockDisposition({ status: 'in_progress', current_index: 0, last_question_index: 0, questions }), 'already-active');
  assert.equal(startMockDisposition({ status: 'in_progress', current_index: 0, last_question_index: null, questions }), 'recover-question');
});

test('buildTelegramResultMessages creates one summary followed by ordered answer reviews', () => {
  const messages = buildTelegramResultMessages({
    text: 'Summary',
    rows: [
      { questionNumber: 1, correct: true, marksAwarded: 1, response: 'A', correctAnswer: 'A', explanation: 'First' },
      { questionNumber: 2, correct: false, marksAwarded: 0, response: null, correctAnswer: 'B, D', explanation: 'Second' },
    ],
  });
  assert.deepEqual(messages, [
    { text: 'Summary', parseMode: 'HTML' },
    { text: '<b>Q1 · Correct · 1 marks</b>\nYour answer: A\nCorrect: A\nFirst', parseMode: 'HTML' },
    { text: '<b>Q2 · Incorrect · 0 marks</b>\nYour answer: Skipped\nCorrect: B, D\nSecond', parseMode: 'HTML' },
  ]);
});
