import { XH_C5_DAILY_MSQ_QUESTIONS as BASE_QUESTIONS } from './xhC5DailyMsqQuestionBankData.js';
import { XH_C5_HARD_MSQ_PART_1 } from './xhC5HardMsqPart1.js';
import { XH_C5_HARD_MSQ_PART_2 } from './xhC5HardMsqPart2.js';
import { XH_C5_HARD_MSQ_PART_3 } from './xhC5HardMsqPart3.js';
import { XH_C5_HARD_MSQ_PART_4 } from './xhC5HardMsqPart4.js';
import { XH_C5_MSQ_ARCHETYPE_EXPANSION } from './xhC5MsqArchetypeExpansion.js';
import { attachMsqType } from './xhC5MsqTypes.js';
import { XH_C5_PYQ_STYLE_OVERRIDES_BASE_1 } from './xhC5PyqStyleOverridesBase1.js';
import { XH_C5_PYQ_STYLE_OVERRIDES_BASE_2 } from './xhC5PyqStyleOverridesBase2.js';
import { XH_C5_PYQ_STYLE_OVERRIDES_BASE_3 } from './xhC5PyqStyleOverridesBase3.js';
import { XH_C5_PYQ_STYLE_OVERRIDES_BASE_4 } from './xhC5PyqStyleOverridesBase4.js';
import { XH_C5_PYQ_STYLE_OVERRIDES_BASE_5 } from './xhC5PyqStyleOverridesBase5.js';
import { XH_C5_PYQ_STYLE_OVERRIDES_HARD_1 } from './xhC5PyqStyleOverridesHard1.js';
import { XH_C5_PYQ_STYLE_OVERRIDES_HARD_2 } from './xhC5PyqStyleOverridesHard2.js';
import { XH_C5_PYQ_STYLE_OVERRIDES_HARD_3 } from './xhC5PyqStyleOverridesHard3.js';
import { XH_C5_PYQ_STYLE_OVERRIDES_HARD_4 } from './xhC5PyqStyleOverridesHard4.js';

const PYQ_STYLE_OVERRIDES = {
  ...XH_C5_PYQ_STYLE_OVERRIDES_BASE_1,
  ...XH_C5_PYQ_STYLE_OVERRIDES_BASE_2,
  ...XH_C5_PYQ_STYLE_OVERRIDES_BASE_3,
  ...XH_C5_PYQ_STYLE_OVERRIDES_BASE_4,
  ...XH_C5_PYQ_STYLE_OVERRIDES_BASE_5,
  ...XH_C5_PYQ_STYLE_OVERRIDES_HARD_1,
  ...XH_C5_PYQ_STYLE_OVERRIDES_HARD_2,
  ...XH_C5_PYQ_STYLE_OVERRIDES_HARD_3,
  ...XH_C5_PYQ_STYLE_OVERRIDES_HARD_4,
};

export const XH_C5_DAILY_MSQ_QUESTIONS = [
  ...XH_C5_HARD_MSQ_PART_1,
  ...XH_C5_HARD_MSQ_PART_2,
  ...XH_C5_HARD_MSQ_PART_3,
  ...XH_C5_HARD_MSQ_PART_4,
  ...XH_C5_MSQ_ARCHETYPE_EXPANSION,
  ...BASE_QUESTIONS,
].map((question) => attachMsqType({
  ...question,
  ...(PYQ_STYLE_OVERRIDES[question.id] || {}),
}));

export const XH_C5_DAILY_MSQ_CARDINALITY_COUNTS = Object.fromEntries(
  [1, 2, 3, 4].map((count) => [
    count,
    XH_C5_DAILY_MSQ_QUESTIONS.filter((question) => question.answers.length === count).length,
  ]),
);
