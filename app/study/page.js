'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { STUDY_DATA } from '../../lib/studyData';
import { STUDY_EXTENSIONS } from '../../lib/studyExtensions';
import { QUIZ_DATA } from '../../lib/quizData';

const TABS = ['Key Terms', 'Summary', 'Must-Know', 'Mnemonics', 'Gate Focus', 'Pitfalls', 'All'];

// Merge base study data with per-chapter GATE-focused extensions.
function chapterWithExtensions(id) {
  const base = STUDY_DATA.find((c) => c.id === id);
  const ext = STUDY_EXTENSIONS[id] || {};
  return {
    ...base,
    keyTerms: [...(base.keyTerms || []), ...(ext.extendedTerms || [])],
    mustKnow: [...(base.mustKnow || []), ...(ext.gateFocus || []), ...(ext.pitfalls || [])],
    gateFocus: ext.gateFocus || [],
    pitfalls: ext.pitfalls || [],
  };
}

// Map study chapters to quiz chapters so each notes page links to its practice.
function quizLinkFor(studyId) {
  const book = QUIZ_DATA.books.find((b) => b.id === 'kaplan');
  if (!book) return null;
  const ch = book.chapters.find((c) => c.id === studyId);
  return ch ? `/quiz/kaplan/${studyId}` : null;
}

export default function StudyPage() {
  const [activeChapter, setActiveChapter] = useState(STUDY_DATA[0].id);
  const [activeTab, setActiveTab] = useState('Key Terms');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [flipped, setFlipped] = useState({});
  const [revealAll, setRevealAll] = useState(false);

  const chapter = useMemo(
    () => chapterWithExtensions(activeChapter),
    [activeChapter]
  );
  const link = quizLinkFor(activeChapter);

  useEffect(() => {
    setFlipped({});
    setQuery('');
  }, [activeChapter, activeTab]);

  function selectChapter(id) {
    setActiveChapter(id);
    setSidebarOpen(false);
  }

  function toggle(i) {
    setFlipped((f) => ({ ...f, [i]: !f[i] }));
  }

  // Filtered data based on the query (searches every tab's content).
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return chapter;
    return {
      ...chapter,
      keyTerms: chapter.keyTerms.filter(
        (t) =>
          t.term.toLowerCase().includes(q) || t.def.toLowerCase().includes(q)
      ),
      summary: chapter.summary.filter(
        (s) =>
          s.heading.toLowerCase().includes(q) ||
          s.body.toLowerCase().includes(q)
      ),
      mustKnow: chapter.mustKnow.filter((m) => m.toLowerCase().includes(q)),
      mnemonics: chapter.mnemonics.filter(
        (m) =>
          m.label.toLowerCase().includes(q) ||
          m.text.toLowerCase().includes(q)
      ),
    };
  }, [chapter, query]);

  const totalTerms = STUDY_DATA.reduce((a, c) => a + c.keyTerms.length, 0);

  return (
    <div className="app">
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
          <div className="study-sidebar-label">
            Chapters · {STUDY_DATA.length} · {totalTerms} terms
          </div>
          {STUDY_DATA.map((ch) => (
            <button
              key={ch.id}
              className={'study-nav-item' + (ch.id === activeChapter ? ' active' : '')}
              onClick={() => selectChapter(ch.id)}
            >
              {ch.title}
              <span
                style={{
                  float: 'right',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--text-faint)',
                }}
              >
                {ch.keyTerms.length}
              </span>
            </button>
          ))}
        </aside>

        {/* Main content */}
        <main className="study-main">
          <h2 className="study-chapter-title">{chapter.title}</h2>

          {/* Toolbar: tabs + search + reveal toggle */}
          <div className="study-toolbar">
            <div className="study-tabs" style={{ marginBottom: 0 }}>
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
            {activeTab === 'Key Terms' && (
              <>
                <input
                  className="study-search"
                  type="search"
                  placeholder="Filter terms & definitions…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button
                  className="btn-link"
                  onClick={() => {
                    if (revealAll) {
                      setFlipped({});
                    } else {
                      const all = {};
                      filtered.keyTerms.forEach((_, i) => (all[i] = true));
                      setFlipped(all);
                    }
                    setRevealAll((v) => !v);
                  }}
                >
                  {revealAll ? 'Hide all' : 'Reveal all'}
                </button>
              </>
            )}
            {(activeTab === 'Summary' ||
              activeTab === 'Must-Know' ||
              activeTab === 'Mnemonics') &&
              query === '' && (
                <input
                  className="study-search"
                  type="search"
                  placeholder="Search this tab…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              )}
            {link && (
              <Link href={link} style={{ marginLeft: 'auto' }}>
                <span
                  className="missed-practice-link"
                  style={{ fontSize: 13 }}
                >
                  → Practice this chapter
                </span>
              </Link>
            )}
          </div>

          {/* Tab content */}
          <div className="study-tab-content">
            {activeTab === 'Key Terms' && (
              <KeyTermsTab
                terms={filtered.keyTerms}
                flipped={flipped}
                onToggle={toggle}
              />
            )}
            {activeTab === 'Summary' && <SummaryTab items={filtered.summary} />}
            {activeTab === 'Must-Know' && (
              <MustKnowTab items={filtered.mustKnow} />
            )}
            {activeTab === 'Mnemonics' && (
              <MnemonicsTab items={filtered.mnemonics} />
            )}
            {activeTab === 'Gate Focus' && (
              <MustKnowTab items={filtered.gateFocus} />
            )}
            {activeTab === 'Pitfalls' && (
              <PitfallsTab items={filtered.pitfalls} />
            )}
            {activeTab === 'All' && <AllView chapter={filtered} />}
          </div>
        </main>
      </div>
    </div>
  );
}

