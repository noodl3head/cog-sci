export const GATE_2027_TOPICS = [
  {
    id: 'research-methods-statistics',
    section: 'XH5.1',
    label: 'Research Methods and Statistics',
    summary: 'Research approaches and designs, ethics, statistics, correlation, regression, factor analysis and experimental designs.',
  },
  {
    id: 'psychometrics',
    section: 'XH5.2',
    label: 'Psychometrics',
    summary: 'Psychological measurement, item and test construction, reliability, validity, norms and assessment applications.',
  },
  {
    id: 'biological-evolutionary',
    section: 'XH5.3',
    label: 'Biological and Evolutionary Basis of Behaviour',
    summary: 'Heredity, evolution, brain and nervous system, neurons, hormones, motivation, emotion, memory and physiological methods.',
  },
  {
    id: 'perception-learning-memory',
    section: 'XH5.4',
    label: 'Perception, Learning, Memory and Forgetting',
    summary: 'Sensation and perception, conditioning and social learning, memory processes and theories of forgetting.',
  },
  {
    id: 'cognition',
    section: 'XH5.5',
    label: 'Cognition',
    summary: 'Thinking, language, problem solving, decision-making, intelligence, aptitude and creativity.',
  },
  {
    id: 'personality',
    section: 'XH5.6',
    label: 'Personality',
    summary: 'Major theories of personality, biological bases and personality assessment.',
  },
  {
    id: 'motivation-emotion-stress',
    section: 'XH5.7',
    label: 'Motivation, Emotion, Stress and Coping',
    summary: 'Approaches to motivation, emotion theories, stress reactions and problem- and emotion-focused coping.',
  },
  {
    id: 'social',
    section: 'XH5.8',
    label: 'Social Psychology',
    summary: 'Social perception and influence, attitudes, prejudice, aggression, prosocial behaviour, groups and intergroup conflict.',
  },
  {
    id: 'development',
    section: 'XH5.9',
    label: 'Development Across the Life Span',
    summary: 'Prenatal, physical, cognitive and psychosocial development, moral development and aging.',
  },
  {
    id: 'clinical-organizational',
    section: 'XH5.10',
    label: 'Clinical Psychology and Organizational Behavior',
    summary: 'Disorders, diagnosis and therapies plus culture, decisions, power, leadership and performance management in organizations.',
  },
  {
    id: 'applications',
    section: 'XH5.11',
    label: 'Applications of Psychology',
    summary: 'Applications in schools, counselling, groups, organizations, environmental psychology and mental health and wellbeing.',
  },
];

export const GATE_2027_TOPIC_IDS = GATE_2027_TOPICS.map((topic) => topic.id);

export const GATE_2027_TOPIC_BY_ID = Object.fromEntries(
  GATE_2027_TOPICS.map((topic) => [topic.id, topic]),
);
