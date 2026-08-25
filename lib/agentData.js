function answered(question, answer) {
  if (answer === undefined || answer === null || answer === '') return false;
  if (question.type === 'MSQ') return Array.isArray(answer) && answer.length > 0;
  return String(answer).trim() !== '';
}

function sameSet(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  const left = [...a].sort();
  const right = [...b].sort();
  return left.every((value, index) => value === right[index]);
}

function correct(question, answer) {
  if (!answered(question, answer)) return false;
  if (question.mta) return true;
  if (question.type === 'MSQ') {
    const sets = question.acceptedSets || [question.answers || []];
    return sets.some((set) => sameSet(answer, set));
  }
  if (question.type === 'NAT') {
    const value = Number(String(answer).replace(/,/g, ''));
    const range = question.range || [Number(question.answer), Number(question.answer)];
    return Number.isFinite(value) && value >= range[0] && value <= range[1];
  }
  return question.acceptedAnswers
    ? question.acceptedAnswers.includes(answer)
    : answer === question.answer;
}

function correctKey(question) {
  if (question.type === 'MSQ') return question.acceptedSets?.[0] || question.answers || [];
  if (question.type === 'NAT') return question.range || [question.answer, question.answer];
  return question.answer ?? null;
}

export function serializeMockResponses(quiz, answers = {}, answerHistory = {}) {
  const section1 = (quiz?.section1 || []).map((question, index) => ({ question, index, section: 1, marks: 1 }));
  const section2 = (quiz?.section2 || []).map((question, offset) => ({ question, index: section1.length + offset, section: 2, marks: 2 }));
  return [...section1, ...section2].map(({ question, index, section, marks }) => {
    const selectedAnswer = answers[index] ?? null;
    const wasAnswered = answered(question, selectedAnswer);
    return {
      questionId: question.id || `mock-${section}-${index + 1}`,
      section,
      questionNumber: index + 1,
      type: question.type,
      marks,
      selectedAnswer,
      correctAnswer: correctKey(question),
      answered: wasAnswered,
      isCorrect: wasAnswered ? correct(question, selectedAnswer) : false,
      topic: question.topic || null,
      syllabusLeaf: question.syllabusLeaf || null,
      answerHistory: answerHistory[index] || [],
    };
  });
}

export function serializePyqResponses(paper, answers = {}) {
  return (paper?.questions || []).map((question) => {
    const selectedAnswer = answers[question.num] ?? null;
    const wasAnswered = answered(question, selectedAnswer);
    return {
      questionId: `${paper.id || 'pyq'}-${question.num}`,
      questionNumber: question.num,
      section: question.section,
      type: question.type,
      marks: question.marks,
      selectedAnswer,
      correctAnswer: correctKey(question),
      answered: wasAnswered,
      isCorrect: wasAnswered ? correct(question, selectedAnswer) : false,
      status: wasAnswered ? (correct(question, selectedAnswer) ? 'correct' : 'wrong') : 'skipped',
    };
  });
}

export function collectSyncEntries(storage) {
  const prefixes = ['gate_', 'quiz_progress_', 'pyq_', 'srs_queue'];
  const entries = [];
  if (!storage) return entries;
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key || !prefixes.some((prefix) => key.startsWith(prefix))) continue;
    try {
      entries.push({ key, value: JSON.parse(storage.getItem(key)) });
    } catch {
      // Ignore malformed or non-JSON local state.
    }
  }
  return entries.sort((a, b) => a.key.localeCompare(b.key));
}

export function rankWeaknesses(rows = []) {
  return rows
    .filter((row) => Number(row.attempted) > 0)
    .map((row) => ({
      ...row,
      attempted: Number(row.attempted),
      correct: Number(row.correct),
      wrong: Number(row.attempted) - Number(row.correct),
      accuracy: Math.round((Number(row.correct) / Number(row.attempted)) * 1000) / 10,
    }))
    .sort((a, b) => a.accuracy - b.accuracy || b.attempted - a.attempted);
}
