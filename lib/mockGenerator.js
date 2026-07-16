import { QUIZ_DATA } from './quizData';

export function getAllPlayableQuestions() {
  const out = [];
  for (const book of QUIZ_DATA.books) {
    for (const ch of book.chapters) {
      ch.questions.forEach((q, i) => {
        if (!q.imageRequired) {
          out.push({
            ...q,
            questionNumber: i + 1,
            chapterId: ch.id,
            chapterTitle: ch.title,
            bookId: book.id,
            bookName: book.name,
          });
        }
      });
    }
  }
  return out;
}

// XOR-shift 32-bit seeded PRNG
function seededRng(seed) {
  let s = (seed >>> 0) || 1;
  return () => {
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

function shuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 20 × 1-mark (−⅓ penalty) + 15 × 2-mark (−⅔ penalty) = 35 questions, 50 marks max
function buildMock(rng) {
  const shuffled = shuffle(getAllPlayableQuestions(), rng);
  return {
    section1: shuffled.slice(0, 20),
    section2: shuffled.slice(20, 35),
  };
}

// Five fixed seeds — these always produce the same 5 preset mocks
const PRESET_SEEDS = [0x4c2a3f1e, 0x7b8e9c20, 0x1d3a5f7e, 0x9c2b4a6d, 0x3e7f1b5c];

export function generatePresetMock(index) {
  return buildMock(seededRng(PRESET_SEEDS[index]));
}

export function generateRandomMock() {
  return buildMock(seededRng(Math.floor(Math.random() * 0xffffffff)));
}
