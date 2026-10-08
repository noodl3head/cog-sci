import test from 'node:test';
import assert from 'node:assert/strict';
import { nextGeneratedMockMsqCycleIndex } from '../lib/clientStudyStore.js';

test('generated C5 mocks continue the five-step MSQ structure rotation', () => {
  assert.equal(nextGeneratedMockMsqCycleIndex([]), 0);
  assert.equal(nextGeneratedMockMsqCycleIndex([{ msqTypeCycleIndex: 0 }]), 1);
  assert.equal(nextGeneratedMockMsqCycleIndex([{ msqTypeCycleIndex: 3 }]), 4);
  assert.equal(nextGeneratedMockMsqCycleIndex([{ msqTypeCycleIndex: 4 }]), 0);
});
