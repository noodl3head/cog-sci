import test from 'node:test';
import assert from 'node:assert/strict';
import { XH_C5_DAILY_MSQ_QUESTIONS } from '../lib/xhC5DailyMsqQuestionBank.js';
import { generateDailyTelegramMock, msqCycleIndexForDate, topicWeightsForDate, XH_C5_COMPLETED_TOPIC_IDS } from '../lib/telegramMockGenerator.js';

const giveaway = /\b(always|never|only|merely|automatically|guarantees?|proves?|logically impossible|must|cannot|every|none|necessarily|by definition|regardless|entirely)\b/i;
const targeted = {
  'xh-c5-msq-personality-009': ['B'],
  'xh-c5-msq-personality-004': ['A', 'B'],
  'xh-c5-msq-personality-005': ['A', 'B', 'C'],
  'xh-c5-msq-biological-evolutionary-008': ['A', 'C', 'D'],
  'xh-c5-hard-v3-p2-004': ['A', 'C'],
  'xh-c5-hard-v3-p2-008': ['A', 'B', 'D'],
  'xh-c5-hard-v3-p2-009': ['A', 'B', 'C'],
  'xh-c5-msq-cognition-004': ['B', 'C'],
  'xh-c5-hard-v3-motivation-emotion-stress-001': ['A', 'C'],
  'xh-c5-hard-v3-social-001': ['A', 'C'],
  'xh-c5-hard-v3-development-004': ['A', 'B', 'C'],
  'xh-c5-msq-research-methods-statistics-007': ['A', 'C'],
  'xh-c5-msq-biological-evolutionary-007': ['A', 'B'],
  'xh-c5-msq-cognition-002': ['B', 'D'],
  'xh-c5-msq-motivation-emotion-stress-001': ['B', 'D'],
  'xh-c5-msq-clinical-organizational-007': ['A', 'C'],
};

function assertOptions(questions) {
  for (const q of questions) {
    assert.deepEqual(Object.keys(q.options).sort(), ['A', 'B', 'C', 'D'], q.id);
    assert.equal(new Set(Object.values(q.options).map(text => text.toLowerCase())).size, 4, q.id);
    for (const [letter, text] of Object.entries(q.options)) {
      if (!q.answers.includes(letter)) assert.doesNotMatch(text, giveaway, `${q.id} ${letter}: ${text}`);
    }
  }
}

test('reviewed near-neighbour edits preserve keys and eliminate giveaway incorrect options in active bank', () => {
  for (const [id, answers] of Object.entries(targeted)) {
    const question = XH_C5_DAILY_MSQ_QUESTIONS.find(q => q.id === id);
    assert.ok(question, id);
    assert.deepEqual(question.answers, answers, id);
  }
  assertOptions(XH_C5_DAILY_MSQ_QUESTIONS);
});

test('daily delivery selector exposes no giveaway incorrect options across rotating scopes and recent history', () => {
  let seed = 12345;
  const rng = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const weights = Object.fromEntries(XH_C5_COMPLETED_TOPIC_IDS.map(topic => [topic, 1]));
  const recent = [];
  for (let day = 1; day <= 15; day++) {
    const date = `2026-11-${String(day).padStart(2, '0')}`;
    const mock = generateDailyTelegramMock(topicWeightsForDate(weights, date), recent.flat(), rng, msqCycleIndexForDate(date));
    assert.equal(mock.length, 10, date);
    assert.equal(new Set(mock.map(q => q.id)).size, 10, date);
    assertOptions(mock);
    recent.push(mock.map(q => q.id));
    if (recent.length > 5) recent.shift();
  }
});
