'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { QUIZ_DATA } from '../lib/quizData';
import { getChapterQuestionCount } from '../lib/quizHelpers';
import { dueCount, dueItems } from '../lib/srs';

function computeStreak(activeDays) {
  if (!activeDays || activeDays.length === 0) return 0;
  const days = new Set(activeDays.map((d) => new Date(d).toDateString()));
  let streak = 0;
  const cursor = new Date();
  // allow today OR yesterday to anchor the streak
  if (!days.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1);
  while (days.has(cursor.toDateString())) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export default function HomePage() {
  const [chapterStats, setChapterStats] = useState({});
  const [stats, setStats] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [due, setDue] = useState({ count: 0, items: [] });

  useEffect(() => {
    // SRS queue lives in localStorage — read after mount to avoid hydration mismatch.
    try { setDue({ count: dueCount(), items: dueItems().slice(0, 5) }); } catch {}
  }, []);

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((data) => {
        const map = {};
        (data.latestByChapter || []).forEach((row) => {
          map[`${row.book_id}::${row.chapter_id}`] = {
            questionsSeen: row.questions_seen,
            latestCorrect: row.latest_correct,
            missedNumbers: row.missed_numbers || [],
          };
        });
        setChapterStats(map);
        setStats(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const streak = useMemo(() => computeStreak(stats?.activeDays), [stats]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return QUIZ_DATA.books.map((book) => ({
      book,
      chapters: book.chapters.filter(
        (ch) => !q || ch.title.toLowerCase().includes(q)
      ),
    }));
  }, [query]);

  const totalAttempts = stats?.totalAttempts ?? 0;
  const totalCorrect = stats?.totalCorrect ?? 0;
  const accuracy = totalAttempts ? Math.round((totalCorrect / totalAttempts) * 100) : null;

  return (
    <div className="app">
      <div className="screen active">
        <div className="home-stats-line">
          <span>streak <b>{streak}d</b></span>
          <span>answered <b>{totalAttempts}</b></span>
          {accuracy !== null && <span>accuracy <b>{accuracy}%</b></span>}
          <span>
            <Link href="/practice/missed" style={{ color: 'var(--text-link)' }}>
              review mistakes →
            </Link>
          </span>
          <span>
            <Link href="/mock" style={{ color: 'var(--text-link)' }}>
              start mock →
            </Link>
          </span>
        </div>

        {due.count > 0 && (
          <div style={{ marginBottom: 18 }}>
            <p className="book-divider" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
              Due for review — {due.count} question{due.count !== 1 ? 's' : ''}
            </p>
            <div className="chapter-list">
              {due.items.map(({ key }) => {
                const [bookId, chapterId, num] = key.split('::');
                const book = QUIZ_DATA.books.find((b) => b.id === bookId);
                const ch = book?.chapters.find((c) => c.id === chapterId);
                return (
                  <Link
                    key={key}
                    href={`/quiz/${bookId}/${chapterId}?missed=${num}`}
                    className="chapter-row"
                  >
                    <span className="cr-num">↻</span>
                    <span className="cr-title">{ch ? ch.title : key}</span>
                    <span className="cr-meta">Q{num}</span>
                  </Link>
                );
              })}
              {due.count > due.items.length && (
                <div className="chapter-row" style={{ color: 'var(--text-faint)' }}>
                  <span className="cr-title">+{due.count - due.items.length} more due later today</span>
                </div>
              )}
            </div>
          </div>
        )}

        <input
          className="chapter-search"
          type="search"
          placeholder="Search chapters…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />

        {rows.map(({ book, chapters }) =>
          chapters.length === 0 ? null : (
            <div key={book.id}>
              <p className="book-divider">
                {book.name} — {chapters.length} chapters
              </p>
              <div className="chapter-list">
                {chapters.map((ch) => {
                  const key = `${book.id}::${ch.id}`;
                  const questionCount = getChapterQuestionCount(book.id, ch.id);
                  const stat = chapterStats[key];
                  const pct =
                    stat && questionCount > 0
                      ? Math.round((stat.latestCorrect / questionCount) * 100)
                      : null;
                  const missedCount = stat?.missedNumbers?.length ?? 0;
                  return (
                    <div
                      key={ch.id}
                      style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                      <Link
                        href={`/quiz/${book.id}/${ch.id}`}
                        className="chapter-row"
                        style={{ flex: '1 1 auto' }}
                      >
                        <span className="cr-num">
                          {String(ch.number).padStart(2, '0')}
                        </span>
                        <span className="cr-title">{ch.title}</span>
                        {!loading && pct !== null && (
                          <span className="cr-progress">
                            <span
                              className="cr-progress-fill"
                              style={{
                                width: pct + '%',
                                display: 'block',
                                background:
                                  pct >= 80
                                    ? 'var(--green)'
                                    : pct >= 50
                                    ? 'var(--yellow)'
                                    : 'var(--red)',
                              }}
                            />
                          </span>
                        )}
                        <span className="cr-meta">
                          {questionCount}q{missedCount > 0 ? ` · ${missedCount}✗` : ''}
                        </span>
                      </Link>
                      {!loading && missedCount > 0 && (
                        <Link
                          href={`/quiz/${book.id}/${ch.id}?missed=${stat.missedNumbers.join(',')}`}
                          className="missed-practice-link"
                          title={`Practice ${missedCount} missed`}
                        >
                          ↺
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
