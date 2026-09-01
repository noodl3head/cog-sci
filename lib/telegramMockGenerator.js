import { getAllPlayableQuestions } from './mockGenerator.js';
import { GATE_STYLE_MOCK_QUESTIONS } from './mockQuestionBank.js';
import { selectDailyQuestions } from './telegramMockCore.js';
import { generateTelegramNatVariants, TELEGRAM_NAT_QUESTIONS } from './telegramMockQuestionBank.js';

const LETTERS = ['A', 'B', 'C', 'D'];

function shuffle(values, rng) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(rng() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function clean(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalizeSourceQuestion(raw, rng) {
  const correctText = clean(raw.options[raw.answer]);
  const distractors = Object.entries(raw.options)
    .filter(([letter, text]) => letter !== raw.answer && clean(text))
    .map(([, text]) => clean(text));
  const arranged = shuffle([
    { text: correctText, correct: true },
    ...shuffle(distractors, rng).slice(0, 3).map((text) => ({ text, correct: false })),
  ], rng);
  let answer = 'A';
  const options = {};
  arranged.forEach((option, index) => {
    const letter = LETTERS[index];
    options[letter] = option.text;
    if (option.correct) answer = letter;
  });
  return {
    id: raw.id,
    type: 'MCQ',
    marks: raw.applied ? 2 : 1,
    topic: raw.topic,
    question: clean(raw.question),
    options,
    answer,
    explanation: clean(raw.explanation),
    syllabusLeaf: raw.syllabusLeaf || null,
    sourceName: raw.bookName || 'Source question bank',
  };
}

function normalizeOriginalQuestion(raw) {
  return {
    ...raw,
    question: clean(raw.question),
    options: raw.options
      ? Object.fromEntries(Object.entries(raw.options).map(([letter, text]) => [letter, clean(text)]))
      : null,
    explanation: clean(raw.explanation),
    sourceName: raw.sourceName || 'Original GATE-style mock bank',
  };
}

export function deriveTopicWeights(chapterRows = [], sourceQuestions = getAllPlayableQuestions()) {
  const byChapter = new Map();
  for (const question of sourceQuestions) {
    const key = `${question.bookId}::${question.chapterId}`;
    if (!byChapter.has(key)) byChapter.set(key, new Set());
    for (const topic of question.topics || [question.topic]) {
      if (topic) byChapter.get(key).add(topic);
    }
  }

  const weights = {};
  for (const row of chapterRows) {
    const bookId = row.book_id ?? row.bookId;
    const chapterId = row.chapter_id ?? row.chapterId;
    const attempted = Number(row.attempted || 0);
    if (!bookId || !chapterId || attempted <= 0) continue;
    const correct = Number(row.correct || 0);
    const errorRate = 1 - Math.min(1, Math.max(0, correct / attempted));
    const weight = 1 + (errorRate * 4) + Math.log1p(attempted);
    for (const topic of byChapter.get(`${bookId}::${chapterId}`) || []) {
      weights[topic] = Math.max(weights[topic] || 0, weight);
    }
  }
  return weights;
}

export function generateDailyTelegramMock(topicWeights, excludedIds = [], rng = Math.random) {
  const source = getAllPlayableQuestions().map((question) => normalizeSourceQuestion(question, rng));
  const original = GATE_STYLE_MOCK_QUESTIONS.map(normalizeOriginalQuestion);
  const numerical = [...TELEGRAM_NAT_QUESTIONS, ...generateTelegramNatVariants(rng)].map(normalizeOriginalQuestion);
  const selected = selectDailyQuestions({
    candidates: [...source, ...original, ...numerical],
    topicWeights,
    excludedIds,
    size: 10,
    rng,
  });
  return shuffle(selected, rng);
}
