import test from 'node:test';
import assert from 'node:assert/strict';
import {
  deriveTopicWeights,
  generateDailyTelegramMock,
  msqCycleIndexForDate,
  topicWeightsForDate,
  XH_C5_COMPLETED_TOPIC_IDS,
  XH_C5_DAILY_MSQ_BANK_VERSION,
} from '../lib/telegramMockGenerator.js';
import { GATE_2027_TOPIC_IDS } from '../lib/gateSyllabus.js';
import { msqTypesForCycle } from '../lib/xhC5MsqTypes.js';


test('completed topic scope covers every official GATE 2027 XH5 syllabus section', () => {
  assert.deepEqual(XH_C5_COMPLETED_TOPIC_IDS, GATE_2027_TOPIC_IDS);
});

test('daily topic scope rotates through every completed syllabus section', () => {
  const weights = Object.fromEntries(GATE_2027_TOPIC_IDS.map((topic, index) => [topic, index + 1]));
  const seen = new Set();
  for (let day = 8; day <= 18; day += 1) {
    const active = topicWeightsForDate(weights, `2026-10-${String(day).padStart(2, '0')}`);
    assert.equal(Object.keys(active).length, 5);
    for (const [topic, weight] of Object.entries(active)) {
      seen.add(topic);
      assert.equal(weight, weights[topic]);
    }
  }
  assert.deepEqual([...seen].sort(), [...GATE_2027_TOPIC_IDS].sort());
});

test('deriveTopicWeights keeps the full completed syllabus eligible and weights weaker attempts higher', () => {
  const questions = [
    { bookId: 'book', chapterId: 'weak-chapter', topics: ['research-methods-statistics'] },
    { bookId: 'book', chapterId: 'strong-chapter', topics: ['social'] },
  ];
  const weights = deriveTopicWeights([
    { book_id: 'book', chapter_id: 'weak-chapter', attempted: 20, correct: 8 },
    { book_id: 'book', chapter_id: 'strong-chapter', attempted: 20, correct: 18 },
  ], questions);
  assert.deepEqual(Object.keys(weights).sort(), [...GATE_2027_TOPIC_IDS].sort());
  assert.equal(weights['research-methods-statistics'] > weights.social, true);
  assert.equal(weights.applications, 1);
});

test('deriveTopicWeights maps real chapter attempts through the playable question bank', () => {
  const weights = deriveTopicWeights([
    { book_id: '500q', chapter_id: '500q-2', attempted: 23, correct: 17 },
  ]);
  assert.equal(Object.keys(weights).length > 0, true);
  assert.equal(weights['research-methods-statistics'] > 0, true);
});

test('generateDailyTelegramMock builds ten fresh PYQ-profiled XH-C5 MSQs only', () => {
  assert.equal(XH_C5_DAILY_MSQ_BANK_VERSION, 8);
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

test('Sphinx long-run selection matches the official two-mark MSQ proportion', () => {
  const topicWeights = Object.fromEntries([
    'research-methods-statistics', 'psychometrics', 'biological-evolutionary',
    'perception-learning-memory', 'cognition', 'personality',
    'motivation-emotion-stress', 'social', 'development',
    'clinical-organizational', 'applications',
  ].map((topic) => [topic, 1]));
  let seed = 20261010;
  const rng = () => ((seed = ((seed * 1664525) + 1013904223) >>> 0) / 4294967296);
  let twoMark = 0;
  let total = 0;
  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const mock = generateDailyTelegramMock(topicWeights, [], rng, attempt % 5);
    twoMark += mock.filter((question) => question.marks === 2).length;
    total += mock.length;
  }
  const share = twoMark / total;
  assert.equal(share >= 0.82 && share <= 0.92, true, `two-mark share ${share}`);
});

test('Sphinx long-run selection matches the official negative-stem proportion', () => {
  const topicWeights = Object.fromEntries([
    'research-methods-statistics', 'psychometrics', 'biological-evolutionary',
    'perception-learning-memory', 'cognition', 'personality',
    'motivation-emotion-stress', 'social', 'development',
    'clinical-organizational', 'applications',
  ].map((topic) => [topic, 1]));
  let seed = 20261011;
  const rng = () => ((seed = ((seed * 1664525) + 1013904223) >>> 0) / 4294967296);
  let negative = 0;
  let total = 0;
  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const mock = generateDailyTelegramMock(topicWeights, [], rng, attempt % 5);
    negative += mock.filter((question) => /\b(NOT|EXCEPT|incorrect|false)\b/i.test(question.question)).length;
    total += mock.length;
  }
  const share = negative / total;
  assert.equal(share >= 0.12 && share <= 0.24, true, `negative-stem share ${share}`);
});

