'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { QUIZ_DATA } from '../../lib/quizData';
import { buildQuestionIndex, getChapter } from '../../lib/quizHelpers';
import { NormalDistChart } from '../components/NormalDistChart';

function computeStreak(activeDays) {
  if (!activeDays || activeDays.length === 0) return 0;
  const days = new Set(activeDays.map((d) => new Date(d).toDateString()));
  let streak = 0;
  let cursor = new Date();
  if (!days.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1);
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

// Returns { finished, inProgress, notStarted, total, chapters[] }
function computeChapterProgress(latestByChapter) {
  const seenMap = {};
  for (const row of latestByChapter || []) {
    seenMap[`${row.book_id}::${row.chapter_id}`] = row.questions_seen;
  }

  let finished = 0, inProgress = 0, notStarted = 0;
  const chapters = [];

  for (const book of QUIZ_DATA.books) {
    for (const ch of book.chapters) {
      const total = ch.questions.filter((q) => !q.imageRequired).length;
      const seen = seenMap[`${book.id}::${ch.id}`] || 0;
      const coverage = total > 0 ? seen / total : 0;
      const status = coverage >= 0.6 ? 'finished' : seen > 0 ? 'inprogress' : 'notstarted';
      if (status === 'finished') finished++;
      else if (status === 'inprogress') inProgress++;
      else notStarted++;
      chapters.push({ title: ch.title, bookName: book.name, status, seen, total, coverage });
    }
  }

  return { finished, inProgress, notStarted, total: chapters.length, chapters };
}

export default function StatsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [mockData, setMockData] = useState(null);
  const [pyqData, setPyqData] = useState(null);

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
    fetch('/api/mock-results')
      .then((r) => r.json())
      .then((d) => { if (!d.error) setMockData(d); })
      .catch(() => {});
    fetch('/api/pyq-results')
      .then((r) => r.json())
      .then((d) => { if (!d.error) setPyqData(d); })
      .catch(() => {});
  }

  useEffect(() => { load(); }, []);

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
        <h1>AP <span className="accent">Psych</span> Quizzer</h1>
        <div className="nav-links">
          <Link href="/" className="btn-link">&larr; Chapters</Link>
          <Link href="/study" className="btn-link">Study</Link>
          <Link href="/mock" className="btn-link">Mock</Link>
          <Link href="/pyq" className="btn-link">PYQ</Link>
        </div>
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

            <h2 className="section-heading">Chapter Progress</h2>
            <ChapterProgressTracker data={data} />

            <h2 className="section-heading">Mock Performance</h2>
            <MockStats mockData={mockData} />

            <h2 className="section-heading">GATE PYQ Papers</h2>
            <PyqStats pyqData={pyqData} />

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
      <span className="streak-text"><b>{streak}</b> day streak — keep it going!</span>
    </div>
  );
}

function OverallCards({ data }) {
  const total = data.totalAttempts || 0;
  const correct = data.totalCorrect || 0;
  const incorrect = total - correct;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const { finished, total: totalChapters } = computeChapterProgress(data.latestByChapter);

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
      <div className="stat-card accent">
        <p className="stat-value">{finished}<span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-muted)' }}>/{totalChapters}</span></p>
        <p className="stat-label">Chapters Finished</p>
      </div>
    </div>
  );
}

