const LETTERS = ['A', 'B', 'C', 'D'];
function sameSet(left, right) { return Array.isArray(left) && Array.isArray(right) && left.length === right.length && [...left].sort().every((value, index) => value === [...right].sort()[index]); }
export function publicSession(session) {
  return { token: session.web_token, status: session.status, questions: (session.questions || []).map(({ id, type, marks, topic, question, options, sourceName }) => ({ id, type, marks, topic, question, options, sourceName })), responses: session.responses || {}, reasoning: session.reasoning || {}, currentIndex: session.current_index || 0, startedAt: session.started_at, completedAt: session.completed_at, webResult: session.web_result || null };
}
export function validateWebSubmission(questions, responses, reasoning) {
  const cleanResponses = {}; const cleanReasoning = {};
  questions.forEach((question, index) => {
    const selected = responses?.[index]; if (!Array.isArray(selected) || selected.some((letter) => !LETTERS.includes(letter))) throw new Error(`Invalid selections for question ${index + 1}`);
    cleanResponses[index] = [...new Set(selected)]; cleanReasoning[index] = {};
    for (const letter of LETTERS) { const value = String(reasoning?.[index]?.[letter] || '').trim(); if (!value || value.length > 1000) throw new Error(`Missing or oversized rationale for ${index + 1}${letter}`); cleanReasoning[index][letter] = value; }
  });
  return { responses: cleanResponses, reasoning: cleanReasoning };
}
export function gradeWebMsqSession(questions, responses, reasoning) {
  const rows = questions.map((question, index) => { const marksAwarded = sameSet(responses[index], question.answers) ? question.marks : 0; return { questionId: question.id, selected: responses[index], correct: question.answers, reasoning: reasoning[index], explanation: question.explanation, marksAwarded }; });
  const score = rows.reduce((sum, row) => sum + row.marksAwarded, 0); return { score, maxMarks: questions.reduce((sum, q) => sum + q.marks, 0), correctCount: rows.filter((r) => r.marksAwarded).length, rows };
}
