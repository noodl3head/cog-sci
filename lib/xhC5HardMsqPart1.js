export const XH_C5_HARD_MSQ_PART_1 = [
  {
    id: "xh-c5-hard-v3-p1-001",
    type: "MSQ",
    topic: "research-methods-statistics",
    marks: 2,
    question: "Twenty-four schools are pair-matched on prior achievement and size; one school in each pair is randomized to a teacher-coaching program and the other to usual practice. Outcomes are measured for 40 students per school before and after implementation. The estimated adjusted post-test difference is 0.28 SD. Which statements are warranted when estimating and interpreting the program effect?",
    options: {
      A: "Treating the 960 student outcomes as independent would tend to overstate uncertainty when outcomes of students in the same school are positively correlated.",
      B: "Adjustment for baseline achievement can improve precision and account for chance baseline imbalance without changing the school as the unit of randomization.",
      C: "Under limited between-school interference and comparable attrition, randomization supports a causal interpretation for offering the program to schools represented by this design.",
      D: "Power depends materially on the number of schools and the intraclass correlation, even though many students are observed within each school."
    },
    answers: ["B", "C", "D"],
    explanation: "A: Incorrect — ignoring positive within-school dependence generally makes standard errors too small, so uncertainty is understated rather than overstated. B: Correct — prognostic baseline adjustment commonly increases precision, while the assignment mechanism remains school-level. C: Correct — with interference and differential attrition sufficiently controlled, the randomized offer identifies a causal effect for the study population and implementation. D: Correct — cluster count and intraclass correlation govern much of the effective sample size; adding students within a fixed set of schools has diminishing returns.",
    sourceName: "Original GATE-style MSQ bank",
    challengeLevel: "gate-hard-v1"
  },
  {
    id: "xh-c5-hard-v3-p1-002",
    type: "MSQ",
    topic: "research-methods-statistics",
    marks: 2,
    question: "In a two-period crossover experiment, participants receive a sedating antihistamine and placebo in randomized AB or BA order, separated by a 48-hour washout. Reaction time returns to baseline before period 2 on average, but participants who received the drug first show a larger practice gain in period 2 than those who received placebo first. Which conclusions or analyses are appropriate?",
    options: {
      A: "A within-participant treatment contrast controls stable differences in baseline reaction speed, provided period and sequence-related effects are modeled adequately.",
      B: "The sequence-dependent practice gain can create a treatment-by-period complication even if mean reaction time appears to have returned to baseline before period 2.",
      C: "Counterbalancing makes the simple pooled drug-minus-placebo mean unbiased under any form of condition-dependent practice.",
      D: "Discarding period 1 and comparing period-2 drug and placebo observations preserves the original within-participant advantage."
    },
    answers: ["A", "B"],
    explanation: "A: Correct — each participant serves as a control for stable person-level differences, but period, sequence, and carryover-related structure still require attention. B: Correct — return of the outcome mean to baseline does not exclude a lingering effect on later learning or practice, so sequence-specific gains can contaminate the treatment contrast. C: Incorrect — counterbalancing handles simple order effects, whereas differential practice induced by the first condition can remain. D: Incorrect — a period-2 comparison is between sequence groups and therefore gives up the within-participant comparison while remaining vulnerable to sequence differences.",
    sourceName: "Original GATE-style MSQ bank",
    challengeLevel: "gate-hard-v1"
  },
  {
    id: "xh-c5-hard-v3-p1-003",
    type: "MSQ",
    topic: "research-methods-statistics",
    marks: 1,
    question: "An observational study estimates the effect of an intensive statistics course on final examination performance. Baseline quantitative skill and prior motivation affect course enrollment and performance. Mid-semester self-efficacy is partly caused by enrollment and affects performance. Follow-up completion is affected by both adverse course experiences and low performance. Which analytic claims are defensible?",
    options: {
      A: "For a total-effect estimand, conditioning on mid-semester self-efficacy can remove part of the pathway through which enrollment influences performance.",
      B: "Restricting analysis to students with complete follow-up can induce selection bias because completion is influenced by variables related to exposure experience and outcome.",
      C: "Adjustment for baseline skill and prior motivation can address confounding through those measured common causes, while leaving residual confounding possible.",
      D: "A well-fitted enrollment propensity score also balances unmeasured determinants of enrollment and performance."
    },
    answers: ["A", "B", "C"],
    explanation: "A: Correct — self-efficacy is post-enrollment and mediates part of the effect, so adjustment changes the target away from the total effect and may introduce additional bias. B: Correct — conditioning on completion can open a noncausal association when completion is jointly influenced by exposure-related experiences and outcome determinants. C: Correct — measured-confounder adjustment is useful under its assumptions but does not remove bias from omitted common causes or serious measurement error. D: Incorrect — propensity methods balance observed covariates included in the model; balance of unmeasured causes does not follow from model fit.",
    sourceName: "Original GATE-style MSQ bank",
    challengeLevel: "gate-hard-v1"
  },
  {
    id: "xh-c5-hard-v3-p1-004",
    type: "MSQ",
    topic: "research-methods-statistics",
    marks: 2,
    question: "A trial has a preregistered maximum sample of 300 but examines the treatment contrast after every additional 25 participants. Recruitment stops at n = 175 when an unadjusted two-sided test first yields p = .041; the corresponding ordinary 95% confidence interval narrowly excludes zero. No sequential boundary was specified. Which interpretations are appropriate?",
    options: {
      A: "Repeated opportunities to stop after a favorable result make the reported nominal p-value and ordinary interval miscalibrated for the data-dependent procedure.",
      B: "The treatment estimate at the stopping look may be exaggerated because crossing the threshold preferentially occurs when sampling fluctuation favors a larger estimate.",
      C: "The confidence interval retains 95% repeated-sampling coverage because its formula was computed correctly at n = 175.",
      D: "The stopping rule changes the randomization mechanism, so baseline covariate balance can no longer arise by chance."
    },
    answers: ["A", "B"],
    explanation: "A: Correct — optional stopping with repeated unadjusted looks inflates the chance of crossing a nominal threshold, so fixed-sample inferential calibration does not describe the full procedure. B: Correct — stopping on first significance selects a favorable fluctuation and can produce an upwardly biased or unstable estimate at that look. C: Incorrect — algebraically correct fixed-sample limits need not retain their advertised coverage under an outcome-dependent stopping rule. D: Incorrect — the original treatment randomization remains intact; the problem concerns the sampling and stopping distribution of the estimator and test.",
    sourceName: "Original GATE-style MSQ bank",
    challengeLevel: "gate-hard-v1"
  },
  {
    id: "xh-c5-hard-v3-p1-005",
    type: "MSQ",
    topic: "psychometrics",
    marks: 2,
    question: "A six-item burnout scale is administered to nurses in two language groups. A multigroup CFA supports the same one-factor pattern and equal loadings. Constraining item intercepts worsens fit because two translated items have higher intercepts in Group B, while the remaining four intercepts are stable. Which inferences are psychometrically defensible?",
    options: {
      A: "Equal loadings support comparing associations between the latent burnout factor and external variables across groups, subject to the rest of the model being adequate.",
      B: "The intercept differences imply that the factor has a different psychological meaning in the two groups despite the supported loading pattern.",
      C: "A latent mean comparison may be considered under a justified partial-scalar model that frees the two noninvariant intercepts and anchors the factor with invariant items.",
      D: "A raw observed-score mean difference can reflect both latent burnout differences and the item-intercept shifts."
    },
    answers: ["A", "C", "D"],
    explanation: "A: Correct — metric invariance places factor-unit relations on a comparable footing, permitting comparison of structural associations when other assumptions hold. B: Incorrect — intercept noninvariance concerns expected item levels at a given factor score; it does not by itself negate the common factor configuration and loading interpretation. C: Correct — partial scalar invariance can support latent mean identification when enough invariant anchors remain and the freed parameters are substantively defensible. D: Correct — observed means combine latent-factor location with item-specific intercept effects, so raw group differences need not represent pure latent mean differences.",
    sourceName: "Original GATE-style MSQ bank",
    challengeLevel: "gate-hard-v1"
  },
  {
    id: "xh-c5-hard-v3-p1-006",
    type: "MSQ",
    topic: "psychometrics",
    marks: 1,
    question: "A 2-parameter logistic IRT analysis of a reasoning test shows that Item 8 has the same discrimination in two groups but a lower difficulty parameter in Group B after matching examinees on the latent trait. The total test-information curve peaks near θ = 0 and declines sharply above θ = 1.5. Which statements follow?",
    options: {
      A: "Item 8 displays a uniform form of differential item functioning because group membership shifts its response probability across matched trait levels without a discrimination difference.",
      B: "The test yields its smallest conditional standard errors above θ = 1.5 because fewer items are targeted there.",
      C: "High coefficient alpha for the full test would resolve the group-comparability concern raised by Item 8.",
      D: "Scores near θ = 0 are estimated more precisely than scores well above θ = 1.5, given the reported information function."
    },
    answers: ["A", "D"],
    explanation: "A: Correct — equal slopes with a group-related difficulty shift is the classic uniform-DIF pattern in a 2PL framework. B: Incorrect — conditional standard error varies approximately as the inverse square root of information, so declining information produces larger errors. C: Incorrect — internal consistency can remain high while a particular item functions differently across groups; reliability does not settle measurement invariance. D: Correct — peak information around θ = 0 implies comparatively lower conditional standard error there than in the sparsely informative upper range.",
    sourceName: "Original GATE-style MSQ bank",
    challengeLevel: "gate-hard-v1"
  },
  {
    id: "xh-c5-hard-v3-p1-007",
    type: "MSQ",
    topic: "psychometrics",
    marks: 2,
    question: "Trainees conduct four interviews. Each interview is scored by two raters newly sampled for that occasion, so raters are nested within occasions rather than crossed with trainees across occasions. A generalizability study finds sizable person-by-occasion variance, modest rater-within-occasion variance, and a small residual component. Which design conclusions are justified?",
    options: {
      A: "Adding occasions can reduce the contribution of person-by-occasion variability to the error variance of the trainee's mean score.",
      B: "Adding raters within each occasion directly averages the person-by-occasion component to the same extent as adding occasions.",
      C: "Because different raters are used on different occasions, the design does not separately identify a stable rater-severity effect that generalizes across occasions.",
      D: "For an absolute decision, systematic occasion and rater-severity components can matter as error even when they would cancel from a purely relative ranking under a balanced design."
    },
    answers: ["A", "C", "D"],
    explanation: "A: Correct — averaging across more occasions attenuates error arising from person-specific fluctuations across occasions. B: Incorrect — extra raters reduce rater-related error within an occasion, but they do not create additional occasions and therefore do not average the person-by-occasion component equivalently. C: Correct — nesting confounds rater identity with occasion-specific sampling, preventing estimation of a rater main effect that persists across occasions. D: Correct — absolute decisions count facet-level shifts that affect score level, whereas relative decisions focus more narrowly on rank-changing interactions under the specified universe of generalization.",
    sourceName: "Original GATE-style MSQ bank",
    challengeLevel: "gate-hard-v1"
  },
  {
    id: "xh-c5-hard-v3-p1-008",
    type: "MSQ",
    topic: "psychometrics",
    marks: 2,
    question: "A cognitive selection test correlates r = .20 with supervisor-rated performance among hired employees. Test reliability is .80, criterion reliability is .50, and hiring previously restricted the test-score range. The organization considers interpreting the coefficient as evidence about validity in the applicant pool. Which statements are appropriate?",
    options: {
      A: "Measurement error in both variables and restriction of test-score range can attenuate the observed incumbent correlation relative to a corresponding association in an unrestricted population.",
      B: "A correction for attenuation and range restriction is informative to the extent that its reliability, selection, linearity, and population assumptions are credible.",
      C: "Dividing .20 by the criterion reliability yields the disattenuated validity coefficient because reliability enters the correction without a square root.",
      D: "Once corrected, the coefficient also establishes that use of the test has equivalent prediction errors across demographic groups."
    },
    answers: ["A", "B"],
    explanation: "A: Correct — unreliability weakens observed covariance, and selecting a narrow score band can further suppress the correlation. B: Correct — corrections are model-based extrapolations; inaccurate reliabilities, indirect selection, nonlinearity, or population differences can make them misleading. C: Incorrect — the classical correction for unreliability uses the square root of the product of predictor and criterion reliabilities, with range-restriction correction requiring additional information. D: Incorrect — an overall corrected validity coefficient does not evaluate subgroup calibration, intercept differences, differential prediction, or fairness consequences.",
    sourceName: "Original GATE-style MSQ bank",
    challengeLevel: "gate-hard-v1"
  },
  {
    id: "xh-c5-hard-v3-p1-009",
    type: "MSQ",
    topic: "biological-evolutionary",
    marks: 2,
    question: "Three patient groups undergo delay fear conditioning with a tone paired with shock in a distinctive room. Group H has bilateral hippocampal damage, Group A has bilateral amygdala damage, and controls have neither lesion. Tests assess skin-conductance responses to the tone in a new room, responses to the original room without the tone, and verbal report of the tone–shock contingency. Which predictions fit established functional dissociations?",
    options: {
      A: "Group H may show a conditioned autonomic response to the discrete tone while showing reduced fear to the conditioning context.",
      B: "Group A may verbally describe the tone–shock relation yet show reduced conditioned autonomic responding to the tone.",
      C: "A preserved verbal contingency report in Group A would imply preserved amygdala-dependent expression of conditioned autonomic fear.",
      D: "The contrast between contextual and discrete-cue responding in Group H is consistent with a hippocampal contribution to configural or relational context representation."
    },
    answers: ["A", "B", "D"],
    explanation: "A: Correct — hippocampal damage can disproportionately disrupt representation of the environmental context while sparing learning to a simple cue through amygdala-centered circuitry. B: Correct — declarative knowledge of the contingency can be supported by medial temporal systems even when amygdala damage reduces conditioned autonomic expression. C: Incorrect — explicit contingency knowledge and autonomic fear expression are dissociable; preserved report does not entail preserved amygdala-mediated responding. D: Correct — contextual fear depends on combining multiple environmental relations, a computation strongly associated with hippocampal function.",
    sourceName: "Original GATE-style MSQ bank",
    challengeLevel: "gate-hard-v1"
  },
  {
    id: "xh-c5-hard-v3-p1-010",
    type: "MSQ",
    topic: "biological-evolutionary",
    marks: 1,
    question: "A right-handed patient with complete callosotomy fixates centrally. The word KEY is flashed briefly to the left visual field. Hidden from view, a key and several distractors are placed within reach. Which outcomes are consistent with hemispheric specialization and disconnection?",
    options: {
      A: "The patient may select the key accurately with the left hand while being unable to name the flashed word aloud.",
      B: "The patient may name KEY readily because left-visual-field input projects first to the language-dominant left hemisphere.",
      C: "Accurate left-hand selection would show that the right hemisphere processed task-relevant meaning despite limited transfer to left-hemisphere speech systems.",
      D: "Accurate naming accompanied by failed left-hand selection is the characteristic prediction for this left-visual-field presentation."
    },
    answers: ["A", "C"],
    explanation: "A: Correct — left-visual-field information reaches the right hemisphere, which controls the left hand and can guide nonverbal selection, while callosal disconnection limits access to left-hemisphere speech. B: Incorrect — left visual field projects initially to the right hemisphere, not the language-dominant left hemisphere. C: Correct — semantically appropriate manual choice can reveal right-hemisphere comprehension that cannot be expressed through the disconnected dominant speech system. D: Incorrect — the expected asymmetry favors left-hand selection over verbal naming for a left-visual-field word in this setup.",
    sourceName: "Original GATE-style MSQ bank",
    challengeLevel: "gate-hard-v1"
  },
  {
    id: "xh-c5-hard-v3-p1-011",
    type: "MSQ",
    topic: "biological-evolutionary",
    marks: 2,
    question: "In a cooperative breeder, an adult can forgo one breeding attempt, reducing its expected surviving offspring by 0.30, and instead help rear three full siblings, increasing each sibling's probability of survival to reproduction by 0.25. In a neighboring population, unrelated adults exchange food repeatedly and remember previous partners. Which evolutionary interpretations are justified?",
    options: {
      A: "Using relatedness r = .50 for full siblings, the helper's weighted indirect benefit is 3 × .25 × .50 = .375, which exceeds the stated direct cost of .30.",
      B: "The calculation supports spread of helping under Hamilton's rule if the survival increments and fitness costs are measured on a comparable scale and other fitness effects are negligible.",
      C: "Partner-contingent food exchange among unrelated adults can be favored through repeated interaction when future benefits, recognition, and defection costs sustain reciprocity.",
      D: "Because helping satisfies Hamilton's inequality in the first population, learning and ecological constraints have no role in the expressed behavior."
    },
    answers: ["A", "B", "C"],
    explanation: "A: Correct — the summed relatedness-weighted benefit is .375, exceeding the .30 loss in expected direct offspring under the supplied quantities. B: Correct — Hamilton's rule is informative when benefits and costs refer to comparable marginal fitness consequences and omitted effects do not reverse the balance. C: Correct — genetic relatedness is not required for reciprocal cooperation when repeated encounters and partner memory alter the long-run payoff structure. D: Incorrect — an inclusive-fitness advantage concerns selection on a capacity or rule; developmental learning, opportunity, and local ecology can still govern whether helping is expressed.",
    sourceName: "Original GATE-style MSQ bank",
    challengeLevel: "gate-hard-v1"
  },
  {
    id: "xh-c5-hard-v3-p1-012",
    type: "MSQ",
    topic: "biological-evolutionary",
    marks: 2,
    question: "Monkeys learn that a visual cue predicts juice after one second. Early in learning, midbrain dopamine neurons fire phasically to unexpected juice. After learning, the response shifts to the cue, and omission of predicted juice produces a pause near the expected delivery time. A low dose of a dopamine antagonist later reduces response vigor, while cue-choice accuracy remains above chance. Which interpretations are supported?",
    options: {
      A: "The temporal shift and omission pause are consistent with a signed reward-prediction-error signal rather than a response to reward consumption alone.",
      B: "Reduced vigor with partly preserved choice accuracy permits a performance or motivational effect in addition to any effect on updating learned values.",
      C: "The omission pause indicates that dopamine neurons encode sensory novelty because the omitted juice supplies a novel stimulus.",
      D: "Above-chance choice during antagonist treatment shows that dopamine signaling had no contribution to acquisition of the cue value before treatment."
    },
    answers: ["A", "B"],
    explanation: "A: Correct — firing to an unexpected reward, transfer to its predictor, and a negative-going response when an expected reward is omitted match core temporal-difference prediction-error features. B: Correct — slower or less vigorous responding with retained discrimination can reflect altered incentive or motor expression, so performance and learning effects should be separated experimentally. C: Incorrect — no juice stimulus appears on omission trials; the pause is time-locked to violated expectation rather than to novel sensory input. D: Incorrect — preserved performance after learning does not reveal whether earlier dopamine activity contributed to acquiring or updating the cue value.",
    sourceName: "Original GATE-style MSQ bank",
    challengeLevel: "gate-hard-v1"
  }
];
