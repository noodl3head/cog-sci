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
- The PYQ 6/56/40/1 distribution is a **generator target**, sampled per question; it is never displayed to the learner and does not impose a fixed pattern on a ten-question mock.

## Authored bank coverage

The daily bank uses all active XH-C5 topic IDs and deliberately includes every cardinality. Coverage is maintained in `lib/xhC5DailyMsqQuestionBank.js` and verified by `tests/xhC5DailyMsqQuestionBank.test.mjs`.

| Topic | Questions |
| --- | ---: |
| research-methods-statistics | 12 |
| psychometrics | 11 |
| biological-evolutionary | 11 |
| perception-learning-memory | 11 |
| cognition | 11 |
| personality | 11 |
| motivation-emotion-stress | 11 |
| social | 11 |
| development | 11 |
| clinical-organizational | 11 |
| applications | 11 |

The authored bank uses 1-, 2-, 3-, and rare 4-correct MSQs; the sampler, rather than a visible quota, determines daily cardinalities.
