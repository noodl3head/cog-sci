import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeTelegramMockSessions } from '../lib/telegramMockAnalytics.js';

test('summarizeTelegramMockSessions exposes safe performance aggregates without answers or reasoning', () => {
  const summary = summarizeTelegramMockSessions([
    {
      mock_date: '2026-10-06',
      status: 'completed',
      score: '8',
      max_marks: '12',
      started_at: '2026-10-06T06:30:00.000Z',
      completed_at: '2026-10-06T06:40:00.000Z',
      questions: [
        { id: 'q1', type: 'MSQ', marks: 2, topic: 'memory' },
        { id: 'q2', type: 'MSQ', marks: 2, topic: 'memory' },
        { id: 'q3', type: 'MSQ', marks: 2, topic: 'learning' },
        { id: 'q4', type: 'MSQ', marks: 2, topic: 'learning' },
        { id: 'q5', type: 'MSQ', marks: 2, topic: 'methods' },
        { id: 'q6', type: 'MSQ', marks: 2, topic: 'methods' },
      ],
      result: {
        correctCount: 4,
        rows: [
          { questionId: 'q1', marksAwarded: 2, correct: ['A', 'B'], selected: ['A', 'B'], reasoning: { A: 'yes' } },
          { questionId: 'q2', marksAwarded: 0, correct: ['A'], selected: ['A', 'B'], reasoning: { A: 'yes' } },
          { questionId: 'q3', marksAwarded: 2 },
          { questionId: 'q4', marksAwarded: 2 },
          { questionId: 'q5', marksAwarded: 0 },
          { questionId: 'q6', marksAwarded: 2 },
        ],
      },
    },
    {
      mock_date: '2026-10-07',
      status: 'in_progress',
      questions: [{ id: 'q7', type: 'MSQ', marks: 2, topic: 'psychometrics' }],
    },
  ]);

  assert.deepEqual(summary.summary, {
    sessions: 2,
    completed: 1,
    inProgress: 1,
    score: 8,
    maxMarks: 12,
    scorePercentage: 66.7,
    questions: 6,
    correct: 4,
    accuracy: 66.7,
  });
  assert.deepEqual(summary.attempts[0].formatBreakdown, { MSQ: { total: 6, correct: 4, marks: 8, maxMarks: 12 } });
  assert.deepEqual(summary.attempts[0].topicBreakdown, [
    { topic: 'learning', total: 2, correct: 2, marks: 4, maxMarks: 4 },
    { topic: 'memory', total: 2, correct: 1, marks: 2, maxMarks: 4 },
    { topic: 'methods', total: 2, correct: 1, marks: 2, maxMarks: 4 },
  ]);
  assert.equal(JSON.stringify(summary).includes('reasoning'), false);
  assert.equal(JSON.stringify(summary).includes('selected'), false);
  assert.equal(JSON.stringify(summary).includes('correct":['), false);
});

test('summarizeTelegramMockSessions treats missing results as ungraded and returns zero-safe metrics', () => {
  const summary = summarizeTelegramMockSessions([{ mock_date: new Date('2026-10-06T00:00:00.000Z'), status: 'in_progress', questions: [{ id: 'q1', type: 'MSQ', marks: 2, topic: 'memory' }] }]);
  assert.equal(summary.summary.completed, 0);
  assert.equal(summary.summary.scorePercentage, null);
  assert.equal(summary.summary.accuracy, null);
  assert.equal(summary.attempts[0].date, '2026-10-06');
  assert.deepEqual(summary.attempts[0].formatBreakdown, { MSQ: { total: 1, correct: null, marks: null, maxMarks: 2 } });
});