function ChapterProgressTracker({ data }) {
  const { finished, inProgress, notStarted, total, chapters } = computeChapterProgress(data.latestByChapter);
  const finishedPct = (finished / total) * 100;
  const inProgressPct = (inProgress / total) * 100;

  // Group chapters by book for the dot grid
  const byBook = {};
  for (const ch of chapters) {
    if (!byBook[ch.bookName]) byBook[ch.bookName] = [];
    byBook[ch.bookName].push(ch);
  }

  return (
    <div className="cp-card">
      {/* Top row: big numbers + bar */}
      <div className="cp-top">
        <div className="cp-score">
          <span className="cp-score-num">{finished}</span>
          <span className="cp-score-denom">/ {total}</span>
          <span className="cp-score-label">chapters finished</span>
        </div>
        <div className="cp-bar-col">
          <div className="cp-bar-track">
            <div className="cp-bar-seg cp-seg-finished" style={{ width: finishedPct + '%' }} />
            <div className="cp-bar-seg cp-seg-inprogress" style={{ width: inProgressPct + '%' }} />
          </div>
          <div className="cp-legend">
            <span className="cp-leg cp-leg-finished">&#9632; {finished} finished</span>
            <span className="cp-leg cp-leg-inprogress">&#9632; {inProgress} in progress</span>
            <span className="cp-leg cp-leg-notstarted">&#9632; {notStarted} not started</span>
          </div>
        </div>
      </div>

      {/* Chapter dot grid per book */}
      {Object.entries(byBook).map(([bookName, chs]) => (
        <div key={bookName} className="cp-book-row">
          <div className="cp-book-name">{bookName}</div>
          <div className="cp-dots">
            {chs.map((ch, i) => (
              <div
                key={i}
                className={`cp-dot cp-dot-${ch.status}`}
                title={`${ch.title} — ${ch.seen}/${ch.total} attempted (${Math.round(ch.coverage * 100)}%)`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ChapterStrength({ data }) {
  const seenMap = {};
  for (const row of data.latestByChapter || []) {
    seenMap[`${row.book_id}::${row.chapter_id}`] = row.questions_seen;
  }

  const rows = (data.byChapter || []).slice().sort((a, b) => {
    const pctA = a.attempts ? a.correct / a.attempts : 0;
    const pctB = b.attempts ? b.correct / b.attempts : 0;
    return pctA - pctB;
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
        const totalQ = chapter ? chapter.questions.filter((q) => !q.imageRequired).length : null;
        const seen = seenMap[`${row.book_id}::${row.chapter_id}`] || row.distinct_questions;
        const isFinished = totalQ && seen / totalQ >= 0.6;

        return (
          <div className="chapter-strength-row" key={row.book_id + row.chapter_id}>
            <div style={{ flex: '1 1 auto', minWidth: 0 }}>
              <div className="csr-title">
                {title}
                {isFinished && <span className="csr-finished-badge">✓</span>}
              </div>
              <div className="csr-sub">
                {row.correct}/{row.attempts} correct &middot; {seen}{totalQ ? `/${totalQ}` : ''} questions seen
              </div>
            </div>
            <div className="csr-bar-track">
              <div className="csr-bar-fill" style={{ width: pct + '%', background: barColor(pct) }} />
            </div>
            <div className="csr-pct" style={{ color: barColor(pct) }}>{pct}%</div>
          </div>
        );
      })}
    </div>
  );
}

function MissedQuestions({ data, questionIndex }) {
  const rows = data.missedQuestions || [];
  const totalMissed = (data.latestByChapter || []).reduce(
    (sum, row) => sum + (row.missed_numbers?.length || 0),
    0
  );

  if (totalMissed === 0 && rows.length === 0) {
    return <div className="empty-state">No missed questions yet — nice work, or you haven't started.</div>;
  }

  return (
    <div>
      {totalMissed > 0 && (
        <div className="practice-missed-banner">
          <div className="pmb-text">
            <span className="pmb-count">{totalMissed}</span>
            {' '}question{totalMissed !== 1 ? 's' : ''} still need review across all chapters.
          </div>
          <Link href="/practice/missed" className="btn">Practice All Missed</Link>
        </div>
      )}
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

function MockStats({ mockData }) {
  if (!mockData) return <div className="empty-state">Loading mock stats…</div>;
  const overall = mockData.overall || {};
  const recent = mockData.recent || [];

  if (!overall.total_attempts) {
    return (
      <div className="empty-state">
        No mock quizzes attempted yet.{' '}
        <a href="/mock" style={{ color: 'var(--text-link)' }}>Take a mock →</a>
      </div>
    );
  }

  function fmtTime(s) {
    if (!s) return '—';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  return (
    <div>
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card accent">
          <p className="stat-value">{overall.total_attempts}</p>
          <p className="stat-label">Mocks Taken</p>
        </div>
        <div className="stat-card green">
          <p className="stat-value">+{Number(overall.avg_positive).toFixed(1)}</p>
          <p className="stat-label">Avg Positive</p>
        </div>
        <div className="stat-card red">
          <p className="stat-value">−{Number(overall.avg_negative).toFixed(1)}</p>
          <p className="stat-label">Avg Negative</p>
        </div>
        <div className="stat-card yellow">
          <p className="stat-value">{Number(overall.avg_total).toFixed(1)}</p>
          <p className="stat-label">Avg Score /50</p>
        </div>
        <div className="stat-card accent">
          <p className="stat-value">{fmtTime(overall.avg_time)}</p>
          <p className="stat-label">Avg Time</p>
        </div>
      </div>

      <NormalDistChart score={Number(overall.avg_total)} label="Your Avg" />

      <div>
        {recent.map((row, i) => {
          const label = row.mock_id === 'generated' ? 'Generated' : `Mock ${row.mock_id}`;
          const pct = Math.round((Number(row.total_marks) / 50) * 100);
          const when = new Date(row.created_at).toLocaleDateString();
          return (
            <div className="mock-history-row" key={i}>
              <span className="mock-history-label">{label}</span>
              <span className="mock-history-score">
                <span style={{ color: 'var(--green)' }}>+{Number(row.positive_marks).toFixed(2)}</span>
                {' '}<span style={{ color: 'var(--red)' }}>−{Number(row.negative_marks).toFixed(2)}</span>
                {' '}= <b>{Number(row.total_marks).toFixed(2)}/50</b>
              </span>
              <span className="mock-history-bar-wrap">
                <div className="mock-history-bar" style={{ width: pct + '%', background: pct >= 60 ? 'var(--green)' : pct >= 35 ? 'var(--yellow)' : 'var(--red)' }} />
              </span>
              <span className="mock-history-time">{fmtTime(row.time_seconds)}</span>
              <span className="mock-history-date">{when}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PyqStats({ pyqData }) {
  if (!pyqData) return <div className="empty-state">Loading PYQ stats…</div>;
  const overall = pyqData.overall || {};
  const recent = pyqData.recent || [];
  const perPaper = pyqData.perPaper || [];

  if (!overall.total_attempts) {
    return (
      <div className="empty-state">
        No GATE papers attempted yet.{' '}
        <a href="/pyq" style={{ color: 'var(--text-link)' }}>Attempt a paper →</a>
      </div>
    );
  }

  function fmtTime(s) {
    if (!s) return '—';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  return (
    <div>
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card accent">
          <p className="stat-value">{overall.total_attempts}</p>
          <p className="stat-label">Papers Attempted</p>
        </div>
        <div className="stat-card green">
          <p className="stat-value">{Number(overall.best_score).toFixed(1)}</p>
          <p className="stat-label">Best Score /100</p>
        </div>
        <div className="stat-card yellow">
          <p className="stat-value">{Number(overall.avg_total).toFixed(1)}</p>
          <p className="stat-label">Avg Score /100</p>
        </div>
        <div className="stat-card accent">
          <p className="stat-value">{fmtTime(overall.avg_time)}</p>
          <p className="stat-label">Avg Time</p>
        </div>
      </div>

      {perPaper.length > 0 && (
        <div className="pyq-stats-papers">
          {perPaper.map((p) => (
            <div className="pyq-stats-paper" key={p.paper_id}>
              <div className="pyq-stats-paper-title">GATE {p.paper_id}</div>
              <div className="pyq-stats-sec-row">
                <span className="pyq-stats-sec"><b>GA</b> {Number(p.avg_ga).toFixed(1)}/15</span>
                <span className="pyq-stats-sec"><b>XH-B1</b> {Number(p.avg_b1).toFixed(1)}/25</span>
                <span className="pyq-stats-sec"><b>XH-C5</b> {Number(p.avg_c5).toFixed(1)}/60</span>
              </div>
              <div className="pyq-stats-paper-meta">
                Best {Number(p.best_score).toFixed(1)} · Avg {Number(p.avg_total).toFixed(1)} · {p.attempts} attempt{p.attempts !== 1 ? 's' : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      <NormalDistChart score={Number(overall.avg_total)} label="Your Avg" total={100} mu={35} sigma={13} pop={10000} />

      <div>
        {recent.map((row, i) => {
          const pct = Math.round((Number(row.total_marks) / 100) * 100);
          const when = new Date(row.created_at).toLocaleDateString();
          return (
            <div className="mock-history-row" key={i}>
              <span className="mock-history-label">GATE {row.paper_id}</span>
              <span className="mock-history-score">
                <span style={{ color: 'var(--green)' }}>+{Number(row.positive_marks).toFixed(2)}</span>
                {' '}<span style={{ color: 'var(--red)' }}>−{Number(row.negative_marks).toFixed(2)}</span>
                {' '}= <b>{Number(row.total_marks).toFixed(2)}/100</b>
              </span>
              <span className="mock-history-bar-wrap">
                <div className="mock-history-bar" style={{ width: pct + '%', background: pct >= 60 ? 'var(--green)' : pct >= 35 ? 'var(--yellow)' : 'var(--red)' }} />
              </span>
              <span className="mock-history-time">{fmtTime(row.time_seconds)}</span>
              <span className="mock-history-date">{when}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActivityFeed({ data, questionIndex }) {
  const rows = data.recent || [];
  if (rows.length === 0) return <div className="empty-state">No activity yet.</div>;
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
