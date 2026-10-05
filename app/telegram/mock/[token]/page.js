'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const LETTERS = ['A', 'B', 'C', 'D'];

function rationaleCount(questions, reasoning) {
  return questions.reduce((count, _question, index) => count + LETTERS.filter(
    (letter) => reasoning?.[index]?.[letter]?.trim(),
  ).length, 0);
}

export default function TelegramWebMockPage({ params }) {
  const { token } = params;
  const [session, setSession] = useState(null);
  const [responses, setResponses] = useState({});
  const [reasoning, setReasoning] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeOption, setActiveOption] = useState(null);
  const [loadState, setLoadState] = useState('loading');
  const [saveState, setSaveState] = useState('Saved');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const hydrated = useRef(false);
  const responsesRef = useRef(responses);
  const reasoningRef = useRef(reasoning);
  const currentIndexRef = useRef(currentIndex);

  useEffect(() => { responsesRef.current = responses; }, [responses]);
  useEffect(() => { reasoningRef.current = reasoning; }, [reasoning]);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch(`/api/telegram/mock/${token}`, { cache: 'no-store' });
        if (cancelled) return;
        if (response.status === 404) {
          setLoadState('not-found');
          return;
        }
        if (!response.ok) throw new Error('Could not load mock');
        const data = await response.json();
        if (cancelled) return;
        setSession(data);
        setResponses(data.responses || {});
        setReasoning(data.reasoning || {});
        setCurrentIndex(Math.min(Math.max(data.currentIndex || 0, 0), Math.max(data.questions.length - 1, 0)));
        setLoadState('ready');
      } catch {
        if (!cancelled) setLoadState('error');
      }
    }
    load();
    return () => { cancelled = true; };
  }, [token]);

  const saveProgress = useCallback(async () => {
    if (!session || session.status !== 'in_progress') return true;
    setSaveState('Saving…');
    try {
      const response = await fetch(`/api/telegram/mock/${token}/progress`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          responses: responsesRef.current,
          reasoning: reasoningRef.current,
          currentIndex: currentIndexRef.current,
        }),
      });
      if (!response.ok) throw new Error('Save failed');
      setSaveState('Saved');
      return true;
    } catch {
      setSaveState('Could not save; retrying');
      return false;
    }
  }, [session, token]);

  useEffect(() => {
    if (!session || session.status !== 'in_progress') return undefined;
    if (!hydrated.current) {
      hydrated.current = true;
      return undefined;
    }
    const timer = setTimeout(() => { void saveProgress(); }, 700);
    return () => clearTimeout(timer);
  }, [responses, reasoning, currentIndex, saveProgress, session]);

  useEffect(() => () => { void saveProgress(); }, [saveProgress]);

  function toggleOption(index, letter) {
    setResponses((current) => {
      const selected = Array.isArray(current?.[index]) ? current[index] : [];
      const next = selected.includes(letter)
        ? selected.filter((value) => value !== letter)
        : [...selected, letter];
      return { ...current, [index]: next };
    });
  }

  function updateReasoning(index, letter, value) {
    setReasoning((current) => ({
      ...current,
      [index]: { ...(current[index] || {}), [letter]: value },
    }));
  }

  async function changeQuestion(index) {
    await saveProgress();
    setCurrentIndex(index);
    setActiveOption(null);
  }

  async function submitMock() {
    setSubmitError('');
    setSubmitting(true);
    await saveProgress();
    try {
      const response = await fetch(`/api/telegram/mock/${token}/submit`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ responses: responsesRef.current, reasoning: reasoningRef.current }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not submit mock');
      setSession(data);
      setResponses(data.responses || {});
      setReasoning(data.reasoning || {});
      setSaveState('Saved');
    } catch (error) {
      setSubmitError(error.message || 'Could not submit mock');
    } finally {
      setSubmitting(false);
    }
  }

  if (loadState === 'loading') return <main className="web-msq-page"><p>Loading today’s MSQ mock…</p></main>;
  if (loadState === 'not-found') return <main className="web-msq-page"><h1>Mock not found</h1><p>This link is invalid or no longer available.</p></main>;
  if (loadState === 'error') return <main className="web-msq-page"><h1>Could not load mock</h1><p>Please refresh and try again.</p></main>;

  const questions = session.questions || [];
  const completed = session.status === 'completed';
  const currentQuestion = questions[currentIndex];
  const rationalesWritten = rationaleCount(questions, reasoning);
  const totalRationales = questions.length * LETTERS.length;
  const missingRationales = totalRationales - rationalesWritten;
  const selectionsComplete = questions.every((_, index) => Array.isArray(responses?.[index]));
  const canSubmit = !completed && selectionsComplete && missingRationales === 0;
  const readyCount = questions.filter((_, index) => LETTERS.every(
    (letter) => reasoning?.[index]?.[letter]?.trim(),
  )).length;

  if (completed) {
    const result = session.webResult;
    return <main className="web-msq-page">
      <header className="web-msq-header">
        <div><p className="web-msq-kicker">Daily GATE XH-C5 MSQ mock</p><h1>Completed</h1></div>
        <p>{result?.score ?? 0} / {result?.maxMarks ?? 0} marks · no negative marking</p>
      </header>
      <section className="web-msq-results" aria-label="Mock results">
        <p>{result?.correctCount ?? 0} of {questions.length} questions earned full marks.</p>
        {(result?.rows || []).map((row, index) => <details className="web-msq-review" key={row.questionId}>
          <summary>Question {index + 1} · {row.marksAwarded} marks</summary>
          {LETTERS.map((letter) => {
            const selectedIsTrue = row.selected.includes(letter);
            const correctIsTrue = row.correct.includes(letter);
            const optionIsCorrect = selectedIsTrue === correctIsTrue;
            return <div className="web-msq-review-option" key={letter}>
              <div className="web-msq-review-option-header">
                <strong>{letter}</strong>
                <span className={`web-msq-review-verdict web-msq-review-verdict--${optionIsCorrect ? 'correct' : 'incorrect'}`}>
                  {optionIsCorrect ? '✓ Correct' : '✕ Incorrect'}
                </span>
              </div>
              <div className="web-msq-review-answer-grid">
                <div><span>Your answer:</span><b>{selectedIsTrue ? 'True' : 'False'}</b></div>
                <div><span>Correct answer:</span><b>{correctIsTrue ? 'True' : 'False'}</b></div>
              </div>
              <p className="web-msq-review-statement">{questions[index]?.options?.[letter]}</p>
              <p><b>Your reasoning:</b> {row.reasoning?.[letter] || 'No rationale saved.'}</p>
            </div>;
          })}
          <p><b>Explanation:</b> {row.explanation}</p>
        </details>)}
      </section>
    </main>;
  }

  if (!currentQuestion) return <main className="web-msq-page"><h1>Mock has no questions</h1></main>;

  return <main className="web-msq-page">
    <header className="web-msq-header">
      <div><p className="web-msq-kicker">Daily GATE XH-C5 MSQ mock</p><h1>Reasoning-first practice</h1></div>
      <div className="web-msq-save" aria-live="polite">{saveState}</div>
    </header>
    <nav className="web-msq-palette" aria-label="Question palette">
      {questions.map((_, index) => <button
        className={index === currentIndex ? 'web-msq-palette-button web-msq-palette-button--current' : 'web-msq-palette-button'}
        key={index}
        onClick={() => { void changeQuestion(index); }}
        type="button"
      >{index + 1}{LETTERS.every((letter) => reasoning?.[index]?.[letter]?.trim()) ? ' ✓' : ''}</button>)}
    </nav>
    <div className="web-msq-status">{readyCount} / {questions.length} ready · {rationalesWritten} / {totalRationales} rationales written</div>
    <section className="web-msq-question">
      <p className="web-msq-meta">Question {currentIndex + 1} of {questions.length} · MSQ · {currentQuestion.marks} marks · no negative marking</p>
      <h2>{currentQuestion.question}</h2>
      <p className="web-msq-instruction">Check every option you judge true/correct. Explain why every option is true or false before final submission.</p>
      <div className="web-msq-options">
        {LETTERS.map((letter) => {
          const selected = Array.isArray(responses?.[currentIndex]) && responses[currentIndex].includes(letter);
          const value = reasoning?.[currentIndex]?.[letter] || '';
          const expanded = activeOption === `${currentIndex}-${letter}` || Boolean(value);
          return <article className={`web-msq-option${expanded ? ' web-msq-option--active' : ''}`} key={letter}>
            <div className="web-msq-option-header">
              <input
                checked={selected}
                className="web-msq-checkbox"
                id={`option-${currentIndex}-${letter}`}
                type="checkbox"
                aria-label={`Mark option ${letter} as true`}
                onChange={() => toggleOption(currentIndex, letter)}
              />
              {expanded
                ? <span className="web-msq-option-eyebrow">{letter} · {currentQuestion.options[letter]}</span>
                : <label htmlFor={`option-${currentIndex}-${letter}`}><b>{letter}.</b> {currentQuestion.options[letter]}</label>}
            </div>
            <label className="web-msq-reasoning-label" htmlFor={`reasoning-${currentIndex}-${letter}`}>
              <span>Your reasoning — why this option is true/false: {selected ? 'Why is this true?' : 'Why is this false?'}</span>
              <textarea
                className="web-msq-reasoning"
                id={`reasoning-${currentIndex}-${letter}`}
                value={value}
                maxLength={1000}
                placeholder={selected ? 'Why is this true?' : 'Why is this false?'}
                aria-label={selected ? `Why is option ${letter} true?` : `Why is option ${letter} false?`}
                onFocus={() => setActiveOption(`${currentIndex}-${letter}`)}
                onChange={(event) => updateReasoning(currentIndex, letter, event.target.value)}
              />
            </label>
          </article>;
        })}
      </div>
    </section>
    <footer className="web-msq-actions">
      <button disabled={currentIndex === 0} onClick={() => { void changeQuestion(currentIndex - 1); }} type="button">Previous</button>
      <button disabled={currentIndex === questions.length - 1} onClick={() => { void changeQuestion(currentIndex + 1); }} type="button">Next</button>
      <div className="web-msq-submit-area">
        {!canSubmit && <p>{missingRationales} rationale{missingRationales === 1 ? '' : 's'} still required{selectionsComplete ? '' : '; visit each question and make a true/false selection.'}</p>}
        {submitError && <p className="web-msq-error">{submitError}</p>}
        <button className="primary" disabled={!canSubmit || submitting} onClick={() => { void submitMock(); }} type="button">
          {submitting ? 'Submitting…' : 'Submit mock'}
        </button>
      </div>
    </footer>
  </main>;
}
