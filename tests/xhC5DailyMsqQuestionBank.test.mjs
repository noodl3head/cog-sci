import test from 'node:test';
import assert from 'node:assert/strict';
import { XH_C5_DAILY_MSQ_QUESTIONS } from '../lib/xhC5DailyMsqQuestionBank.js';
import { XH_C5_DAILY_MSQ_QUESTIONS as XH_C5_BASE_MSQS } from '../lib/xhC5DailyMsqQuestionBankData.js';
import { XH_C5_HARD_MSQ_PART_1 } from '../lib/xhC5HardMsqPart1.js';
import { XH_C5_HARD_MSQ_PART_2 } from '../lib/xhC5HardMsqPart2.js';
import { XH_C5_HARD_MSQ_PART_3 } from '../lib/xhC5HardMsqPart3.js';
import { XH_C5_HARD_MSQ_PART_4 } from '../lib/xhC5HardMsqPart4.js';
import { XH_C5_MSQ_ARCHETYPE_EXPANSION } from '../lib/xhC5MsqArchetypeExpansion.js';
import { XH_C5_PYQ_STYLE_OVERRIDES_BASE_1 } from '../lib/xhC5PyqStyleOverridesBase1.js';
import { XH_C5_PYQ_STYLE_OVERRIDES_BASE_2 } from '../lib/xhC5PyqStyleOverridesBase2.js';
import { XH_C5_PYQ_STYLE_OVERRIDES_BASE_3 } from '../lib/xhC5PyqStyleOverridesBase3.js';
import { XH_C5_PYQ_STYLE_OVERRIDES_BASE_4 } from '../lib/xhC5PyqStyleOverridesBase4.js';
import { XH_C5_PYQ_STYLE_OVERRIDES_BASE_5 } from '../lib/xhC5PyqStyleOverridesBase5.js';
import { XH_C5_PYQ_STYLE_OVERRIDES_HARD_1 } from '../lib/xhC5PyqStyleOverridesHard1.js';
import { XH_C5_PYQ_STYLE_OVERRIDES_HARD_2 } from '../lib/xhC5PyqStyleOverridesHard2.js';
import { XH_C5_PYQ_STYLE_OVERRIDES_HARD_3 } from '../lib/xhC5PyqStyleOverridesHard3.js';
import { XH_C5_PYQ_STYLE_OVERRIDES_HARD_4 } from '../lib/xhC5PyqStyleOverridesHard4.js';

