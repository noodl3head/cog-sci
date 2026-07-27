function syllabusLeaf(id, label, keywords, target = 4) {
  return { id, label, keywords, target };
}

// Leaf topics follow the official GATE 2027 XH5 syllabus. Targets are the
// first editorial milestone for original, reviewed GATE-style questions.
export const GATE_2027_TOPICS = [
  {
    id: 'research-methods-statistics', section: 'XH5.1', label: 'Research Methods and Statistics',
    summary: 'Research approaches and designs, ethics, statistics, correlation, regression, factor analysis and experimental designs.',
    leaves: [
      syllabusLeaf('research-worldviews', 'Philosophical worldviews and research approaches', ['worldview', 'quantitative', 'qualitative', 'mixed method'], 4),
      syllabusLeaf('research-problems-variables', 'Problems, purpose, variables, operational definitions and hypotheses', ['research problem', 'purpose statement', 'variable', 'operational definition', 'hypothesis'], 5),
      syllabusLeaf('research-sampling', 'Sampling and assignment', ['sample', 'sampling', 'population', 'random assignment', 'randomly assigned', 'stratified'], 5),
      syllabusLeaf('research-qualitative-methods', 'Interviews, surveys, observation and qualitative methods', ['interview', 'survey', 'questionnaire', 'observation', 'focus group', 'narrative', 'case study', 'ethnograph', 'field stud'], 5),
      syllabusLeaf('research-ethics', 'Ethics in conducting and reporting research', ['ethic', 'consent', 'debrief', 'deception', 'confidential', 'institutional review'], 4),
      syllabusLeaf('research-descriptive-statistics', 'Central tendency, dispersion and normal probability curve', ['mean', 'median', 'mode', 'standard deviation', 'variance', 'dispersion', 'normal curve', 'normal distribution', 'z score'], 5),
      syllabusLeaf('research-inferential-statistics', 'Parametric and non-parametric tests, effect size and power', ['parametric', 'nonparametric', 'non-parametric', 'effect size', 'power analysis', 'significance', 'p-value', 't-test', 'chi-square'], 6),
      syllabusLeaf('research-correlation-regression', 'Correlation and regression methods', ['correlation', 'correlat', 'pearson', 'rank order', 'partial correlation', 'multiple correlation', 'biserial', 'tetrachoric', 'phi coefficient', 'regression'], 6),
      syllabusLeaf('research-factor-analysis', 'Factor analysis assumptions, methods, rotation and interpretation', ['factor analysis', 'factor loading', 'rotation', 'eigenvalue', 'principal component'], 6),
      syllabusLeaf('research-experimental-designs', 'Factorial, block, repeated, single-subject and cohort designs', ['factorial', 'randomized block', 'repeated measures', 'single-subject', 'single subject', 'cohort', 'experimental design'], 6),
      syllabusLeaf('research-anova-family', 'ANOVA, MANOVA and ANCOVA', ['anova', 'manova', 'ancova', 'interaction effect', 'main effect'], 6),
    ],
  },
  {
    id: 'psychometrics', section: 'XH5.2', label: 'Psychometrics',
    summary: 'Psychological measurement, item and test construction, reliability, validity, norms and assessment applications.',
    leaves: [
      syllabusLeaf('psychometrics-foundations', 'Foundations and scales of psychological measurement', ['psychometric', 'measurement', 'nominal', 'ordinal', 'interval scale', 'ratio scale'], 5),
      syllabusLeaf('psychometrics-items', 'Item construction and item analysis', ['item analysis', 'item difficulty', 'item discrimination', 'distractor', 'item construction'], 6),
      syllabusLeaf('psychometrics-test-construction', 'Methods of test construction', ['test construction', 'test blueprint', 'pilot test', 'test development'], 5),
      syllabusLeaf('psychometrics-reliability', 'Reliability and measurement error', ['reliability', 'test-retest', 'split-half', 'internal consistency', 'cronbach', 'measurement error'], 6),
      syllabusLeaf('psychometrics-validity', 'Validity and validation evidence', ['validity', 'valid ', 'construct', 'criterion', 'content validity', 'predictive validity', 'concurrent validity'], 6),
      syllabusLeaf('psychometrics-norms', 'Standardization, norms and scores', ['standardiz', 'norms', 'normative', 'percentile', 'standard score', 'iq score'], 5),
      syllabusLeaf('psychometrics-test-types', 'Intelligence, performance, ability, aptitude and personality tests', ['intelligence test', 'performance test', 'ability test', 'aptitude', 'personality questionnaire', 'achievement test'], 5),
      syllabusLeaf('psychometrics-applications', 'Testing applications across settings', ['psychological testing', 'assessment application', 'educational testing', 'clinical assessment', 'employee selection'], 4),
    ],
  },
  {
    id: 'biological-evolutionary', section: 'XH5.3', label: 'Biological and Evolutionary Basis of Behaviour',
    summary: 'Heredity, evolution, brain and nervous system, neurons, hormones, motivation, emotion, memory and physiological methods.',
    leaves: [
      syllabusLeaf('bio-evolution-heredity', 'Heredity, evolution and natural selection', ['heredity', 'evolution', 'natural selection', 'adaptive', 'evolutionary'], 4),
      syllabusLeaf('bio-nervous-brain', 'Nervous system and brain structures', ['nervous system', 'brain', 'cortex', 'lobe', 'thalamus', 'hypothalamus', 'hippocamp', 'amygdala'], 5),
      syllabusLeaf('bio-neurons-transmission', 'Neurons, neural impulses, synapses and neurotransmitters', ['neuron', 'action potential', 'neural impulse', 'synap', 'neurotransmitter', 'axon', 'dendrite'], 5),
      syllabusLeaf('bio-lateralization', 'Hemispheric lateralization', ['lateralization', 'hemisphere', 'split-brain', 'corpus callosum'], 4),
      syllabusLeaf('bio-endocrine-hormones', 'Endocrine system and hormonal regulation', ['endocrine', 'hormone', 'pituitary', 'adrenal', 'thyroid', 'testosterone', 'estrogen'], 4),
      syllabusLeaf('bio-motivation-emotion-memory', 'Biological bases of motivation, emotion and memory', ['hunger', 'thirst', 'sleep', 'sex drive', 'limbic', 'biological basis', 'memory consolidation'], 5),
      syllabusLeaf('bio-physiological-methods', 'Invasive and non-invasive physiological methods', ['eeg', 'scan', 'fmri', 'pet scan', 'lesion', 'microelectrode', 'degeneration technique', 'invasive', 'non-invasive'], 6),
      syllabusLeaf('bio-genetics-behaviour', 'Genetics, chromosomal anomalies, twin and adoption studies', ['genetic', 'chromosom', 'twin stud', 'adoption stud', 'nature-nurture'], 5),
    ],
  },
  {
    id: 'perception-learning-memory', section: 'XH5.4', label: 'Perception, Learning, Memory and Forgetting',
    summary: 'Sensation and perception, conditioning and social learning, memory processes and theories of forgetting.',
    leaves: [
      syllabusLeaf('plm-sensation', 'Sensation, thresholds, adaptation and sensory systems', ['sensation', 'threshold', 'adaptation', 'vision', 'hearing', 'touch', 'pain', 'smell', 'taste', 'kinesth', 'vestibular'], 5),
      syllabusLeaf('plm-perception-attention', 'Attention, perceptual organization, depth and illusions', ['perception', 'attention', 'gestalt', 'depth cue', 'illusion', 'figure-ground', 'constancy'], 5),
      syllabusLeaf('plm-classical-conditioning', 'Classical conditioning', ['classical conditioning', 'conditioned stimulus', 'unconditioned', 'extinction', 'spontaneous recovery'], 4),
      syllabusLeaf('plm-operant-conditioning', 'Operant conditioning', ['operant', 'reinforcement', 'punishment', 'schedule of reinforcement', 'shaping'], 4),
      syllabusLeaf('plm-social-cognitive-learning', 'Social and cognitive learning', ['social learning', 'observational learning', 'modeling', 'latent learning', 'cognitive map'], 4),
      syllabusLeaf('plm-memory', 'Encoding, storage, retrieval and memory theories', ['memory', 'encoding', 'storage', 'retrieval', 'working memory', 'long-term memory', 'reconstructive'], 5),
      syllabusLeaf('plm-forgetting', 'Encoding failure, interference and trace decay', ['forgetting', 'encoding failure', 'interference', 'trace decay', 'proactive', 'retroactive'], 4),
    ],
  },
  {
    id: 'cognition', section: 'XH5.5', label: 'Cognition',
    summary: 'Thinking, language, problem solving, decision-making, intelligence, aptitude and creativity.',
    leaves: [
      syllabusLeaf('cognition-thought-language', 'Thought, concepts, propositions, imagery and language', ['concept', 'proposition', 'imagery', 'language', 'thought'], 4),
      syllabusLeaf('cognition-paradigms', 'Information-processing and ecological approaches', ['information processing', 'ecological approach', 'cognitive paradigm'], 4),
      syllabusLeaf('cognition-problem-solving', 'Problem solving, strategies, obstacles and metacognition', ['problem solving', 'algorithm', 'heuristic', 'functional fixedness', 'mental set', 'metacogn'], 5),
      syllabusLeaf('cognition-decision-making', 'Decision-making and choice', ['decision', 'choice', 'framing', 'availability heuristic', 'representativeness'], 4),
      syllabusLeaf('cognition-intelligence-theories', 'Theories and measurement of intelligence', ['intelligence', 'spearman', 'thurstone', 'jensen', 'cattell', 'gardner', 'sternberg', 'emotional intelligence'], 5),
      syllabusLeaf('cognition-individual-differences', 'Heredity, environment, aptitude and creativity', ['aptitude', 'creativity', 'individual difference', 'heredity and environment'], 4),
    ],
  },
  {
    id: 'personality', section: 'XH5.6', label: 'Personality',
    summary: 'Major theories of personality, biological bases and personality assessment.',
    leaves: [
      syllabusLeaf('personality-psychodynamic', 'Psychoanalytic theories', ['psychoanalytic', 'psychodynamic', 'freud', 'id', 'superego', 'defense mechanism'], 4),
      syllabusLeaf('personality-learning-cognitive', 'Behaviourist, social and cognitive theories', ['behaviorist', 'behaviourist', 'social cognitive', 'locus of control', 'self-efficacy'], 4),
      syllabusLeaf('personality-humanistic', 'Humanistic theories', ['humanistic', 'maslow', 'rogers', 'self-actualization'], 4),
      syllabusLeaf('personality-trait-type', 'Trait and type theories', ['trait', 'type theory', 'big five', 'eysenck', 'allport', 'cattell'], 4),
      syllabusLeaf('personality-biology', 'Biology of personality', ['biological personality', 'temperament', 'behavioral activation', 'behavioural activation'], 4),
      syllabusLeaf('personality-assessment', 'Personality assessment', ['personality assessment', 'projective', 'rorschach', 'thematic apperception', 'mmpi'], 5),
    ],
  },
  {
    id: 'motivation-emotion-stress', section: 'XH5.7', label: 'Motivation, Emotion, Stress and Coping',
    summary: 'Approaches to motivation, emotion theories, stress reactions and problem- and emotion-focused coping.',
    leaves: [
      syllabusLeaf('mes-motivation-approaches', 'Approaches to motivation', ['instinct', 'drive-reduction', 'arousal', 'incentive', 'humanistic motivation'], 4),
      syllabusLeaf('mes-achievement-intrinsic', 'Achievement, intrinsic motivation, curiosity and exploration', ['achievement motivation', 'intrinsic motivation', 'curiosity', 'exploration', 'self-determination'], 4),
      syllabusLeaf('mes-aggression', 'Aggression as motivated behaviour', ['aggression', 'aggressive'], 4),
      syllabusLeaf('mes-emotion', 'Nature and theories of emotion', ['emotion', 'james-lange', 'cannon-bard', 'schachter', 'two-factor theory'], 5),
      syllabusLeaf('mes-stress', 'Stressors, cognitive factors, reactions and effects', ['stress', 'stressor', 'general adaptation', 'gas ', 'burnout'], 5),
      syllabusLeaf('mes-coping', 'Problem-focused and emotion-focused coping', ['coping', 'problem-focused', 'emotion-focused'], 5),
    ],
  },
  {
    id: 'social', section: 'XH5.8', label: 'Social Psychology',
    summary: 'Social perception and influence, attitudes, prejudice, aggression, prosocial behaviour, groups and intergroup conflict.',
    leaves: [
      syllabusLeaf('social-perception', 'Attribution, impression formation and social categorization', ['attribution', 'impression formation', 'social categor', 'implicit personality', 'fundamental attribution'], 5),
      syllabusLeaf('social-influence', 'Conformity, compliance and obedience', ['conformity', 'compliance', 'obedience', 'asch', 'milgram'], 5),
      syllabusLeaf('social-attitudes-values', 'Attitudes, persuasion, dissonance, beliefs and values', ['attitude', 'persuasion', 'cognitive dissonance', 'belief', 'value pattern'], 5),
      syllabusLeaf('social-prejudice-power-prosocial', 'Prejudice, discrimination, aggression, power and prosocial behaviour', ['prejudice', 'discrimination', 'power', 'prosocial', 'altruism', 'bystander'], 5),
      syllabusLeaf('social-groups-conflict', 'Group dynamics and intergroup relations', ['group dynamic', 'groupthink', 'polarization', 'social loafing', 'intergroup', 'conflict', 'robbers cave'], 5),
    ],
  },
  {
    id: 'development', section: 'XH5.9', label: 'Development Across the Life Span',
    summary: 'Prenatal, physical, cognitive and psychosocial development, moral development and aging.',
    leaves: [
      syllabusLeaf('development-nature-nurture-prenatal', 'Nature-nurture and prenatal development', ['nature versus nurture', 'prenatal', 'chromosome', 'gene', 'dna', 'teratogen'], 4),
      syllabusLeaf('development-infancy-childhood', 'Development in infancy and childhood', ['infancy', 'infant', 'childhood', 'attachment', 'object permanence'], 5),
      syllabusLeaf('development-adolescence-adulthood', 'Development in adolescence and adulthood', ['adolescen', 'puberty', 'adulthood', 'midlife'], 5),
      syllabusLeaf('development-cognitive-psychosocial', 'Cognitive and psychosocial development', ['piaget', 'erikson', 'psychosocial', 'cognitive development'], 5),
      syllabusLeaf('development-moral', 'Moral development', ['moral development', 'kohlberg'], 4),
      syllabusLeaf('development-aging', 'Theories of aging', ['aging', 'ageing', 'gerontology', 'disengagement theory', 'activity theory'], 5),
    ],
  },
  {
    id: 'clinical-organizational', section: 'XH5.10', label: 'Clinical Psychology and Organizational Behavior',
    summary: 'Disorders, diagnosis and therapies plus culture, decisions, power, leadership and performance management in organizations.',
    leaves: [
      syllabusLeaf('clinical-disorders', 'Psychological disorders and conceptions of disorder', ['disorder', 'abnormal', 'schizophrenia', 'depression', 'anxiety', 'obsession', 'compulsion'], 5),
      syllabusLeaf('clinical-assessment-diagnosis', 'Assessment, diagnosis, DSM and other tools', ['diagnosis', 'dsm', 'clinical assessment', 'diagnostic'], 5),
      syllabusLeaf('clinical-psychotherapies', 'Psychodynamic, experiential, behavioural and cognitive therapies', ['therapy', 'psychotherapy', 'behavior therapy', 'behaviour therapy', 'cognitive therapy', 'rebt', 'meditation'], 6),
      syllabusLeaf('clinical-biological-therapy', 'Biological therapies', ['biological therapy', 'ect', 'psychopharmac', 'antidepressant', 'antipsychotic'], 4),
      syllabusLeaf('org-diversity-culture', 'Organizational diversity and culture', ['organizational culture', 'organisational culture', 'diversity', 'organizational climate'], 5),
      syllabusLeaf('org-decisions-power-politics', 'Organizational decisions, power and politics', ['organizational decision', 'power', 'politics', 'decision rights'], 5),
      syllabusLeaf('org-leadership', 'Leadership theories, styles and effectiveness', ['leader', 'leadership', 'contingency approach'], 5),
      syllabusLeaf('org-positive-behaviour', 'Positive organizational behaviour', ['positive organizational', 'commitment', 'engagement', 'psychological capital', 'job satisfaction'], 4),
      syllabusLeaf('org-performance-management', 'Performance management, reward and punishment', ['performance management', 'job performance', 'reward', 'punishment', 'employee selection', 'job analysis'], 5),
    ],
  },
  {
    id: 'applications', section: 'XH5.11', label: 'Applications of Psychology',
    summary: 'Applications in schools, counselling, groups, organizations, environmental psychology and mental health and wellbeing.',
    leaves: [
      syllabusLeaf('applications-school-learning', 'Motivation, learning and educational achievement in schools', ['school', 'teacher', 'student', 'classroom', 'educational achievement', 'academic achievement'], 5),
      syllabusLeaf('applications-school-counselling', 'Counselling and guidance in schools', ['school counsell', 'school counsel', 'guidance', 'career path'], 5),
      syllabusLeaf('applications-groups-organizations', 'Psychological principles in groups and organizations', ['work group', 'organizational setup', 'organisation', 'manager', 'employee'], 5),
      syllabusLeaf('applications-environmental', 'Personal space, crowding and territoriality', ['personal space', 'crowding', 'territorial'], 5),
      syllabusLeaf('applications-mental-health', 'Mental-health and wellbeing interventions', ['mental health', 'wellbeing', 'well-being', 'preventive intervention', 'community mental'], 5),
    ],
  },
];

export const GATE_2027_TOPIC_IDS = GATE_2027_TOPICS.map((topic) => topic.id);
export const GATE_2027_TOPIC_BY_ID = Object.fromEntries(GATE_2027_TOPICS.map((topic) => [topic.id, topic]));
export const GATE_2027_LEAVES = GATE_2027_TOPICS.flatMap((topic) =>
  topic.leaves.map((leaf) => ({ ...leaf, topicId: topic.id, section: topic.section }))
);
export const GATE_2027_LEAF_BY_ID = Object.fromEntries(GATE_2027_LEAVES.map((leaf) => [leaf.id, leaf]));
export const GATE_2027_ORIGINAL_TARGET = GATE_2027_LEAVES.reduce((sum, leaf) => sum + leaf.target, 0);
