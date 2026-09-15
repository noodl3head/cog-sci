import test from 'node:test';
import assert from 'node:assert/strict';
import { getPyqOptionClassName } from '../lib/pyqOptionState.js';

test('selected image-only options receive the visible selected class', () => {
  assert.equal(
    getPyqOptionClassName({ imageOnly: true, selected: true }),
    'option pyq-letter-option selected'
  );
});

test('selected text options preserve the mock selected class', () => {
  assert.equal(
    getPyqOptionClassName({ imageOnly: false, selected: true }),
    'option mock-option mock-selected'
  );
});
