'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PYQ_PAPERS } from '../../lib/pyqData';

function formatTime(s) {
  if (!s) return '—';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export default function PyqListPage() {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/pyq-results')
      .then((r) => r.json())
      .then((data) => {
        const map = {};
        for (const row of data.perPaper || []) map[row.paper_id] = row;
        setStats(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="app">
      <div className="screen active">
        <div className="mock-list-header">
          <div>
            <h2 className="mock-list-title">GATE XH-C5 · Previous Year Papers</h2>
            <p className="mock-list-sub">
              Full 65-question papers &middot; 100 marks &middot; 3 sections (GA · XH-B1 · XH-C5) &middot;
              MCQ (−⅓ / −⅔) · MSQ &amp; NAT (no negative)
            </p>
          </div>
        </div>

        <div className="mock-card-grid">
          {PYQ_PAPERS.map((p) => {
            const stat = stats[p.id];
            return (
              <div className="mock-card pyq-card" key={p.id}>
                <div className="mock-card-num">{p.name}</div>
                {!loading && stat ? (
                  <div className="mock-card-stats">
                    <div className="mock-stat-row">
                      <span className="mock-stat-label">Best</span>
                      <span className="mock-stat-val">{Number(stat.best_score).toFixed(2)}<span className="mock-stat-denom">/100</span></span>
                    </div>
                    <div className="mock-stat-row">
                      <span className="mock-stat-label">Avg</span>
                      <span className="mock-stat-val">{Number(stat.avg_total).toFixed(2)}</span>
                    </div>
                    <div className="mock-stat-row">
                      <span className="mock-stat-label">Attempts</span>
                      <span className="mock-stat-val">{stat.attempts}</span>
                    </div>
                    <div className="mock-stat-row">
                      <span className="mock-stat-label">Avg time</span>
                      <span className="mock-stat-val">{formatTime(stat.avg_time)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="mock-card-empty">
                    {loading ? <span className="mock-card-empty-text">…</span> : <span className="mock-card-empty-text">Not attempted yet</span>}
                  </div>
                )}
                <Link href={`/pyq/${p.id}`} className="btn mock-start-btn">Start Paper</Link>
              </div>
            );
          })}
        </div>

        <p className="pyq-note">
          These are the actual GATE {PYQ_PAPERS.map((p) => p.year).join(' & ')} XH-C5 papers, presented
          section-by-section exactly as in the exam. Figures are reproduced from the original papers.
          Your scores are tracked separately from the practice mocks.
        </p>
      </div>
    </div>
  );
}
