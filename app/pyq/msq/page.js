'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getMsqPracticeModules } from '../../../lib/pyqData';

const sections = getMsqPracticeModules();

export default function MsqModulesPage() {
  const [activeCode, setActiveCode] = useState('XH-B1');
  const active = sections.find((section) => section.code === activeCode);

  return (
    <div className="app">
      <div className="screen active msq-module-page">
        <div className="msq-module-heading">
          <div>
            <Link href="/pyq" className="btn-link">← Previous year papers</Link>
            <h2>PYQ MSQ practice</h2>
            <p>Choose a section, then a module. Questions retain their original year and paper number.</p>
          </div>
        </div>

        <div className="msq-section-tabs" role="tablist" aria-label="MSQ section">
          {sections.map((section) => (
            <button
              key={section.code}
              type="button"
              role="tab"
              id={`tab-${section.code}`}
              aria-selected={activeCode === section.code}
              aria-controls="msq-modules"
              className={activeCode === section.code ? 'selected' : ''}
              onClick={() => setActiveCode(section.code)}
            >
              <span>{section.code}</span>
              <small>{section.name} · {section.count} questions</small>
            </button>
          ))}
        </div>

        <section id="msq-modules" role="tabpanel" aria-labelledby={`tab-${active.code}`}>
          <div className="msq-module-summary">
            <h3>{active.code} · {active.name}</h3>
            <span>{active.modules.length} modules · up to 20 questions each</span>
          </div>
          <div className="msq-module-list">
            {active.modules.map((module) => (
              <Link key={module.id} href={`/pyq/${module.id}`} className="msq-module-row">
                <span className="msq-module-index">{String(module.number).padStart(2, '0')}</span>
                <span className="msq-module-title">Module {module.number}</span>
                <span className="msq-module-count">{module.questions.length} questions</span>
                <span aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
          <p className="msq-module-note">GA has no MSQs in the available papers. Practice scores are not added to full-paper history.</p>
        </section>
      </div>
    </div>
  );
}
