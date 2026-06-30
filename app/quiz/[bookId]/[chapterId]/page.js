'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getChapter } from '../../../../lib/quizHelpers';

export default function QuizPage() {
  const params = useParams();
  const { bookId, chapterId } = params;

  const chapter = useMemo(() => getChapter(bookId, chapterId), [bookId, chapterId]);

  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [missed, setMissed] = useState([]);
  const [finished, setFinished] = useState(false);

  if (!chapter) {
    return (
      <div className="app">
        <div className="masthead">
          <h1>
            AP <span className="accent">Psych</span> Quizzer
          </h1>
        </div>
        <div className="screen active">
          <div className="empty-state">Couldn&apos;t find that chapter.</div>
          <div style={{ marginTop: 16 }}>
            <Link href="/" className="btn-link">
              &larr; Back home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const questions = chapter.questions;
  const q = questions[index];
  const questionNumber = index + 1; // matches lib/quizHelpers indexing convention

  function selectAnswer(letter) {
    if (answered) return;
    setSelected(letter);
    setAnswered(true);
    const isCorrect = letter === q.answer;
    if (isCorrect) {
      setScore((s) => s + 1);
    } else {
      setMissed((m) => [
        ...m,
        {
          question: q.question,
          yourAnswer: letter,
          yourText: q.options[letter],
          correctAnswer: q.answer,
          correctText: q.options[q.answer],
          explanation: q.explanation,
        },
      ]);
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
    }).catch(() => {
      // Non-fatal: quiz still works locally even if the write fails (e.g. DB not configured yet)
    });
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

  function retry() {
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
          <h1>
            AP <span className="accent">Psych</span> Quizzer
          </h1>
          <Link href="/" className="btn-link">
            &larr; All Chapters
          </Link>
        </div>
        <div className="screen active">
          <div className="summary-card">
            <div className="chapter-name">{chapter.title}</div>
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
                Retry Chapter
              </button>
              <Link href="/" className="btn btn-secondary">
                Choose Another Chapter
              </Link>
              <Link href="/stats" className="btn btn-secondary">
                View My Stats
              </Link>
            </div>

            {missed.length > 0 && (
              <div className="missed-list">
                <h3>Questions to Review</h3>
                {missed.map((m, i) => (
                  <div className="missed-item" key={i}>
                    <div>{m.question}</div>
                    <div style={{ marginTop: 6 }}>
                      You chose <b>{m.yourAnswer}</b> ({m.yourText}) &middot; Correct:{' '}
                      <b style={{ color: 'var(--green)' }}>{m.correctAnswer}</b> ({m.correctText})
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
        <h1>
          AP <span className="accent">Psych</span> Quizzer
        </h1>
        <Link href="/" className="btn-link">
          &larr; All Chapters
        </Link>
      </div>

      <div className="screen active">
        <div className="quiz-bar">
          <div />
          <div className="quiz-meta">
            <b>{chapter.title}</b> &middot; Score {score}/{index}
          </div>
        </div>
        <div className="progress-rail">
          <div className="progress-rail-fill" style={{ width: progressPct + '%' }} />
        </div>

        <div className="answer-sheet">
          <p className="q-number">
            Question {questionNumber} of {questions.length}
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
