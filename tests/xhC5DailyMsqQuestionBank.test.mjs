import test from 'node:test';
import assert from 'node:assert/strict';
import { XH_C5_DAILY_MSQ_QUESTIONS } from '../lib/xhC5DailyMsqQuestionBank.js';

test('daily XH-C5 bank is entirely valid all-or-nothing MSQs', () => {
  assert.ok(XH_C5_DAILY_MSQ_QUESTIONS.length >= 120);
  for (const q of XH_C5_DAILY_MSQ_QUESTIONS) {
    assert.equal(q.type, 'MSQ');
    assert.equal(typeof q.id, 'string');
    assert.equal(typeof q.topic, 'string');
    assert.equal([1, 2].includes(q.marks), true);
    assert.deepEqual(Object.keys(q.options), ['A', 'B', 'C', 'D']);
    assert.equal(q.answers.length >= 1 && q.answers.length <= 4, true);
    assert.equal(new Set(q.answers).size, q.answers.length);
    assert.equal(q.answers.every((letter) => Object.hasOwn(q.options, letter)), true);
    assert.match(q.question, /\S/);
    assert.match(q.explanation, /\S/);
    assert.doesNotMatch(`${q.question} ${Object.values(q.options).join(' ')}`, /all of the above|none of the above/i);
  }
});

test('bank covers every active GATE XH-C5 topic and can supply every empirical cardinality', () => {
  const topics = new Set(XH_C5_DAILY_MSQ_QUESTIONS.map((q) => q.topic));
  for (const topic of [
    'research-methods-statistics', 'psychometrics', 'biological-evolutionary',
    'perception-learning-memory', 'cognition', 'personality',
    'motivation-emotion-stress', 'social', 'development',
    'clinical-organizational', 'applications',
  ]) assert.equal(topics.has(topic), true, `missing ${topic}`);
  for (const n of [1, 2, 3, 4]) assert.equal(XH_C5_DAILY_MSQ_QUESTIONS.some((q) => q.answers.length === n), true);
});
