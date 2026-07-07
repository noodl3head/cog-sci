'use client';

import { useMemo, useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getChapter } from '../../../../lib/quizHelpers';

function saveKey(bookId, chapterId) {
  return `quiz_progress_${bookId}_${chapterId}`;
}

function clearSave(bookId, chapterId) {
  try { localStorage.removeItem(saveKey(bookId, chapterId)); } catch {}
}

export default function QuizPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { bookId, chapterId } = params;

  const chapter = useMemo(() => getChapter(bookId, chapterId), [bookId, chapterId]);
  const isMissedMode = !!searchParams.get('missed');

  const initialQuestions = useMemo(() => {
    if (!chapter) return [];
    const missedParam = searchParams.get('missed');
    const base = chapter.questions.filter((q) => !q.imageRequired);
    if (!missedParam) return base;
    const nums = new Set(missedParam.split(',').map(Number));
    return base.filter((_, i) => nums.has(i + 1));
  }, [chapter, searchParams]);

  const [questions, setQuestions] = useState(initialQuestions);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [missed, setMissed] = useState([]);
  const [finished, setFinished] = useState(false);

  // undefined = still checking, null = nothing saved, object = saved progress found
  const [savedProgress, setSavedProgress] = useState(undefined);

  useEffect(() => {
    if (isMissedMode || !chapter) {
      setSavedProgress(null);
      return;
    }
    try {
      const raw = localStorage.getItem(saveKey(bookId, chapterId));
      if (!raw) { setSavedProgress(null); return; }
      const data = JSON.parse(raw);
      if (data && data.index > 0 && data.total === chapter.questions.length) {
        setSavedProgress(data);
      } else {
        setSavedProgress(null);
      }
    } catch {
      setSavedProgress(null);
    }
  }, []);

  if (!chapter) {
    return (
      <div className="app">
        <div className="masthead">
          <h1>AP <span className="accent">Psych</span> Quizzer</h1>
        </div>
        <div className="screen active">
          <div className="empty-state">Couldn&apos;t find that chapter.</div>
          <div style={{ marginTop: 16 }}>
            <Link href="/" className="btn-link">&larr; Back home</Link>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="app">
        <div className="masthead">
          <h1>AP <span className="accent">Psych</span> Quizzer</h1>
          <Link href="/" className="btn-link">&larr; All Chapters</Link>
        </div>
        <div className="screen active">
          <div className="empty-state">No missed questions to practice — great job!</div>
        </div>
      </div>
    );
  }

  // Show resume prompt while we're still checking localStorage (savedProgress === undefined)
  // or when we found saved progress (savedProgress is an object)
  if (savedProgress === undefined) {
    // Still hydrating — render nothing to avoid flash
    return null;
  }

  if (savedProgress) {
    function doResume() {
      setIndex(savedProgress.index);
      setScore(savedProgress.score);
      setMissed(savedProgress.missed || []);
      setSavedProgress(null);
    }
    function doFresh() {
      clearSave(bookId, chapterId);
      setSavedProgress(null);
    }

    return (
      <div className="app">
        <div className="masthead">
          <h1>AP <span className="accent">Psych</span> Quizzer</h1>
          <Link href="/" className="btn-link">&larr; All Chapters</Link>
        </div>
        <div className="screen active">
          <div className="resume-card">
            <div className="resume-icon">⏸</div>
            <h2 className="resume-title">Resume {chapter.title}?</h2>
            <p className="resume-sub">
              You were on question <b>{savedProgress.index + 1}</b> of <b>{savedProgress.total}</b>
              {' '}with a score of <b>{savedProgress.score}/{savedProgress.index}</b>.
            </p>
            <div className="resume-actions">
              <button className="btn" onClick={doResume}>
                Resume from Q{savedProgress.index + 1}
              </button>
              <button className="btn btn-secondary" onClick={doFresh}>
                Start Fresh
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[index];
  const questionNumber = chapter.questions.indexOf(q) + 1;

  function selectAnswer(letter) {
    if (answered) return;
    setSelected(letter);
    setAnswered(true);
    const isCorrect = letter === q.answer;

    const newScore = isCorrect ? score + 1 : score;
    const newMissed = isCorrect ? missed : [...missed, { ...q, yourAnswer: letter }];

    if (isCorrect) setScore(newScore);
    else setMissed(newMissed);

    // Auto-save progress (not in missed mode — that's transient)
    if (!isMissedMode) {
      try {
        localStorage.setItem(saveKey(bookId, chapterId), JSON.stringify({
          index: index + 1,  // next question to answer on resume
          score: newScore,
          missed: newMissed,
          total: questions.length,
          savedAt: Date.now(),
        }));
      } catch {}
    }

    fetch('/api/attempts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookId,
        chapterId,
        questionNumber,
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
      clearSave(bookId, chapterId);
      setFinished(true);
    }
  }

  function retry() {
    clearSave(bookId, chapterId);
    setQuestions(initialQuestions);
    setIndex(0);
    setScore(0);
    setSelected(null);
    setAnswered(false);
    setMissed([]);
    setFinished(false);
  }

  function retryMissed() {
    clearSave(bookId, chapterId);
    const missedQs = missed.map(({ yourAnswer, ...q }) => q);
    setQuestions(missedQs);
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
        <div className="masthead">
          <h1>AP <span className="accent">Psych</span> Quizzer</h1>
          <Link href="/" className="btn-link">&larr; All Chapters</Link>
        </div>
        <div className="screen active">
          <div className="summary-card">
            <div className="chapter-name">
              {chapter.title}
              {isMissedMode && <span style={{ color: 'var(--yellow)', marginLeft: 8 }}>· Missed Review</span>}
            </div>
            <div className="score-ring">
              <svg width="150" height="150" viewBox="0 0 150 150">
                <circle className="ring-bg" cx="75" cy="75" r="65" />
                <circle
                  className="ring-fill"
                  cx="75"
                  cy="75"
                  r="65"
                  strokeDasharray={`${dash} ${circumference}`}
                />
              </svg>
              <div className="ring-label">{pct}%</div>
            </div>
            <p className="summary-line">
              You scored {score} out of {questions.length}.
            </p>
            <div className="summary-actions">
              <button className="btn" onClick={retry}>
                {isMissedMode ? 'Retry Missed' : 'Retry Chapter'}
              </button>
              {missed.length > 0 && (
                <button className="btn btn-secondary" onClick={retryMissed}>
                  ↺ Retry Wrong ({missed.length})
                </button>
              )}
              <Link href="/" className="btn btn-secondary">All Chapters</Link>
              <Link href="/stats" className="btn btn-secondary">My Stats</Link>
            </div>

            {missed.length > 0 && (
              <div className="missed-list">
                <h3>Questions to Review</h3>
                {missed.map((m, i) => (
                  <div className="missed-item" key={i}>
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
      <div className="masthead">
        <h1>AP <span className="accent">Psych</span> Quizzer</h1>
        <Link href="/" className="btn-link">&larr; All Chapters</Link>
      </div>

      <div className="screen active">
        <div className="quiz-bar">
          <div />
          <div className="quiz-meta">
            <b>{chapter.title}</b>
            {isMissedMode && <span style={{ color: 'var(--yellow)' }}> · Missed Review</span>}
            {' '}&middot; Score {score}/{index}
          </div>
        </div>
        <div className="progress-rail">
          <div className="progress-rail-fill" style={{ width: progressPct + '%' }} />
        </div>

        <div className="answer-sheet">
          <p className="q-number">
            Question {index + 1} of {questions.length}
          </p>
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