function wordCount(value) {
  return String(value || '').match(/[A-Za-z0-9]+(?:['’.-][A-Za-z0-9]+)*/g)?.length || 0;
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

const ALL_STYLE_OVERRIDES = {
  ...XH_C5_PYQ_STYLE_OVERRIDES_BASE_1,
  ...XH_C5_PYQ_STYLE_OVERRIDES_BASE_2,
  ...XH_C5_PYQ_STYLE_OVERRIDES_BASE_3,
  ...XH_C5_PYQ_STYLE_OVERRIDES_BASE_4,
  ...XH_C5_PYQ_STYLE_OVERRIDES_BASE_5,
  ...XH_C5_PYQ_STYLE_OVERRIDES_HARD_1,
  ...XH_C5_PYQ_STYLE_OVERRIDES_HARD_2,
  ...XH_C5_PYQ_STYLE_OVERRIDES_HARD_3,
  ...XH_C5_PYQ_STYLE_OVERRIDES_HARD_4,
};

const SOURCE_QUESTIONS = [
  ...XH_C5_HARD_MSQ_PART_1,
  ...XH_C5_HARD_MSQ_PART_2,
  ...XH_C5_HARD_MSQ_PART_3,
  ...XH_C5_HARD_MSQ_PART_4,
  ...XH_C5_MSQ_ARCHETYPE_EXPANSION,
  ...XH_C5_BASE_MSQS,
];

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
    assert.doesNotMatch(
      `${q.question} ${Object.values(q.options).join(' ')}`,
      /all of the above|none of the above|permits a causal conclusion whenever|expert recognizes the label|guarantees that a finding will generalize/i,
    );
  }
});

test('authored MSQs match the concise vocabulary and presentation of XH-C5 PYQs', () => {
  const stemWords = XH_C5_DAILY_MSQ_QUESTIONS.map((q) => wordCount(q.question));
  const totalWords = XH_C5_DAILY_MSQ_QUESTIONS.map((q) => (
    wordCount(q.question) + Object.values(q.options).reduce((sum, option) => sum + wordCount(option), 0)
  ));
  const oneMarkTotals = totalWords.filter((_, index) => XH_C5_DAILY_MSQ_QUESTIONS[index].marks === 1);
  const twoMarkTotals = totalWords.filter((_, index) => XH_C5_DAILY_MSQ_QUESTIONS[index].marks === 2);
  const pyqOpeningCount = XH_C5_DAILY_MSQ_QUESTIONS.filter((q) => (
    /\bWhich (?:of the following|statement|statements|option|options|pair|pairs|factor|factors|feature|features|conclusion|conclusions|interpretation|interpretations|is|are)/i.test(q.question)
  )).length;
  const shortOptions = XH_C5_DAILY_MSQ_QUESTIONS.flatMap((q) => Object.values(q.options))
    .filter((option) => wordCount(option) <= 6).length;
  const academicFramingCount = XH_C5_DAILY_MSQ_QUESTIONS.reduce((count, q) => (
    count + ((`${q.question} ${Object.values(q.options).join(' ')}`.match(/\b(warranted|compatible|necessarily)\b/gi) || []).length)
  ), 0);

  assert.equal(mean(stemWords) <= 28, true, `mean stem length ${mean(stemWords).toFixed(1)}`);
  assert.equal(mean(totalWords) <= 72, true, `mean total length ${mean(totalWords).toFixed(1)}`);
  assert.equal(mean(oneMarkTotals) <= 62, true, `one-mark mean ${mean(oneMarkTotals).toFixed(1)}`);
  assert.equal(mean(twoMarkTotals) <= 80, true, `two-mark mean ${mean(twoMarkTotals).toFixed(1)}`);
  assert.equal(Math.max(...stemWords) <= 60, true, `longest stem ${Math.max(...stemWords)}`);
  assert.equal(pyqOpeningCount / XH_C5_DAILY_MSQ_QUESTIONS.length >= 0.45, true, `PYQ openings ${pyqOpeningCount}`);
  assert.equal(shortOptions / (XH_C5_DAILY_MSQ_QUESTIONS.length * 4) >= 0.12, true, `short options ${shortOptions}`);
  assert.equal(academicFramingCount <= 12, true, `academic framing count ${academicFramingCount}`);
});

test('authored MSQs do not expose incorrect options through isolated absolute wording', () => {
  const cue = /\b(always|never|only|merely|automatically|guarantees?|proves?|impossible|must|cannot|every|none|necessarily|regardless|entirely|sole)\b/i;
  const exposed = XH_C5_DAILY_MSQ_QUESTIONS.filter((question) => {
    const cued = Object.entries(question.options)
      .filter(([, option]) => cue.test(option))
      .map(([letter]) => letter);
    return cued.length === 1 && !question.answers.includes(cued[0]);
  });
  const share = exposed.length / XH_C5_DAILY_MSQ_QUESTIONS.length;
  assert.equal(share <= 0.05, true, `isolated giveaway share ${share}: ${exposed.map((q) => q.id).join(', ')}`);
});

test('PYQ-style overrides cover every delivered MSQ ID exactly once with no unknown entries', () => {
  const questionIds = XH_C5_DAILY_MSQ_QUESTIONS.map((question) => question.id).sort();
  const overrideIds = Object.keys(ALL_STYLE_OVERRIDES).sort();
  assert.equal(questionIds.length, 179);
  assert.equal(new Set(questionIds).size, questionIds.length);
  assert.equal(overrideIds.length, 179);
  assert.deepEqual(overrideIds, questionIds);
});

test('text and challenge overrides preserve source answers, marks, and topics', () => {
  const sourceById = new Map(SOURCE_QUESTIONS.map((question) => [question.id, question]));
  for (const question of XH_C5_DAILY_MSQ_QUESTIONS) {
    const source = sourceById.get(question.id);
    assert.ok(source, `missing source for ${question.id}`);
    assert.deepEqual(question.answers, source.answers, `${question.id} answers`);
    assert.equal(question.marks, source.marks, `${question.id} marks`);
    assert.equal(question.topic, source.topic, `${question.id} topic`);
  }
});

test('option-level explanation verdicts agree with every stored MSQ answer key', () => {
  for (const question of XH_C5_DAILY_MSQ_QUESTIONS) {
    for (const letter of ['A', 'B', 'C', 'D']) {
      const verdict = question.explanation.match(new RegExp(`(?:^|\\s)${letter}:\\s*(Correct|Incorrect)\\b`, 'i'))?.[1]?.toLowerCase();
      assert.ok(verdict, `${question.id} has no ${letter} explanation verdict`);
      assert.equal(verdict === 'correct', question.answers.includes(letter), `${question.id} option ${letter}`);
    }
  }
});

test('bank includes a substantial authored GATE-hard tier with close distractors', () => {
  const hard = XH_C5_DAILY_MSQ_QUESTIONS.filter((q) => q.challengeLevel === 'gate-hard-v1');
  assert.equal(hard.length, 52);
  assert.equal(new Set(hard.map((q) => q.id)).size, hard.length);
  assert.equal(new Set(hard.map((q) => q.topic)).size, 11);
  for (const q of hard) {
    assert.equal([2, 3, 4].includes(q.answers.length), true, q.id);
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
