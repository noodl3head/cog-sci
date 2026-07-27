// Central quality gate for imported chapter and mock questions.
// IDs use the original 1-based position in quizData so saved attempt records remain stable.

const APPENDED_CONTEXT_RE = /\s*Questions?\s+\d+\s*[-–]\s*\d+\s+are based on the following\.\s*[\s\S]*$/i;

export const RESTORED_CONTEXTS = {
  'alp-study': {
    title: 'Study context',
    body: 'Researchers examined whether an Advanced Learning Program (ALP), attended from fourth through eighth grade, had long-term effects. They compared the high-school GPAs of seniors who had participated in the ALP with the GPAs of seniors who had not participated.',
  },
  'proposition-12-survey': {
    title: 'Survey context',
    body: 'Policy analysts surveyed approximately 18,000 adult residents electronically about Proposition 12. After two weeks, 117 responses were returned.\n\nQ1. Do you support Proposition 12?\nQ2. How happy are you with the current housing situation in the city?\nQ3. Are you concerned about the fiscal deficit that Proposition 12 will bring to the city?\nQ4. Are you troubled by the new residents who will flood into the city if Proposition 12 passes?',
  },
  'calculus-expectations': {
    title: 'Experiment context',
    body: 'College students in an introductory calculus class were randomly assigned to four groups and received the same exam. Group A was told most students were expected to pass. Group B was told most students were expected to fail. Group C was shown statistics suggesting that female students perform worse than male students on similar exams. Group D received no information about expected performance.',
  },
  'green-button-study': {
    title: 'Experiment context',
    body: 'A rat was placed in a cage with a green button that released a food pellet. After the first button press, the pellet was released only after one minute had elapsed. The researcher measured how often the rat pressed the button while waiting for the pellet.',
  },
  'pamela-and-paul': {
    title: 'Scenario',
    body: 'Pamela wants her husband, Paul, to do more chores instead of playing computer games. She offers him his favourite snack, chocolate, for every hour of chores he completes. She also gives him steamed vegetables, which he initially neither likes nor dislikes, whenever he plays video games. Eventually, Paul can enjoy the vegetables without playing video games at the same time.',
  },
  'word-recall-study': {
    title: 'Study context',
    body: 'Investigators read a series of words to adults aged 40 to 80. The participants were then asked to recall as many words as possible.',
  },
  'adam-development': {
    title: 'Developmental scenario',
    body: 'Adam has just started preschool and is trying to assert his independence. He insists on dressing himself, tying his shoes, and using the toilet without help. When his older brother, Jack, tries to help him lift schoolbooks that are too heavy, Adam becomes upset and insists that he can do it himself.',
  },
  'ramirez-quiz-team': {
    title: 'Quiz-team scenario',
    body: 'Mr. Ramirez sponsors a high-school quiz-bowl team. Members must maintain a required GPA and attend practice twice a week. At the annual party, participation is rewarded with food, while district winners also receive certificates and state winners receive trophies.',
  },
  'michael-howard-competitions': {
    title: 'Competition data',
    body: 'Tom recorded crowd size, first-place prize money, and Michael Howard\'s outcome in three competitions.\n\nCompetition 1: crowd 1,211; prize $50,000; loss.\nCompetition 2: crowd 10,321; prize $100,000; win.\nCompetition 3: crowd 8,756; prize $150,000; win.',
  },
  'brian-interview': {
    title: 'Clinical interview',
    body: 'A therapist interviews Brian to identify his concerns and appropriate treatment. Brian reports that for several weeks he has consistently felt blue and down and has lost interest in activities he previously enjoyed. He reports no current medical concerns or substance misuse.',
  },
  'karl-workplace': {
    title: 'Workplace scenario',
    body: 'During his interview, Karl was well dressed and groomed and described his work ethic, perseverance, and creativity as reasons for past success. After he was hired, a reliable coworker reported that Karl was routinely late, dressed unprofessionally, distracted colleagues, submitted unpolished work, blamed competing priorities, and kept a highly disorganized desk.',
  },
};

