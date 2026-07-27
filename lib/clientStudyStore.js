const HISTORY_KEY = 'gate_mock_attempt_history_v1';
const REVISION_KEY = 'gate_revision_list_v1';
const LATEST_SHEET_KEY = 'gate_latest_revision_sheet_v1';
const PROGRESS_PREFIX = 'gate_mock_progress_v1:';

function readJson(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const value = JSON.parse(window.localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function mockProgressKey(mockId, topicKey = '') {
  return `${PROGRESS_PREFIX}${mockId}:${topicKey || 'all'}`;
}

export function loadMockProgress(mockId, topicKey) {
  return readJson(mockProgressKey(mockId, topicKey), null);
}

export function saveMockProgress(mockId, topicKey, progress) {
  writeJson(mockProgressKey(mockId, topicKey), progress);
}

export function clearMockProgress(mockId, topicKey) {
  if (typeof window !== 'undefined') window.localStorage.removeItem(mockProgressKey(mockId, topicKey));
}

export function listMockProgress() {
  if (typeof window === 'undefined') return [];
  const progress = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key?.startsWith(PROGRESS_PREFIX)) continue;
    const value = readJson(key, null);
    if (value) progress.push({ key, ...value });
  }
  return progress.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
}

export function getMockHistory() {
  return readJson(HISTORY_KEY, []);
}

export function addMockHistory(attempt) {
  const history = getMockHistory().filter((item) => item.id !== attempt.id);
  const next = [attempt, ...history];
  if (!writeJson(HISTORY_KEY, next.slice(0, 60))) writeJson(HISTORY_KEY, next.slice(0, 20));
}

export function getRevisionList() {
  return readJson(REVISION_KEY, []);
}

export function addRevisionItem(item) {
  const current = getRevisionList();
  const next = [item, ...current.filter((entry) => entry.questionId !== item.questionId)];
  writeJson(REVISION_KEY, next);
  return next;
}

export function removeRevisionItem(questionId) {
  const next = getRevisionList().filter((item) => item.questionId !== questionId);
  writeJson(REVISION_KEY, next);
  return next;
}

export function setLatestRevisionSheet(items, title) {
  writeJson(LATEST_SHEET_KEY, { title, createdAt: new Date().toISOString(), items });
}

export function getLatestRevisionSheet() {
  return readJson(LATEST_SHEET_KEY, { title: 'Latest incorrect questions', items: [] });
}
