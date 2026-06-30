import { QUIZ_DATA } from './quizData';

export function getBook(bookId) {
  return QUIZ_DATA.books.find((b) => b.id === bookId) || null;
}

export function getChapter(bookId, chapterId) {
  const book = getBook(bookId);
  if (!book) return null;
  return book.chapters.find((c) => c.id === chapterId) || null;
}

export function totalQuestionCount() {
  let total = 0;
  QUIZ_DATA.books.forEach((b) => b.chapters.forEach((c) => (total += c.questions.length)));
  return total;
}

export function totalChapterCount() {
  let total = 0;
  QUIZ_DATA.books.forEach((b) => (total += b.chapters.length));
  return total;
}

// Build a lookup map: "bookId::chapterId::questionNumber" -> { question, options, answer, explanation, chapterTitle, bookName }
export function buildQuestionIndex() {
  const index = {};
  QUIZ_DATA.books.forEach((book) => {
    book.chapters.forEach((chapter) => {
      chapter.questions.forEach((q, i) => {
        const questionNumber = i + 1; // 1-indexed position within the chapter array
        const key = `${book.id}::${chapter.id}::${questionNumber}`;
        index[key] = {
          ...q,
          questionNumber,
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          bookId: book.id,
          bookName: book.name,
        };
      });
    });
  });
  return index;
}
