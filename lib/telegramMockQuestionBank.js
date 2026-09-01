// Original numerical-answer questions for the daily Telegram mock.
// They follow GATE NAT scoring: no negative marks and numeric tolerance where needed.
export const TELEGRAM_NAT_QUESTIONS = [
  {
    id: 'telegram-nat-correlation-01', type: 'NAT', marks: 2, topic: 'research-methods-statistics',
    question: 'A study reports a correlation of -0.60. What percentage of variance is shared by the two variables? Enter a whole number.',
    answer: 36, tolerance: 0,
    explanation: 'Shared variance is r squared multiplied by 100: (-0.60)^2 x 100 = 36.'
  },
  {
    id: 'telegram-nat-factorial-01', type: 'NAT', marks: 1, topic: 'research-methods-statistics',
    question: 'How many treatment combinations are present in a 3 x 4 factorial design?',
    answer: 12, tolerance: 0,
    explanation: 'The number of cells is the product of factor levels: 3 x 4 = 12.'
  },
  {
    id: 'telegram-nat-zscore-01', type: 'NAT', marks: 1, topic: 'research-methods-statistics',
    question: 'A score is 70 in a distribution with mean 50 and standard deviation 10. What is its z score?',
    answer: 2, tolerance: 0,
    explanation: 'z = (X - mean) / SD = (70 - 50) / 10 = 2.'
  },
  {
    id: 'telegram-nat-probability-01', type: 'NAT', marks: 2, topic: 'research-methods-statistics',
    question: 'If two independent events have probabilities 0.50 and 0.40, what is the probability that both occur?',
    answer: 0.2, tolerance: 0.001,
    explanation: 'For independent events, multiply the probabilities: 0.50 x 0.40 = 0.20.'
  },
  {
    id: 'telegram-nat-mean-01', type: 'NAT', marks: 1, topic: 'research-methods-statistics',
    question: 'What is the arithmetic mean of the scores 4, 6, 8, 10, and 12?',
    answer: 8, tolerance: 0,
    explanation: 'The scores sum to 40, and 40 / 5 = 8.'
  },
  {
    id: 'telegram-nat-df-01', type: 'NAT', marks: 2, topic: 'research-methods-statistics',
    question: 'For a chi-square goodness-of-fit test with five categories and no estimated parameters, what are the degrees of freedom?',
    answer: 4, tolerance: 0,
    explanation: 'For this goodness-of-fit test, df = number of categories - 1 = 5 - 1 = 4.'
  },
  {
    id: 'telegram-nat-spearman-brown-01', type: 'NAT', marks: 2, topic: 'psychometrics',
    question: 'A test has reliability 0.60. Using the Spearman-Brown formula, estimate the reliability after doubling its length. Enter two decimal places.',
    answer: 0.75, tolerance: 0.01,
    explanation: 'The doubled-length reliability is (2 x 0.60) / (1 + 0.60) = 0.75.'
  },
  {
    id: 'telegram-nat-sem-01', type: 'NAT', marks: 2, topic: 'psychometrics',
    question: 'A test has standard deviation 10 and reliability 0.84. What is its standard error of measurement?',
    answer: 4, tolerance: 0.01,
    explanation: 'SEM = SD x square root of (1 - reliability) = 10 x square root of 0.16 = 4.'
  },
  {
    id: 'telegram-nat-discrimination-01', type: 'NAT', marks: 1, topic: 'psychometrics',
    question: 'On one item, 80% of the upper group and 30% of the lower group answer correctly. What is the upper-lower discrimination index?',
    answer: 0.5, tolerance: 0.001,
    explanation: 'The discrimination index is 0.80 - 0.30 = 0.50.'
  },
  {
    id: 'telegram-nat-iq-01', type: 'NAT', marks: 1, topic: 'psychometrics',
    question: 'Using the historical ratio-IQ formula, what IQ corresponds to mental age 12 and chronological age 10?',
    answer: 120, tolerance: 0,
    explanation: 'Ratio IQ = mental age / chronological age x 100 = 12 / 10 x 100 = 120.'
  },
  {
    id: 'telegram-nat-weber-01', type: 'NAT', marks: 2, topic: 'perception-learning-memory',
    question: 'A just-noticeable difference is 2 units when the baseline stimulus is 40 units. What is the Weber fraction?',
    answer: 0.05, tolerance: 0.001,
    explanation: 'The Weber fraction is change in intensity divided by baseline intensity: 2 / 40 = 0.05.'
  },
  {
    id: 'telegram-nat-heritability-01', type: 'NAT', marks: 2, topic: 'biological-evolutionary',
    question: 'In a population, genetic variance is 20 and total phenotypic variance is 50. What is broad-sense heritability?',
    answer: 0.4, tolerance: 0.001,
    explanation: 'Broad-sense heritability is genetic variance divided by phenotypic variance: 20 / 50 = 0.40.'
  }
];

