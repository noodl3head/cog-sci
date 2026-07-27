import { QUIZ_DATA } from './quizData';
import { prepareQuestionForUse } from './questionQuality';

export function getBook(bookId) {
  return QUIZ_DATA.books.find((b) => b.id === bookId) || null;
}

export function getChapter(bookId, chapterId) {
  const book = getBook(bookId);
  if (!book) return null;
  return book.chapters.find((c) => c.id === chapterId) || null;
}

export function getChapterQuestions(bookId, chapterId) {
  const chapter = getChapter(bookId, chapterId);
  if (!chapter) return [];

  return chapter.questions.flatMap((question, index) => {
    const prepared = prepareQuestionForUse(question, {
      bookId,
      chapterId,
      questionNumber: index + 1,
      previousQuestion: chapter.questions[index - 1] || null,
    });
    return prepared.status === 'playable' ? [prepared.question] : [];
  });
}

export function getChapterQuestionCount(bookId, chapterId) {
  return getChapterQuestions(bookId, chapterId).length;
}

export function totalQuestionCount() {
  let total = 0;
  QUIZ_DATA.books.forEach((b) =>
    b.chapters.forEach((c) => (total += getChapterQuestionCount(b.id, c.id)))
  );
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
      getChapterQuestions(book.id, chapter.id).forEach((q) => {
        const key = `${book.id}::${chapter.id}::${q.questionNumber}`;
        index[key] = {
          ...q,
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
