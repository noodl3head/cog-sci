'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getMockHistory } from '../../../lib/clientStudyStore';
import { scoreRank } from '../../components/NormalDistChart';

function formatTime(seconds = 0) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

function delta(current, previous, suffix = '') {
  if (!previous) return 'First recorded attempt';
  const difference = current - previous;
  return `${difference > 0 ? '+' : ''}${difference.toFixed(suffix ? 0 : 2)}${suffix}`;
}

export default function MockHistoryPage() {
  const [history, setHistory] = useState([]);
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    const stored = getMockHistory();
    setHistory(stored);
    setSelectedId(stored[0]?.id || '');
  }, []);

  const selected = useMemo(() => history.find((attempt) => attempt.id === selectedId) || history[0], [history, selectedId]);
  const previous = selected ? history[history.findIndex((attempt) => attempt.id === selected.id) + 1] : null;
  const projection = selected ? scoreRank(selected.score) : null;
  const chronological = [...history].reverse();

  return (
    <div className="app">
      <main className="screen active history-page">
        <div className="history-header">
          <div>
            <p className="coverage-kicker">Private browser history</p>
            <h2>Mock History Comparison</h2>
            <p>Detailed attempt data stays on this device. Rank and percentile are modelled estimates, not comparisons with real users.</p>
          </div>
          {history.length > 0 && (
            <select value={selected?.id || ''} onChange={(event) => setSelectedId(event.target.value)}>
              {history.map((attempt) => <option value={attempt.id} key={attempt.id}>{attempt.title} · {new Date(attempt.createdAt).toLocaleString()}</option>)}
            </select>
          )}
        </div>

        {!selected ? (
          <div className="empty-state history-empty-state">
            <b>No detailed mock attempts on this browser yet.</b>
            <span>Complete a mock here to start the comparison timeline. Older Neon summary rows cannot reconstruct topic-level detail.</span>
            <Link href="/mock" className="btn">Start a mock</Link>
          </div>
        ) : (
          <>
            <section className="history-metrics">
              <div><span>Score</span><b>{selected.score.toFixed(2)}/50</b><small>{previous ? `${delta(selected.score, previous.score)} vs previous` : 'First recorded attempt'}</small></div>
              <div><span>Accuracy</span><b>{selected.accuracy}%</b><small>{previous ? `${delta(selected.accuracy, previous.accuracy, '%')} vs previous` : 'First recorded attempt'}</small></div>
              <div><span>Speed</span><b>{formatTime(selected.secondsPerAnswered)}</b><small>per answered question</small></div>
              <div><span>Negative lost</span><b>−{selected.negativeMarks.toFixed(2)}</b><small>{selected.changedCorrectToIncorrect} correct → incorrect</small></div>
              <div><span>Projected percentile</span><b>{projection.pct.toFixed(1)}th</b><small>modelled μ=25, σ=8</small></div>
              <div><span>Projected rank</span><b>~{projection.rank.toLocaleString()}</b><small>out of 4,500 modelled</small></div>
            </section>

            <section className="history-panel">
              <h3>Score trend</h3>
              <div className="history-trend">
                {chronological.map((attempt, index) => (
                  <div className="history-trend-column" key={attempt.id} title={`${attempt.title}: ${attempt.score}/50`}>
                    <span>{attempt.score.toFixed(1)}</span>
                    <i style={{ height: `${Math.max(3, (Math.max(0, attempt.score) / 50) * 100)}%` }} />
                    <small>{index + 1}</small>
                  </div>
                ))}
              </div>
            </section>

            <section className="history-panel">
              <h3>Topic breakdown</h3>
              <div className="history-topic-list">
                {selected.topicBreakdown.map((topic) => {
                  const accuracy = topic.attempted ? Math.round((topic.correct / topic.attempted) * 100) : 0;
                  return (
                    <div className="history-topic-row" key={topic.topic}>
                      <div><b>{topic.label}</b><span>{topic.correct} correct · {topic.wrong} wrong · {topic.skipped} skipped</span></div>
                      <div className="history-topic-bar"><i style={{ width: `${accuracy}%` }} /></div>
                      <strong>{accuracy}%</strong>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="history-panel">
              <h3>Attempt log</h3>
              <div className="history-attempt-table">
                {history.map((attempt) => (
                  <button key={attempt.id} className={attempt.id === selected.id ? 'selected' : ''} onClick={() => setSelectedId(attempt.id)}>
                    <span>{new Date(attempt.createdAt).toLocaleDateString()}</span>
                    <b>{attempt.title}</b>
                    <strong>{attempt.score.toFixed(2)}</strong>
                    <small>{attempt.accuracy}% · {formatTime(attempt.timeSeconds)}</small>
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
