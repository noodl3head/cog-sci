// Original GATE-style questions used to add MSQ coverage and organizational
// psychology, both of which are sparse in the AP-oriented source books.
// These questions are not copied or adapted from the PYQ bank.

export const GATE_STYLE_MOCK_QUESTIONS = [
  {
    id: 'gate-style-org-01', topic: 'organizational', type: 'MCQ', marks: 1,
    question: 'A selection test predicts training performance well but shows almost no relationship with later job performance. This pattern most directly suggests that the test has',
    options: { A: 'high criterion validity for training but low criterion validity for the job', B: 'high content validity for both criteria', C: 'low test-retest reliability', D: 'high face validity but no construct validity' },
    answer: 'A', explanation: 'Criterion-related validity is specific to the outcome being predicted. Evidence for training success does not establish prediction of job performance.'
  },
  {
    id: 'gate-style-org-02', topic: 'organizational', type: 'MSQ', marks: 2,
    question: 'A project team has unclear responsibilities and members frequently duplicate one another\'s work. Which interventions are likely to improve role clarity?',
    options: { A: 'Conduct a job and task analysis', B: 'Specify decision rights and expected outputs', C: 'Increase role ambiguity to promote flexibility', D: 'Use a responsibility-assignment matrix' },
    answers: ['A', 'B', 'D'], explanation: 'Task analysis, explicit outputs and a responsibility matrix clarify who owns each activity. Deliberately increasing ambiguity would worsen the problem.'
  },
  {
    id: 'gate-style-org-03', topic: 'organizational', type: 'MCQ', marks: 1,
    question: 'Two employees contribute equally, but one learns that the other receives a substantially larger reward. Equity theory predicts that the first employee will initially experience',
    options: { A: 'positive reinforcement', B: 'perceived under-reward inequity', C: 'role overload', D: 'group polarization' },
    answer: 'B', explanation: 'Equity theory compares one\'s input-to-outcome ratio with that of a referent. Equal input and lower reward produces perceived under-reward inequity.'
  },
  {
    id: 'gate-style-org-04', topic: 'organizational', type: 'MSQ', marks: 2,
    question: 'Which observations are consistent with a contingency approach to leadership?',
    options: { A: 'Leader effectiveness can depend on task structure', B: 'The same style is optimal in every situation', C: 'Follower readiness can alter the usefulness of a style', D: 'Situational control can moderate leader effectiveness' },
    answers: ['A', 'C', 'D'], explanation: 'Contingency theories reject a universally best style and examine task, follower and situational moderators.'
  },
  {
    id: 'gate-style-org-05', topic: 'organizational', type: 'MCQ', marks: 1,
    question: 'An employee intends to remain because leaving would mean losing pension benefits and organization-specific advantages. This is primarily',
    options: { A: 'affective commitment', B: 'normative commitment', C: 'continuance commitment', D: 'job involvement' },
    answer: 'C', explanation: 'Continuance commitment reflects the perceived costs of leaving rather than emotional attachment or obligation.'
  },
  {
    id: 'gate-style-org-06', topic: 'organizational', type: 'MSQ', marks: 2,
    question: 'A company wants a fair and technically sound employee-selection procedure. Which practices support that goal?',
    options: { A: 'Use standardized administration', B: 'Validate scores against job-relevant criteria', C: 'Choose items only because applicants like them', D: 'Monitor adverse impact across groups' },
    answers: ['A', 'B', 'D'], explanation: 'Standardization, job-related validation and adverse-impact monitoring support reliability, validity and fairness.'
  },
  {
    id: 'gate-style-org-07', topic: 'organizational', type: 'MCQ', marks: 1,
    question: 'A highly cohesive committee suppresses dissent, assumes unanimity, and fails to examine alternatives. The decision process illustrates',
    options: { A: 'social facilitation', B: 'groupthink', C: 'social compensation', D: 'minority influence' },
    answer: 'B', explanation: 'Suppression of dissent and the illusion of unanimity are characteristic symptoms of groupthink.'
  },
  {
    id: 'gate-style-org-08', topic: 'organizational', type: 'MSQ', marks: 2,
    question: 'According to the job characteristics model, which changes can increase experienced meaningfulness of work?',
    options: { A: 'Increase skill variety', B: 'Increase task identity', C: 'Increase task significance', D: 'Reduce feedback from the job' },
    answers: ['A', 'B', 'C'], explanation: 'Skill variety, task identity and task significance jointly contribute to experienced meaningfulness. Feedback mainly supports knowledge of results.'
  },
  {
    id: 'gate-style-org-09', topic: 'organizational', type: 'MCQ', marks: 1,
    question: 'Employees share deep assumptions about acceptable conduct, while their current survey responses describe how procedures are experienced. These refer respectively to organizational',
    options: { A: 'culture and climate', B: 'climate and culture', C: 'structure and culture', D: 'culture and design' },
    answer: 'A', explanation: 'Culture concerns shared underlying assumptions; climate concerns employees\' current perceptions of policies, practices and procedures.'
  },
  {
    id: 'gate-style-org-10', topic: 'organizational', type: 'MSQ', marks: 2,
    question: 'Which conditions generally make constructive task conflict more likely than destructive relationship conflict?',
    options: { A: 'Psychological safety', B: 'Focus on ideas rather than personal attributes', C: 'Clear shared goals', D: 'Personal attacks during disagreement' },
    answers: ['A', 'B', 'C'], explanation: 'Safety, issue-focused discussion and shared goals allow disagreement about tasks without turning it into interpersonal hostility.'
  },
  {
    id: 'gate-style-methods-01', topic: 'methods', type: 'MSQ', marks: 2,
    question: 'Participants are randomly assigned to sleep for either four or eight hours before a memory test. Which statements are correct?',
    options: { A: 'Sleep duration is the independent variable', B: 'Memory score is the dependent variable', C: 'Random assignment helps balance participant differences', D: 'The design is necessarily correlational' },
    answers: ['A', 'B', 'C'], explanation: 'The manipulated sleep condition is the independent variable, memory is the outcome, and random assignment strengthens causal inference.'
  },
  {
    id: 'gate-style-bio-01', topic: 'biological', type: 'MSQ', marks: 2,
    question: 'Which changes are expected during sympathetic nervous system activation?',
    options: { A: 'Increased heart rate', B: 'Pupil dilation', C: 'Enhanced digestive activity', D: 'Reduced salivation' },
    answers: ['A', 'B', 'D'], explanation: 'Sympathetic activation prepares the body for action by increasing cardiac output, dilating pupils and inhibiting salivation and digestion.'
  },
  {
    id: 'gate-style-learning-01', topic: 'learning', type: 'MSQ', marks: 2,
    question: 'A teacher stops giving attention to disruptive calling-out and praises students who raise their hands. Which learning processes are being used?',
    options: { A: 'Extinction of calling-out', B: 'Positive reinforcement of hand-raising', C: 'Negative punishment of hand-raising', D: 'Differential reinforcement' },
    answers: ['A', 'B', 'D'], explanation: 'Withholding attention can extinguish calling-out, praise reinforces hand-raising, and reinforcing an alternative response is differential reinforcement.'
  },
  {
    id: 'gate-style-cognition-01', topic: 'cognition', type: 'MSQ', marks: 2,
    question: 'A witness remembers a blue car. After repeatedly hearing that the car was green, the witness later reports seeing a green car. Which concepts can account for this change?',
    options: { A: 'Misinformation effect', B: 'Source-monitoring error', C: 'State-dependent learning', D: 'Memory reconstruction' },
    answers: ['A', 'B', 'D'], explanation: 'Post-event information can be incorporated through reconstructive memory and confused with the original perceptual source.'
  },
  {
    id: 'gate-style-methods-02', topic: 'methods', type: 'MSQ', marks: 2,
    question: 'A 2 × 3 factorial experiment is conducted. Which statements are necessarily true?',
    options: { A: 'There are two independent variables', B: 'There are six treatment combinations', C: 'At least one independent variable has three levels', D: 'There must be six dependent variables' },
    answers: ['A', 'B', 'C'], explanation: 'A 2 × 3 design has two factors with two and three levels, yielding six cells; it need not have six dependent variables.'
  },
  {
    id: 'gate-style-sensation-01', topic: 'sensation', type: 'MSQ', marks: 2,
    question: 'In a signal-detection task, which changes can increase the proportion of “signal present” responses?',
    options: { A: 'Greater sensitivity to the signal', B: 'Adopting a more liberal response criterion', C: 'Increasing both hits and false alarms through criterion shift', D: 'Making the criterion more conservative' },
    answers: ['A', 'B', 'C'], explanation: 'Sensitivity and a liberal criterion can raise yes-responses. A liberal shift commonly raises both hits and false alarms.'
  },
  {
    id: 'gate-style-development-01', topic: 'development', type: 'MSQ', marks: 2,
    question: 'During the Strange Situation, a child is distressed by separation, seeks the caregiver on return, but resists soothing and remains angry. Which statements fit this pattern?',
    options: { A: 'It is associated with resistant or ambivalent attachment', B: 'Proximity seeking and resistance coexist', C: 'The child shows the classic secure pattern', D: 'Inconsistent caregiving can contribute to this pattern' },
    answers: ['A', 'B', 'D'], explanation: 'Resistant attachment combines strong proximity seeking with difficulty being soothed and is often linked to inconsistent caregiving.'
  },
  {
    id: 'gate-style-motivation-01', topic: 'motivation', type: 'MSQ', marks: 2,
    question: 'Which predictions follow from self-determination theory?',
    options: { A: 'Autonomy support can strengthen intrinsic motivation', B: 'Competence experiences can support motivation', C: 'Relatedness is a basic psychological need', D: 'Every external reward necessarily increases intrinsic motivation' },
    answers: ['A', 'B', 'C'], explanation: 'Self-determination theory emphasizes autonomy, competence and relatedness. Controlling rewards can sometimes undermine intrinsic motivation.'
  },
  {
    id: 'gate-style-methods-03', topic: 'methods', type: 'MSQ', marks: 2,
    question: 'A scale produces similar scores across two weeks but does not adequately represent the construct it claims to measure. Which conclusions are justified?',
    options: { A: 'Test-retest reliability may be high', B: 'Construct validity may be poor', C: 'High reliability guarantees high validity', D: 'A reliable measure can still be invalid' },
    answers: ['A', 'B', 'D'], explanation: 'Score stability supports test-retest reliability, but reliability alone does not establish that the intended construct is measured.'
  },
  {
    id: 'gate-style-social-01', topic: 'social', type: 'MSQ', marks: 2,
    question: 'An observer explains a stranger\'s angry response as “an aggressive personality” while ignoring that the stranger was threatened. Which statements apply?',
    options: { A: 'The explanation is dispositional', B: 'Situational information is underweighted', C: 'The pattern is consistent with fundamental attribution error', D: 'The explanation demonstrates self-handicapping' },
    answers: ['A', 'B', 'C'], explanation: 'The judgment emphasizes disposition and neglects a strong situational cause, which is the classic attribution error.'
  },
  {
    id: 'gate-style-cognition-02', topic: 'cognition', type: 'MSQ', marks: 2,
    question: 'Which tasks place substantial demands on working memory?',
    options: { A: 'Keeping intermediate results while solving mental arithmetic', B: 'Reordering a short list of digits', C: 'Maintaining directions while navigating', D: 'A spinal withdrawal reflex' },
    answers: ['A', 'B', 'C'], explanation: 'Working memory temporarily maintains and manipulates information for complex cognition; a spinal reflex does not require it.'
  },
  {
    id: 'gate-style-health-01', topic: 'health', type: 'MSQ', marks: 1,
    question: 'Which are generally examples of problem-focused coping?',
    options: { A: 'Making a plan to remove the stressor', B: 'Seeking information needed to act', C: 'Changing the situation that produces stress', D: 'Denying that the stressor exists' },
    answers: ['A', 'B', 'C'], explanation: 'Problem-focused coping aims to alter or manage the source of stress. Denial avoids rather than addresses it.'
  },
  {
    id: 'gate-style-methods-04', topic: 'methods', type: 'MSQ', marks: 2,
    question: 'Which practices are required for ethically sound research involving deception?',
    options: { A: 'The deception must be scientifically justified', B: 'Risks must be minimized', C: 'Participants should ordinarily be debriefed', D: 'Consent and withdrawal rights can always be ignored' },
    answers: ['A', 'B', 'C'], explanation: 'Justification, risk minimization and debriefing are central safeguards. Deception does not remove participant rights.'
  },
  {
    id: 'gate-style-bio-02', topic: 'biological', type: 'MSQ', marks: 2,
    question: 'Damage to the hippocampal formation would most directly be expected to impair which functions?',
    options: { A: 'Formation of new declarative memories', B: 'Spatial memory', C: 'Consolidation of episodic information', D: 'Execution of a simple spinal reflex' },
    answers: ['A', 'B', 'C'], explanation: 'The hippocampal system is central to declarative, episodic and spatial memory formation, not basic spinal reflexes.'
  },
  {
    id: 'gate-style-motivation-02', topic: 'motivation', type: 'MSQ', marks: 2,
    question: 'Which statements are consistent with the five-factor model of personality?',
    options: { A: 'Traits are described along continuous dimensions', B: 'Conscientiousness concerns organization and self-discipline', C: 'Neuroticism concerns emotional instability', D: 'The model assigns every person to one of five personality types' },
    answers: ['A', 'B', 'C'], explanation: 'The model describes five continuous trait dimensions; it does not divide people into five mutually exclusive types.'
  },
  {
    id: 'gate-style-clinical-01', topic: 'clinical', type: 'MSQ', marks: 2,
    question: 'Which features distinguish an obsession from a compulsion?',
    options: { A: 'An obsession is an intrusive thought, image or urge', B: 'A compulsion is a repetitive act or mental ritual', C: 'Compulsions are often performed to reduce distress', D: 'Obsessions are always experienced as pleasurable' },
    answers: ['A', 'B', 'C'], explanation: 'Obsessions are intrusive mental events; compulsions are repetitive responses often intended to reduce anxiety or prevent feared outcomes.'
  },
  {
    id: 'gate-style-methods-05', topic: 'methods', type: 'MSQ', marks: 2,
    question: 'A correlation of −0.80 is observed between test anxiety and examination performance. Which statements are correct?',
    options: { A: 'The association is strong and negative', B: 'Higher anxiety tends to accompany lower performance', C: 'The correlation alone proves that anxiety causes poor performance', D: 'The coefficient of determination is 0.64' },
    answers: ['A', 'B', 'D'], explanation: 'The sign gives direction, magnitude gives strength, and r squared is 0.64. Correlation alone cannot establish causation.'
  },
  {
    id: 'gate-style-sensation-02', topic: 'sensation', type: 'MSQ', marks: 2,
    question: 'Which are monocular depth cues?',
    options: { A: 'Linear perspective', B: 'Interposition', C: 'Texture gradient', D: 'Retinal disparity' },
    answers: ['A', 'B', 'C'], explanation: 'Linear perspective, interposition and texture gradient can operate with one eye. Retinal disparity depends on binocular input.'
  },
  {
    id: 'gate-style-learning-02', topic: 'learning', type: 'MSQ', marks: 2,
    question: 'After conditioning a tone with food, an animal salivates to similar tones. Which procedures would help demonstrate stimulus discrimination?',
    options: { A: 'Reinforce the target tone', B: 'Do not reinforce a different tone', C: 'Measure different responding to the two tones', D: 'Pair every possible tone with food' },
    answers: ['A', 'B', 'C'], explanation: 'Differential conditioning reinforces one stimulus but not another and tests whether responding becomes selective.'
  },
  {
    id: 'gate-style-social-02', topic: 'social', type: 'MSQ', marks: 2,
    question: 'Which factors generally increase conformity in an Asch-type judgment task?',
    options: { A: 'A unanimous majority', B: 'Public responding', C: 'An ally who gives the correct response', D: 'Uncertainty about the task' },
    answers: ['A', 'B', 'D'], explanation: 'Unanimity, public responding and uncertainty increase normative or informational pressure. A dissenting ally reduces conformity.'
  }
];

// Each preset receives two organizational questions plus four MSQs from
// different syllabus areas. The remaining slots come from the supplied books.
export const PRESET_CUSTOM_IDS = [
  ['gate-style-org-01', 'gate-style-org-02', 'gate-style-methods-01', 'gate-style-bio-01', 'gate-style-learning-01', 'gate-style-cognition-01'],
  ['gate-style-org-03', 'gate-style-org-04', 'gate-style-methods-02', 'gate-style-sensation-01', 'gate-style-development-01', 'gate-style-motivation-01'],
  ['gate-style-org-05', 'gate-style-org-06', 'gate-style-methods-03', 'gate-style-social-01', 'gate-style-cognition-02', 'gate-style-health-01'],
  ['gate-style-org-07', 'gate-style-org-08', 'gate-style-methods-04', 'gate-style-bio-02', 'gate-style-motivation-02', 'gate-style-clinical-01'],
  ['gate-style-org-09', 'gate-style-org-10', 'gate-style-methods-05', 'gate-style-sensation-02', 'gate-style-learning-02', 'gate-style-social-02']
];
