import { PYQ_PAPERS } from '../lib/pyqData.js';
import { summarizeXhC5Msqs, xhC5MsqRows } from '../lib/xhC5MsqProfile.js';

const profile = summarizeXhC5Msqs(PYQ_PAPERS);
const questions = xhC5MsqRows(PYQ_PAPERS).map(({ year, question }) => ({
  year,
  num: question.num,
  marks: question.marks,
  correctOptionCount: question.answers.length,
  stem: question.question,
  options: question.options,
}));

console.log(JSON.stringify({ profile, questions }, null, 2));
