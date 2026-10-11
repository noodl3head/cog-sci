# XH-C5 MSQ format profile

## Source snapshot

The local 2021–2026 XH-C5 PYQ data contains **103 MSQs**. The reproducible audit is `scripts/auditXhC5Msq.mjs`; its JSON output is committed as `xh-c5-msq-audit.json`.

| Correct options | PYQs | Share |
| --- | ---: | ---: |
| 1 | 6 | 5.8% |
| 2 | 56 | 54.4% |
| 3 | 40 | 38.8% |
| 4 | 1 | 1.0% |

| Paper year | MSQs |
| --- | ---: |
| 2021 | 18 |
| 2022 | 21 |
| 2023 | 15 |
| 2024 | 19 |
| 2025 | 15 |
| 2026 | 15 |

The audit has 13 one-mark and 90 two-mark source MSQs.

## Observed construction patterns

| Stem family | Typical construction |
| --- | --- |
| Direct factual/classification | Ask which listed concepts fit a defined category or mechanism. |
| Negative stem | Ask which option(s) are **NOT** associated with a construct; keep the negation conspicuous. |
| Statement-truth | Present independently evaluable claims and ask which statements are correct. |
| Scenario/application | Supply a brief research, clinical, social, or developmental situation and ask which inferences follow. |
| Relation/method-selection | Ask which design, measure, or analytic choice supports a stated inference. |
| Match/column form | Require independent evaluation of mappings rather than a single compound pattern guess. |

Common wording includes “Which of the following is/are…”, “Which … is/are NOT…”, and “Which statements … are correct?”

## Authoring rules

- Each of A–D is independently true or false and tests one concept or claim.
- Use plausible, unambiguously false distractors; explain why every option is true or false.
- Do not use “all of the above” or “none of the above.”
- Avoid wording that leaks the number of correct options.
- Use one-mark questions for direct knowledge/classification and two-mark questions for scenarios, conditional statements, multiple concepts, or method selection.
- Match the PYQ surface style as well as its concepts: prefer direct “Which…” stems, ordinary textbook vocabulary, and short parallel options. Difficulty should come from construct boundaries, direction, scope, or application rather than verbal length.
- The 2021–2026 PYQs average 15.9 stem words and 41.6 words including options. The delivered authored bank is kept close to that profile rather than penalizing short noun-phrase options.
- The PYQ 6/56/40/1 distribution is a **generator target**, sampled per question; it is never displayed to the learner and does not impose a fixed pattern on a ten-question mock.
- Match the PYQ marks profile at delivery time. Because finite topic/archetype pools create fallbacks, selector weights are calibrated against generated mocks rather than copied mechanically from the raw 13/90 paper counts.
- Do not expose a false option through a lone absolute cue such as “proves”, “every”, “sole”, or “cannot”. Incorrect options should fail through an adjacent construct, direction, condition, or scope boundary.
- Every four-archetype cycle must deliver a substantial reviewed-hard tier; bank-level hard-item counts alone are insufficient because sparse cycles can otherwise become much easier.

## Authored bank coverage

The daily bank uses all active XH-C5 topic IDs and deliberately includes every cardinality. Coverage is maintained in `lib/xhC5DailyMsqQuestionBank.js` and verified by `tests/xhC5DailyMsqQuestionBank.test.mjs`.

| Topic | Questions |
| --- | ---: |
| research-methods-statistics | 18 |
| psychometrics | 17 |
| biological-evolutionary | 15 |
| perception-learning-memory | 17 |
| cognition | 15 |
| personality | 16 |
| motivation-emotion-stress | 16 |
| social | 17 |
| development | 16 |
| clinical-organizational | 17 |
| applications | 15 |

The authored bank uses 1-, 2-, 3-, and rare 4-correct MSQs; the sampler, rather than a visible quota, determines daily cardinalities.

After the difficulty-fidelity revision, the 179 delivered items average **19.6 stem words** and **51.4 total words**, with stems ranging from 6–33 words and complete items from 34–75 words.

Bank version 6 adds delivery-level fidelity gates and an eight-item hard expansion for sparse archetypes. Across 20 deterministic 500-mock audits with a rolling five-session exclusion window, delivered questions produced **89.6–90.8% two-mark items**, **16.3–17.2% negative/exclusion stems**, **3.0–3.9% one-correct**, **57.6–59.6% two-correct**, **36.5–38.5% three-correct**, and **0.5–1.0% four-correct**. Every cycle delivered at least **30% reviewed-hard items**, and no bank item exposed a lone incorrect option through the audited absolute-word cues.
