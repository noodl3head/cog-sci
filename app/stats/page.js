'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { buildQuestionIndex, getChapter } from '../../lib/quizHelpers';

function computeStreak(activeDays) {
  // activeDays: array of 'YYYY-MM-DD' strings, descending
  if (!activeDays || activeDays.length === 0) return 0;
  const days = new Set(activeDays.map((d) => new Date(d).toDateString()));
  let streak = 0;
  let cursor = new Date();
  // If they haven't done anything today, the streak still counts from yesterday backward.
  if (!days.has(cursor.toDateString())) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (days.has(cursor.toDateString())) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function barColor(pct) {
  if (pct >= 80) return 'var(--green)';
  if (pct >= 50) return 'var(--yellow)';
  return 'var(--red)';
}

export default function StatsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);

  const questionIndex = buildQuestionIndex();

  function load() {
    setLoading(true);
    fetch('/api/stats')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError('Could not reach the stats API.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleReset() {
    if (!confirm('This permanently deletes all recorded attempts. Continue?')) return;
    setResetting(true);
    await fetch('/api/reset', { method: 'POST' }).catch(() => {});
    setResetting(false);
    load();
  }

  return (
    <div className="app">
      <div className="masthead">
        <h1>
          AP <span className="accent">Psych</span> Quizzer
        </h1>
        <Link href="/" className="btn-link">
          &larr; All Chapters
        </Link>
      </div>

      <div className="screen active">
        {loading && <p className="loading-text">Loading your stats…</p>}

        {error && !loading && (
          <div className="empty-state">
            {error}
            <div style={{ marginTop: 10, fontSize: 12 }}>
              Make sure DATABASE_URL is set in your Vercel project and that you've run
              sql/schema.sql against your Postgres database.
            </div>
          </div>
        )}

        {data && !loading && (
          <>
            <StreakBanner activeDays={data.activeDays} />

            <OverallCards data={data} />

            <h2 className="section-heading">Chapter Strength</h2>
            <ChapterStrength data={data} />

            <h2 className="section-heading">Questions to Review</h2>
            <MissedQuestions data={data} questionIndex={questionIndex} />

            <h2 className="section-heading">Recent Activity</h2>
            <ActivityFeed data={data} questionIndex={questionIndex} />

            <div className="danger-zone">
              <button className="btn btn-danger" onClick={handleReset} disabled={resetting}>
                {resetting ? 'Resetting…' : 'Reset All Stats'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StreakBanner({ activeDays }) {
  const streak = computeStreak(activeDays);
  if (streak === 0) {
    return (
      <div className="streak-banner">
        <span className="streak-flame">🔥</span>
        <span className="streak-text">No active streak yet — answer a question today to start one.</span>
      </div>
    );
  }
  return (
    <div className="streak-banner">
      <span className="streak-flame">🔥</span>
      <span className="streak-text">
        <b>{streak}</b> day streak — keep it going!
      </span>
    </div>
  );
}

function OverallCards({ data }) {
  const total = data.totalAttempts || 0;
  const correct = data.totalCorrect || 0;
  const incorrect = total - correct;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const chaptersStarted = data.byChapter ? data.byChapter.length : 0;

  return (
    <div className="stats-grid">
      <div className="stat-card accent">
        <p className="stat-value">{total}</p>
        <p className="stat-label">Questions Answered</p>
      </div>
      <div className="stat-card green">
        <p className="stat-value">{correct}</p>
        <p className="stat-label">Correct</p>
      </div>
      <div className="stat-card red">
        <p className="stat-value">{incorrect}</p>
        <p className="stat-label">Incorrect</p>
      </div>
      <div className="stat-card yellow">
        <p className="stat-value">{accuracy}%</p>
        <p className="stat-label">Accuracy</p>
      </div>
      <div className="stat-card">
        <p className="stat-value">{chaptersStarted}</p>
        <p className="stat-label">Chapters Started</p>
      </div>
    </div>
  );
}

function ChapterStrength({ data }) {
  const rows = (data.byChapter || []).slice().sort((a, b) => {
    const pctA = a.attempts ? a.correct / a.attempts : 0;
    const pctB = b.attempts ? b.correct / b.attempts : 0;
    return pctA - pctB; // weakest first
  });

  if (rows.length === 0) {
    return <div className="empty-state">No chapters attempted yet — go answer some questions!</div>;
  }

  return (
    <div>
      {rows.map((row) => {
        const pct = row.attempts > 0 ? Math.round((row.correct / row.attempts) * 100) : 0;
        const chapter = getChapter(row.book_id, row.chapter_id);
        const title = chapter ? chapter.title : `${row.book_id} / ${row.chapter_id}`;
        return (
          <div className="chapter-strength-row" key={row.book_id + row.chapter_id}>
            <div style={{ flex: '1 1 auto', minWidth: 0 }}>
              <div className="csr-title">{title}</div>
              <div className="csr-sub">
                {row.correct}/{row.attempts} correct &middot; {row.distinct_questions} questions seen
              </div>
            </div>
            <div className="csr-bar-track">
              <div className="csr-bar-fill" style={{ width: pct + '%', background: barColor(pct) }} />
            </div>
            <div className="csr-pct" style={{ color: barColor(pct) }}>
              {pct}%
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MissedQuestions({ data, questionIndex }) {
  const rows = data.missedQuestions || [];
  if (rows.length === 0) {
    return <div className="empty-state">No missed questions yet — nice work, or you haven't started.</div>;
  }
  return (
    <div>
      {rows.map((row, i) => {
        const key = `${row.book_id}::${row.chapter_id}::${row.question_number}`;
        const q = questionIndex[key];
        return (
          <div className="missed-q-row" key={i}>
            <div className="mq-title">{q ? q.question : `Question ${row.question_number}`}</div>
            <div className="mq-meta">
              {q ? q.chapterTitle : row.chapter_id} &middot; missed {row.times_missed}/{row.times_seen} times
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ActivityFeed({ data, questionIndex }) {
  const rows = data.recent || [];
  if (rows.length === 0) {
    return <div className="empty-state">No activity yet.</div>;
  }
  return (
    <div>
      {rows.map((row, i) => {
        const key = `${row.book_id}::${row.chapter_id}::${row.question_number}`;
        const q = questionIndex[key];
        const when = new Date(row.created_at);
        return (
          <div className="activity-feed-row" key={i}>
            <span className={'activity-dot ' + (row.is_correct ? 'correct' : 'incorrect')} />
            <span>{q ? q.chapterTitle : row.chapter_id}</span>
            <span className="af-meta">{when.toLocaleString()}</span>
          </div>
        );
      })}
    </div>
  );
}
