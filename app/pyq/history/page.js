'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { normalizePyqAttempt } from '../../../lib/pyqHistory';

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '—';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return hours
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function PyqHistoryPage() {
  const [attempts, setAttempts] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/pyq-results/history')
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || data.error) throw new Error(data.error || 'Could not load results.');
        return (data.history || []).map(normalizePyqAttempt);
      })
      .then(setAttempts)
      .catch((requestError) => setError(requestError.message));
  }, []);

  return (
    <div className="app">
      <div className="screen active">
        <div className="pyq-history-header">
          <div>
            <p className="page-eyebrow">Previous papers</p>
            <h2 className="mock-list-title">Past PYQ results</h2>
          </div>
          <Link href="/pyq" className="btn-link">← Papers</Link>
        </div>

        {error && <div className="empty-state">{error}</div>}
        {!attempts && !error && <div className="empty-state">Loading past results…</div>}
        {attempts?.length === 0 && <div className="empty-state">No completed PYQ papers yet.</div>}

        {attempts?.length > 0 && (
          <div className="pyq-history-list">
            <div className="pyq-history-columns" aria-hidden="true">
              <span>Paper</span><span>Score</span><span>Sections</span><span>Time</span><span>Date</span><span />
            </div>
            {attempts.map((attempt) => (
              <Link className="pyq-history-entry" href={`/pyq/results/${attempt.id}`} key={attempt.id}>
                <span className="pyq-history-paper">GATE {attempt.paperId}</span>
                <span className="pyq-history-score">{attempt.totalMarks.toFixed(2)}<small>/100</small></span>
                <span className="pyq-history-sections">
                  GA {attempt.gaNet.toFixed(1)} · B1 {attempt.b1Net.toFixed(1)} · C5 {attempt.c5Net.toFixed(1)}
                </span>
                <span>{formatTime(attempt.timeSeconds)}</span>
                <span>{new Date(attempt.createdAt).toLocaleString()}</span>
                <span className="pyq-history-arrow">→</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
