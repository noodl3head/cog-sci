function sameSet(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false;
  const a = [...left].sort();
  const b = [...right].sort();
  return a.every((value, index) => value === b[index]);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildQuestionMessage(question, index, total) {
  const marksLabel = Number(question.marks) === 1 ? '1 mark' : `${question.marks} marks`;
  const lines = [
    `<b>Question ${index + 1}/${total} · ${escapeHtml(question.type)} · ${marksLabel}</b>`,
    '',
    escapeHtml(question.question),
  ];
  if (question.options) {
    lines.push('', ...Object.entries(question.options).map(([letter, option]) => `${letter}. ${escapeHtml(option)}`));
  } else if (question.type === 'NAT') {
    lines.push('', '<i>Reply with a numerical answer.</i>');
  }
  if (question.type === 'MSQ') lines.push('', '<i>Select all that apply, then press Submit selections.</i>');
  return lines.join('\n');
}

function callbackButton(text, callbackData) {
  return { text, callback_data: callbackData };
}

export function buildQuestionKeyboard(question, { sessionId, questionIndex, selected = [] }) {
  const skip = callbackButton('Skip', `tm:skip:${sessionId}:${questionIndex}`);
  if (question.type === 'NAT') return { inline_keyboard: [[skip]] };
  const buttons = Object.keys(question.options || {}).map((letter) => {
    const label = question.type === 'MSQ' && selected.includes(letter) ? `✓ ${letter}` : letter;
    return callbackButton(label, `tm:q:${sessionId}:${questionIndex}:${letter}`);
  });
  const rows = [];
  for (let index = 0; index < buttons.length; index += 2) rows.push(buttons.slice(index, index + 2));
  if (question.type === 'MSQ') {
    rows.push([callbackButton('Submit selections', `tm:submit:${sessionId}:${questionIndex}`), skip]);
  } else {
    rows.push([skip]);
  }
  return { inline_keyboard: rows };
}

export function parseCallbackData(data) {
  const parts = String(data || '').split(':');
  if (parts[0] !== 'tm') return null;
  const action = parts[1];
  if (action === 'start' && parts.length === 3 && /^\d{4}-\d{2}-\d{2}$/.test(parts[2])) {
    return { action, mockDate: parts[2] };
  }
  if (!['q', 'submit', 'skip'].includes(action)) return null;
  const expectedLength = action === 'q' ? 5 : 4;
  if (parts.length !== expectedLength || !parts[2] || !/^\d+$/.test(parts[3])) return null;
  const result = { action, sessionId: parts[2], questionIndex: Number(parts[3]) };
  if (action === 'q') result.value = parts[4];
  return result;
}

function weightedPick(pool, topicWeights, rng) {
  const topicCounts = pool.reduce((counts, question) => {
    counts[question.topic] = (counts[question.topic] || 0) + 1;
    return counts;
  }, {});
  const weights = pool.map((question) => (
    Math.max(0.01, Number(topicWeights[question.topic]) || 0) / topicCounts[question.topic]
  ));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let cursor = rng() * total;
  for (let index = 0; index < pool.length; index += 1) {
    cursor -= weights[index];
    if (cursor <= 0) return index;
  }
  return pool.length - 1;
}

export function selectDailyQuestions({ candidates, topicWeights, excludedIds = [], size = 10, rng = Math.random }) {
  const excluded = new Set(excludedIds);
  const pool = candidates.filter((question) => topicWeights[question.topic] > 0 && !excluded.has(question.id));
  if (pool.length < size) throw new Error(`Not enough fresh covered-topic questions: need ${size}, found ${pool.length}`);

  const natTarget = Math.max(1, Math.round(size * 0.1));
  const msqTarget = Math.round(size * 0.4);
  const targets = { MCQ: size - natTarget - msqTarget, MSQ: msqTarget, NAT: natTarget };
  const picked = [];
  const distinctTopicCount = new Set(pool.map((question) => question.topic)).size;
  const maxPerTopic = Math.ceil(size / Math.min(4, distinctTopicCount));

  function underTopicCap(questions) {
    const counts = picked.reduce((result, question) => {
      result[question.topic] = (result[question.topic] || 0) + 1;
      return result;
    }, {});
    const capped = questions.filter((question) => (counts[question.topic] || 0) < maxPerTopic);
    return capped.length ? capped : questions;
  }

  function take(type) {
    const eligible = underTopicCap(pool.filter((question) => question.type === type));
    if (!eligible.length) return false;
    const localIndex = weightedPick(eligible, topicWeights, rng);
    const chosen = eligible[localIndex];
    pool.splice(pool.findIndex((question) => question.id === chosen.id), 1);
    picked.push(chosen);
    return true;
  }

  for (const type of ['MCQ', 'MSQ', 'NAT']) {
    for (let count = 0; count < targets[type]; count += 1) take(type);
  }
  while (picked.length < size && pool.length) {
    const eligible = underTopicCap(pool);
    const localIndex = weightedPick(eligible, topicWeights, rng);
    const chosen = eligible[localIndex];
    pool.splice(pool.findIndex((question) => question.id === chosen.id), 1);
    picked.push(chosen);
  }
  if (picked.length < size) throw new Error(`Not enough questions to build a ${size}-question mock`);
  return picked;
}

export function buildResultSummary(questions, responses = {}) {
  const rows = questions.map((question, index) => {
    const evaluation = scoreResponse(question, responses[index]);
    let correctAnswer = question.answer;
    if (question.type === 'MSQ') correctAnswer = (question.acceptedSets?.[0] || question.answers || []).join(', ');
    if (question.type === 'NAT' && question.range) correctAnswer = `${question.range[0]}–${question.range[1]}`;
    return {
      questionId: question.id,
      questionNumber: index + 1,
      type: question.type,
      response: responses[index] ?? null,
      correctAnswer,
      ...evaluation,
      explanation: question.explanation || '',
    };
  });
  const score = Math.round(rows.reduce((sum, row) => sum + row.marksAwarded, 0) * 100) / 100;
  const maxMarks = questions.reduce((sum, question) => sum + Number(question.marks || 0), 0);
  const correctCount = rows.filter((row) => row.correct).length;
  const details = rows.map((row) => [
    `<b>Q${row.questionNumber} · ${row.correct ? 'Correct' : 'Incorrect'} · ${Math.round(row.marksAwarded * 100) / 100} marks</b>`,
    `Correct: ${escapeHtml(row.correctAnswer)}`,
    escapeHtml(row.explanation),
  ].filter(Boolean).join('\n')).join('\n\n');
  return {
    score,
    maxMarks,
    correctCount,
    rows,
    text: `<b>Mock complete · ${score}/${maxMarks}</b>\n${correctCount}/${questions.length} questions correct\n\n${details}`,
  };
}

export function scoreResponse(question, response) {
  if (response == null || (Array.isArray(response) && response.length === 0)) {
    return { correct: false, marksAwarded: 0 };
  }
  if (question.type === 'MSQ') {
    const acceptedSets = question.acceptedSets || [question.answers || []];
    const correct = acceptedSets.some((set) => sameSet(response, set));
    return { correct, marksAwarded: correct ? question.marks : 0 };
  }

  if (question.type === 'NAT') {
    const numeric = Number(String(response).replace(/,/g, '').trim());
    const answer = Number(question.answer);
    const tolerance = Number(question.tolerance || 0);
    const range = question.range || [answer - tolerance, answer + tolerance];
    const correct = Number.isFinite(numeric) && numeric >= range[0] && numeric <= range[1];
    return { correct, marksAwarded: correct ? question.marks : 0 };
  }

  const acceptedAnswers = question.acceptedAnswers || [question.answer];
  const correct = acceptedAnswers.includes(response);
  return {
    correct,
    marksAwarded: correct ? question.marks : -(Number(question.marks) / 3),
  };
}
