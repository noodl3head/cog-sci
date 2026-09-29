export function summarizeXhC5Msqs(papers) {
  const rows = papers.flatMap((paper) => paper.questions
    .filter((question) => question.section === 'XH-C5' && question.type === 'MSQ')
    .map((question) => ({ year: Number(paper.year || paper.id), question })));

  const correctOptionCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
  const byYear = {};
  for (const { year, question } of rows) {
    correctOptionCounts[question.answers.length] += 1;
    byYear[year] = (byYear[year] || 0) + 1;
  }
  return { total: rows.length, correctOptionCounts, byYear };
}

export function xhC5MsqRows(papers) {
  return papers.flatMap((paper) => paper.questions
    .filter((question) => question.section === 'XH-C5' && question.type === 'MSQ')
    .map((question) => ({ year: Number(paper.year || paper.id), question })));
}
