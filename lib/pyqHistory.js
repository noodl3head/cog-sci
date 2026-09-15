function parseJsonValue(value, fallback) {
  if (value == null) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function parsePyqAttemptId(value) {
  if (!/^\d+$/.test(String(value))) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function normalizePyqAttempt(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    paperId: String(row.paper_id),
    positiveMarks: Number(row.positive_marks),
    negativeMarks: Number(row.negative_marks),
    totalMarks: Number(row.total_marks),
    timeSeconds: Number(row.time_seconds),
    gaNet: Number(row.ga_net),
    b1Net: Number(row.b1_net),
    c5Net: Number(row.c5_net),
    sections: parseJsonValue(row.sections, []),
    responses: parseJsonValue(row.responses, null),
    createdAt: row.created_at,
  };
}

export function responseMapForAttempt(attempt) {
  if (!Array.isArray(attempt?.responses)) return {};
  return Object.fromEntries(
    attempt.responses
      .filter((response) => response?.questionNumber != null)
      .map((response) => [response.questionNumber, response])
  );
}

function answerValues(answer) {
  if (answer == null || answer === '') return [];
  return (Array.isArray(answer) ? answer : [answer]).map(String);
}

function sameAnswerSet(left, right) {
  if (left.length !== right.length) return false;
  const sortedLeft = [...left].sort();
  const sortedRight = [...right].sort();
  return sortedLeft.every((value, index) => value === sortedRight[index]);
}

export function getPyqReviewAnswerState(question, response = {}) {
  const selected = answerValues(response.selectedAnswer);
  const marksToAll = response.marksToAll ?? Boolean(question?.mta);

  if (marksToAll) {
    return { selected, correct: [], correctLabel: 'Marks awarded to all', marksToAll: true };
  }

  if (question?.type === 'MSQ') {
    const rawSets = response.acceptedSets || question.acceptedSets;
    const acceptedSets = Array.isArray(rawSets) && rawSets.length
      ? rawSets.map((set) => answerValues(set))
      : [answerValues(response.correctAnswer ?? question.answers)];
    const matchedSet = response.status === 'correct'
      ? acceptedSets.find((set) => sameAnswerSet(set, selected))
      : null;
    const correct = matchedSet || acceptedSets[0] || [];
    return {
      selected,
      correct,
      correctLabel: acceptedSets.map((set) => set.join(', ')).join(' or '),
      marksToAll: false,
    };
  }

  if (question?.type === 'MCQ') {
    const correct = answerValues(
      response.acceptedAnswers || question.acceptedAnswers || (response.correctAnswer ?? question.answer)
    );
    return { selected, correct, correctLabel: correct.join(' or '), marksToAll: false };
  }

  const correct = answerValues(response.correctAnswer ?? question?.range ?? question?.answer);
  return { selected, correct, correctLabel: correct.join(' to '), marksToAll: false };
}
