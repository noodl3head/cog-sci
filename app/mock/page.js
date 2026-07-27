'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GATE_2027_TOPICS, GATE_2027_TOPIC_IDS } from '../../lib/gateSyllabus';

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
  const [selectedTopics, setSelectedTopics] = useState(() => new Set(GATE_2027_TOPIC_IDS));

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

  function toggleTopic(topicId) {
    setSelectedTopics((current) => {
      const next = new Set(current);
      if (next.has(topicId)) next.delete(topicId);
      else next.add(topicId);
      return next;
    });
  }

  function generateMock() {
    if (!selectedTopics.size) return;
    const topics = GATE_2027_TOPIC_IDS.filter((topicId) => selectedTopics.has(topicId));
    router.push(`/mock/generated?topics=${encodeURIComponent(topics.join(','))}`);
  }

  return (
    <div className="app">
      <div className="masthead">
        <h1>AP <span className="accent">Psych</span> Quizzer</h1>
        <div className="nav-links">
          <Link href="/" className="btn-link">Chapters</Link>
          <Link href="/study" className="btn-link">Study</Link>
          <Link href="/pyq" className="btn-link">PYQ</Link>
          <Link href="/stats" className="btn-link">Stats</Link>
        </div>
      </div>

      <div className="screen active">
        <div className="mock-list-header">
          <div>
            <h2 className="mock-list-title">Mock Quizzes</h2>
            <p className="mock-list-sub">
              35 questions &middot; 50 marks &middot; GATE-style MCQ/MSQ &middot; Four options &middot; Complete GATE 2027 XH5 coverage &middot; No instant feedback
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
            <div className="mock-generate-heading-row">
              <div>
                <div className="mock-generate-title">+ Generate a Topic Mock</div>
                <div className="mock-generate-sub">Choose one or more chapters from the official GATE 2027 XH5 syllabus. Questions are balanced across your selection.</div>
              </div>
              <div className="mock-topic-actions">
                <button type="button" className="mock-topic-action" onClick={() => setSelectedTopics(new Set(GATE_2027_TOPIC_IDS))}>Select all</button>
                <button type="button" className="mock-topic-action" onClick={() => setSelectedTopics(new Set())}>Clear</button>
              </div>
            </div>

            <div className="mock-topic-grid">
              {GATE_2027_TOPICS.map((topic) => {
                const selected = selectedTopics.has(topic.id);
                return (
                  <label className={`mock-topic-option${selected ? ' selected' : ''}`} key={topic.id}>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleTopic(topic.id)}
                    />
                    <span className="mock-topic-check" aria-hidden="true">{selected ? '✓' : ''}</span>
                    <span>
                      <span className="mock-topic-name"><b>{topic.section}</b> {topic.label}</span>
                      <span className="mock-topic-summary">{topic.summary}</span>
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="mock-generate-footer">
              <span className="mock-topic-count">{selectedTopics.size} of {GATE_2027_TOPICS.length} topics selected</span>
              <button type="button" className="btn mock-generate-btn" disabled={!selectedTopics.size} onClick={generateMock}>
                Generate Mock
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
