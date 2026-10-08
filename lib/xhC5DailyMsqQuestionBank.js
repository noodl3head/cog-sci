import { XH_C5_DAILY_MSQ_QUESTIONS as BASE_QUESTIONS } from './xhC5DailyMsqQuestionBankData.js';
import { XH_C5_HARD_MSQ_PART_1 } from './xhC5HardMsqPart1.js';
import { XH_C5_HARD_MSQ_PART_2 } from './xhC5HardMsqPart2.js';
import { XH_C5_HARD_MSQ_PART_3 } from './xhC5HardMsqPart3.js';
import { XH_C5_HARD_MSQ_PART_4 } from './xhC5HardMsqPart4.js';
import { XH_C5_MSQ_ARCHETYPE_EXPANSION } from './xhC5MsqArchetypeExpansion.js';
import { attachMsqType } from './xhC5MsqTypes.js';

export const XH_C5_DAILY_MSQ_QUESTIONS = [
  ...XH_C5_HARD_MSQ_PART_1,
  ...XH_C5_HARD_MSQ_PART_2,
  ...XH_C5_HARD_MSQ_PART_3,
  ...XH_C5_HARD_MSQ_PART_4,
  ...XH_C5_MSQ_ARCHETYPE_EXPANSION,
  ...BASE_QUESTIONS,
].map(attachMsqType);

export const XH_C5_DAILY_MSQ_CARDINALITY_COUNTS = Object.fromEntries(
  [1, 2, 3, 4].map((count) => [
    count,
    XH_C5_DAILY_MSQ_QUESTIONS.filter((question) => question.answers.length === count).length,
  ]),
);
