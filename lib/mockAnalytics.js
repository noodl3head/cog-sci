import { GATE_2027_LEAF_BY_ID, GATE_2027_TOPIC_BY_ID } from './gateSyllabus';

export function isQuestionAnswered(question, answer) {
  if (question.type === 'MSQ') return Array.isArray(answer) && answer.length > 0;
  return typeof answer === 'string' && answer.trim().length > 0;
}

export function isQuestionCorrect(question, answer) {
  if (!isQuestionAnswered(question, answer)) return false;
  if (question.type === 'MCQ') return answer === question.answer;
  if (question.type === 'NAT') {
    const numericAnswer = Number(answer);
    return Number.isFinite(numericAnswer) && Math.abs(numericAnswer - Number(question.answer)) <= (question.tolerance ?? 0);
  }
  const selected = [...answer].sort();
  const correct = [...question.answers].sort();
  return selected.length === correct.length && selected.every((letter, index) => letter === correct[index]);
}

export function correctAnswerKeys(question) {
  if (question.type === 'MSQ') return question.answers;
  return [question.answer];
}

export function formatQuestionAnswer(question, answer) {
  if (!isQuestionAnswered(question, answer)) return 'Not answered';
  if (question.type === 'NAT') return String(answer);
  const keys = Array.isArray(answer) ? answer : [answer];
  return keys.map((key) => `${key} - ${question.options?.[key] || ''}`.trim()).join('; ');
}

export function revisionItemFromQuestion(question, answer, attemptTitle = '') {
  const topic = GATE_2027_TOPIC_BY_ID[question.topic];
  const leaf = GATE_2027_LEAF_BY_ID[question.syllabusLeaf];
  const takeaway = String(question.explanation || '').split(/(?<=[.!?])\s+/)[0] || 'Review the keyed relationship and apply it to a new example.';
  return {
    questionId: question.id,
    question: question.question,
    context: question.context || null,
    type: question.type,
    marks: question.marks,
    options: question.options || null,
    userAnswer: formatQuestionAnswer(question, answer),
    correctAnswer: formatQuestionAnswer(question, question.type === 'MSQ' ? question.answers : String(question.answer)),
    explanation: question.explanation,
    takeaway,
    sourceName: question.sourceName || 'Original GATE-style mock bank',
    topic: question.topic,
    topicLabel: topic?.label || question.chapterTitle,
    section: topic?.section || '',
    syllabusLeaf: question.syllabusLeaf,
    concept: question.syllabusLeafSource === 'topic-fallback'
      ? (question.originalChapterTitle || question.chapterTitle)
      : (leaf?.label || question.originalChapterTitle || question.chapterTitle),
    attemptTitle,
    addedAt: new Date().toISOString(),
  };
}

export function buildAttemptRecord({ quiz, answers, answerHistory, result, mockId, title, timeSeconds }) {
  const questions = [...quiz.section1, ...quiz.section2];
  const topicMap = new Map();
  let answered = 0;
  let correct = 0;
  let changedCorrectToIncorrect = 0;
  const incorrectQuestions = [];

  questions.forEach((question, index) => {
    const answer = answers[index];
    const attempted = isQuestionAnswered(question, answer);
    const correctFinal = isQuestionCorrect(question, answer);
    if (attempted) answered += 1;
    if (correctFinal) correct += 1;
    if ((answerHistory[index] || []).some((pastAnswer) => isQuestionCorrect(question, pastAnswer)) && !correctFinal) {
      changedCorrectToIncorrect += 1;
    }

    const topic = GATE_2027_TOPIC_BY_ID[question.topic];
    const current = topicMap.get(question.topic) || {
      topic: question.topic,
      label: topic?.label || question.chapterTitle,
      total: 0, attempted: 0, correct: 0, wrong: 0, skipped: 0,
    };
    current.total += 1;
    if (!attempted) current.skipped += 1;
    else if (correctFinal) { current.attempted += 1; current.correct += 1; }
    else { current.attempted += 1; current.wrong += 1; }
    topicMap.set(question.topic, current);

    if (attempted && !correctFinal) incorrectQuestions.push(revisionItemFromQuestion(question, answer, title));
  });

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    mockId,
    title,
    createdAt: new Date().toISOString(),
    score: Number(result.total.toFixed(2)),
    positiveMarks: Number(result.positive.toFixed(2)),
    negativeMarks: Number(result.negative.toFixed(2)),
    timeSeconds,
    answered,
    correct,
    wrong: answered - correct,
    skipped: questions.length - answered,
    accuracy: answered ? Math.round((correct / answered) * 100) : 0,
    secondsPerAnswered: answered ? Math.round(timeSeconds / answered) : 0,
    changedCorrectToIncorrect,
    topicBreakdown: [...topicMap.values()],
    incorrectQuestions,
  };
}
