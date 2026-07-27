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
      <section className="home-hero">
        <div className="home-hero-copy">
          <p className="page-eyebrow">Your GATE 2027 workspace</p>
          <h1>Turn the syllabus into<br /><em>exam confidence.</em></h1>
          <p className="home-hero-sub">Study by chapter, test under pressure, and bring every mistake back into your revision loop.</p>
          <div className="home-hero-actions">
            <Link href="/mock" className="btn">Start a mock</Link>
            <Link href="/study" className="btn btn-secondary">Open study notes</Link>
          </div>
        </div>
        <div className="home-hero-stats" aria-label="Question bank summary">
          <div><strong>{totalQuestionCount()}</strong><span>Mapped questions</span></div>
          <div><strong>{totalChapterCount()}</strong><span>Study chapters</span></div>
          <div><strong>XH5</strong><span>Official syllabus</span></div>
        </div>
      </section>

      <div className="screen active">
        <div className="section-heading">
          <div>
            <p className="page-eyebrow">Question bank</p>
            <h2>Choose a chapter</h2>
          </div>
          <Link href="/coverage" className="text-action">View syllabus coverage →</Link>
        </div>
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
