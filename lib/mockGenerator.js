import { QUIZ_DATA } from './quizData';
import { GATE_STYLE_MOCK_QUESTIONS, PRESET_CUSTOM_IDS } from './mockQuestionBank';
import { GATE_2027_TOPIC_BY_ID, GATE_2027_TOPIC_IDS } from './gateSyllabus';

export const MOCK_BLUEPRINT = {
  'research-methods-statistics': { one: 3, two: 2 },
  psychometrics: { one: 2, two: 1 },
  'biological-evolutionary': { one: 2, two: 2 },
  'perception-learning-memory': { one: 2, two: 2 },
  cognition: { one: 2, two: 1 },
  personality: { one: 1, two: 1 },
  'motivation-emotion-stress': { one: 2, two: 1 },
  social: { one: 2, two: 1 },
  development: { one: 1, two: 1 },
  'clinical-organizational': { one: 2, two: 2 },
  applications: { one: 1, two: 1 },
};

const PRESET_SEEDS = [0x4c2a3f1e, 0x7b8e9c20, 0x1d3a5f7e, 0x9c2b4a6d, 0x3e7f1b5c];
const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

// XOR-shift 32-bit seeded PRNG.
function seededRng(seed) {
  let s = (seed >>> 0) || 1;
  return () => {
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

function shuffle(arr, rng) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function cleanText(value = '') {
  return String(value)
    .replace(/â€™|â€˜/g, "'")
    .replace(/â€œ|â€/g, '"')
    .replace(/â€“|â€”/g, '-')
    .replace(/â€¦/g, '...')
    .replace(/Â/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function chapterTopics(chapterId, title, question) {
  const t = title.toLowerCase();
  const q = cleanText(question).toLowerCase();
  let primary = null;

  if (chapterId === 'kaplan-4') {
    const methodsTerms = /experiment|research|sample|sampling|correlat|variable|mean|median|mode|standard deviation|hypothesis|ethic|case stud|survey|observ|statistic|random assign|operational definition|confound/;
    if (methodsTerms.test(q)) primary = 'research-methods-statistics';
  }
  if (/research method/.test(t)) primary = 'research-methods-statistics';
  else if (/brain|neuroscience|biological/.test(t)) primary = 'biological-evolutionary';
  else if (/sensation|perception|consciousness|sleep|dream|drug|hypnosis|conditioning|learning|memory|remember|forget/.test(t)) primary = 'perception-learning-memory';
  else if (/intelligence|testing|thought|language|cognitive/.test(t)) primary = 'cognition';
  else if (/development|death and dying/.test(t)) primary = 'development';
  else if (/freudian|personality/.test(t)) primary = 'personality';
  else if (/motivation|emotion|stress|coping/.test(t)) primary = 'motivation-emotion-stress';
  else if (/social/.test(t)) primary = 'social';
  else if (/disorder|therap|clinical|schizophrenia/.test(t)) primary = 'clinical-organizational';

  if (/motivation, emotion, and personality/.test(t)) {
    primary = /trait|personality|freud|defense mechanism|id\b|ego\b|superego|big five|self-concept|locus of control|projective|rorschach|thematic apperception/i.test(q)
      ? 'personality'
      : 'motivation-emotion-stress';
  }

  const topics = primary ? [primary] : [];
  const psychometricsTerms = /psychometric|reliab|validity|standardiz|norm(?:s|ative)?\b|percentile|test score|item analysis|aptitude|achievement test|intelligence test|iq\b|wechsler|stanford-binet|assessment instrument|measurement scale|split-half|test-retest|criterion validity|construct validity/;
  if (/intelligence and testing/.test(t) || psychometricsTerms.test(q)) topics.push('psychometrics');

  const applicationTerms = /school|classroom|teacher|student|educational|counsel(?:l)?ing|guidance|employee|workplace|job performance|organization|personal space|crowding|territorial|mental health|wellbeing|well-being/;
  if (applicationTerms.test(q)) topics.push('applications');

  return [...new Set(topics)];
}

function isStandalone(question) {
  const q = cleanText(question);
  if (q.length < 18) return false;
  return !/\b(the passage|the graph|the figure|the table|the excerpt|the preceding|the previous question)\b/i.test(q)
    && !/\bKarl\b|\bGroups? [A-D] and [A-D]\b/.test(q);
}

function isApplied(question) {
  const q = cleanText(question);
  return q.length >= 145
    || /researcher|experiment|study|scenario|participant|student|client|employee|observed|data|results|following situation/i.test(q);
}

function questionKey(question) {
  return cleanText(question).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function hasOptionDependencies(options) {
  return Object.values(options).some((value) => {
    const text = cleanText(value);
    return /all of the above|none of the above|both\s+\(?[A-E]\)?\s+and\s+\(?[A-E]\)?|[A-E]\s+and\s+[A-E]\s+only|choices?\s+\(?[A-E]\)?/i.test(text);
  });
}

function sourceQuestions() {
  const seen = new Set();
  const out = [];

  for (const book of QUIZ_DATA.books) {
    for (const chapter of book.chapters) {
      chapter.questions.forEach((q, index) => {
        if (q.imageRequired || !q.options || !q.answer || !isStandalone(q.question)) return;
        const optionKeys = Object.keys(q.options).filter((key) => cleanText(q.options[key]));
        if (optionKeys.length < 4 || !optionKeys.includes(q.answer) || hasOptionDependencies(q.options)) return;

        const key = questionKey(q.question);
        if (!key || seen.has(key)) return;
        seen.add(key);

        const topics = chapterTopics(chapter.id, chapter.title, q.question);
        if (!topics.length) return;

        out.push({
          ...q,
          id: `${book.id}:${chapter.id}:${index + 1}`,
          question: cleanText(q.question),
          explanation: cleanText(q.explanation),
          topic: topics[0],
          topics,
          originalChapterTitle: chapter.title,
          bookId: book.id,
          bookName: book.name,
          applied: isApplied(q.question),
        });
      });
    }
  }
  return out;
}

const SOURCE_QUESTIONS = sourceQuestions();
const CUSTOM_BY_ID = new Map(GATE_STYLE_MOCK_QUESTIONS.map((q) => [q.id, q]));

function conciseExplanation(explanation, correctText) {
  const cleaned = cleanText(explanation)
    .replace(/\bChoice\s*\([A-E]\)/gi, 'This option')
    .replace(/\([A-E]\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return `Correct answer: ${correctText}. ${cleaned}`.trim();
}

function normalizeMcq(raw, marks, rng) {
  const correctText = cleanText(raw.options[raw.answer]);
  const distractors = Object.keys(raw.options)
    .filter((key) => key !== raw.answer)
    .map((key) => cleanText(raw.options[key]))
    .filter(Boolean);
  const selected = shuffle(distractors, rng).slice(0, 3).map((text) => ({ text, correct: false }));
  selected.push({ text: correctText, correct: true });
  const arranged = shuffle(selected, rng);
  const options = {};
  let answer = 'A';
  arranged.forEach((option, index) => {
    const letter = OPTION_LETTERS[index];
    options[letter] = option.text;
    if (option.correct) answer = letter;
  });

  return {
    id: raw.id,
    topic: raw.selectedTopic || raw.topic,
    type: 'MCQ',
    marks,
    question: raw.question,
    options,
    answer,
    explanation: conciseExplanation(raw.explanation, correctText),
    chapterTitle: GATE_2027_TOPIC_BY_ID[raw.selectedTopic || raw.topic].label,
    sourceName: raw.bookName,
  };
}

function normalizeCustom(raw) {
  return {
    ...raw,
    question: cleanText(raw.question),
    options: Object.fromEntries(Object.entries(raw.options).map(([k, v]) => [k, cleanText(v)])),
    explanation: cleanText(raw.explanation),
    chapterTitle: GATE_2027_TOPIC_BY_ID[raw.topic].label,
    sourceName: 'Original GATE-style mock bank',
  };
}

function takeCandidates({ topic, marks, count, rng, usedIds }) {
  if (count <= 0) return [];
  const available = SOURCE_QUESTIONS.filter((q) => q.topics.includes(topic) && !usedIds.has(q.id));
  const preferred = shuffle(available.filter((q) => marks === 2 ? q.applied : !q.applied), rng);
  const fallback = shuffle(available.filter((q) => !preferred.includes(q)), rng);
  const picked = [...preferred, ...fallback].slice(0, count);
  if (picked.length !== count) {
    throw new Error(`Insufficient unique ${topic} questions for ${marks}-mark mock slots`);
  }
  picked.forEach((q) => usedIds.add(q.id));
  return picked.map((q) => normalizeMcq({ ...q, selectedTopic: topic }, marks, rng));
}

function buildMock(rng, customIds, usedIds) {
  const selected = customIds.map((id) => {
    const question = CUSTOM_BY_ID.get(id);
    if (!question) throw new Error(`Unknown custom mock question: ${id}`);
    return normalizeCustom(question);
  });

  for (const [topic, quota] of Object.entries(MOCK_BLUEPRINT)) {
    for (const marks of [1, 2]) {
      const key = marks === 1 ? 'one' : 'two';
      const alreadySelected = selected.filter((q) => q.topic === topic && q.marks === marks).length;
      const needed = quota[key] - alreadySelected;
      if (needed < 0) throw new Error(`Custom questions exceed the ${topic} ${marks}-mark quota`);
      selected.push(...takeCandidates({ topic, marks, count: needed, rng, usedIds }));
    }
  }

  const section1 = shuffle(selected.filter((q) => q.marks === 1), rng);
  const section2 = shuffle(selected.filter((q) => q.marks === 2), rng);
  if (section1.length !== 20 || section2.length !== 15) {
    throw new Error(`Invalid mock shape: ${section1.length} one-mark and ${section2.length} two-mark questions`);
  }
  return { section1, section2 };
}

function buildPresetMocks() {
  const usedIds = new Set();
  return PRESET_SEEDS.map((seed, index) => buildMock(seededRng(seed), PRESET_CUSTOM_IDS[index], usedIds));
}

const PRESET_MOCKS = buildPresetMocks();

export function getAllPlayableQuestions() {
  return SOURCE_QUESTIONS.map((q) => ({ ...q }));
}

export function generatePresetMock(index) {
  return PRESET_MOCKS[index] || null;
}

export function generateRandomMock() {
  return generateTopicMock(GATE_2027_TOPIC_IDS);
}

export function generateTopicMock(topicIds = GATE_2027_TOPIC_IDS) {
  const selectedTopics = [...new Set(topicIds)].filter((topic) => GATE_2027_TOPIC_BY_ID[topic]);
  if (!selectedTopics.length) throw new Error('Select at least one GATE 2027 topic');
  const seed = Math.floor(Math.random() * 0xffffffff);
  const rng = seededRng(seed);
  const usedIds = new Set();
  const sections = { 1: [], 2: [] };

  for (const marks of [1, 2]) {
    const target = marks === 1 ? 20 : 15;
    const topicOrder = shuffle(selectedTopics, rng);
    for (let slot = 0; slot < target; slot++) {
      const preferredTopic = topicOrder[slot % topicOrder.length];
      const fallbackTopics = [preferredTopic, ...shuffle(selectedTopics.filter((topic) => topic !== preferredTopic), rng)];
      let picked = null;

      for (const topic of fallbackTopics) {
        const custom = shuffle(
          GATE_STYLE_MOCK_QUESTIONS.filter((q) => q.topic === topic && q.marks === marks && !usedIds.has(q.id)),
          rng,
        )[0];
        if (custom) {
          usedIds.add(custom.id);
          picked = normalizeCustom(custom);
          break;
        }

        const source = shuffle(
          SOURCE_QUESTIONS.filter((q) => q.topics.includes(topic) && !usedIds.has(q.id)),
          rng,
        ).sort((a, b) => Number(marks === 2 ? b.applied : !b.applied) - Number(marks === 2 ? a.applied : !a.applied))[0];
        if (source) {
          usedIds.add(source.id);
          picked = normalizeMcq({ ...source, selectedTopic: topic }, marks, rng);
          break;
        }
      }

      if (!picked) {
        throw new Error('The selected topics do not yet contain enough unique questions for a 35-question mock');
      }
      sections[marks].push(picked);
    }
  }

  return { section1: shuffle(sections[1], rng), section2: shuffle(sections[2], rng) };
}
