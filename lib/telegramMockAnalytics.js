function numberOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function roundPercent(numerator, denominator) {
  if (!denominator) return null;
  return Math.round((numerator / denominator) * 1000) / 10;
}

function sessionDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString().slice(0, 10);
}

function buildBreakdowns(questions, result) {
  const graded = Boolean(result);
  const resultRows = new Map((result?.rows || []).map((row) => [row.questionId, row]));
  const formats = new Map();
  const topics = new Map();

  for (const question of questions || []) {
    const resultRow = resultRows.get(question.id);
    const marks = Number(question.marks) || 0;
    const awarded = graded ? (Number(resultRow?.marksAwarded) || 0) : null;
    const correct = graded ? awarded === marks : null;
    const entries = [
      [formats, question.type || 'Unknown'],
      [topics, question.topic || 'Unclassified'],
    ];

    for (const [collection, key] of entries) {
      const current = collection.get(key) || {
        total: 0,
        correct: graded ? 0 : null,
        marks: graded ? 0 : null,
        maxMarks: 0,
      };
      current.total += 1;
      if (graded) {
        current.correct += Number(correct);
        current.marks += awarded;
      }
      current.maxMarks += marks;
      collection.set(key, current);
    }
  }

  return {
    formatBreakdown: Object.fromEntries(formats),
    topicBreakdown: [...topics.entries()]
      .map(([topic, values]) => ({ topic, ...values }))
      .sort((left, right) => left.topic.localeCompare(right.topic)),
  };
}

function serializeAttempt(session) {
  const questions = session.questions || [];
  const result = session.web_result || session.result || null;
  const completed = session.status === 'completed' && result;
  const breakdowns = buildBreakdowns(questions, result);
  const score = completed ? numberOrNull(session.score ?? result.score) : null;
  const maxMarks = completed ? numberOrNull(session.max_marks ?? result.maxMarks) : null;
  const correct = completed ? Number(result.correctCount ?? 0) : null;

  return {
    date: sessionDate(session.mock_date),
    status: session.status,
    startedAt: session.started_at,
    completedAt: session.completed_at,
    score,
    maxMarks,
    scorePercentage: score !== null && maxMarks !== null ? roundPercent(score, maxMarks) : null,
    questions: questions.length,
    correct,
    accuracy: correct !== null ? roundPercent(correct, questions.length) : null,
    ...breakdowns,
  };
}

export function summarizeTelegramMockSessions(sessions) {
  const attempts = (sessions || []).map(serializeAttempt);
  const completed = attempts.filter((attempt) => attempt.status === 'completed' && attempt.maxMarks !== null);
  const score = completed.reduce((total, attempt) => total + attempt.score, 0);
  const maxMarks = completed.reduce((total, attempt) => total + attempt.maxMarks, 0);
  const questions = completed.reduce((total, attempt) => total + attempt.questions, 0);
  const correct = completed.reduce((total, attempt) => total + attempt.correct, 0);

  return {
    summary: {
      sessions: attempts.length,
      completed: completed.length,
      inProgress: attempts.filter((attempt) => attempt.status === 'in_progress').length,
      score,
      maxMarks,
      scorePercentage: roundPercent(score, maxMarks),
      questions,
      correct,
      accuracy: roundPercent(correct, questions),
    },
    attempts,
  };
}
