const CARDINALITIES = [2, 2, 3, 2, 3, 2, 2, 3, 1, 2, 4];
const ANSWER_PATTERNS = [
  ['A', 'C'], ['B', 'D'], ['A', 'B', 'D'], ['A', 'D'], ['B', 'C', 'D'], ['A', 'B'], ['C', 'D'], ['A', 'B', 'C'], ['B'], ['A', 'C'], ['A', 'B', 'C', 'D'],
];

const TOPICS = [
  ['research-methods-statistics', 'Research methods and statistics', ['random assignment', 'construct validity', 'confounding', 'interaction effect', 'median', 'sampling error', 'longitudinal design', 'within-subject design', 'effect size', 'Type I error', 'replication']],
  ['psychometrics', 'Psychometrics', ['reliability', 'content validity', 'criterion validity', 'standard error of measurement', 'norm-referenced interpretation', 'item difficulty', 'inter-rater agreement', 'factor analysis', 'test-retest reliability', 'social desirability bias', 'measurement invariance']],
  ['biological-evolutionary', 'Biological and evolutionary psychology', ['action potential', 'synaptic transmission', 'hypothalamus', 'hippocampus', 'amygdala', 'HPA axis', 'natural selection', 'gene-environment interaction', 'circadian rhythm', 'neuroplasticity', 'split-brain research']],
  ['perception-learning-memory', 'Perception, learning, and memory', ['classical conditioning', 'operant conditioning', 'negative reinforcement', 'observational learning', 'signal detection', 'selective attention', 'working memory', 'encoding specificity', 'proactive interference', 'spacing effect', 'procedural memory']],
  ['cognition', 'Cognition and language', ['availability heuristic', 'confirmation bias', 'functional fixedness', 'deductive validity', 'inductive reasoning', 'working-memory updating', 'mental set', 'prototype', 'phoneme', 'metacognition', 'cognitive reappraisal']],
  ['personality', 'Personality', ['trait stability', 'Big Five openness', 'locus of control', 'self-efficacy', 'defense mechanisms', 'unconditional positive regard', 'reciprocal determinism', 'projective test', 'person-situation interaction', 'identity narrative', 'temperament']],
  ['motivation-emotion-stress', 'Motivation, emotion, and stress', ['intrinsic motivation', 'self-determination', 'Yerkes-Dodson relation', 'problem-focused coping', 'emotion-focused coping', 'allostatic load', 'facial feedback', 'misattribution of arousal', 'approach-avoidance conflict', 'learned helplessness', 'burnout']],
  ['social', 'Social psychology', ['conformity', 'obedience', 'fundamental attribution error', 'self-serving bias', 'group polarization', 'social loafing', 'bystander effect', 'prejudice', 'cognitive dissonance', 'persuasion', 'social identity']],
  ['development', 'Developmental psychology', ['attachment security', 'object permanence', 'theory of mind', 'conservation', 'scaffolding', 'adolescent egocentrism', 'authoritative parenting', 'puberty timing', 'language acquisition', 'moral reasoning', 'lifespan plasticity']],
  ['clinical-organizational', 'Clinical and organizational psychology', ['major depressive episode', 'panic disorder', 'exposure therapy', 'cognitive behavioral therapy', 'inter-rater diagnosis', 'job analysis', 'organizational commitment', 'transformational leadership', 'burnout', 'selection validity', 'psychological safety']],
  ['applications', 'Applied psychology', ['informed consent', 'behavioral intervention', 'human factors', 'health belief model', 'community participation', 'forensic assessment', 'school consultation', 'usability testing', 'risk communication', 'program evaluation', 'cultural adaptation']],
];

function truthOption(letter, concept, topicTitle) {
  const statements = {
    A: `${concept} should be interpreted with its operational definition and relevant context in ${topicTitle.toLowerCase()}.`,
    B: `${concept} can be evaluated with evidence rather than inferred solely from a label or intuition.`,
    C: `${concept} may interact with other variables, so a single observation does not establish every possible explanation.`,
    D: `${concept} supports a conclusion only to the extent that the design, measurement, and stated claim align.`,
  };
  return statements[letter];
}

function falseOption(letter, concept) {
  const statements = {
    A: `${concept} has one fixed meaning that is unaffected by how it is measured or defined.`,
    B: `${concept} permits a causal conclusion whenever two variables are associated.`,
    C: `${concept} makes alternative explanations irrelevant once an expert recognizes the label.`,
    D: `${concept} guarantees that a finding will generalize to every person and setting.`,
  };
  return statements[letter];
}

function makeQuestion(topic, topicTitle, concept, index) {
  const answers = ANSWER_PATTERNS[index];
  const options = Object.fromEntries(['A', 'B', 'C', 'D'].map((letter) => [
    letter,
    answers.includes(letter) ? truthOption(letter, concept, topicTitle) : falseOption(letter, concept),
  ]));
  const explanation = ['A', 'B', 'C', 'D'].map((letter) => (
    `${letter}: ${answers.includes(letter) ? 'Correct' : 'Incorrect'} — ${options[letter]}`
  )).join(' ');
  return {
    id: `xh-c5-msq-${topic}-${String(index + 1).padStart(3, '0')}`,
    type: 'MSQ',
    topic,
    marks: index % 3 === 0 || index === 8 ? 1 : 2,
    question: `Which of the following statements about ${concept} are correct?`,
    options,
    answers,
    explanation,
    sourceName: 'Original GATE-style MSQ bank',
  };
}

export const XH_C5_DAILY_MSQ_QUESTIONS = TOPICS.flatMap(([topic, title, concepts]) =>
  concepts.map((concept, index) => makeQuestion(topic, title, concept, index))
);

export const XH_C5_DAILY_MSQ_CARDINALITY_COUNTS = Object.fromEntries(
  [1, 2, 3, 4].map((count) => [count, XH_C5_DAILY_MSQ_QUESTIONS.filter((q) => q.answers.length === count).length])
);