function KeyTermsTab({ terms, flipped, onToggle }) {
  return (
    <div>
      <p className="term-count-note">{terms.length} terms</p>
      <div className="flashcard-grid">
        {terms.map((t, i) => (
          <div
            key={i}
            className={'flashcard' + (flipped[i] ? ' flipped' : '')}
            onClick={() => onToggle(i)}
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
          <pre className="mnemonic-text">{item.text.replace(/\*\*/g, '')}</pre>
        </div>
      ))}
    </div>
  );
}

function PitfallsTab({ items }) {
  if (!items.length) {
    return <p className="term-count-note">No pitfalls recorded for this chapter.</p>;
  }
  return (
    <ul className="mustknow-list pitfalls-list">
      {items.map((item, i) => (
        <li key={i} className="mustknow-item">
          <span className="mustknow-bullet" style={{ color: 'var(--red)' }}>⚠</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/* Flat single-page view of everything in the chapter — good for a final read-through. */
function AllView({ chapter }) {
  return (
    <div className="study-all-view">
      {chapter.summary?.length > 0 && (
        <>
          <p className="study-section-heading">Summary</p>
          <SummaryTab items={chapter.summary} />
        </>
      )}
      {chapter.mustKnow?.length > 0 && (
        <>
          <p className="study-section-heading">Must-know</p>
          <MustKnowTab items={chapter.mustKnow} />
        </>
      )}
      {chapter.mnemonics?.length > 0 && (
        <>
          <p className="study-section-heading">Mnemonics</p>
          <MnemonicsTab items={chapter.mnemonics} />
        </>
      )}
      {chapter.pitfalls?.length > 0 && (
        <>
          <p className="study-section-heading">Common pitfalls</p>
          <PitfallsTab items={chapter.pitfalls} />
        </>
      )}
      {chapter.gateFocus?.length > 0 && (
        <>
          <p className="study-section-heading">GATE exam focus</p>
          <MustKnowTab items={chapter.gateFocus} />
        </>
      )}
      {chapter.keyTerms?.length > 0 && (
        <>
          <p className="study-section-heading">
            Key terms ({chapter.keyTerms.length})
          </p>
          <dl className="term-def-list">
            {chapter.keyTerms.map((t, i) => (
              <div key={i}>
                <dt>{t.term}</dt>
                <dd>{t.def}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </div>
  );
}
