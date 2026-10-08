import { QUIZ_DATA } from './quizData.js';
import { GATE_STYLE_MOCK_QUESTIONS, PRESET_CUSTOM_IDS } from './mockQuestionBank.js';
import { GATE_2027_TOPIC_BY_ID, GATE_2027_TOPIC_IDS } from './gateSyllabus.js';
import { prepareQuestionForUse } from './questionQuality.js';
import { enrichQuestionMetadata, inferSyllabusLeaf } from './questionMetadata.js';
import { XH_C5_DAILY_MSQ_QUESTIONS } from './xhC5DailyMsqQuestionBank.js';
import { msqTypesForAvailableCycle } from './xhC5MsqTypes.js';

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
      chapter.questions.forEach((rawQuestion, index) => {
        const prepared = prepareQuestionForUse(rawQuestion, {
          bookId: book.id,
          chapterId: chapter.id,
          questionNumber: index + 1,
          previousQuestion: chapter.questions[index - 1] || null,
        });
        if (prepared.status !== 'playable') return;
        const q = prepared.question;
        const optionKeys = Object.keys(q.options).filter((key) => cleanText(q.options[key]));
        if (optionKeys.length < 4 || !optionKeys.includes(q.answer) || hasOptionDependencies(q.options)) return;

        const key = questionKey(q.question);
        if (!key || seen.has(key)) return;
        seen.add(key);

        const topics = chapterTopics(chapter.id, chapter.title, q.question);
        if (!topics.length) return;

        out.push(enrichQuestionMetadata({
          ...q,
          id: `${book.id}:${chapter.id}:${index + 1}`,
          question: cleanText(q.question),
          explanation: cleanText(q.explanation),
          topic: topics[0],
          topics,
          originalChapterTitle: chapter.title,
          bookId: book.id,
          chapterId: chapter.id,
          bookName: book.name,
          applied: isApplied(q.question),
        }, { topicId: topics[0], sourceType: 'imported-ap' }));
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
  const selectedTopic = raw.selectedTopic || raw.topic;
  const selectedLeaf = selectedTopic === raw.topic
    ? { syllabusLeaf: raw.syllabusLeaf, syllabusLeafSource: raw.syllabusLeafSource }
    : inferSyllabusLeaf(raw, selectedTopic);
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
    topic: selectedTopic,
    type: 'MCQ',
    marks,
    question: raw.question,
    options,
    answer,
    explanation: conciseExplanation(raw.explanation, correctText),
    chapterTitle: GATE_2027_TOPIC_BY_ID[selectedTopic].label,
    sourceName: raw.bookName,
    originalChapterTitle: raw.originalChapterTitle,
    context: raw.context || null,
    ...selectedLeaf,
    difficulty: raw.difficulty,
    cognitiveLevel: raw.cognitiveLevel,
    sourceType: raw.sourceType,
    qualityStatus: raw.qualityStatus,
  };
}

function normalizeCustom(raw) {
  return {
    ...raw,
    question: cleanText(raw.question),
    options: raw.options
      ? Object.fromEntries(Object.entries(raw.options).map(([k, v]) => [k, cleanText(v)]))
      : null,
    explanation: cleanText(raw.explanation),
    chapterTitle: GATE_2027_TOPIC_BY_ID[raw.topic].label,
    sourceName: raw.sourceName || 'Original GATE-style mock bank',
  };
}