const CONTEXT_BY_QUESTION_ID = {
  'kaplan:kaplan-4:24': 'alp-study',
  'kaplan:kaplan-4:74': 'proposition-12-survey',
  'kaplan:kaplan-4:75': 'proposition-12-survey',
  'kaplan:kaplan-4:82': 'calculus-expectations',
  'kaplan:kaplan-7:26': 'green-button-study',
  'kaplan:kaplan-7:49': 'pamela-and-paul',
  'kaplan:kaplan-7:50': 'pamela-and-paul',
  'kaplan:kaplan-7:51': 'pamela-and-paul',
  'kaplan:kaplan-7:52': 'pamela-and-paul',
  'kaplan:kaplan-8:61': 'word-recall-study',
  'kaplan:kaplan-9:49': 'adam-development',
  'kaplan:kaplan-9:50': 'adam-development',
  'kaplan:kaplan-9:51': 'adam-development',
  'kaplan:kaplan-10:30': 'ramirez-quiz-team',
  'kaplan:kaplan-10:31': 'ramirez-quiz-team',
  'kaplan:kaplan-10:32': 'ramirez-quiz-team',
  'kaplan:kaplan-10:45': 'michael-howard-competitions',
  'kaplan:kaplan-10:46': 'michael-howard-competitions',
  'kaplan:kaplan-11:40': 'brian-interview',
  'kaplan:kaplan-11:41': 'brian-interview',
  'kaplan:kaplan-12:66': 'karl-workplace',
  'kaplan:kaplan-12:67': 'karl-workplace',
};

// These were manually checked against the source material. Their required graph,
// figure, result series, or earlier event description is not usable in quizData.
export const KNOWN_EXCLUDED_QUESTIONS = {
  'kaplan:kaplan-4:26': 'ALP result graph is missing',
  'kaplan:kaplan-4:27': 'ALP result and conclusion are incomplete without the source chain',
  'kaplan:kaplan-4:41': 'study graph is missing',
  'kaplan:kaplan-4:89': 'BMI scatterplot is missing',
  'kaplan:kaplan-5:68': 'EEG figure is missing',
  'kaplan:kaplan-6:31': 'required dashed-line figure is missing',
  'kaplan:kaplan-7:27': 'reinforcement graph is missing',
  'kaplan:kaplan-7:41': 'reinforcement-schedule figure is missing',
  'kaplan:kaplan-8:78': 'probability-estimation graph is missing',
  'kaplan:kaplan-8:79': 'belief-perseverance result chain is missing',
  'kaplan:kaplan-8:106': 'robbery-video study scenario is missing',
  'kaplan:kaplan-8:107': 'robbery-video study scenario is missing',
  'kaplan:kaplan-8:108': 'robbery-video study scenario is missing',
  'kaplan:kaplan-8:109': 'false-memory study scenario is missing',
  'kaplan:kaplan-9:45': 'age and recall graph is missing',
  'kaplan:kaplan-11:61': 'Martha mood graph is missing',
  'kaplan:kaplan-11:62': 'Martha week-9 mood value is missing',
  'kaplan:kaplan-11:63': 'Martha mood history is missing',
  'kaplan:kaplan-12:61': 'calculus group result graph is missing',
  'kaplan:kaplan-12:62': 'calculus group result graph is missing',
};

const KNOWN_SELF_CONTAINED_QUESTIONS = new Set([
  // The stem contains the full gym experiment and the result needed to answer it.
  'kaplan:kaplan-7:61',
]);

export function questionBankId(bookId, chapterId, questionNumber) {
  return `${bookId}:${chapterId}:${questionNumber}`;
}

function stripAppendedContext(options = {}) {
  let repaired = false;
  const cleaned = Object.fromEntries(Object.entries(options).map(([key, value]) => {
    const original = String(value ?? '');
    const next = original.replace(APPENDED_CONTEXT_RE, '').trim();
    if (next !== original.trim()) repaired = true;
    return [key, next];
  }));
  return { options: cleaned, repaired };
}