function randomInt(rng, minimum, maximum) {
  return minimum + Math.floor(rng() * (maximum - minimum + 1));
}

function compactNumber(value) {
  return Math.round(value * 1000) / 1000;
}

export function generateTelegramNatVariants(rng = Math.random) {
  const factorA = randomInt(rng, 2, 5);
  const factorB = randomInt(rng, 3, 7);

  const mean = randomInt(rng, 4, 8) * 10;
  const sd = randomInt(rng, 1, 4) * 5;
  const z = randomInt(rng, 1, 3);
  const score = mean + (sd * z);

  const correlation = randomInt(rng, 3, 9) / 10;
  const sharedVariance = compactNumber(correlation * correlation * 100);

  const probabilityA = randomInt(rng, 2, 8) / 10;
  const probabilityB = randomInt(rng, 2, 8) / 10;
  const jointProbability = compactNumber(probabilityA * probabilityB);

  const sequenceStart = randomInt(rng, 2, 12);
  const sequenceStep = randomInt(rng, 1, 5);
  const sequence = Array.from({ length: 5 }, (_, index) => sequenceStart + (sequenceStep * index));
  const sequenceMean = sequenceStart + (sequenceStep * 2);

  return [
    {
      id: `telegram-nat-dynamic-factorial-${factorA}-${factorB}`,
      type: 'NAT', marks: 1, topic: 'research-methods-statistics',
      question: `How many treatment combinations are present in a ${factorA} x ${factorB} factorial design?`,
      answer: factorA * factorB, tolerance: 0,
      explanation: `The number of cells is the product of factor levels: ${factorA} x ${factorB} = ${factorA * factorB}.`,
    },
    {
      id: `telegram-nat-dynamic-z-${mean}-${sd}-${score}`,
      type: 'NAT', marks: 1, topic: 'research-methods-statistics',
      question: `A score is ${score} in a distribution with mean ${mean} and standard deviation ${sd}. What is its z score?`,
      answer: z, tolerance: 0,
      explanation: `z = (X - mean) / SD = (${score} - ${mean}) / ${sd} = ${z}.`,
    },
    {
      id: `telegram-nat-dynamic-r2-${String(correlation).replace('.', '-')}`,
      type: 'NAT', marks: 2, topic: 'research-methods-statistics',
      question: `A study reports a correlation of ${correlation.toFixed(1)}. What percentage of variance is shared by the two variables?`,
      answer: sharedVariance, tolerance: 0.01,
      explanation: `Shared variance is r squared multiplied by 100: ${correlation.toFixed(1)} squared x 100 = ${sharedVariance}.`,
    },
    {
      id: `telegram-nat-dynamic-probability-${String(probabilityA).replace('.', '-')}-${String(probabilityB).replace('.', '-')}`,
      type: 'NAT', marks: 2, topic: 'research-methods-statistics',
      question: `Two independent events have probabilities ${probabilityA.toFixed(1)} and ${probabilityB.toFixed(1)}. What is the probability that both occur?`,
      answer: jointProbability, tolerance: 0.001,
      explanation: `For independent events, multiply the probabilities: ${probabilityA.toFixed(1)} x ${probabilityB.toFixed(1)} = ${jointProbability}.`,
    },
    {
      id: `telegram-nat-dynamic-mean-${sequenceStart}-${sequenceStep}`,
      type: 'NAT', marks: 1, topic: 'research-methods-statistics',
      question: `What is the arithmetic mean of the scores ${sequence.join(', ')}?`,
      answer: sequenceMean, tolerance: 0,
      explanation: `The five equally spaced scores are symmetric around ${sequenceMean}, so their arithmetic mean is ${sequenceMean}.`,
    },
  ];
}
