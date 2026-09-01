import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceTelegramMockSession,
  claimTelegramMockResultMessage,
  claimTelegramMockUpdate,
  completeTelegramMockSession,
  markTelegramMockResultDelivered,
  prepareTelegramMockResultDelivery,
  releaseTelegramMockResultClaim,
  releaseTelegramMockUpdate,
  submitTelegramMockSelection,
  toggleTelegramMockSelection,
} from '../lib/telegramMockStore.js';

test('advanceTelegramMockSession guards the update with the expected current index', async () => {
  const calls = [];
  const sql = async (strings, ...values) => {
    calls.push({ text: strings.join('?'), values });
    return [{ session_id: 'session-1', current_index: 4 }];
  };
  const row = await advanceTelegramMockSession(sql, 'session-1', 3, 'B');
  assert.equal(row.current_index, 4);
  assert.match(calls[0].text, /current_index = current_index \+ 1/);
  assert.match(calls[0].text, /AND current_index =/);
  assert.equal(calls[0].values.includes(3), true);
});

test('claimTelegramMockUpdate uses an insert conflict guard for idempotency', async () => {
  const calls = [];
  const sql = async (strings, ...values) => {
    calls.push({ text: strings.join('?'), values });
    return [{ update_id: 42 }];
  };
  assert.equal(await claimTelegramMockUpdate(sql, 42), true);
  assert.match(calls[0].text, /ON CONFLICT \(update_id\) DO NOTHING/);
  assert.equal(calls[0].values.includes(42), true);
});

test('releaseTelegramMockUpdate makes a failed update retryable', async () => {
  const calls = [];
  const sql = async (strings, ...values) => {
    calls.push({ text: strings.join('?'), values });
    return [];
  };
  await releaseTelegramMockUpdate(sql, 42);
  assert.match(calls[0].text, /DELETE FROM telegram_mock_updates/);
  assert.equal(calls[0].values.includes(42), true);
});

test('toggleTelegramMockSelection updates the JSON array atomically at the expected index', async () => {
  const calls = [];
  const sql = async (strings, ...values) => {
    calls.push({ text: strings.join('?'), values });
    return [{ selected: ['A', 'C'], current_index: 2 }];
  };
  const row = await toggleTelegramMockSelection(sql, 'session-1', 2, 'C');
  assert.deepEqual(row.selected, ['A', 'C']);
  assert.match(calls[0].text, /selected \? \?::text/);
  assert.match(calls[0].text, /AND current_index =/);
  assert.equal(calls[0].values.includes('C'), true);
});

test('submitTelegramMockSelection atomically records the current selection and advances once', async () => {
  const calls = [];
  const sql = async (strings, ...values) => {
    calls.push({ text: strings.join('?'), values });
    return [{ responses: { 2: ['A', 'C'] }, selected: [], current_index: 3 }];
  };
  const row = await submitTelegramMockSelection(sql, 'session-1', 2);
  assert.equal(row.current_index, 3);
  assert.match(calls[0].text, /jsonb_array_length\(selected\) > 0/);
  assert.match(calls[0].text, /current_index = current_index \+ 1/);
  assert.match(calls[0].text, /AND current_index =/);
});

test('prepareTelegramMockResultDelivery persists a resumable finishing state', async () => {
  const calls = [];
  const sql = async (strings, ...values) => {
    calls.push({ text: strings.join('?'), values });
    return [{ status: 'finishing', result_delivery_index: -1 }];
  };
  const result = { score: 3, maxMarks: 5, text: 'Summary', explanations: [] };
  const row = await prepareTelegramMockResultDelivery(sql, 'session-1', result);
  assert.equal(row.status, 'finishing');
  assert.match(calls[0].text, /status = 'finishing'/);
  assert.match(calls[0].text, /result =/);
});

test('claimTelegramMockResultMessage serializes concurrent result senders', async () => {
  const calls = [];
  const sql = async (strings, ...values) => {
    calls.push({ text: strings.join('?'), values });
    return [{ result_delivery_claim_index: 2 }];
  };
  const row = await claimTelegramMockResultMessage(sql, 'session-1', 2);
  assert.equal(row.result_delivery_claim_index, 2);
  assert.match(calls[0].text, /result_delivery_claim_index/);
  assert.match(calls[0].text, /result_delivery_claimed_at/);
  assert.equal(calls[0].values.includes(1), true);
});

test('releaseTelegramMockResultClaim makes a failed send immediately retryable', async () => {
  const calls = [];
  const sql = async (strings, ...values) => {
    calls.push({ text: strings.join('?'), values });
    return [];
  };
  await releaseTelegramMockResultClaim(sql, 'session-1', 2);
  assert.match(calls[0].text, /result_delivery_claim_index = NULL/);
  assert.equal(calls[0].values.includes(2), true);
});

test('markTelegramMockResultDelivered checkpoints messages in order', async () => {
  const calls = [];
  const sql = async (strings, ...values) => {
    calls.push({ text: strings.join('?'), values });
    return [{ result_delivery_index: 2 }];
  };
  const row = await markTelegramMockResultDelivered(sql, 'session-1', 2);
  assert.equal(row.result_delivery_index, 2);
  assert.match(calls[0].text, /result_delivery_index =/);
  assert.equal(calls[0].values.includes(1), true);
});

test('completeTelegramMockSession requires the final delivery checkpoint', async () => {
  const calls = [];
  const sql = async (strings, ...values) => {
    calls.push({ text: strings.join('?'), values });
    return [{ status: 'completed' }];
  };
  const row = await completeTelegramMockSession(sql, 'session-1', 10);
  assert.equal(row.status, 'completed');
  assert.match(calls[0].text, /status = 'finishing'/);
  assert.match(calls[0].text, /result_delivery_index =/);
  assert.equal(calls[0].values.includes(10), true);
});
