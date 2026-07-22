// GATE XH-C5 marking rules, shared by the runner UI and (optionally) the API.
//
//  MCQ  : correct = +marks; wrong = −marks/3 (1mk → −1/3, 2mk → −2/3); skipped = 0.
//         "Marks To All" (mta) questions award full marks to everyone.
//  MSQ  : no negative marking, no partial credit. Full marks only if the chosen
//         set exactly matches the key (or any accepted key); otherwise 0.
//  NAT  : no negative marking. Full marks if the value falls in [lo, hi]; else 0.

import { PYQ_SECTIONS } from './pyqData';

const NAT_EPS = 1e-9;

function sameSet(a, b) {
  if (a.length !== b.length) return false;
  const A = [...a].sort();
  const B = [...b].sort();
  return A.every((v, i) => v === B[i]);
}

// Has the user actually entered an answer for this question?
export function isAnswered(q, ans) {
  if (ans === undefined || ans === null) return false;
  if (q.type === 'MCQ') return ans !== '';
  if (q.type === 'MSQ') return Array.isArray(ans) && ans.length > 0;
  if (q.type === 'NAT') return String(ans).trim() !== '';
  return false;
}

// Is the given (answered) response correct? Assumes isAnswered() is true.
export function isCorrect(q, ans) {
  if (q.type === 'MCQ') {
    if (q.mta) return true;
    if (q.acceptedAnswers) return q.acceptedAnswers.includes(ans);
    return ans === q.answer;
  }
  if (q.type === 'MSQ') {
    const sel = Array.isArray(ans) ? ans : [];
    const sets = q.acceptedSets || [q.answers];
    return sets.some((s) => sameSet(sel, s));
  }
  if (q.type === 'NAT') {
    const v = parseFloat(String(ans).replace(/,/g, '').trim());
    if (Number.isNaN(v)) return false;
    const [lo, hi] = q.range;
    return v >= lo - NAT_EPS && v <= hi + NAT_EPS;
  }
  return false;
}

// Per-question grade: { status, positive, negative }
export function gradeQuestion(q, ans) {
  if (q.type === 'MCQ' && q.mta) {
    // Marks to all — everyone gets the marks regardless of what they picked.
    return { status: 'correct', positive: q.marks, negative: 0 };
  }
  if (!isAnswered(q, ans)) {
    return { status: 'skipped', positive: 0, negative: 0 };
  }
  if (isCorrect(q, ans)) {
    return { status: 'correct', positive: q.marks, negative: 0 };
  }
  // Wrong — negative only for MCQ.
  const negative = q.type === 'MCQ' ? q.marks / 3 : 0;
  return { status: 'wrong', positive: 0, negative };
}

// Full result: per-section breakdown + overall totals.
export function calcPyqResult(paper, answers) {
  const sections = {};
  for (const s of PYQ_SECTIONS) {
    sections[s.code] = {
      code: s.code, name: s.name,
      correct: 0, wrong: 0, skipped: 0,
      positive: 0, negative: 0, maxMarks: 0,
    };
  }

  let positive = 0, negative = 0;
  for (const q of paper.questions) {
    const g = gradeQuestion(q, answers[q.num]);
    const sec = sections[q.section];
    sec.maxMarks += q.marks;
    sec[g.status] += 1;
    sec.positive += g.positive;
    sec.negative += g.negative;
    positive += g.positive;
    negative += g.negative;
  }

  const round2 = (x) => Math.round(x * 100) / 100;
  for (const code in sections) {
    sections[code].positive = round2(sections[code].positive);
    sections[code].negative = round2(sections[code].negative);
    sections[code].net = round2(sections[code].positive - sections[code].negative);
  }

  return {
    sections: PYQ_SECTIONS.map((s) => sections[s.code]),
    positive: round2(positive),
    negative: round2(negative),
    total: round2(positive - negative),
    maxMarks: paper.totalMarks,
  };
}