test('Sphinx long-run answer cardinalities stay close to the official MSQ profile', () => {
  const topicWeights = Object.fromEntries([
    'research-methods-statistics', 'psychometrics', 'biological-evolutionary',
    'perception-learning-memory', 'cognition', 'personality',
    'motivation-emotion-stress', 'social', 'development',
    'clinical-organizational', 'applications',
  ].map((topic) => [topic, 1]));
  let seed = 20261013;
  const rng = () => ((seed = ((seed * 1664525) + 1013904223) >>> 0) / 4294967296);
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
  let total = 0;
  for (let attempt = 0; attempt < 1000; attempt += 1) {
    for (const question of generateDailyTelegramMock(topicWeights, [], rng, attempt % 5)) {
      counts[question.answers.length] += 1;
      total += 1;
    }
  }
  const shares = Object.fromEntries(Object.entries(counts).map(([key, value]) => [key, value / total]));
  assert.equal(shares[1] >= 0.03 && shares[1] <= 0.09, true, `one-correct share ${shares[1]}`);
  assert.equal(shares[2] >= 0.48 && shares[2] <= 0.61, true, `two-correct share ${shares[2]}`);
  assert.equal(shares[3] >= 0.32 && shares[3] <= 0.45, true, `three-correct share ${shares[3]}`);
  assert.equal(shares[4] <= 0.02, true, `four-correct share ${shares[4]}`);
});

test('Sphinx includes a substantial reviewed hard tier in every long-run cycle mix', () => {
  const topicWeights = Object.fromEntries([
    'research-methods-statistics', 'psychometrics', 'biological-evolutionary',
    'perception-learning-memory', 'cognition', 'personality',
    'motivation-emotion-stress', 'social', 'development',
    'clinical-organizational', 'applications',
  ].map((topic) => [topic, 1]));
  let seed = 20261012;
  const rng = () => ((seed = ((seed * 1664525) + 1013904223) >>> 0) / 4294967296);
  const byCycle = Array.from({ length: 5 }, () => ({ hard: 0, total: 0 }));
  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const cycleIndex = attempt % 5;
    const mock = generateDailyTelegramMock(topicWeights, [], rng, cycleIndex);
    byCycle[cycleIndex].hard += mock.filter((question) => question.challengeLevel === 'gate-hard-v1').length;
    byCycle[cycleIndex].total += mock.length;
  }
  for (let cycleIndex = 0; cycleIndex < byCycle.length; cycleIndex += 1) {
    const share = byCycle[cycleIndex].hard / byCycle[cycleIndex].total;
    assert.equal(share >= 0.30, true, `cycle ${cycleIndex} hard-tier share ${share}`);
  }
});

test('Sphinx preserves the PYQ profile across a realistic recent-question exclusion history', () => {
  const topicWeights = Object.fromEntries([
    'research-methods-statistics', 'psychometrics', 'biological-evolutionary',
    'perception-learning-memory', 'cognition', 'personality',
    'motivation-emotion-stress', 'social', 'development',
    'clinical-organizational', 'applications',
  ].map((topic) => [topic, 1]));
  let seed = 20261014;
  const rng = () => ((seed = ((seed * 1664525) + 1013904223) >>> 0) / 4294967296);
  const recentMocks = [];
  const counts = { total: 0, repeated: 0, twoMark: 0, negative: 0, hard: 0, cardinality: { 1: 0, 2: 0, 3: 0, 4: 0 } };
  for (let attempt = 0; attempt < 15; attempt += 1) {
    const usedIds = recentMocks.flat();
    const mock = generateDailyTelegramMock(topicWeights, usedIds, rng, attempt % 5);
    counts.repeated += mock.filter((question) => usedIds.includes(question.id)).length;
    recentMocks.push(mock.map((question) => question.id));
    if (recentMocks.length > 5) recentMocks.shift();
    for (const question of mock) {
      counts.total += 1;
      counts.twoMark += question.marks === 2;
      counts.negative += /\b(NOT|EXCEPT|incorrect|false)\b/i.test(question.question);
      counts.hard += question.challengeLevel === 'gate-hard-v1';
      counts.cardinality[question.answers.length] += 1;
    }
  }
  const twoMarkShare = counts.twoMark / counts.total;
  const negativeShare = counts.negative / counts.total;
  const hardShare = counts.hard / counts.total;
  const fourCorrectShare = counts.cardinality[4] / counts.total;
  const repeatedShare = counts.repeated / counts.total;
  assert.equal(repeatedShare <= 0.15, true, `recent-question repeat share ${repeatedShare}`);
  assert.equal(twoMarkShare >= 0.82 && twoMarkShare <= 0.92, true, `two-mark share ${twoMarkShare}`);
  assert.equal(negativeShare >= 0.08 && negativeShare <= 0.24, true, `negative-stem share ${negativeShare}`);
  assert.equal(hardShare >= 0.30, true, `hard-tier share ${hardShare}`);
  assert.equal(fourCorrectShare <= 0.03, true, `four-correct share ${fourCorrectShare}`);
});

test('Sphinx advances to the next four MSQ types on each India-date mock', () => {
  assert.equal(msqCycleIndexForDate('2026-10-08'), 0);
  assert.equal(msqCycleIndexForDate('2026-10-09'), 1);
  assert.equal(msqCycleIndexForDate('2026-10-12'), 4);
  assert.equal(msqCycleIndexForDate('2026-10-13'), 0);
  assert.throws(() => msqCycleIndexForDate('2026-02-31'), /valid calendar date/);
});

test('Sphinx substitutes fresh structures before relaxing old-question exclusions', () => {
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
    assert.equal(new Set(mock.map((q) => q.id)).size, 10);
    assert.equal(new Set(mock.map((q) => q.msqType)).size >= 4, true);
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
