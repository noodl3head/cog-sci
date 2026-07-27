'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  addRevisionItem, getLatestRevisionSheet, getRevisionList, removeRevisionItem,
} from '../../lib/clientStudyStore';

function markdownFor(items, title) {
  const body = items.map((item, index) => {
    const context = item.context ? `\n> ${item.context.title}: ${item.context.body.replace(/\n/g, '\n> ')}\n` : '';
    const options = item.options ? Object.entries(item.options).map(([key, value]) => `- ${key}. ${value}`).join('\n') : '';
    return `## ${index + 1}. ${item.question}\n${context}\n${options}\n\n**Your answer:** ${item.userAnswer}\n\n**Correct answer:** ${item.correctAnswer}\n\n**Why:** ${item.explanation}\n\n**Concept:** ${item.concept}\n\n**Remember:** ${item.takeaway}\n\n**Source:** ${item.sourceName} - ${item.section} ${item.topicLabel}`;
  }).join('\n\n---\n\n');
  return `# ${title}\n\nGenerated ${new Date().toLocaleString()}\n\n${body}`;
}

export default function RevisionPage({ searchParams }) {
  const latestView = searchParams?.view === 'latest';
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState('My Revision List');

  useEffect(() => {
    if (latestView) {
      const latest = getLatestRevisionSheet();
      setItems(latest.items || []);
      setTitle(latest.title || 'Latest incorrect questions');
    } else {
      setItems(getRevisionList());
      setTitle('My Revision List');
    }
  }, [latestView]);

  function saveAll() {
    let next = getRevisionList();
    for (const item of items) next = addRevisionItem(item);
    setItems(latestView ? items : next);
  }

  function remove(questionId) {
    setItems(removeRevisionItem(questionId));
  }

  function downloadMarkdown() {
    const blob = new Blob([markdownFor(items, title)], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'revision-sheet'}.md`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="app revision-app">
      <main className="screen active revision-page">
        <div className="revision-header">
          <div>
            <p className="coverage-kicker">Revision sheet</p>
            <h2>{title}</h2>
            <p>{items.length} question{items.length === 1 ? '' : 's'} - explanations, concepts and takeaways included</p>
          </div>
          <div className="revision-header-actions no-print">
            {latestView && <button className="btn btn-secondary" disabled={!items.length} onClick={saveAll}>Add all to revision list</button>}
            <button className="btn btn-secondary" disabled={!items.length} onClick={downloadMarkdown}>Download Markdown</button>
            <button className="btn" disabled={!items.length} onClick={() => window.print()}>Print / Save PDF</button>
          </div>
        </div>

        {!items.length ? (
          <div className="empty-state">No revision questions yet. Add mistakes from mock review or export the incorrect questions after a mock.</div>
        ) : (
          <div className="revision-sheet">
            {items.map((item, index) => (
              <article className="revision-question" key={`${item.questionId}-${index}`}>
                <div className="revision-question-meta"><span>Question {index + 1}</span><span>{item.section} - {item.concept}</span></div>
                {item.context && <div className="revision-context"><b>{item.context.title}</b><p>{item.context.body}</p></div>}
                <h3>{item.question}</h3>
                {item.options && <div className="revision-options">{Object.entries(item.options).map(([key, value]) => <div key={key}><b>{key}</b><span>{value}</span></div>)}</div>}
                <div className="revision-answer-grid">
                  <div><span>Your answer</span><b>{item.userAnswer}</b></div>
                  <div><span>Correct answer</span><b>{item.correctAnswer}</b></div>
                </div>
                <div className="revision-explanation"><span>Why</span><p>{item.explanation}</p></div>
                <div className="revision-remember"><span>Remember this</span><p>{item.takeaway}</p></div>
                <div className="revision-source">Source: {item.sourceName} - {item.section} {item.topicLabel}</div>
                {!latestView && <button className="revision-remove no-print" onClick={() => remove(item.questionId)}>Remove</button>}
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
