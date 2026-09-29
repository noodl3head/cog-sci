import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeXhC5Msqs } from '../lib/xhC5MsqProfile.js';
import { PYQ_PAPERS } from '../lib/pyqData.js';

test('XH-C5 MSQ profile reflects every loaded 2021–2026 MSQ exactly once', () => {
  const profile = summarizeXhC5Msqs(PYQ_PAPERS);
  assert.equal(profile.total, 103);
  assert.deepEqual(profile.correctOptionCounts, { 1: 6, 2: 56, 3: 40, 4: 1 });
  assert.equal(profile.byYear[2021], 18);
  assert.equal(profile.byYear[2022], 21);
  assert.equal(profile.byYear[2023], 15);
  assert.equal(profile.byYear[2024], 19);
  assert.equal(profile.byYear[2025], 15);
  assert.equal(profile.byYear[2026], 15);
});
