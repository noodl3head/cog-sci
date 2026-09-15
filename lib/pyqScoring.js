// GATE XH-C5 marking rules, shared by the runner UI and (optionally) the API.
//
//  MCQ  : correct = +marks; wrong = −marks/3 (1mk → −1/3, 2mk → −2/3); skipped = 0.
//         "Marks To All" (mta) questions award full marks to everyone.
//  MSQ  : no negative marking, no partial credit. Full marks only if the chosen
//         set exactly matches the key (or any accepted key); otherwise 0.
//  NAT  : no negative marking. Full marks if the value falls in [lo, hi]; else 0.

import { PYQ_SECTIONS } from './pyqData.js';
import { gradeQuestion } from './pyqGrade.js';

export { gradeQuestion, isAnswered, isCorrect } from './pyqGrade.js';

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
