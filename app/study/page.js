'use client';

import { useState } from 'react';
import Link from 'next/link';
import { STUDY_DATA } from '../../lib/studyData';

const TABS = ['Key Terms', 'Summary', 'Must-Know', 'Mnemonics'];

export default function StudyPage() {
  const [activeChapter, setActiveChapter] = useState(STUDY_DATA[0].id);
  const [activeTab, setActiveTab] = useState('Key Terms');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const chapter = STUDY_DATA.find((c) => c.id === activeChapter);

  function selectChapter(id) {
    setActiveChapter(id);
    setSidebarOpen(false);
  }

  return (
    <div className="app">
      <div className="masthead">
        <h1>AP <span className="accent">Psych</span> Quizzer</h1>
        <div className="nav-links">
          <Link href="/" className="btn-link">Chapters</Link>
          <Link href="/stats" className="btn-link">Stats</Link>
        </div>
      </div>

      <div className="study-layout">
        {/* Mobile chapter toggle */}
        <button
          className="study-sidebar-toggle"
          onClick={() => setSidebarOpen((v) => !v)}
        >
          {chapter.title} ▾
        </button>

        {/* Sidebar */}
        <aside className={'study-sidebar' + (sidebarOpen ? ' open' : '')}>
          <div className="study-sidebar-label">Kaplan Chapters</div>
          {STUDY_DATA.map((ch) => (
            <button
              key={ch.id}
              className={'study-nav-item' + (ch.id === activeChapter ? ' active' : '')}
              onClick={() => selectChapter(ch.id)}
            >
              {ch.title}
            </button>
          ))}
        </aside>

        {/* Main content */}
        <main className="study-main">
          <h2 className="study-chapter-title">{chapter.title}</h2>

          {/* Tab bar */}
          <div className="study-tabs">
            {TABS.map((tab) => (
              <button
                key={tab}
                className={'study-tab' + (tab === activeTab ? ' active' : '')}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="study-tab-content">
            {activeTab === 'Key Terms' && <KeyTermsTab terms={chapter.keyTerms} />}
            {activeTab === 'Summary' && <SummaryTab items={chapter.summary} />}
            {activeTab === 'Must-Know' && <MustKnowTab items={chapter.mustKnow} />}
            {activeTab === 'Mnemonics' && <MnemonicsTab items={chapter.mnemonics} />}
          </div>
        </main>
      </div>
    </div>
  );
}

function KeyTermsTab({ terms }) {
  const [flipped, setFlipped] = useState({});

  function toggle(i) {
    setFlipped((f) => ({ ...f, [i]: !f[i] }));
  }

  return (
    <div>
      <p className="study-hint">{terms.length} terms — tap a card to reveal the definition.</p>
      <div className="flashcard-grid">
        {terms.map((t, i) => (
          <div
            key={i}
            className={'flashcard' + (flipped[i] ? ' flipped' : '')}
            onClick={() => toggle(i)}
          >
            <div className="flashcard-inner">
              <div className="flashcard-front">
                <span className="fc-term">{t.term}</span>
                <span className="fc-tap-hint">tap to reveal</span>
              </div>
              <div className="flashcard-back">
                <span className="fc-def">{t.def}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryTab({ items }) {
  return (
    <div className="summary-list">
      {items.map((item, i) => (
        <div key={i} className="summary-block">
          <h3 className="summary-block-heading">{item.heading}</h3>
          <p className="summary-block-body">{item.body}</p>
        </div>
      ))}
    </div>
  );
}

function MustKnowTab({ items }) {
  return (
    <ul className="mustknow-list">
      {items.map((item, i) => (
        <li key={i} className="mustknow-item">
          <span className="mustknow-bullet">✓</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function MnemonicsTab({ items }) {
  return (
    <div className="mnemonic-list">
      {items.map((item, i) => (
        <div key={i} className="mnemonic-card">
          <div className="mnemonic-label">{item.label}</div>
          <pre className="mnemonic-text">{item.text}</pre>
        </div>
      ))}
    </div>
  );
}
