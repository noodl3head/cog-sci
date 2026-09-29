import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pagePath = new URL('../app/telegram/mock/[token]/page.js', import.meta.url);
const cssPath = new URL('../app/globals.css', import.meta.url);

test('web MSQ runner uses checkboxes, rationale fields, autosave, and server submit', async () => {
  const source = await readFile(pagePath, 'utf8');
  assert.match(source, /'use client'/);
  assert.match(source, /type="checkbox"/);
  assert.match(source, /aria-label=\{`Mark option \$\{letter\} as true`\}/);
  assert.match(source, /Your reasoning — why this option is true\/false/);
  assert.match(source, /reasoning\?\.\[index\]\?\.\[letter\]/);
  assert.match(source, /responses\?\.\[index\]/);
  assert.match(source, /setTimeout\([\s\S]*?700\)/);
  assert.match(source, /method: 'PUT'/);
  assert.match(source, /\/api\/telegram\/mock\/\$\{token\}\/progress/);
  assert.match(source, /method: 'POST'/);
  assert.match(source, /\/api\/telegram\/mock\/\$\{token\}\/submit/);
  assert.doesNotMatch(source, /question\.answers|question\.explanation|correct set/i);
});

test('web MSQ runner styles preserve checkbox and reasoning usability', async () => {
  const css = await readFile(cssPath, 'utf8');
  for (const className of [
    'web-msq-option',
    'web-msq-option--active',
    'web-msq-option-eyebrow',
    'web-msq-reasoning',
    'web-msq-checkbox',
  ]) assert.match(css, new RegExp(`\\.${className}\\b`));
});
