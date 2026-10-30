import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PYQ_PAPERS } from '../lib/pyqData.js';
import { PYQ_RANK_PROJECTIONS, getPyqRankProjection } from '../lib/pyqRankProjection.js';
import { scoreRank } from '../lib/scoreRank.js';

const EXPECTED = {
  2021: { mu: 32.60, sigma: 15.90, pop: 1141, topMark: 77.33 },
  2022: { mu: 47.22, sigma: 14.94, pop: 1933, topMark: 84 },
  2023: { mu: 37.93, sigma: 17.05, pop: 2684, topMark: 84 },
  2024: { mu: 38.52, sigma: 14.21, pop: 3415, topMark: 77.67 },
  2025: { mu: 49.40, sigma: 15.77, pop: 4125, topMark: 89 },
  2026: { mu: 27.81, sigma: 11.55, pop: 6178, topMark: 73 },
};

test('uses the official XH-C5 cohort moments for every PYQ year', () => {
  assert.deepEqual(PYQ_RANK_PROJECTIONS, EXPECTED);
});

test('every loaded full paper has a valid year-specific projection', () => {
  for (const paper of PYQ_PAPERS.filter((entry) => !entry.isPractice)) {
    const projection = getPyqRankProjection(paper.year);
    assert.equal(Number.isFinite(projection.mu), true, `${paper.year} mean`);
    assert.equal(projection.sigma > 0, true, `${paper.year} standard deviation`);
    assert.equal(Number.isInteger(projection.pop) && projection.pop > 0, true, `${paper.year} cohort`);
  }
});

test('unsupported years fail instead of silently reusing a generic model', () => {
  assert.throws(() => getPyqRankProjection(2099), /No PYQ rank projection data for 2099/);
});

test('an official AIR 1 mark projects to rank 1 instead of the normal-tail estimate', () => {
  const projection = getPyqRankProjection(2021);
  assert.equal(scoreRank(77.33, { total: 100, ...projection }).rank, 1);
});

test('PYQ runner resolves the distribution from the selected paper year', async () => {
  const source = await readFile(new URL('../app/pyq/[id]/page.js', import.meta.url), 'utf8');
  assert.match(source, /getPyqRankProjection\(paper\.year\)/);
  assert.match(source, /basis="official XH-C5"/);
  assert.doesNotMatch(source, /PYQ_MU|PYQ_SIGMA|PYQ_POP/);
});

test('stats page shows year-specific projections and has no generic PYQ model', async () => {
  const source = await readFile(new URL('../app/stats/page.js', import.meta.url), 'utf8');
  assert.match(source, /getPyqRankProjection\(Number\(p\.paper_id\)\)/);
  assert.doesNotMatch(source, /mu=\{34\.5\}|sigma=\{15\}|pop=\{4500\}/);
});
