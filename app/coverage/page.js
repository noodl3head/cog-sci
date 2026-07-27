import Link from 'next/link';
import { getContentCoverageReport } from '../../lib/contentCoverage';

function Metric({ label, value, note }) {
  return (
    <div className="coverage-metric">
      <span className="coverage-metric-label">{label}</span>
      <strong>{value}</strong>
      <span className="coverage-metric-note">{note}</span>
    </div>
  );
}

export default function CoveragePage() {
  const { summary, topics } = getContentCoverageReport();
  const originalProgress = Math.round((summary.original / summary.originalTarget) * 100);

  return (
    <div className="app">
      <main className="screen active coverage-page">
        <div className="coverage-hero">
          <div>
            <p className="coverage-kicker">GATE 2027 XH5 content control</p>
            <h2>Question Coverage</h2>
            <p>Tracks every mock-eligible question against the official syllabus leaves. Original GATE-style coverage is measured separately from imported AP support material.</p>
          </div>
          <div className="coverage-overall">
            <span>{originalProgress}%</span>
            <small>of original-question milestone</small>
          </div>
        </div>

        <section className="coverage-metrics" aria-label="Coverage summary">
          <Metric label="Original GATE-style" value={summary.original} note={`${summary.targetRemaining} remaining to milestone`} />
          <Metric label="Imported AP support" value={summary.imported} note="screened and mock-eligible" />
          <Metric label="Reviewed originals" value={summary.reviewed} note="preferred by generated mocks" />
          <Metric label="Syllabus mapping" value={summary.explicitMappings + summary.inferredMappings} note={`${summary.fallbackMappings} broad fallback mappings`} />
        </section>

        <section className="coverage-distribution">
          <div>
            <span>Formats</span>
            <b>{summary.formats.MCQ} MCQ</b><b>{summary.formats.MSQ} MSQ</b><b>{summary.formats.NAT} NAT</b>
          </div>
          <div>
            <span>Difficulty</span>
            <b>{summary.difficulties.easy} easy</b><b>{summary.difficulties.medium} medium</b><b>{summary.difficulties.hard} hard</b>
          </div>
          <div>
            <span>Cognitive level</span>
            <b>{summary.cognitiveLevels.recall} recall</b><b>{summary.cognitiveLevels.understanding} understand</b>
            <b>{summary.cognitiveLevels.application} apply</b><b>{summary.cognitiveLevels.analysis} analyse</b>
          </div>
        </section>

        <div className="coverage-topic-list">
          {topics.map((topic) => (
            <details className="coverage-topic" key={topic.id} open={topic.id === 'research-methods-statistics' || topic.id === 'psychometrics'}>
              <summary>
                <div className="coverage-topic-heading">
                  <span className="coverage-section">{topic.section}</span>
                  <div>
                    <h3>{topic.label}</h3>
                    <p>{topic.original} original · {topic.imported} imported · {topic.gaps} empty leaves</p>
                  </div>
                </div>
                <div className="coverage-topic-progress">
                  <span>{topic.original}/{topic.target}</span>
                  <div><i style={{ width: `${topic.progress}%` }} /></div>
                </div>
              </summary>

              <div className="coverage-leaf-table">
                <div className="coverage-leaf-head">
                  <span>Syllabus leaf</span><span>Original</span><span>AP support</span><span>Status</span>
                </div>
                {topic.leaves.map((leaf) => (
                  <div className="coverage-leaf-row" key={leaf.id}>
                    <span>{leaf.label}<small>Target {leaf.target}</small></span>
                    <b>{leaf.original}</b>
                    <b>{leaf.imported}</b>
                    <span className={`coverage-status ${leaf.status}`}>
                      {leaf.status === 'covered' ? 'Covered' : leaf.status === 'developing' ? `${leaf.remaining} needed` : 'No original'}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      </main>
    </div>
  );
}
