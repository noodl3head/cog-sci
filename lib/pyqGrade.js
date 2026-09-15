const NAT_EPS = 1e-9;

function sameSet(left, right) {
  if (left.length !== right.length) return false;
  const sortedLeft = [...left].sort();
  const sortedRight = [...right].sort();
  return sortedLeft.every((value, index) => value === sortedRight[index]);
}

export function isAnswered(question, answer) {
  if (answer === undefined || answer === null) return false;
  if (question.type === 'MCQ') return answer !== '';
  if (question.type === 'MSQ') return Array.isArray(answer) && answer.length > 0;
  if (question.type === 'NAT') return String(answer).trim() !== '';
  return false;
}

export function isCorrect(question, answer) {
  if (question.type === 'MCQ') {
    if (question.mta) return true;
    if (question.acceptedAnswers) return question.acceptedAnswers.includes(answer);
    return answer === question.answer;
  }
  if (question.type === 'MSQ') {
    const selected = Array.isArray(answer) ? answer : [];
    const acceptedSets = question.acceptedSets || [question.answers];
    return acceptedSets.some((set) => sameSet(selected, set));
  }
  if (question.type === 'NAT') {
    const value = Number(String(answer).replace(/,/g, '').trim());
    if (!Number.isFinite(value)) return false;
    const [low, high] = question.range;
    return value >= low - NAT_EPS && value <= high + NAT_EPS;
  }
  return false;
}

export function gradeQuestion(question, answer) {
  if (question.type === 'MCQ' && question.mta) {
    return { status: 'correct', positive: question.marks, negative: 0 };
  }
  if (!isAnswered(question, answer)) {
    return { status: 'skipped', positive: 0, negative: 0 };
  }
  if (isCorrect(question, answer)) {
    return { status: 'correct', positive: question.marks, negative: 0 };
  }
  return {
    status: 'wrong',
    positive: 0,
    negative: question.type === 'MCQ' ? question.marks / 3 : 0,
  };
}
