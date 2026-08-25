// Per-user overrides of the transcribed PYQ answer keys, stored in localStorage.
// The official keys were hand-transcribed (e.g. the 2021 A-skew), so this lets you
// correct any key you believe is wrong once you've solved a paper yourself.
//
// Storage shape: { "2021:3": { answer: "B", note: "verified against official key" }, ... }
// Overrides are honored by pyqScoring via applyOverrides() before grading.

const KEY = 'pyq_key_overrides';

export function loadOverrides() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveOverrides(map) {
  try { localStorage.setItem(KEY, JSON.stringify(map)); } catch {}
}

export function qid(paperId, num) {
  return `${paperId}:${num}`;
}

export function getOverride(paperId, num) {
  return loadOverrides()[qid(paperId, num)] || null;
}

// override = { answer } for MCQ/MSQ, or null to remove. MSQ accepts an array as `answers`.
export function setOverride(paperId, num, override) {
  const map = loadOverrides();
  if (override == null) delete map[qid(paperId, num)];
  else map[qid(paperId, num)] = { ...override, at: Date.now() };
  saveOverrides(map);
  return map;
}

export function removeOverride(paperId, num) {
  setOverride(paperId, num, null);
}

export function overrideCount(paperId) {
  const map = loadOverrides();
  return Object.keys(map).filter((k) => !paperId || k.startsWith(`${paperId}:`)).length;
}

// Returns a new questions array where each question carries its overridden key
// (answer / answers / range). Pass this into calcPyqResult so scoring uses YOUR key.
export function applyOverrides(questions, paperId) {
  const map = loadOverrides();
  return questions.map((q) => {
    const o = map[qid(paperId, q.num)];
    if (!o) return q;
    const next = { ...q };
    if (o.answer !== undefined && o.answer !== null) next.answer = o.answer;
    if (Array.isArray(o.answers)) next.answers = o.answers;
    // MCQ with a null stored key + override → also drop mta so it grades normally
    if (q.mta && o.answer) next.mta = false;
    next.overridden = true;
    return next;
  });
}
