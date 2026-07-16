'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { generatePresetMock, generateRandomMock } from '../../../lib/mockGenerator';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function getQ(quiz, index) {
  if (index < 20) return { ...quiz.section1[index], mark: 1, penalty: 1 / 3, section: 1 };
  return { ...quiz.section2[index - 20], mark: 2, penalty: 2 / 3, section: 2 };
}

function calcResult(quiz, answers) {
  const { section1, section2 } = quiz;

  let s1c = 0, s1w = 0;
  section1.forEach((q, i) => {
    const a = answers[i];
    if (a === undefined) return;
    if (a === q.answer) s1c++; else s1w++;
  });
  const s1sk = 20 - s1c - s1w;

  let s2c = 0, s2w = 0;
  section2.forEach((q, i) => {
    const a = answers[20 + i];
    if (a === undefined) return;
    if (a === q.answer) s2c++; else s2w++;
  });
  const s2sk = 15 - s2c - s2w;

  const positive = s1c * 1 + s2c * 2;
  const negative = s1w * (1 / 3) + s2w * (2 / 3);
  return {
    s1Correct: s1c, s1Wrong: s1w, s1Skipped: s1sk,
    s2Correct: s2c, s2Wrong: s2w, s2Skipped: s2sk,
    positive, negative, total: positive - negative,
  };
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MockQuizPage() {
  const { id } = useParams();

  // Generate quiz once per mount
  const quiz = useMemo(() => {
    if (id === 'generated') return generateRandomMock();
    const n = parseInt(id, 10);
    if (n >= 1 && n <= 5) return generatePresetMock(n - 1);
    return null;
  }, [id]);

  // Quiz state
  const [phase, setPhase] = useState('quiz'); // 'quiz' | 'confirm' | 'results' | 'review'
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState(new Set());
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [savedToDb, setSavedToDb] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const timerRef = useRef(null);

  // Timer — runs only during active quiz
  useEffect(() => {
    if (phase !== 'quiz') {
      clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => setTimeElapsed((t) => t + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  if (!quiz) {
    return (
      <div className="app">
        <div className="masthead"><h1>AP <span className="accent">Psych</span> Quizzer</h1></div>
        <div className="screen active"><div className="empty-state">Invalid mock ID.</div></div>
      </div>
    );
  }

  const totalQ = 35;
  const mockTitle = id === 'generated' ? 'Generated Mock' : `Mock Quiz ${id}`;

  // Current question
  const q = getQ(quiz, currentIndex);
  const isSection2Start = currentIndex === 20;
  const isFlagged = flagged.has(currentIndex);
  const selectedAnswer = answers[currentIndex];

  function selectOption(letter) {
    setAnswers((prev) => ({ ...prev, [currentIndex]: letter }));
  }

  function clearAnswer() {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[currentIndex];
      return next;
    });
  }

  function toggleFlag() {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(currentIndex)) next.delete(currentIndex);
      else next.add(currentIndex);
      return next;
    });
  }

  function goTo(index) { setCurrentIndex(index); }
  function prev() { if (currentIndex > 0) setCurrentIndex((i) => i - 1); }
  function next() { if (currentIndex < totalQ - 1) setCurrentIndex((i) => i + 1); }

  const answeredCount = Object.keys(answers).length;
  const unanswered = totalQ - answeredCount;

  function submitMock() {
    setPhase('results');
    const result = calcResult(quiz, answers);
    if (!savedToDb) {
      setSavedToDb(true);
      fetch('/api/mock-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mockId: id,
          positiveMarks: +result.positive.toFixed(2),
          negativeMarks: +result.negative.toFixed(2),
          totalMarks: +(result.positive - result.negative).toFixed(2),
          timeSeconds: timeElapsed,
          s1Correct: result.s1Correct, s1Wrong: result.s1Wrong, s1Skipped: result.s1Skipped,
          s2Correct: result.s2Correct, s2Wrong: result.s2Wrong, s2Skipped: result.s2Skipped,
        }),
      }).catch(() => {});
    }
  }

  // ── Masthead ────────────────────────────────────────────────────────────────
  const masthead = (
    <div className="masthead">
      <h1>AP <span className="accent">Psych</span> Quizzer</h1>
      <div className="nav-links">
        <span className="mock-timer-chip">
          <span className="mock-timer-icon">⏱</span>
          {formatTime(timeElapsed)}
        </span>
        <Link href="/mock" className="btn-link">← Mocks</Link>
      </div>
    </div>
  );

  // ── Phase: Results ───────────────────────────────────────────────────────────
  if (phase === 'results' || phase === 'review') {
    const result = calcResult(quiz, answers);
    const pct = Math.round((result.total / 50) * 100);
    const circumference = 2 * Math.PI * 65;
    const dash = Math.max(0, (result.total / 50)) * circumference;

    if (phase === 'review') {
      const rq = getQ(quiz, reviewIndex);
      const rAnswered = answers[reviewIndex];
      const isCorrect = rAnswered === rq.answer;
      const isSkipped = rAnswered === undefined;

      return (
        <div className="app">
          {masthead}
          <div className="screen active">
            <div className="mock-review-bar">
              <button className="btn btn-secondary" onClick={() => setPhase('results')}>← Results</button>
              <span className="mock-review-counter">
                Q{reviewIndex + 1} / {totalQ}
                {reviewIndex < 20
                  ? <span className="mock-mark-badge s1">S1 · 1mk</span>
                  : <span className="mock-mark-badge s2">S2 · 2mk</span>
                }
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary" disabled={reviewIndex === 0} onClick={() => setReviewIndex((i) => i - 1)}>←</button>
                <button className="btn btn-secondary" disabled={reviewIndex === totalQ - 1} onClick={() => setReviewIndex((i) => i + 1)}>→</button>
              </div>
            </div>

            <div className="answer-sheet" style={{ marginTop: 16 }}>
              <p className="q-number">Question {reviewIndex + 1} of {totalQ}</p>
              <p className="q-chapter-tag">{rq.chapterTitle}</p>
              <p className="q-text">{rq.question}</p>

              <div className="options">
                {Object.keys(rq.options).map((letter) => {
                  let cls = 'option';
                  if (letter === rq.answer) cls += ' correct';
                  else if (letter === rAnswered && !isCorrect) cls += ' incorrect selected';
                  else cls += ' fade';
                  return (
                    <button key={letter} className={cls} disabled>
                      <span className="bubble">{letter}</span>
                      <span>{rq.options[letter]}</span>
                      {letter === rq.answer && <span className="review-correct-tag">✓ correct</span>}
                      {letter === rAnswered && !isCorrect && <span className="review-wrong-tag">✗ your answer</span>}
                    </button>
                  );
                })}
              </div>

              {isSkipped && (
                <div className="feedback show">
                  <p className="feedback-label">Skipped — no marks deducted</p>
                  <p className="feedback-text">{rq.explanation}</p>
                </div>
              )}
              {!isSkipped && (
                <div className={'feedback show' + (!isCorrect ? ' wrong' : '')}>
                  <p className="feedback-label">{isCorrect ? 'Correct' : `Incorrect — answer was ${rq.answer}`}</p>
                  <p className="feedback-text">{rq.explanation}</p>
                </div>
              )}
            </div>

            {/* Mini palette in review */}
            <div className="mock-palette-block" style={{ marginTop: 24 }}>
              <div className="mock-palette-section-row">
                <span className="mock-palette-label">S1</span>
                <div className="mock-palette-chips">
                  {quiz.section1.map((sq, i) => {
                    const a = answers[i];
                    const status = a === undefined ? 'skip' : a === sq.answer ? 'correct' : 'wrong';
                    return (
                      <button
                        key={i}
                        className={`mock-chip review-${status}` + (i === reviewIndex ? ' current' : '')}
                        onClick={() => setReviewIndex(i)}
                      >{i + 1}</button>
                    );
                  })}
                </div>
              </div>
              <div className="mock-palette-section-row" style={{ marginTop: 8 }}>
                <span className="mock-palette-label">S2</span>
                <div className="mock-palette-chips">
                  {quiz.section2.map((sq, i) => {
                    const gi = 20 + i;
                    const a = answers[gi];
                    const status = a === undefined ? 'skip' : a === sq.answer ? 'correct' : 'wrong';
                    return (
                      <button
                        key={i}
                        className={`mock-chip review-${status}` + (gi === reviewIndex ? ' current' : '')}
                        onClick={() => setReviewIndex(gi)}
                      >{gi + 1}</button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="app">
        {masthead}
        <div className="screen active">
          <div className="summary-card">
            <div className="chapter-name">{mockTitle} — Results</div>

            <div className="score-ring">
              <svg width="150" height="150" viewBox="0 0 150 150">
                <circle className="ring-bg" cx="75" cy="75" r="65" />
                <circle
                  className="ring-fill"
                  cx="75" cy="75" r="65"
                  strokeDasharray={`${dash} ${circumference}`}
                  style={{ stroke: pct >= 60 ? 'var(--green)' : pct >= 35 ? 'var(--yellow)' : 'var(--red)' }}
                />
              </svg>
              <div className="ring-label">{result.total.toFixed(2)}<span style={{ fontSize: 14, color: 'var(--text-muted)' }}>/50</span></div>
            </div>

            <div className="mock-time-line">
              <span className="mock-timer-icon">⏱</span> Time taken: <b>{formatTime(timeElapsed)}</b>
            </div>

            {/* Section breakdown */}
            <div className="mock-result-sections">
              <div className="mock-result-sec">
                <div className="mock-result-sec-title">Section 1 <span className="mock-mark-badge s1">1 mk · −⅓</span></div>
                <div className="mock-result-row"><span>Correct</span><span className="mock-result-green">+{result.s1Correct}</span></div>
                <div className="mock-result-row"><span>Wrong</span><span className="mock-result-red">−{result.s1Wrong}</span></div>
                <div className="mock-result-row"><span>Skipped</span><span>{result.s1Skipped}</span></div>
                <div className="mock-result-row marks">
                  <span>+{result.s1Correct.toFixed(0)}</span>
                  <span className="mock-result-red">−{(result.s1Wrong / 3).toFixed(2)}</span>
                </div>
              </div>
              <div className="mock-result-sec">
                <div className="mock-result-sec-title">Section 2 <span className="mock-mark-badge s2">2 mk · −⅔</span></div>
                <div className="mock-result-row"><span>Correct</span><span className="mock-result-green">+{result.s2Correct}</span></div>
                <div className="mock-result-row"><span>Wrong</span><span className="mock-result-red">−{result.s2Wrong}</span></div>
                <div className="mock-result-row"><span>Skipped</span><span>{result.s2Skipped}</span></div>
                <div className="mock-result-row marks">
                  <span>+{(result.s2Correct * 2).toFixed(0)}</span>
                  <span className="mock-result-red">−{(result.s2Wrong * 2 / 3).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Totals */}
            <div className="mock-result-totals">
              <div className="mock-total-row positive">
                <span>Total Positive</span>
                <span>+{result.positive.toFixed(2)}</span>
              </div>
              <div className="mock-total-row negative">
                <span>Total Negative</span>
                <span>−{result.negative.toFixed(2)}</span>
              </div>
              <div className="mock-total-row net">
                <span>Net Score</span>
                <span>{result.total.toFixed(2)} / 50</span>
              </div>
            </div>

            <div className="summary-actions">
              <button className="btn" onClick={() => { setReviewIndex(0); setPhase('review'); }}>
                View Answer Key
              </button>
              <Link href="/mock" className="btn btn-secondary">Back to Mocks</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Phase: Confirm submit overlay ────────────────────────────────────────────
  if (phase === 'confirm') {
    return (
      <div className="app">
        {masthead}
        <div className="screen active">
          <div className="mock-confirm-overlay">
            <div className="mock-confirm-box">
              <h2 className="mock-confirm-title">Submit Mock?</h2>
              {unanswered > 0 && (
                <p className="mock-confirm-warn">
                  You have <b>{unanswered}</b> unanswered question{unanswered !== 1 ? 's' : ''}.
                  Unanswered questions carry no penalty.
                </p>
              )}
              <p className="mock-confirm-sub">Time elapsed: <b>{formatTime(timeElapsed)}</b></p>
              <div className="mock-confirm-actions">
                <button className="btn" onClick={submitMock}>Yes, Submit</button>
                <button className="btn btn-secondary" onClick={() => setPhase('quiz')}>Keep Going</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Phase: Active Quiz ───────────────────────────────────────────────────────
  const progressPct = ((currentIndex) / totalQ) * 100;
  const sectionLabel = currentIndex < 20
    ? `Section 1 · Q ${currentIndex + 1} of 20 · 1 mark`
    : `Section 2 · Q ${currentIndex - 19} of 15 · 2 marks`;

  return (
    <div className="app">
      {masthead}
      <div className="screen active">

        {/* Section + progress header */}
        <div className="mock-section-bar">
          <span className="mock-section-label">{sectionLabel}</span>
          <span className="mock-answered-count">{answeredCount}/{totalQ} answered</span>
        </div>
        <div className="progress-rail">
          <div className="progress-rail-fill" style={{ width: progressPct + '%' }} />
        </div>

        {/* Section 2 transition banner */}
        {isSection2Start && (
          <div className="mock-section-banner">
            Section 2 — 2 Marks per question &middot; Penalty: −⅔ per wrong answer
          </div>
        )}

        {/* Question */}
        <div className="answer-sheet">
          <div className="mock-q-header">
            <p className="q-number">Question {currentIndex + 1} of {totalQ}</p>
            <span className={'mock-mark-badge ' + (q.section === 1 ? 's1' : 's2')}>
              {q.mark} mk · −{q.section === 1 ? '⅓' : '⅔'} wrong
            </span>
          </div>
          <p className="q-chapter-tag">{q.chapterTitle}</p>
          <p className="q-text">{q.question}</p>

          <div className="options">
            {Object.keys(q.options).map((letter) => (
              <button
                key={letter}
                className={'option mock-option' + (selectedAnswer === letter ? ' mock-selected' : '')}
                onClick={() => selectOption(letter)}
              >
                <span className="bubble">{letter}</span>
                <span>{q.options[letter]}</span>
              </button>
            ))}
          </div>

          {/* Navigation row */}
          <div className="mock-nav-row">
            <button
              className={'mock-flag-btn' + (isFlagged ? ' flagged' : '')}
              onClick={toggleFlag}
              title="Flag for review"
            >
              {isFlagged ? '⚑ Flagged' : '⚐ Flag'}
            </button>
            <div className="mock-nav-btns">
              <button className="btn btn-secondary" onClick={prev} disabled={currentIndex === 0}>← Prev</button>
              <button className="btn btn-secondary" onClick={clearAnswer} disabled={selectedAnswer === undefined}>Clear</button>
              <button className="btn" onClick={next} disabled={currentIndex === totalQ - 1}>Next →</button>
            </div>
          </div>
        </div>

        {/* Question palette */}
        <div className="mock-palette-block">
          <div className="mock-palette-legend">
            <span className="mock-legend-chip answered" />answered
            <span className="mock-legend-chip flagged" />flagged
            <span className="mock-legend-chip unanswered" />unanswered
          </div>
          <div className="mock-palette-section-row">
            <span className="mock-palette-label">S1</span>
            <div className="mock-palette-chips">
              {quiz.section1.map((_, i) => {
                const answered = answers[i] !== undefined;
                const flag = flagged.has(i);
                let cls = 'mock-chip';
                if (i === currentIndex) cls += ' current';
                else if (flag) cls += ' flagged';
                else if (answered) cls += ' answered';
                return (
                  <button key={i} className={cls} onClick={() => goTo(i)}>{i + 1}</button>
                );
              })}
            </div>
          </div>
          <div className="mock-palette-section-row">
            <span className="mock-palette-label">S2</span>
            <div className="mock-palette-chips">
              {quiz.section2.map((_, i) => {
                const gi = 20 + i;
                const answered = answers[gi] !== undefined;
                const flag = flagged.has(gi);
                let cls = 'mock-chip';
                if (gi === currentIndex) cls += ' current';
                else if (flag) cls += ' flagged';
                else if (answered) cls += ' answered';
                return (
                  <button key={i} className={cls} onClick={() => goTo(gi)}>{gi + 1}</button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mock-submit-row">
          <button className="btn mock-submit-btn" onClick={() => setPhase('confirm')}>
            Submit Mock ▸
          </button>
        </div>

      </div>
    </div>
  );
}
