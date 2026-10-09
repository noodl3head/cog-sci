import { getAllPlayableQuestions } from './mockGenerator.js';
import { XH_C5_DAILY_MSQ_QUESTIONS } from './xhC5DailyMsqQuestionBank.js';
import { selectDailyXhC5Msqs } from './xhC5DailyMsqCore.js';

export const XH_C5_DAILY_MSQ_BANK_VERSION = 5;
const MSQ_TYPE_CYCLE_EPOCH = Date.UTC(2026, 9, 8);

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

export function msqCycleIndexForDate(mockDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(mockDate || ''))) {
    throw new Error('mockDate must use YYYY-MM-DD');
  }
  const [year, month, day] = mockDate.split('-').map(Number);
  const timestamp = Date.UTC(year, month - 1, day);
  const parsed = new Date(timestamp);
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) {
    throw new Error('mockDate must be a valid calendar date');
  }
  const elapsedDays = Math.floor((timestamp - MSQ_TYPE_CYCLE_EPOCH) / 86400000);
  return ((elapsedDays % 5) + 5) % 5;
}

export function generateDailyTelegramMock(topicWeights, excludedIds = [], rng = Math.random, cycleIndex = 0) {
  return selectDailyXhC5Msqs({
    candidates: XH_C5_DAILY_MSQ_QUESTIONS,
    topicWeights,
    excludedIds,
    size: 10,
    cycleIndex,
    rng,
  }).map((question) => ({ ...question, bankVersion: XH_C5_DAILY_MSQ_BANK_VERSION }));
}
