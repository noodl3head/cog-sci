'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const MOCK_COUNT = 5;

function formatTime(s) {
  if (!s) return '—';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export default function MockListPage() {
  const router = useRouter();
  const [mockStats, setMockStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/mock-results')
      .then((r) => r.json())
      .then((data) => {
        const map = {};
        for (const row of data.perMock || []) {
          map[row.mock_id] = row;
        }
        setMockStats(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="app">
      <div className="masthead">
        <h1>AP <span className="accent">Psych</span> Quizzer</h1>
        <div className="nav-links">
          <Link href="/" className="btn-link">Chapters</Link>
          <Link href="/study" className="btn-link">Study</Link>
          <Link href="/stats" className="btn-link">Stats</Link>
        </div>
      </div>

      <div className="screen active">
        <div className="mock-list-header">
          <div>
            <h2 className="mock-list-title">Mock Quizzes</h2>
            <p className="mock-list-sub">
              35 questions &middot; 50 marks &middot; Section 1: 1mk (−⅓) &middot; Section 2: 2mk (−⅔) &middot; No instant feedback
            </p>
          </div>
        </div>

        <div className="mock-card-grid">
          {Array.from({ length: MOCK_COUNT }, (_, i) => {
            const id = String(i + 1);
            const stat = mockStats[id];
            return (
              <div className="mock-card" key={id}>
                <div className="mock-card-num">Mock {i + 1}</div>
                {!loading && stat ? (
                  <div className="mock-card-stats">
                    <div className="mock-stat-row">
                      <span className="mock-stat-label">Best</span>
                      <span className="mock-stat-val">{Number(stat.best_score).toFixed(2)}<span className="mock-stat-denom">/50</span></span>
                    </div>
                    <div className="mock-stat-row">
                      <span className="mock-stat-label">Avg</span>
                      <span className="mock-stat-val">{Number(stat.avg_total).toFixed(2)}</span>
                    </div>
                    <div className="mock-stat-row">
                      <span className="mock-stat-label">Attempts</span>
                      <span className="mock-stat-val">{stat.attempts}</span>
                    </div>
                  </div>
                ) : (
                  <div className="mock-card-empty">
                    {loading ? <span className="mock-card-empty-text">…</span> : <span className="mock-card-empty-text">Not attempted yet</span>}
                  </div>
                )}
                <Link href={`/mock/${id}`} className="btn mock-start-btn">Start</Link>
              </div>
            );
          })}
        </div>

        <div className="mock-generate-block">
          <div className="mock-generate-info">
            <div className="mock-generate-title">+ Generate New Mock</div>
            <div className="mock-generate-sub">Creates a fresh randomized quiz from all chapters. Result is saved to your history but doesn&apos;t appear as a fixed card.</div>
          </div>
          <Link href="/mock/generated" className="btn mock-start-btn">Generate</Link>
        </div>
      </div>
    </div>
  );
}
