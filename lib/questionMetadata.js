import { GATE_2027_TOPIC_BY_ID } from './gateSyllabus.js';

function normalizedText(question) {
  return `${question.question || ''} ${question.explanation || ''}`.toLowerCase();
}

export function inferSyllabusLeaf(question, topicId) {
  const topic = GATE_2027_TOPIC_BY_ID[topicId];
  if (!topic?.leaves?.length) return { syllabusLeaf: null, syllabusLeafSource: 'unmapped' };

  const text = normalizedText(question);
  let bestLeaf = null;
  let bestScore = 0;
  for (const leaf of topic.leaves) {
    const score = leaf.keywords.reduce((total, keyword) => total + (text.includes(keyword) ? Math.max(1, keyword.split(' ').length) : 0), 0);
    if (score > bestScore) {
      bestLeaf = leaf;
      bestScore = score;
    }
  }

  return bestLeaf
    ? { syllabusLeaf: bestLeaf.id, syllabusLeafSource: 'inferred' }
    : { syllabusLeaf: topic.leaves[0].id, syllabusLeafSource: 'topic-fallback' };
}

function inferCognitiveLevel(question) {
  const text = String(question.question || '');
  if (/calculate|compute|data|results|design|most likely responsible|which conclusions|which statements/i.test(text)) return 'analysis';
  if (text.length >= 145 || /scenario|study|experiment|client|employee|student|participant/i.test(text)) return 'application';
  if (/define|called|known as|who|which theory/i.test(text)) return 'recall';
  return 'understanding';
}

function inferDifficulty(question) {
  if (question.difficulty) return question.difficulty;
  if (question.type === 'NAT' || question.marks === 2 && inferCognitiveLevel(question) === 'analysis') return 'hard';
  if (question.marks === 2 || inferCognitiveLevel(question) === 'application') return 'medium';
  return 'easy';
}

export function enrichQuestionMetadata(question, { topicId = question.topic, sourceType = 'imported-ap' } = {}) {
  const explicitLeaf = question.syllabusLeaf;
  const leaf = explicitLeaf
    ? { syllabusLeaf: explicitLeaf, syllabusLeafSource: 'explicit' }
    : inferSyllabusLeaf(question, topicId);

  return {
    ...question,
    topic: topicId,
    ...leaf,
    format: question.type || 'MCQ',
    difficulty: inferDifficulty(question),
    cognitiveLevel: question.cognitiveLevel || inferCognitiveLevel(question),
    sourceType: question.sourceType || sourceType,
    qualityStatus: question.qualityStatus || (sourceType === 'original-gate' ? 'reviewed' : 'screened'),
  };
}
