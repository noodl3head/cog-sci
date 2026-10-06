function numberOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function roundPercent(numerator, denominator) {
  if (!denominator) return null;
  return Math.round((numerator / denominator) * 1000) / 10;
}

function buildBreakdowns(questions, result) {
  const resultRows = new Map((result?.rows || []).map((row) => [row.questionId, row]));
  const formats = new Map();
  const topics = new Map();

  for (const question of questions || []) {
    const resultRow = resultRows.get(question.id);
    const marks = Number(question.marks) || 0;
    const awarded = Number(resultRow?.marksAwarded) || 0;
    const correct = resultRow ? awarded === marks : false;
    const entries = [
      [formats, question.type || 'Unknown'],
      [topics, question.topic || 'Unclassified'],
    ];

    for (const [collection, key] of entries) {
      const current = collection.get(key) || { total: 0, correct: 0, marks: 0, maxMarks: 0 };
      current.total += 1;
      current.correct += Number(correct);
      current.marks += awarded;
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
    date: String(session.mock_date),
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