function inferredDependencyReason(question, options) {
  const q = String(question || '').trim();
  const optionText = Object.values(options || {}).join(' ');
  const combined = `${q} ${optionText}`;

  if (/\bQ\d+\b/i.test(combined)) return 'references a numbered item that is not included';
  if (/\b(the passage|the graph|the figure|the picture|the excerpt|the preceding|the previous question)\b/i.test(q)) return 'references omitted preceding material';
  if (/\b(?:above|below)\s+(?:graph|figure|picture|image|passage|excerpt)\b/i.test(q)) return 'references omitted preceding material';
  if (/\b(?:graph|figure|image|data|results?)\s+(?:shown|presented|summarized|obtained)?\s*(?:above|below)\b/i.test(q)) return 'references a missing visual or result set';
  if (/\b(?:scenario|situation|experiment|study)\s+(?:described|shown|presented)\s+above\b/i.test(q)) return 'references an omitted scenario or experiment';
  if (/^(?:this|the)\s+survey\b/i.test(q) || (q.length < 170 && /\bthis research\b/i.test(q))) return 'references an omitted survey or study';
  if (/\bthis task\b/i.test(q) || /\bparticipants in the study\b/i.test(q)) return 'references an omitted task or study';
  // Long, fully described experiments can legitimately refer to their own groups or results.
  if (q.length >= 400) return null;
  if (q.length < 180 && /\bGroup [A-Z]\b/.test(q) && !/\bGroup [A-Z]:/.test(q)) return 'references an unintroduced experimental group';
  return null;
}

export function prepareQuestionForUse(rawQuestion, meta) {
  const { bookId, chapterId, questionNumber, previousQuestion = null } = meta;
  const id = questionBankId(bookId, chapterId, questionNumber);
  const { options, repaired } = stripAppendedContext(rawQuestion.options);

  if (rawQuestion.imageRequired) {
    return { id, status: 'excluded', reason: 'required image is unavailable in chapter practice' };
  }
  if (!rawQuestion.question || !rawQuestion.answer || !options[rawQuestion.answer]) {
    return { id, status: 'excluded', reason: 'question, answer, or correct option is malformed' };
  }
  if (KNOWN_EXCLUDED_QUESTIONS[id]) {
    return { id, status: 'excluded', reason: KNOWN_EXCLUDED_QUESTIONS[id] };
  }

  let context = null;
  const contextKey = CONTEXT_BY_QUESTION_ID[id];
  if (contextKey) context = { id: contextKey, ...RESTORED_CONTEXTS[contextKey] };

  if (!context && /\bpreceding scenario\b/i.test(rawQuestion.question) && previousQuestion?.question) {
    context = {
      id: `${id}-previous-question`,
      title: 'Previous scenario',
      body: previousQuestion.question,
    };
  }

  if (!context && !KNOWN_SELF_CONTAINED_QUESTIONS.has(id)) {
    const reason = inferredDependencyReason(rawQuestion.question, options);
    if (reason) return { id, status: 'excluded', reason };
  }

  return {
    id,
    status: 'playable',
    repaired,
    contextRestored: Boolean(context),
    question: {
      ...rawQuestion,
      options,
      context,
      questionNumber,
      qualityStatus: context ? 'context-restored' : repaired ? 'source-cleaned' : 'standalone',
    },
  };
}

export function auditQuestionBank(quizData) {
  const records = [];
  for (const book of quizData.books) {
    for (const chapter of book.chapters) {
      chapter.questions.forEach((question, index) => {
        const result = prepareQuestionForUse(question, {
          bookId: book.id,
          chapterId: chapter.id,
          questionNumber: index + 1,
          previousQuestion: chapter.questions[index - 1] || null,
        });
        records.push({
          id: result.id,
          book: book.name,
          chapter: chapter.title,
          status: result.status,
          reason: result.reason || null,
          repaired: Boolean(result.repaired),
          contextRestored: Boolean(result.contextRestored),
        });
      });
    }
  }

  return {
    total: records.length,
    playable: records.filter((record) => record.status === 'playable').length,
    excluded: records.filter((record) => record.status === 'excluded').length,
    contextRestored: records.filter((record) => record.contextRestored).length,
    sourceCleaned: records.filter((record) => record.repaired).length,
    records,
  };
}
