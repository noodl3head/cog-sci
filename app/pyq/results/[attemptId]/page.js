'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getPaper } from '../../../../lib/pyqData';
import { getPyqReviewAnswerState, normalizePyqAttempt, responseMapForAttempt } from '../../../../lib/pyqHistory';

const LETTERS = ['A', 'B', 'C', 'D'];

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return hours
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function answerValues(answer) {
  if (answer == null || answer === '') return [];
  return Array.isArray(answer) ? answer.map(String) : [String(answer)];
}

function answerLabel(answer) {
  const values = answerValues(answer);
  return values.length ? values.join(', ') : 'Not answered';
}

export default function PyqPastResultPage() {
  const { attemptId } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [error, setError] = useState('');
  const [questionIndex, setQuestionIndex] = useState(0);

  useEffect(() => {
    fetch(`/api/pyq-results/${attemptId}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || data.error) throw new Error(data.error || 'Could not load this result.');
        return normalizePyqAttempt(data.attempt);
      })
      .then(setAttempt)
      .catch((requestError) => setError(requestError.message));
  }, [attemptId]);

  const paper = useMemo(() => (attempt ? getPaper(attempt.paperId) : null), [attempt]);
  const responses = useMemo(() => responseMapForAttempt(attempt), [attempt]);

  if (error) {
    return <div className="app"><div className="screen active"><div className="empty-state">{error}</div><Link href="/pyq/history" className="btn-link">← Past results</Link></div></div>;
  }
  if (!attempt) return <div className="app"><div className="screen active"><div className="empty-state">Loading result…</div></div></div>;

  const sections = Array.isArray(attempt.sections) ? attempt.sections : [];
  const hasResponses = paper && Object.keys(responses).length > 0;
  const question = hasResponses ? paper.questions[questionIndex] : null;
  const response = question ? responses[question.num] : null;
  const reviewAnswer = question ? getPyqReviewAnswerState(question, response) : { selected: [], correct: [], correctLabel: '', marksToAll: false };
  const selected = reviewAnswer.selected;
  const correct = reviewAnswer.correct;

  return (
    <div className="app">
      <div className="screen active">
        <div className="pyq-result-topbar">
          <div>
            <p className="page-eyebrow">Saved attempt #{attempt.id}</p>
            <h2 className="mock-list-title">GATE {attempt.paperId} · Result</h2>
            <p className="mock-list-sub">{new Date(attempt.createdAt).toLocaleString()} · {formatTime(attempt.timeSeconds)}</p>
          </div>
          <Link href="/pyq/history" className="btn-link">← Past results</Link>
        </div>

        <section className="pyq-past-summary" aria-label="Score summary">
          <div className="pyq-past-total">
            <span>Net score</span>
            <strong>{attempt.totalMarks.toFixed(2)}<small>/100</small></strong>
            <p><b className="mock-result-green">+{attempt.positiveMarks.toFixed(2)}</b> · <b className="mock-result-red">−{attempt.negativeMarks.toFixed(2)}</b></p>
          </div>
          <div className="pyq-past-sections">
            {sections.length > 0 ? sections.map((section) => (
              <div className="pyq-past-section" key={section.code}>
                <b>{section.code}</b>
                <span>{Number(section.net).toFixed(2)} / {section.maxMarks}</span>
                <small>{section.correct} correct · {section.wrong} wrong · {section.skipped} skipped</small>
              </div>
            )) : (
              <>
                <div className="pyq-past-section"><b>GA</b><span>{attempt.gaNet.toFixed(2)} / 15</span></div>
                <div className="pyq-past-section"><b>XH-B1</b><span>{attempt.b1Net.toFixed(2)} / 25</span></div>
                <div className="pyq-past-section"><b>XH-C5</b><span>{attempt.c5Net.toFixed(2)} / 60</span></div>
              </>
            )}
          </div>
        </section>

        {!hasResponses && (
          <div className="pyq-legacy-result-note">
            This attempt predates question-level answer tracking. Its score and section breakdown are available, but individual responses cannot be reconstructed.
          </div>
        )}

        {question && (
          <section className="pyq-past-review">
            <div className="pyq-review-toolbar">
              <div>
                <span className={`pyq-review-status ${response?.status || 'skipped'}`}>{response?.status || 'skipped'}</span>
                <b>Question {question.num} of {paper.questions.length}</b>
                <small>{question.section} · {question.type} · {question.marks} mark{question.marks === 1 ? '' : 's'}</small>
              </div>
              <div className="pyq-review-nav">
                <button className="btn btn-secondary" disabled={questionIndex === 0} onClick={() => setQuestionIndex((index) => index - 1)}>← Prev</button>
                <button className="btn btn-secondary" disabled={questionIndex === paper.questions.length - 1} onClick={() => setQuestionIndex((index) => index + 1)}>Next →</button>
              </div>
            </div>

            {question.stem && <p className="q-text pyq-stem" dangerouslySetInnerHTML={{ __html: question.stem }} />}
            {question.lines && <div className="pyq-lines">{question.lines.map((line, index) => <p className="pyq-line" key={index} dangerouslySetInnerHTML={{ __html: line }} />)}</div>}
            {question.table && (
              <div className="pyq-table-wrap">
                <table className="pyq-table">
                  <thead><tr>{question.table.headers.map((header, index) => <th key={index} dangerouslySetInnerHTML={{ __html: header }} />)}</tr></thead>
                  <tbody>{question.table.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex} dangerouslySetInnerHTML={{ __html: cell }} />)}</tr>)}</tbody>
                </table>
              </div>
            )}
            {question.image && <div className="pyq-figure"><img src={question.image} alt={`Figure for question ${question.num}`} /></div>}

            {reviewAnswer.marksToAll && <p className="pyq-marks-to-all">Marks were awarded to all candidates for this question.</p>}

            {question.type === 'NAT' ? (
              <div className="pyq-review-answer-line"><span>Your answer: <b>{answerLabel(response?.selectedAnswer)}</b></span><span>Accepted: <b>{reviewAnswer.correctLabel}</b></span></div>
            ) : (
              <div className={'options' + (question.imageOnly ? ' pyq-image-options' : '')}>
                {LETTERS.map((letter) => {
                  const label = question.options?.[letter] || '';
                  let className = 'option pyq-review-option';
                  if (reviewAnswer.marksToAll && selected.includes(letter)) className += ' selected';
                  else if (correct.includes(letter)) className += ' correct';
                  else if (selected.includes(letter)) className += ' incorrect';
                  else className += ' fade';
                  return <div className={className} key={letter}><span className="bubble">{letter}</span>{label && <span dangerouslySetInnerHTML={{ __html: label }} />}</div>;
                })}
              </div>
            )}

            {question.type !== 'NAT' && (
              <div className="pyq-review-answer-line">
                <span>Your answer: <b>{answerLabel(response?.selectedAnswer)}</b></span>
                <span>Correct answer: <b>{reviewAnswer.correctLabel}</b></span>
              </div>
            )}

            <div className="mock-palette-chips pyq-review-palette">
              {paper.questions.map((item, index) => {
                const saved = responses[item.num];
                const status = saved?.status === 'skipped' || !saved ? 'skip' : saved.status;
                return <button key={item.num} className={`mock-chip review-${status}${index === questionIndex ? ' current' : ''}`} onClick={() => setQuestionIndex(index)}>{item.num}</button>;
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
