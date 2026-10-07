import { weightedPick } from './telegramMockCore.js';

export const XH_C5_MSQ_CARDINALITY_WEIGHTS = { 1: 6, 2: 56, 3: 40, 4: 1 };

const GIVEAWAY_WORDING = /\b(always|never|all|only|merely|automatically|guarantees?|proves?|logically impossible|must|cannot|every|none|necessarily|by definition|regardless|entirely)\b/i;

function wordCount(value) {
  return String(value || '').trim().split(/\s+/).filter(Boolean).length;
}

export function gateMsqChallengeScore(question) {
  const options = Object.values(question?.options || {});
  if (options.length !== 4) return 0;
  const lengths = options.map(wordCount);
  const cueCount = options.filter((option) => GIVEAWAY_WORDING.test(option)).length;
  const shortest = Math.max(1, Math.min(...lengths));
  const longest = Math.max(...lengths);
  const lengthRatioPenalty = Math.max(0, (longest / shortest) - 1.6) * 12;
  const shortOptionPenalty = lengths.filter((length) => length < 7).length * 5;
  const authoredDifficultyBonus = question.challengeLevel === 'gate-hard-v1' ? 60 : 0;
  return Math.max(0, Math.round(100 + authoredDifficultyBonus - (cueCount * 18) - lengthRatioPenalty - shortOptionPenalty));
}

export function correctOptionCountFor(rng = Math.random) {
  const total = Object.values(XH_C5_MSQ_CARDINALITY_WEIGHTS).reduce((sum, value) => sum + value, 0);
  const threshold = rng() * total;
  let cumulative = 0;
  for (const count of [1, 2, 3, 4]) {
    cumulative += XH_C5_MSQ_CARDINALITY_WEIGHTS[count];
    if (threshold < cumulative) return count;
  }
  return 4;
}

function validCandidate(question, eligibleTopics, excluded) {
  return question?.type === 'MSQ'
    && eligibleTopics.has(question.topic)
    && !excluded.has(question.id)
    && Array.isArray(question.answers)
    && question.answers.length >= 1
    && question.answers.length <= 4;
}

function nearestAvailableCount(pool, desired) {
  return [1, 2, 3, 4]
    .filter((count) => pool.some((question) => question.answers.length === count))
    .sort((left, right) => Math.abs(left - desired) - Math.abs(right - desired) || left - right)[0];
}

export function selectDailyXhC5Msqs({ candidates, topicWeights, excludedIds = [], size = 10, rng = Math.random }) {
  const excluded = new Set(excludedIds);
  const eligibleTopics = new Set(Object.entries(topicWeights || {})
    .filter(([, weight]) => Number(weight) > 0)
    .map(([topic]) => topic));
  const pool = candidates.filter((question) => validCandidate(question, eligibleTopics, excluded));
  if (pool.length < size) throw new Error(`Not enough fresh covered-topic MSQs: need ${size}, found ${pool.length}`);

  const picked = [];
  const fallbacks = [];
  while (picked.length < size) {
    const desired = correctOptionCountFor(rng);
    const count = nearestAvailableCount(pool, desired);
    const matchingCount = pool.filter((question) => question.answers.length === count);
    const topicMax = new Map();
    for (const question of matchingCount) {
      topicMax.set(question.topic, Math.max(topicMax.get(question.topic) ?? -Infinity, gateMsqChallengeScore(question)));
    }
    const options = matchingCount.filter((question) => (
      gateMsqChallengeScore(question) >= topicMax.get(question.topic) - 12
    ));
    const chosen = options[weightedPick(options, topicWeights, rng)];
    pool.splice(pool.findIndex((question) => question.id === chosen.id), 1);
    picked.push(chosen);
    if (count !== desired) fallbacks.push({ questionId: chosen.id, desired, selected: count });
  }
  if (process.env.NODE_ENV !== 'production' && fallbacks.length) {
    Object.defineProperty(picked, 'fallbacks', { value: fallbacks, enumerable: false });
  }
  return picked;
}
