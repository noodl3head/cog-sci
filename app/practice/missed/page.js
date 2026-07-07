'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { buildQuestionIndex } from '../../../lib/quizHelpers';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function PracticeMissedPage() {
  const questionIndex = useMemo(() => buildQuestionIndex(), []);

  const [questions, setQuestions] = useState(null); // null = loading
  const [loadError, setLoadError] = useState(null);

  // Quiz state
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [missed, setMissed] = useState([]);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setLoadError(data.error); return; }
        const qs = [];
        for (const row of data.latestByChapter || []) {
          for (const num of row.missed_numbers || []) {
            const key = `${row.book_id}::${row.chapter_id}::${num}`;
            const q = questionIndex[key];
            if (q && !q.imageRequired) qs.push(q);
          }
        }
        setQuestions(shuffle(qs));
      })
      .catch(() => setLoadError('Could not load stats.'));
  }, []);

  const masthead = (
    <div className="masthead">
      <h1>AP <span className="accent">Psych</span> Quizzer</h1>
      <Link href="/stats" className="btn-link">&larr; My Stats</Link>
    </div>
  );

  if (!questions) {
    return (
      <div className="app">
        {masthead}
        <div className="screen active">
          {loadError
            ? <div className="empty-state">{loadError}</div>
            : <p className="loading-text">Loading your missed questions…</p>
          }
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="app">
        {masthead}
        <div className="screen active">
          <div className="empty-state">
            No missed questions to practice — you haven't attempted any chapters yet, or you've gotten everything right!
          </div>
        </div>
      </div>
    );
  }

  const q = questions[index];

  function selectAnswer(letter) {
    if (answered) return;
    setSelected(letter);
    setAnswered(true);
    const isCorrect = letter === q.answer;
    if (isCorrect) setScore((s) => s + 1);
    else setMissed((m) => [...m, { ...q, yourAnswer: letter }]);

    fetch('/api/attempts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookId: q.bookId,
        chapterId: q.chapterId,
        questionNumber: q.questionNumber,
        selectedLetter: letter,
        correctLetter: q.answer,
        isCorrect,
      }),
    }).catch(() => {});
  }

  function next() {
    if (index < questions.length - 1) {
      setIndex((i) => i + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      setFinished(true);
    }
  }

  function retryAll() {
    setQuestions(shuffle(questions));
    setIndex(0);
    setScore(0);
    setSelected(null);
    setAnswered(false);
    setMissed([]);
    setFinished(false);
  }

  function retryMissed() {
    const missedQs = missed.map(({ yourAnswer, ...q }) => q);
    setQuestions(shuffle(missedQs));
    setIndex(0);
    setScore(0);
    setSelected(null);
    setAnswered(false);
    setMissed([]);
    setFinished(false);
  }

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    const circumference = 2 * Math.PI * 65;
    const dash = (pct / 100) * circumference;

    return (
      <div className="app">
        {masthead}
        <div className="screen active">
          <div className="summary-card">
            <div className="chapter-name">All Missed Questions</div>
            <div className="score-ring">
              <svg width="150" height="150" viewBox="0 0 150 150">
                <circle className="ring-bg" cx="75" cy="75" r="65" />
                <circle
                  className="ring-fill"
                  cx="75" cy="75" r="65"
                  strokeDasharray={`${dash} ${circumference}`}
                />
              </svg>
              <div className="ring-label">{pct}%</div>
            </div>
            <p className="summary-line">
              You scored {score} out of {questions.length}.
            </p>
            <div className="summary-actions">
              <button className="btn" onClick={retryAll}>Retry All</button>
              {missed.length > 0 && (
                <button className="btn btn-secondary" onClick={retryMissed}>
                  ↺ Retry Wrong ({missed.length})
                </button>
              )}
              <Link href="/stats" className="btn btn-secondary">Back to Stats</Link>
            </div>

            {missed.length > 0 && (
              <div className="missed-list">
                <h3>Still Needs Review</h3>
                {missed.map((m, i) => (
                  <div className="missed-item" key={i}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '0.03em' }}>
                      {m.chapterTitle}
                    </div>
                    <div>{m.question}</div>
                    <div style={{ marginTop: 6 }}>
                      You chose <b>{m.yourAnswer}</b> ({m.options[m.yourAnswer]}) &middot; Correct:{' '}
                      <b style={{ color: 'var(--green)' }}>{m.answer}</b> ({m.options[m.answer]})
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const progressPct = (index / questions.length) * 100;

  return (
    <div className="app">
      {masthead}
      <div className="screen active">
        <div className="quiz-bar">
          <div />
          <div className="quiz-meta">
            <b>Missed Questions Review</b> &middot; Score {score}/{index}
          </div>
        </div>
        <div className="progress-rail">
          <div className="progress-rail-fill" style={{ width: progressPct + '%' }} />
        </div>

        <div className="answer-sheet">
          <p className="q-number">Question {index + 1} of {questions.length}</p>
          <p className="q-chapter-tag">{q.chapterTitle}</p>
          <p className="q-text">{q.question}</p>

          <div className="options">
            {Object.keys(q.options).map((letter) => {
              let cls = 'option';
              if (answered) {
                if (letter === q.answer) cls += ' correct';
                else if (letter === selected) cls += ' incorrect';
                else cls += ' fade';
                if (letter === selected) cls += ' selected';
              }
              return (
                <button
                  key={letter}
                  className={cls}
                  disabled={answered}
                  onClick={() => selectAnswer(letter)}
                >
                  <span className="bubble">{letter}</span>
                  <span>{q.options[letter]}</span>
                </button>
              );
            })}
          </div>

          {answered && (
            <div className={'feedback show' + (selected !== q.answer ? ' wrong' : '')}>
              <p className="feedback-label">
                {selected === q.answer ? 'Correct' : `Incorrect — Correct answer: ${q.answer}`}
              </p>
              <p className="feedback-text">{q.explanation}</p>
            </div>
          )}

          <div className="quiz-actions">
            <button className="btn" disabled={!answered} onClick={next}>
              {index === questions.length - 1 ? 'See Results' : 'Next Question'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
