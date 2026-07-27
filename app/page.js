'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { QUIZ_DATA } from '../lib/quizData';
import { getChapterQuestionCount, totalQuestionCount, totalChapterCount } from '../lib/quizHelpers';

export default function HomePage() {
  const [chapterStats, setChapterStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((data) => {
        const map = {};
        (data.latestByChapter || []).forEach((row) => {
          map[`${row.book_id}::${row.chapter_id}`] = {
            questionsSeeen: row.questions_seen,
            latestCorrect: row.latest_correct,
            missedNumbers: row.missed_numbers || [],
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
          GATE <span className="accent">Psych</span> Quizzer
        </h1>
        <div className="nav-links">
          <span className="tag">
            {totalQuestionCount()} Questions &middot; {totalChapterCount()} Chapters
          </span>
          <Link href="/study" className="btn-link">Study</Link>
          <Link href="/mock" className="btn-link">Mock</Link>
          <Link href="/mock/history" className="btn-link">History</Link>
          <Link href="/revision" className="btn-link">Revision</Link>
          <Link href="/pyq" className="btn-link">PYQ</Link>
          <Link href="/coverage" className="btn-link">Coverage</Link>
          <Link href="/stats" className="btn-link">Stats</Link>
        </div>
      </div>

      <div className="screen active">
        {QUIZ_DATA.books.map((book) => {
          const totalQ = book.chapters.reduce((sum, chapter) => sum + getChapterQuestionCount(book.id, chapter.id), 0);
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
                  const questionCount = getChapterQuestionCount(book.id, ch.id);
                  const stat = chapterStats[key];
                  const pct =
                    stat && questionCount > 0
                      ? Math.round((stat.latestCorrect / questionCount) * 100)
                      : null;
                  const missedCount = stat?.missedNumbers?.length ?? 0;
                  const missedParam =
                    missedCount > 0 ? stat.missedNumbers.join(',') : null;

                  return (
                    <div className="chapter-card-wrap" key={ch.id}>
                      <Link
                        href={`/quiz/${book.id}/${ch.id}`}
                        className="chapter-card"
                        data-num={String(ch.number).padStart(2, '0')}
                      >
                        <p className="ch-title">{ch.title}</p>
                        <p className="ch-meta">{questionCount} Questions</p>
                        {!loading && pct !== null && (
                          <div className="ch-progress">
                            <div
                              className="ch-progress-fill"
                              style={{
                                width: pct + '%',
                                background:
                                  pct >= 80
                                    ? 'var(--green)'
                                    : pct >= 50
                                    ? 'var(--yellow)'
                                    : 'var(--red)',
                              }}
                            />
                          </div>
                        )}
                      </Link>
                      {!loading && missedParam && (
                        <Link
                          href={`/quiz/${book.id}/${ch.id}?missed=${missedParam}`}
                          className="missed-practice-link"
                        >
                          ↺ Practice {missedCount} missed
                        </Link>
                      )}
                    </div>
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
