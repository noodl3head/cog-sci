'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { QUIZ_DATA } from '../lib/quizData';
import { totalQuestionCount, totalChapterCount } from '../lib/quizHelpers';

export default function HomePage() {
  const [chapterStats, setChapterStats] = useState({}); // key: `${bookId}::${chapterId}` -> {attempts, correct}
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((data) => {
        const map = {};
        (data.byChapter || []).forEach((row) => {
          map[`${row.book_id}::${row.chapter_id}`] = {
            attempts: row.attempts,
            correct: row.correct,
          };
        });
        setChapterStats(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="app">
      <div className="masthead">
        <h1>
          AP <span className="accent">Psych</span> Quizzer
        </h1>
        <div className="nav-links">
          <span className="tag">
            {totalQuestionCount()} Questions &middot; {totalChapterCount()} Chapters
          </span>
          <Link href="/stats" className="btn-link">
            My Stats
          </Link>
        </div>
      </div>

      <div className="screen active">
        {QUIZ_DATA.books.map((book) => {
          const totalQ = book.chapters.reduce((a, c) => a + c.questions.length, 0);
          return (
            <div className="book-section" key={book.id}>
              <h2 className="book-title">
                {book.name}{' '}
                <span className="count">
                  {book.chapters.length} chapters &middot; {totalQ} questions
                </span>
              </h2>
              <div className="chapter-grid">
                {book.chapters.map((ch) => {
                  const key = `${book.id}::${ch.id}`;
                  const stat = chapterStats[key];
                  const pct =
                    stat && stat.attempts > 0
                      ? Math.round((stat.correct / stat.attempts) * 100)
                      : null;
                  return (
                    <Link
                      href={`/quiz/${book.id}/${ch.id}`}
                      className="chapter-card"
                      data-num={String(ch.number).padStart(2, '0')}
                      key={ch.id}
                    >
                      <p className="ch-title">{ch.title}</p>
                      <p className="ch-meta">{ch.questions.length} Questions</p>
                      {!loading && pct !== null && (
                        <div className="ch-progress">
                          <div
                            className="ch-progress-fill"
                            style={{
                              width: pct + '%',
                              background:
                                pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--yellow)' : 'var(--red)',
                            }}
                          />
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <footer className="note">Tracking your stats across every session &middot; for personal study use</footer>
    </div>
  );
}