function rotateMockMsqs(
  mock,
  cycleIndex,
  rng,
  excludedQuestionIds = [],
  allowedTopics = null,
  sharedUsedIds = null,
) {
  const allowedTopicSet = new Set(allowedTopics || [
    ...mock.section1.map((question) => question.topic),
    ...mock.section2.map((question) => question.topic),
  ]);
  const sections = {
    section1: [...mock.section1],
    section2: [...mock.section2],
  };
  const allSlots = Object.entries(sections).flatMap(([sectionName, questions]) =>
    questions.map((question, index) => ({
      sectionName,
      index,
      question,
      wasMsq: question.type === 'MSQ',
      key: `${sectionName}:${index}`,
    }))
  );
  const originalMsqSlots = allSlots.filter((slot) => slot.wasMsq);
  const softExcluded = new Set(excludedQuestionIds);
  const hardExcluded = sharedUsedIds instanceof Set ? sharedUsedIds : new Set();
  const slotShapes = new Set(allSlots.map((slot) => `${slot.question.topic}:${slot.question.marks}`));
  const availableTypes = new Set(XH_C5_DAILY_MSQ_QUESTIONS
    .filter((question) => (
      allowedTopicSet.has(question.topic)
      && slotShapes.has(`${question.topic}:${question.marks}`)
      && !hardExcluded.has(question.id)
    ))
    .map((question) => question.msqType));
  const activeTypes = msqTypesForAvailableCycle(cycleIndex, availableTypes);
  const activeTypeSet = new Set(activeTypes);
  const usedIds = new Set(allSlots
    .filter((slot) => !slot.wasMsq)
    .map((slot) => slot.question.id));
  const assignedSlots = new Set();
  const typeUsage = new Map(activeTypes.map((type) => [type, 0]));

  function msqCandidates(type, slot, freshOnly) {
    return XH_C5_DAILY_MSQ_QUESTIONS.filter((question) => (
      question.topic === slot.question.topic
      && allowedTopicSet.has(question.topic)
      && question.marks === slot.question.marks
      && question.msqType === type
      && !usedIds.has(question.id)
      && !hardExcluded.has(question.id)
      && (!freshOnly || !softExcluded.has(question.id))
    ));
  }

  function chooseMsq(type, slot) {
    const fresh = msqCandidates(type, slot, true);
    const available = fresh.length ? fresh : msqCandidates(type, slot, false);
    if (!available.length) return null;
    return shuffle(available, rng)
      .sort((left, right) => Number(right.challengeLevel === 'gate-hard-v1') - Number(left.challengeLevel === 'gate-hard-v1'))[0];
  }

  function placeMsq(type, slot) {
    const chosen = chooseMsq(type, slot);
    if (!chosen) return false;
    sections[slot.sectionName][slot.index] = normalizeCustom(chosen);
    assignedSlots.add(slot.key);
    usedIds.add(chosen.id);
    typeUsage.set(type, (typeUsage.get(type) || 0) + 1);
    return true;
  }

  for (const type of activeTypes) {
    const candidateSlots = shuffle(allSlots.filter((slot) => (
      !assignedSlots.has(slot.key) && msqCandidates(type, slot, false).length
    )), rng).sort((left, right) => Number(right.wasMsq) - Number(left.wasMsq));
    const slot = candidateSlots[0];
    if (!slot || !placeMsq(type, slot)) {
      throw new Error(`Selected topics cannot supply active MSQ type: ${type}`);
    }
  }

  function replacementMcq(slot) {
    const available = SOURCE_QUESTIONS.filter((question) => (
      question.topics.includes(slot.question.topic)
      && !usedIds.has(question.id)
      && !hardExcluded.has(question.id)
    ));
    const fresh = available.filter((question) => !softExcluded.has(question.id));
    const chosen = shuffle(fresh.length ? fresh : available, rng)[0];
    if (!chosen) throw new Error(`No replacement MCQ is available for ${slot.question.topic}`);
    usedIds.add(chosen.id);
    return normalizeMcq({ ...chosen, selectedTopic: slot.question.topic }, slot.question.marks, rng);
  }

  for (const slot of originalMsqSlots) {
    if (assignedSlots.has(slot.key)) continue;
    const availableTypes = activeTypes.filter((type) => msqCandidates(type, slot, false).length);
    if (!availableTypes.length) {
      sections[slot.sectionName][slot.index] = replacementMcq(slot);
      continue;
    }
    const minimumUsage = Math.min(...availableTypes.map((type) => typeUsage.get(type) || 0));
    const desiredType = availableTypes.find((type) => (typeUsage.get(type) || 0) === minimumUsage);
    placeMsq(desiredType, slot);
  }

  const finalQuestions = Object.values(sections).flat();
  const represented = new Set(finalQuestions
    .filter((question) => question.type === 'MSQ')
    .map((question) => question.msqType));
  if (activeTypes.some((type) => !represented.has(type))) {
    throw new Error('C5 mock could not represent every active MSQ structure');
  }
  if ([...represented].some((type) => !activeTypeSet.has(type))) {
    throw new Error('C5 mock contains an MSQ outside the active structure cycle');
  }
  if (finalQuestions.some((question) => !allowedTopicSet.has(question.topic))) {
    throw new Error('C5 mock rotation changed the selected topic scope');
  }
  if (new Set(finalQuestions.map((question) => question.id)).size !== finalQuestions.length) {
    throw new Error('C5 mock rotation produced duplicate question IDs');
  }
  if (sharedUsedIds instanceof Set) {
    finalQuestions.filter((question) => question.type === 'MSQ')
      .forEach((question) => sharedUsedIds.add(question.id));
  }
  return {
    ...sections,
    msqTypeCycleIndex: ((Number(cycleIndex) || 0) % 5 + 5) % 5,
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

function buildMock(rng, customIds, usedIds, cycleIndex = 0) {
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
  return rotateMockMsqs(
    { section1, section2 },
    cycleIndex,
    rng,
    [],
    Object.keys(MOCK_BLUEPRINT),
    usedIds,
  );
}

function buildPresetMocks() {
  const usedIds = new Set();
  return PRESET_SEEDS.map((seed, index) => buildMock(seededRng(seed), PRESET_CUSTOM_IDS[index], usedIds, index));
}

const PRESET_MOCKS = buildPresetMocks();

export function getAllPlayableQuestions() {
  return SOURCE_QUESTIONS.map((q) => ({ ...q }));
}

export function generatePresetMock(index) {
  return PRESET_MOCKS[index] || null;
}

export function generateRandomMock(excludedQuestionIds = [], msqCycleIndex = 0) {
  return generateTopicMock(GATE_2027_TOPIC_IDS, excludedQuestionIds, msqCycleIndex);
}

export function generateTopicMock(topicIds = GATE_2027_TOPIC_IDS, excludedQuestionIds = [], msqCycleIndex = 0) {
  const selectedTopics = [...new Set(topicIds)].filter((topic) => GATE_2027_TOPIC_BY_ID[topic]);
  if (!selectedTopics.length) throw new Error('Select at least one GATE 2027 topic');
  const seed = Math.floor(Math.random() * 0xffffffff);
  const rng = seededRng(seed);
  const usedIds = new Set();
  const recentlyUsedIds = new Set(excludedQuestionIds);
  const leafUsage = new Map();
  const sections = { 1: [], 2: [] };

  function chooseCandidate(candidates) {
    return shuffle(candidates, rng)
      .sort((a, b) => (leafUsage.get(a.syllabusLeaf) || 0) - (leafUsage.get(b.syllabusLeaf) || 0))[0];
  }

  function recordCandidate(question) {
    usedIds.add(question.id);
    if (question.syllabusLeaf) leafUsage.set(question.syllabusLeaf, (leafUsage.get(question.syllabusLeaf) || 0) + 1);
  }

  function findQuestion(marks, topicOrder, allowRecentlyUsed) {
    for (const topic of topicOrder) {
      const isAvailable = (question) => !usedIds.has(question.id)
        && (allowRecentlyUsed || !recentlyUsedIds.has(question.id));
      const custom = chooseCandidate(
        GATE_STYLE_MOCK_QUESTIONS.filter((q) => q.topic === topic && q.marks === marks && q.qualityStatus === 'reviewed' && isAvailable(q)),
      );
      if (custom) return normalizeCustom(custom);

      const source = chooseCandidate(
        SOURCE_QUESTIONS.filter((q) => q.topics.includes(topic) && isAvailable(q)),
      );
      if (source) return normalizeMcq({ ...source, selectedTopic: topic }, marks, rng);
    }

    return null;
  }

  for (const marks of [1, 2]) {
    const target = marks === 1 ? 20 : 15;
    const topicOrder = shuffle(selectedTopics, rng);
    for (let slot = 0; slot < target; slot++) {
      const preferredTopic = topicOrder[slot % topicOrder.length];
      const fallbackTopics = [preferredTopic, ...shuffle(selectedTopics.filter((topic) => topic !== preferredTopic), rng)];
      // Prefer unseen questions. Only reuse recent ones when a narrow topic
      // selection cannot otherwise fill all 35 slots.
      const picked = findQuestion(marks, fallbackTopics, false) || findQuestion(marks, fallbackTopics, true);

      if (!picked) {
        throw new Error('The selected topics do not yet contain enough unique questions for a 35-question mock');
      }
      recordCandidate(picked);
      sections[marks].push(picked);
    }
  }

  return rotateMockMsqs({
    section1: shuffle(sections[1], rng),
    section2: shuffle(sections[2], rng),
  }, msqCycleIndex, rng, [...recentlyUsedIds], selectedTopics);
}
