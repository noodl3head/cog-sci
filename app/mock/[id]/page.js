'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { generatePresetMock, generateRandomMock, generateTopicMock } from '../../../lib/mockGenerator';
import { serializeMockResponses } from '../../../lib/agentData';
import { NormalDistChart } from '../../components/NormalDistChart';
import { GATE_2027_LEAF_BY_ID, GATE_2027_TOPIC_BY_ID } from '../../../lib/gateSyllabus';
import {
  buildAttemptRecord, correctAnswerKeys, formatQuestionAnswer,
  isQuestionAnswered as isAnswered, isQuestionCorrect as isCorrect,
  revisionItemFromQuestion,
} from '../../../lib/mockAnalytics';
import {
  addMockHistory, addRevisionItem, clearMockProgress, getRevisionList,
  getRecentlyUsedMockQuestionIds, loadMockProgress, rememberGeneratedMockQuestions,
  saveMockProgress, setLatestRevisionSheet,
} from '../../../lib/clientStudyStore';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function getQ(quiz, index) {
  if (index < 20) return { ...quiz.section1[index], mark: 1, section: 1 };
  return { ...quiz.section2[index - 20], mark: 2, section: 2 };
}

function calcResult(quiz, answers) {
  const { section1, section2 } = quiz;

  let s1c = 0, s1w = 0;
  section1.forEach((q, i) => {
    const a = answers[i];
    if (!isAnswered(q, a)) return;
    if (isCorrect(q, a)) s1c++; else s1w++;
  });
  const s1sk = 20 - s1c - s1w;

  let s2c = 0, s2w = 0;
  section2.forEach((q, i) => {
    const a = answers[20 + i];
    if (!isAnswered(q, a)) return;
    if (isCorrect(q, a)) s2c++; else s2w++;
  });
  const s2sk = 15 - s2c - s2w;

  const positive = s1c * 1 + s2c * 2;
  const s1Negative = section1.reduce((sum, q, i) => {
    const a = answers[i];
    return sum + (isAnswered(q, a) && !isCorrect(q, a) && q.type === 'MCQ' ? 1 / 3 : 0);
  }, 0);
  const s2Negative = section2.reduce((sum, q, i) => {
    const a = answers[20 + i];
    return sum + (isAnswered(q, a) && !isCorrect(q, a) && q.type === 'MCQ' ? 2 / 3 : 0);
  }, 0);
  const negative = s1Negative + s2Negative;
  return {
    s1Correct: s1c, s1Wrong: s1w, s1Skipped: s1sk,
    s2Correct: s2c, s2Wrong: s2w, s2Skipped: s2sk,
    s1Negative, s2Negative, positive, negative, total: positive - negative,
  };
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MockQuizPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedTopicKey = searchParams.get('topics') || '';

  // Generate quiz once per mount
  const initialQuiz = useMemo(() => {
    if (id === 'generated') {
      const selectedTopics = selectedTopicKey.split(',').filter(Boolean);
      const recentlyUsedIds = getRecentlyUsedMockQuestionIds();
      return selectedTopics.length
        ? generateTopicMock(selectedTopics, recentlyUsedIds)
        : generateRandomMock(recentlyUsedIds);
    }
    const n = parseInt(id, 10);
    if (n >= 1 && n <= 5) return generatePresetMock(n - 1);
    return null;
  }, [id, selectedTopicKey]);
  const [quiz, setQuiz] = useState(initialQuiz);

  // Quiz state
  const [phase, setPhase] = useState('quiz'); // 'quiz' | 'confirm' | 'results' | 'review'
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [answerHistory, setAnswerHistory] = useState({});
  const [flagged, setFlagged] = useState(new Set());
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [savedToDb, setSavedToDb] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [attemptRecord, setAttemptRecord] = useState(null);
  const [progressReady, setProgressReady] = useState(false);
  const [resumeNotice, setResumeNotice] = useState(false);
  const [revisionIds, setRevisionIds] = useState(new Set());
  const timerRef = useRef(null);
  const attemptSavedRef = useRef(false);

  useEffect(() => {
    const saved = loadMockProgress(id, selectedTopicKey);
    if (saved?.quiz?.section1?.length === 20 && saved?.quiz?.section2?.length === 15) {
      setQuiz(saved.quiz);
      setAnswers(saved.answers || {});
      setAnswerHistory(saved.answerHistory || {});
      setFlagged(new Set(saved.flagged || []));
      setCurrentIndex(Math.min(34, Math.max(0, saved.currentIndex || 0)));
      setTimeElapsed(saved.timeElapsed || 0);
      setResumeNotice(true);
    } else {
      setQuiz(initialQuiz);
    }
    setRevisionIds(new Set(getRevisionList().map((item) => item.questionId)));
    setProgressReady(true);
  }, [id, initialQuiz, selectedTopicKey]);

  // Timer — runs only during active quiz
  useEffect(() => {
    if (phase !== 'quiz') {
      clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => setTimeElapsed((t) => t + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  useEffect(() => {
    if (!progressReady || phase !== 'quiz' || !quiz) return;
    saveMockProgress(id, selectedTopicKey, {
      mockId: id,
      title: id === 'generated' ? 'Generated Mock' : `Mock Quiz ${id}`,
      topicKey: selectedTopicKey,
      quiz,
      answers,
      answerHistory,
      flagged: [...flagged],
      currentIndex,
      timeElapsed,
      savedAt: new Date().toISOString(),
    });
  }, [answerHistory, answers, currentIndex, flagged, id, phase, progressReady, quiz, selectedTopicKey, timeElapsed]);

  useEffect(() => {
    if (id === 'generated' && progressReady && quiz) {
      rememberGeneratedMockQuestions(quiz, selectedTopicKey);
    }
  }, [id, progressReady, quiz, selectedTopicKey]);

  if (!quiz) {
    return (
      <div className="app">
        <div className="masthead"><h1>GATE <span className="accent">Psych</span> Quizzer</h1></div>
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
    const current = q.type === 'MSQ' && Array.isArray(selectedAnswer) ? selectedAnswer : [];
    const nextAnswer = q.type === 'MCQ'
      ? letter
      : current.includes(letter) ? current.filter((selected) => selected !== letter) : [...current, letter];
    setAnswers((prev) => ({ ...prev, [currentIndex]: nextAnswer }));
    setAnswerHistory((prev) => ({ ...prev, [currentIndex]: [...(prev[currentIndex] || []), nextAnswer] }));
  }

  function setNumericAnswer(value) {
    setAnswers((prev) => ({ ...prev, [currentIndex]: value }));
    setAnswerHistory((prev) => ({ ...prev, [currentIndex]: [...(prev[currentIndex] || []), value] }));
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

  function restartMock() {
    clearMockProgress(id, selectedTopicKey);
    window.location.reload();
  }

  function addQuestionToRevision(question, answer) {
    const nextRevision = addRevisionItem(revisionItemFromQuestion(question, answer, mockTitle));
    setRevisionIds(new Set(nextRevision.map((item) => item.questionId)));
  }

  function findSimilarQuestion(question, fromIndex) {
    const questions = [...quiz.section1, ...quiz.section2];
    const sameLeaf = questions.findIndex((candidate, index) =>
      index !== fromIndex && candidate.syllabusLeaf && candidate.syllabusLeaf === question.syllabusLeaf
    );
    if (sameLeaf >= 0) return sameLeaf;
    return questions.findIndex((candidate, index) => index !== fromIndex && candidate.topic === question.topic);
  }

  const allQuestions = [...quiz.section1, ...quiz.section2];
  const answeredCount = allQuestions.filter((question, i) => isAnswered(question, answers[i])).length;
  const unanswered = totalQ - answeredCount;

  function submitMock() {
    const result = calcResult(quiz, answers);
    const record = buildAttemptRecord({
      quiz, answers, answerHistory, result, mockId: id,
      title: mockTitle, timeSeconds: timeElapsed,
    });
    if (!attemptSavedRef.current) {
      attemptSavedRef.current = true;
      addMockHistory(record);
      setLatestRevisionSheet(record.incorrectQuestions, `${mockTitle} - incorrect questions`);
      clearMockProgress(id, selectedTopicKey);
      setAttemptRecord(record);
    }
    setPhase('results');
    if (!savedToDb) {
      setSavedToDb(true);
      fetch('/api/mock-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mockId: id,
          positiveMarks: +result.positive.toFixed(2),
          negativeMarks: +result.negative.toFixed(2),
          totalMarks: +result.total.toFixed(2),
          timeSeconds: timeElapsed,
          s1Correct: result.s1Correct, s1Wrong: result.s1Wrong, s1Skipped: result.s1Skipped,
          s2Correct: result.s2Correct, s2Wrong: result.s2Wrong, s2Skipped: result.s2Skipped,
          responses: serializeMockResponses(quiz, answers, answerHistory),
        }),
      })
        .then((r) => r.json())
        .then((d) => { if (d.error) setSaveError(d.error); })
        .catch((e) => setSaveError(e.message || 'Network error — result not saved.'));
    }
  }

  // ── Masthead ────────────────────────────────────────────────────────────────
  const masthead = (
    <div className="masthead">
      <h1>GATE <span className="accent">Psych</span> Quizzer</h1>
      <div className="nav-links">
        <span className="mock-timer-chip">
          <span className="mock-timer-icon">⏱</span>
          {formatTime(timeElapsed)}
        </span>
        <Link href="/mock/history" className="btn-link">History</Link>
        <Link href="/revision" className="btn-link">Revision</Link>
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
      const answerIsCorrect = isCorrect(rq, rAnswered);
      const isSkipped = !isAnswered(rq, rAnswered);
      const selectedSet = rq.type === 'MSQ' ? (Array.isArray(rAnswered) ? rAnswered : []) : [rAnswered];
      const correctSet = correctAnswerKeys(rq);
      const topic = GATE_2027_TOPIC_BY_ID[rq.topic];
      const leaf = GATE_2027_LEAF_BY_ID[rq.syllabusLeaf];
      const conceptLabel = rq.syllabusLeafSource === 'topic-fallback'
        ? (rq.originalChapterTitle || rq.chapterTitle)
        : (leaf?.label || rq.originalChapterTitle || rq.chapterTitle);
      const takeaway = String(rq.explanation || '').split(/(?<=[.!?])\s+/)[0];
      const similarIndex = findSimilarQuestion(rq, reviewIndex);

      return (
        <div className="app">
          {masthead}
          <div className="screen active">
            <div className="mock-review-bar">
              <button className="btn btn-secondary" onClick={() => setPhase('results')}>← Results</button>
              <span className="mock-review-counter">
                Q{reviewIndex + 1} / {totalQ}
                {reviewIndex < 20
                  ? <span className="mock-mark-badge s1">{rq.type} · 1mk</span>
                  : <span className="mock-mark-badge s2">{rq.type} · 2mk</span>
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
              {rq.context && (
                <div className="question-context">
                  <div className="question-context-title">{rq.context.title}</div>
                  <div className="question-context-body">{rq.context.body}</div>
                </div>
              )}
              <p className="q-text">{rq.question}</p>

              {rq.type === 'NAT' ? (
                <div className="mock-nat-review">
                  <span>Your answer: <b>{isSkipped ? 'Not answered' : rAnswered}</b></span>
                  <span>Correct answer: <b>{rq.answer}</b></span>
                </div>
              ) : (
                <div className="options">
                  {Object.keys(rq.options).map((letter) => {
                  let cls = 'option';
                  if (correctSet.includes(letter)) cls += ' correct';
                  else if (selectedSet.includes(letter) && !answerIsCorrect) cls += ' incorrect selected';
                  else cls += ' fade';
                  return (
                    <button key={letter} className={cls} disabled>
                      <span className="bubble">{letter}</span>
                      <span>{rq.options[letter]}</span>
                      {correctSet.includes(letter) && <span className="review-correct-tag">✓ correct</span>}
                      {selectedSet.includes(letter) && !correctSet.includes(letter) && <span className="review-wrong-tag">✗ your answer</span>}
                    </button>
                  );
                  })}
                </div>
              )}

              {answerIsCorrect ? (
                <div className="feedback show">
                  <p className="feedback-label">Correct</p>
                  <p className="feedback-text">{rq.explanation}</p>
                </div>
              ) : (
                <div className="mistake-review-card">
                  <div className="mistake-review-title">{isSkipped ? 'Skipped question' : 'Turn this mistake into a revision point'}</div>
                  <div className="mistake-answer-grid">
                    <div><span>Your answer</span><b>{formatQuestionAnswer(rq, rAnswered)}</b></div>
                    <div><span>Correct answer</span><b>{formatQuestionAnswer(rq, rq.type === 'MSQ' ? rq.answers : String(rq.answer))}</b></div>
                  </div>
                  <div className="mistake-learning-row">
                    <span>Why this was wrong</span>
                    <p>{isSkipped ? 'No answer was submitted, so the underlying relationship was not applied.' : rq.explanation}</p>
                  </div>
                  <div className="mistake-learning-row">
                    <span>Underlying concept</span>
                    <p><b>{conceptLabel}</b></p>
                  </div>
                  <div className="mistake-takeaway">
                    <span>Remember this</span>
                    <p>{takeaway || 'Review the keyed relationship, then apply it to a fresh example.'}</p>
                  </div>
                  <div className="mistake-source">
                    <span>Source: <b>{rq.sourceName}</b></span>
                    <span>Syllabus: <b>{topic?.section} {topic?.label}</b></span>
                  </div>
                  <div className="mistake-actions">
                    <button className="btn btn-secondary" disabled={similarIndex < 0} onClick={() => setReviewIndex(similarIndex)}>
                      Try similar question
                    </button>
                    <button className="btn" onClick={() => addQuestionToRevision(rq, rAnswered)}>
                      {revisionIds.has(rq.id) ? 'Added to revision list' : 'Add to revision list'}
                    </button>
                  </div>
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
                    const status = !isAnswered(sq, a) ? 'skip' : isCorrect(sq, a) ? 'correct' : 'wrong';
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
                    const status = !isAnswered(sq, a) ? 'skip' : isCorrect(sq, a) ? 'correct' : 'wrong';
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

            {attemptRecord && (
              <div className="mock-learning-summary">
                <div><span>Accuracy</span><b>{attemptRecord.accuracy}%</b></div>
                <div><span>Speed</span><b>{formatTime(attemptRecord.secondsPerAnswered)} / answered</b></div>
                <div><span>Negative marks lost</span><b>−{attemptRecord.negativeMarks.toFixed(2)}</b></div>
                <div><span>Correct → incorrect</span><b>{attemptRecord.changedCorrectToIncorrect}</b></div>
              </div>
            )}

            {/* Section breakdown */}
            <div className="mock-result-sections">
              <div className="mock-result-sec">
                <div className="mock-result-sec-title">Section 1 <span className="mock-mark-badge s1">1 mk · MCQ/MSQ/NAT</span></div>
                <div className="mock-result-row"><span>Correct</span><span className="mock-result-green">+{result.s1Correct}</span></div>
                <div className="mock-result-row"><span>Wrong</span><span className="mock-result-red">−{result.s1Wrong}</span></div>
                <div className="mock-result-row"><span>Skipped</span><span>{result.s1Skipped}</span></div>
                <div className="mock-result-row marks">
                  <span>+{result.s1Correct.toFixed(0)}</span>
                  <span className="mock-result-red">−{result.s1Negative.toFixed(2)}</span>
                </div>
              </div>
              <div className="mock-result-sec">
                <div className="mock-result-sec-title">Section 2 <span className="mock-mark-badge s2">2 mk · MCQ/MSQ/NAT</span></div>
                <div className="mock-result-row"><span>Correct</span><span className="mock-result-green">+{result.s2Correct}</span></div>
                <div className="mock-result-row"><span>Wrong</span><span className="mock-result-red">−{result.s2Wrong}</span></div>
                <div className="mock-result-row"><span>Skipped</span><span>{result.s2Skipped}</span></div>
                <div className="mock-result-row marks">
                  <span>+{(result.s2Correct * 2).toFixed(0)}</span>
                  <span className="mock-result-red">−{result.s2Negative.toFixed(2)}</span>
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

            {/* Normal distribution comparison */}
            <NormalDistChart score={result.total} />

            {saveError && (
              <div className="mock-save-error">
                ⚠ Result not saved: {saveError}
              </div>
            )}

            <div className="summary-actions">
              <button className="btn" onClick={() => {
                const firstMistake = allQuestions.findIndex((question, index) => !isCorrect(question, answers[index]));
                setReviewIndex(firstMistake >= 0 ? firstMistake : 0);
                setPhase('review');
              }}>
                Review Mistakes
              </button>
              <button className="btn btn-secondary" disabled={!attemptRecord?.incorrectQuestions.length} onClick={() => router.push('/revision?view=latest')}>
                Export Incorrect Questions
              </button>
              <Link href="/mock/history" className="btn btn-secondary">Compare Attempts</Link>
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

        {resumeNotice && (
          <div className="mock-resume-banner">
            <span><b>Mock resumed.</b> Your answers, flags, position and timer were restored.</span>
            <button type="button" onClick={restartMock}>Restart this mock</button>
          </div>
        )}

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
            Section 2 — 2 Marks per question &middot; MCQ: −⅔ for a wrong answer &middot; MSQ/NAT: no negative marking
          </div>
        )}

        {/* Question */}
        <div className="answer-sheet">
          <div className="mock-q-header">
            <p className="q-number">Question {currentIndex + 1} of {totalQ}</p>
            <span className={'mock-mark-badge ' + (q.section === 1 ? 's1' : 's2')}>
              {q.type} · {q.mark} mk · {q.type === 'MCQ' ? `−${q.section === 1 ? '⅓' : '⅔'} wrong` : 'no negative'}
            </span>
          </div>
          <p className="q-chapter-tag">{q.chapterTitle}</p>
          {q.context && (
            <div className="question-context">
              <div className="question-context-title">{q.context.title}</div>
              <div className="question-context-body">{q.context.body}</div>
            </div>
          )}
          {q.type === 'MSQ' && <p className="pyq-msq-hint">Multiple Select — choose all correct options.</p>}
          <p className="q-text">{q.question}</p>

          {q.type === 'NAT' ? (
            <div className="pyq-nat-block">
              <label className="pyq-nat-label" htmlFor="mock-nat-answer">Numerical answer</label>
              <input
                id="mock-nat-answer"
                className="pyq-nat-input"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={selectedAnswer || ''}
                onChange={(event) => setNumericAnswer(event.target.value)}
                placeholder="Enter a number"
              />
            </div>
          ) : (
            <div className="options">
              {Object.keys(q.options).map((letter) => (
              <button
                key={letter}
                className={'option mock-option' + ((q.type === 'MSQ' ? (selectedAnswer || []).includes(letter) : selectedAnswer === letter) ? ' mock-selected' : '')}
                onClick={() => selectOption(letter)}
              >
                <span className="bubble">{letter}</span>
                <span>{q.options[letter]}</span>
              </button>
              ))}
            </div>
          )}

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
              <button className="btn btn-secondary" onClick={clearAnswer} disabled={!isAnswered(q, selectedAnswer)}>Clear</button>
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
              {quiz.section1.map((question, i) => {
                const answered = isAnswered(question, answers[i]);
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
              {quiz.section2.map((question, i) => {
                const gi = 20 + i;
                const answered = isAnswered(question, answers[gi]);
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
