import { weightedPick } from './telegramMockCore.js';
import { orderedMsqTypesForAvailableCycle } from './xhC5MsqTypes.js';

export const XH_C5_MSQ_CARDINALITY_WEIGHTS = { 1: 6, 2: 56, 3: 40, 4: 1 };
// Calibrated against delivered mocks: sparse archetype/topic pools create
// fallbacks, so raw official proportions cannot be copied directly here.
export const XH_C5_MSQ_MARK_WEIGHTS = { 1: 1, 2: 99 };
export const XH_C5_MSQ_NEGATIVE_WEIGHTS = { negative: 60, positive: 40 };
export const XH_C5_MSQ_HARD_WEIGHTS = { hard: 90, standard: 10 };

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
  const lengthRatioPenalty = Math.max(0, (longest / shortest) - 2.5) * 8;
  const verboseOptionPenalty = Math.max(0, (lengths.reduce((sum, length) => sum + length, 0) / lengths.length) - 16) * 2;
  return Math.max(0, Math.round(100 - (cueCount * 18) - lengthRatioPenalty - verboseOptionPenalty));
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

export function markFor(rng = Math.random) {
  const total = Object.values(XH_C5_MSQ_MARK_WEIGHTS).reduce((sum, value) => sum + value, 0);
  return rng() * total < XH_C5_MSQ_MARK_WEIGHTS[1] ? 1 : 2;
}

export function negativeStemFor(rng = Math.random) {
  const total = XH_C5_MSQ_NEGATIVE_WEIGHTS.negative + XH_C5_MSQ_NEGATIVE_WEIGHTS.positive;
  return rng() * total < XH_C5_MSQ_NEGATIVE_WEIGHTS.negative;
}

export function hardTierFor(rng = Math.random) {
  const total = XH_C5_MSQ_HARD_WEIGHTS.hard + XH_C5_MSQ_HARD_WEIGHTS.standard;
  return rng() * total < XH_C5_MSQ_HARD_WEIGHTS.hard;
}

function isNegativeStem(question) {
  return /\b(NOT|EXCEPT|incorrect|false)\b/i.test(String(question?.question || ''));
}

function profiledCandidate(candidatePool, {
  desiredCount,
  desiredHard,
  desiredMark,
  desiredNegative,
  excluded,
  topicWeights,
  rng,
}) {
  const scored = candidatePool.map((question) => ({
    question,
    penalty:
      (Math.abs(question.answers.length - desiredCount) * 120)
      + (question.answers.length === 4 && desiredCount !== 4 ? 50 : 0)
      + (question.marks === desiredMark ? 0 : 90)
      + ((question.challengeLevel === 'gate-hard-v1') === desiredHard ? 0 : 25)
      + (isNegativeStem(question) === desiredNegative ? 0 : 30)
      + (excluded.has(question.id) ? 6 : 0),
  }));
  const minimumPenalty = Math.min(...scored.map(({ penalty }) => penalty));
  const profileMatches = scored
    .filter(({ penalty }) => penalty === minimumPenalty)
    .map(({ question }) => question);
  const maximumChallenge = Math.max(...profileMatches.map(gateMsqChallengeScore));
  const challengeBand = profileMatches.filter((question) => (
    gateMsqChallengeScore(question) >= maximumChallenge - 12
  ));
  return challengeBand[weightedPick(challengeBand, topicWeights, rng)];
}

function validCandidate(question, eligibleTopics) {
  return question?.type === 'MSQ'
    && eligibleTopics.has(question.topic)
    && typeof question.msqType === 'string'
    && Array.isArray(question.answers)
    && question.answers.length >= 1
    && question.answers.length <= 4;
}

export function selectDailyXhC5Msqs({
  candidates,
  topicWeights,
  excludedIds = [],
  size = 10,
  cycleIndex = 0,
  rng = Math.random,
}) {
  const excluded = new Set(excludedIds);
  const eligibleTopics = new Set(Object.entries(topicWeights || {})
    .filter(([, weight]) => Number(weight) > 0)
    .map(([topic]) => topic));
  const coveredCandidates = candidates.filter((question) => validCandidate(question, eligibleTopics));
  const orderedTypes = orderedMsqTypesForAvailableCycle(
    cycleIndex,
    new Set(coveredCandidates.map((question) => question.msqType)),
  );
  const focusCount = Math.min(4, size);
  const focusTypeList = orderedTypes.slice(0, focusCount);
  if (focusTypeList.length < focusCount) {
    throw new Error(`At least ${focusCount} MSQ structures are required; found ${focusTypeList.length}`);
  }
  const activeTypeList = [...focusTypeList];
  while (
    coveredCandidates.filter((question) => activeTypeList.includes(question.msqType)).length < size
    && activeTypeList.length < orderedTypes.length
  ) {
    activeTypeList.push(orderedTypes[activeTypeList.length]);
  }
  const activeTypes = new Set(activeTypeList);
  const pool = coveredCandidates.filter((question) => activeTypes.has(question.msqType));
  if (pool.length < size) throw new Error(`Not enough fresh covered-topic MSQs: need ${size}, found ${pool.length}`);

  const picked = [];
  const fallbacks = [];
  const typeUsage = new Map(activeTypeList.map((type) => [type, 0]));

  function takeFrom(candidatePool) {
    const desired = correctOptionCountFor(rng);
    const desiredHard = hardTierFor(rng);
    const desiredMark = markFor(rng);
    const desiredNegative = negativeStemFor(rng);
    const chosen = profiledCandidate(candidatePool, {
      desiredCount: desired,
      desiredHard,
      desiredMark,
      desiredNegative,
      excluded,
      topicWeights,
      rng,
    });
    pool.splice(pool.findIndex((question) => question.id === chosen.id), 1);
    picked.push(chosen);
    typeUsage.set(chosen.msqType, (typeUsage.get(chosen.msqType) || 0) + 1);
    const reused = excluded.has(chosen.id);
    if (chosen.answers.length !== desired || reused) {
      fallbacks.push({ questionId: chosen.id, desired, selected: chosen.answers.length, reused });
    }
  }

  for (const msqType of focusTypeList) {
    if (picked.length >= size) break;
    const matchingType = pool.filter((question) => question.msqType === msqType);
    if (!matchingType.length) {
      throw new Error(`No covered-topic MSQ available for active type: ${msqType}`);
    }
    takeFrom(matchingType);
  }

  while (picked.length < size) {
    const availableTypes = activeTypeList.filter((type) => pool.some((question) => question.msqType === type));
    const minimumUsage = Math.min(...availableTypes.map((type) => typeUsage.get(type) || 0));
    const balancedTypes = new Set(availableTypes.filter((type) => (typeUsage.get(type) || 0) === minimumUsage));
    const balanced = pool.filter((question) => balancedTypes.has(question.msqType));
    takeFrom(balanced);
  }
  if (process.env.NODE_ENV !== 'production' && fallbacks.length) {
    Object.defineProperty(picked, 'fallbacks', { value: fallbacks, enumerable: false });
  }
  return picked;
}
