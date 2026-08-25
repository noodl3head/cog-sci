// Lightweight spaced-repetition scheduler for missed chapter questions.
// Items are keyed "bookId::chapterId::questionNumber" and scheduled with a
// simple expanding interval: 1d → 3d → 7d → 14d → 30d.
//
// Storage shape (localStorage 'srs_queue'):
// { "500q::500q-1::3": { due: 1690000000000, intervalDays: 3, stage: 1, misses: 2 } }

const KEY = 'srs_queue';
export const STAGE_DAYS = [1, 3, 7, 14, 30];

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
function save(map) {
  try { localStorage.setItem(KEY, JSON.stringify(map)); } catch {}
}

export function keyFor(bookId, chapterId, questionNumber) {
  return `${bookId}::${chapterId}::${questionNumber}`;
}

// Record an answer. wrong=true schedules/resets; wrong=false advances the stage.
export function review(bookId, chapterId, questionNumber, wrong) {
  const map = load();
  const k = keyFor(bookId, chapterId, questionNumber);
  const cur = map[k];
  if (wrong) {
    map[k] = { due: Date.now(), intervalDays: 0, stage: 0, misses: (cur?.misses || 0) + 1 };
  } else {
    const stage = Math.min((cur?.stage ?? -1) + 1, STAGE_DAYS.length - 1);
    const intervalDays = STAGE_DAYS[stage];
    map[k] = {
      due: Date.now() + intervalDays * 86400000,
      intervalDays,
      stage,
      misses: cur?.misses || 0,
    };
    // graduated: stop scheduling after the final interval
    if (cur?.stage === STAGE_DAYS.length - 1 && !wrong) delete map[k];
  }
  save(map);
}

export function dueItems(now = Date.now()) {
  const map = load();
  return Object.entries(map)
    .filter(([, v]) => v.due <= now)
    .map(([k, v]) => ({ key: k, ...v }))
    .sort((a, b) => a.due - b.due);
}

export function dueCount(now = Date.now()) {
  return dueItems(now).length;
}

export function removeItem(k) {
  const map = load();
  delete map[k];
  save(map);
}

// Parse "bookId::chapterId::questionNumber" back into parts.
export function parseKey(k) {
  const [bookId, chapterId, questionNumber] = k.split('::');
  return { bookId, chapterId, questionNumber: Number(questionNumber) };
}
