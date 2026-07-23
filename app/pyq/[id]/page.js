'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getPaper } from '../../../lib/pyqData';
import { calcPyqResult, gradeQuestion, isAnswered } from '../../../lib/pyqScoring';
import { NormalDistChart } from '../../components/NormalDistChart';

// Population model for the 100-mark GATE paper distribution chart.
const PYQ_MU = 34.5, PYQ_SIGMA = 15, PYQ_POP = 4500;

function formatTime(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function sectionMeta(paper, code) {
  return paper.sections.find((s) => s.code === code);
}

function typeBadge(q) {
  if (q.type === 'MCQ') return { cls: q.marks === 1 ? 's1' : 's2', text: `MCQ · ${q.marks}mk · −${q.marks === 1 ? '⅓' : '⅔'}` };
  if (q.type === 'MSQ') return { cls: 'msq', text: `MSQ · ${q.marks}mk · no −ve` };
  return { cls: 'nat', text: `NAT · ${q.marks}mk · no −ve` };
}

const OPTS = ['A', 'B', 'C', 'D'];

export default function PyqPage() {
  const { id } = useParams();
  const paper = useMemo(() => getPaper(id), [id]);

  const [phase, setPhase] = useState('quiz'); // quiz | confirm | results | review
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // keyed by q.num
  const [flagged, setFlagged] = useState(new Set());
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [savedToDb, setSavedToDb] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [reviewIndex, setReviewIndex] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (phase !== 'quiz') { clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => setTimeElapsed((t) => t + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  if (!paper) {
    return (
      <div className="app">
        <div className="masthead"><h1>AP <span className="accent">Psych</span> Quizzer</h1></div>
        <div className="screen active"><div className="empty-state">Unknown paper.</div></div>
      </div>
    );
  }

  const questions = paper.questions;
  const totalQ = questions.length;
  const q = questions[currentIndex];
  const ans = answers[q.num];

  // ── Answer mutations ──────────────────────────────────────────────────────
  function setMcq(letter) {
    setAnswers((p) => ({ ...p, [q.num]: p[q.num] === letter ? undefined : letter }));
  }
  function toggleMsq(letter) {
    setAnswers((p) => {
      const cur = Array.isArray(p[q.num]) ? p[q.num] : [];
      const next = cur.includes(letter) ? cur.filter((l) => l !== letter) : [...cur, letter];
      return { ...p, [q.num]: next };
    });
  }
  function setNat(val) {
    setAnswers((p) => ({ ...p, [q.num]: val }));
  }
  function clearAnswer() {
    setAnswers((p) => { const n = { ...p }; delete n[q.num]; return n; });
  }
  function toggleFlag() {
    setFlagged((p) => { const n = new Set(p); n.has(q.num) ? n.delete(q.num) : n.add(q.num); return n; });
  }

  const answeredCount = questions.filter((qq) => isAnswered(qq, answers[qq.num])).length;
  const unanswered = totalQ - answeredCount;

  function goTo(i) { setCurrentIndex(i); }
  function prev() { if (currentIndex > 0) setCurrentIndex((i) => i - 1); }
  function next() { if (currentIndex < totalQ - 1) setCurrentIndex((i) => i + 1); }

  function submitPaper() {
    const result = calcPyqResult(paper, answers);
    setPhase('results');
    if (!savedToDb) {
      setSavedToDb(true);
      const byCode = (c) => result.sections.find((s) => s.code === c)?.net ?? 0;
      fetch('/api/pyq-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paperId: paper.id,
          positiveMarks: result.positive,
          negativeMarks: result.negative,
          totalMarks: result.total,
          timeSeconds: timeElapsed,
          gaNet: byCode('GA'), b1Net: byCode('XH-B1'), c5Net: byCode('XH-C5'),
          sections: result.sections,
        }),
      })
        .then((r) => r.json())
        .then((d) => { if (d.error) setSaveError(d.error); })
        .catch((e) => setSaveError(e.message || 'Network error — result not saved.'));
    }
  }

  const masthead = (
    <div className="masthead">
      <h1>AP <span className="accent">Psych</span> Quizzer</h1>
      <div className="nav-links">
        <span className="mock-timer-chip"><span className="mock-timer-icon">⏱</span>{formatTime(timeElapsed)}</span>
        <Link href="/pyq" className="btn-link">← Papers</Link>
      </div>
    </div>
  );

  // ── Shared: render a question's answer inputs ─────────────────────────────
  function renderInputs(qq, curAns, { review = false } = {}) {
    const grade = review ? gradeQuestion(qq, curAns) : null;

    if (qq.type === 'NAT') {
      const val = curAns ?? '';
      return (
        <div className="pyq-nat-block">
          <label className="pyq-nat-label">Numerical answer</label>
          <input
            type="text" inputMode="decimal" className="pyq-nat-input"
            value={val} disabled={review}
            onChange={(e) => setNat(e.target.value)}
            placeholder="Type a number"
          />
          {review && (
            <div className="pyq-nat-answer">
              Accepted: <b>{qq.range[0] === qq.range[1] ? qq.range[0] : `${qq.range[0]} to ${qq.range[1]}`}</b>
              {' · '}
              <span className={grade.status === 'correct' ? 'mock-result-green' : grade.status === 'wrong' ? 'mock-result-red' : ''}>
                {grade.status}
              </span>
            </div>
          )}
        </div>
      );
    }

    // MCQ / MSQ
    const isMsq = qq.type === 'MSQ';
    const selected = isMsq ? (Array.isArray(curAns) ? curAns : []) : (curAns ? [curAns] : []);
    const correctSet = isMsq
      ? (qq.acceptedSets ? qq.acceptedSets[0] : qq.answers)
      : (qq.answer ? [qq.answer] : []);

    return (
      <div className={'options' + (qq.imageOnly ? ' pyq-image-options' : '')}>
        {OPTS.map((letter) => {
          const label = qq.options?.[letter] ?? '';
          const isSel = selected.includes(letter);
          let cls = 'option ' + (qq.imageOnly ? 'pyq-letter-option' : 'mock-option');
          if (review) {
            const isCorrectOpt = correctSet.includes(letter);
            if (isCorrectOpt) cls += ' correct';
            else if (isSel) cls += ' incorrect selected';
            else cls += ' fade';
          } else if (isSel) {
            cls += ' mock-selected';
          }
          return (
            <button
              key={letter} className={cls} disabled={review}
              onClick={() => (isMsq ? toggleMsq(letter) : setMcq(letter))}
            >
              <span className="bubble">{letter}</span>
              {label && <span dangerouslySetInnerHTML={{ __html: label }} />}
              {review && correctSet.includes(letter) && <span className="review-correct-tag">✓</span>}
              {review && isSel && !correctSet.includes(letter) && <span className="review-wrong-tag">✗</span>}
            </button>
          );
        })}
      </div>
    );
  }

  function questionCard(qq, indexLabel, { review = false } = {}) {
    const sm = sectionMeta(paper, qq.section);
    const badge = typeBadge(qq);
    const posInSec = qq.num - sm.from + 1;
    const secSize = sm.to - sm.from + 1;
    return (
      <div className="answer-sheet">
        <div className="mock-q-header">
          <p className="q-number">Question {qq.num} of {totalQ}</p>
          <span className={'mock-mark-badge ' + badge.cls}>{badge.text}</span>
        </div>
        <p className="q-chapter-tag">{sm.code} · {sm.name} · Q{posInSec}/{secSize}</p>

        {qq.type === 'MSQ' && !review && (
          <p className="pyq-msq-hint">Multiple Select — choose all correct options. No negative marking; all-or-nothing.</p>
        )}

        {qq.stem && <p className="q-text pyq-stem" dangerouslySetInnerHTML={{ __html: qq.stem }} />}
        {qq.lines && (
          <div className="pyq-lines">
            {qq.lines.map((line, i) => (
              <p key={i} className="pyq-line" dangerouslySetInnerHTML={{ __html: line }} />
            ))}
          </div>
        )}
        {qq.table && (
          <div className="pyq-table-wrap">
            <table className="pyq-table">
              <thead>
                <tr>
                  {qq.table.headers.map((h, i) => (
                    <th key={i} dangerouslySetInnerHTML={{ __html: h }} />
                  ))}
                </tr>
              </thead>
              <tbody>
                {qq.table.rows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci} dangerouslySetInnerHTML={{ __html: cell }} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {qq.image && (
          <div className="pyq-figure">
            <img src={qq.image} alt={`Figure for question ${qq.num}`} />
          </div>
        )}

        {renderInputs(qq, answers[qq.num], { review })}
      </div>
    );
  }

  // ── Phase: results / review ───────────────────────────────────────────────
  if (phase === 'results' || phase === 'review') {
    const result = calcPyqResult(paper, answers);
    const pct = Math.round((result.total / result.maxMarks) * 100);
    const circumference = 2 * Math.PI * 65;
    const dash = Math.max(0, result.total / result.maxMarks) * circumference;

    if (phase === 'review') {
      const rq = questions[reviewIndex];
      return (
        <div className="app">
          {masthead}
          <div className="screen active">
            <div className="mock-review-bar">
              <button className="btn btn-secondary" onClick={() => setPhase('results')}>← Results</button>
              <span className="mock-review-counter">Q{rq.num} / {totalQ}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary" disabled={reviewIndex === 0} onClick={() => setReviewIndex((i) => i - 1)}>←</button>
                <button className="btn btn-secondary" disabled={reviewIndex === totalQ - 1} onClick={() => setReviewIndex((i) => i + 1)}>→</button>
              </div>
            </div>

            <div style={{ marginTop: 16 }}>{questionCard(rq, null, { review: true })}</div>

            <div className="mock-palette-block" style={{ marginTop: 24 }}>
              {paper.sections.map((s) => (
                <div className="mock-palette-section-row" key={s.code}>
                  <span className="mock-palette-label">{s.code}</span>
                  <div className="mock-palette-chips">
                    {questions.filter((x) => x.section === s.code).map((x) => {
                      const gi = questions.indexOf(x);
                      const g = gradeQuestion(x, answers[x.num]);
                      return (
                        <button key={x.num}
                          className={`mock-chip review-${g.status === 'correct' ? 'correct' : g.status === 'wrong' ? 'wrong' : 'skip'}` + (gi === reviewIndex ? ' current' : '')}
                          onClick={() => setReviewIndex(gi)}>{x.num}</button>
                      );
                    })}
                  </div>
                </div>
              ))}
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
            <div className="chapter-name">{paper.name} — Results</div>

            <div className="score-ring">
              <svg width="150" height="150" viewBox="0 0 150 150">
                <circle className="ring-bg" cx="75" cy="75" r="65" />
                <circle className="ring-fill" cx="75" cy="75" r="65"
                  strokeDasharray={`${dash} ${circumference}`}
                  style={{ stroke: pct >= 60 ? 'var(--green)' : pct >= 35 ? 'var(--yellow)' : 'var(--red)' }} />
              </svg>
              <div className="ring-label">{result.total.toFixed(2)}<span style={{ fontSize: 14, color: 'var(--text-muted)' }}>/{result.maxMarks}</span></div>
            </div>

            <div className="mock-time-line"><span className="mock-timer-icon">⏱</span> Time taken: <b>{formatTime(timeElapsed)}</b></div>

            <div className="mock-result-sections pyq-result-sections">
              {result.sections.map((s) => (
                <div className="mock-result-sec" key={s.code}>
                  <div className="mock-result-sec-title">{s.code} <span className="pyq-sec-name">{s.name}</span></div>
                  <div className="mock-result-row"><span>Correct</span><span className="mock-result-green">{s.correct}</span></div>
                  <div className="mock-result-row"><span>Wrong</span><span className="mock-result-red">{s.wrong}</span></div>
                  <div className="mock-result-row"><span>Skipped</span><span>{s.skipped}</span></div>
                  <div className="mock-result-row marks">
                    <span className="mock-result-green">+{s.positive.toFixed(2)}</span>
                    <span className="mock-result-red">−{s.negative.toFixed(2)}</span>
                  </div>
                  <div className="mock-result-row pyq-sec-net"><span>Net</span><span>{s.net.toFixed(2)} / {s.maxMarks}</span></div>
                </div>
              ))}
            </div>

            <div className="mock-result-totals">
              <div className="mock-total-row positive"><span>Total Positive</span><span>+{result.positive.toFixed(2)}</span></div>
              <div className="mock-total-row negative"><span>Total Negative</span><span>−{result.negative.toFixed(2)}</span></div>
              <div className="mock-total-row net"><span>Net Score</span><span>{result.total.toFixed(2)} / {result.maxMarks}</span></div>
            </div>

            <NormalDistChart score={result.total} total={result.maxMarks} mu={PYQ_MU} sigma={PYQ_SIGMA} pop={PYQ_POP} />

            {saveError && <div className="mock-save-error">⚠ Result not saved: {saveError}</div>}

            <div className="summary-actions">
              <button className="btn" onClick={() => { setReviewIndex(0); setPhase('review'); }}>View Answer Key</button>
              <Link href="/pyq" className="btn btn-secondary">Back to Papers</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Phase: confirm ────────────────────────────────────────────────────────
  if (phase === 'confirm') {
    return (
      <div className="app">
        {masthead}
        <div className="screen active">
          <div className="mock-confirm-overlay">
            <div className="mock-confirm-box">
              <h2 className="mock-confirm-title">Submit {paper.name}?</h2>
              {unanswered > 0 && (
                <p className="mock-confirm-warn">
                  You have <b>{unanswered}</b> unanswered question{unanswered !== 1 ? 's' : ''}. Unanswered questions carry no penalty.
                </p>
              )}
              <p className="mock-confirm-sub">Time elapsed: <b>{formatTime(timeElapsed)}</b></p>
              <div className="mock-confirm-actions">
                <button className="btn" onClick={submitPaper}>Yes, Submit</button>
                <button className="btn btn-secondary" onClick={() => setPhase('quiz')}>Keep Going</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Phase: active quiz ────────────────────────────────────────────────────
  const progressPct = (currentIndex / totalQ) * 100;
  const sm = sectionMeta(paper, q.section);
  const enteringSection = currentIndex === 0 || questions[currentIndex - 1].section !== q.section;

  return (
    <div className="app">
      {masthead}
      <div className="screen active">
        <div className="mock-section-bar">
          <span className="mock-section-label">{sm.code} · {sm.name}</span>
          <span className="mock-answered-count">{answeredCount}/{totalQ} answered</span>
        </div>
        <div className="progress-rail"><div className="progress-rail-fill" style={{ width: progressPct + '%' }} /></div>

        {enteringSection && currentIndex > 0 && (
          <div className="mock-section-banner">Now entering {sm.code} — {sm.name}</div>
        )}

        {questionCard(q, null, { review: false })}

        <div className="mock-nav-row">
          <button className={'mock-flag-btn' + (flagged.has(q.num) ? ' flagged' : '')} onClick={toggleFlag} title="Flag for review">
            {flagged.has(q.num) ? '⚑ Flagged' : '⚐ Flag'}
          </button>
          <div className="mock-nav-btns">
            <button className="btn btn-secondary" onClick={prev} disabled={currentIndex === 0}>← Prev</button>
            <button className="btn btn-secondary" onClick={clearAnswer} disabled={!isAnswered(q, ans)}>Clear</button>
            <button className="btn" onClick={next} disabled={currentIndex === totalQ - 1}>Next →</button>
          </div>
        </div>

        <div className="mock-palette-block">
          <div className="mock-palette-legend">
            <span className="mock-legend-chip answered" />answered
            <span className="mock-legend-chip flagged" />flagged
            <span className="mock-legend-chip unanswered" />unanswered
          </div>
          {paper.sections.map((s) => (
            <div className="mock-palette-section-row" key={s.code}>
              <span className="mock-palette-label">{s.code}</span>
              <div className="mock-palette-chips">
                {questions.filter((x) => x.section === s.code).map((x) => {
                  const gi = questions.indexOf(x);
                  const answered = isAnswered(x, answers[x.num]);
                  const flag = flagged.has(x.num);
                  let cls = 'mock-chip';
                  if (gi === currentIndex) cls += ' current';
                  else if (flag) cls += ' flagged';
                  else if (answered) cls += ' answered';
                  return <button key={x.num} className={cls} onClick={() => goTo(gi)}>{x.num}</button>;
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mock-submit-row">
          <button className="btn mock-submit-btn" onClick={() => setPhase('confirm')}>Submit Paper ▸</button>
        </div>
      </div>
    </div>
  );
}
