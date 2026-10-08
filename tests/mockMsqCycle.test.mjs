import test from 'node:test';
import assert from 'node:assert/strict';
import { GATE_2027_TOPIC_IDS } from '../lib/gateSyllabus.js';
import { generatePresetMock, generateTopicMock } from '../lib/mockGenerator.js';
import { msqTypesForCycle } from '../lib/xhC5MsqTypes.js';

function assertCycle(mock, cycleIndex) {
  const questions = [...mock.section1, ...mock.section2];
  const msqs = questions.filter((question) => question.type === 'MSQ');
  const active = msqTypesForCycle(cycleIndex);
  assert.equal(msqs.length >= 4, true);
  assert.equal(msqs.every((question) => active.includes(question.msqType)), true);
  assert.deepEqual([...new Set(msqs.map((question) => question.msqType))].sort(), [...active].sort());
  assert.equal(new Set(questions.map((question) => question.id)).size, questions.length);
}

test('five preset C5 mocks rotate through four MSQ structures each', () => {
  for (let index = 0; index < 5; index += 1) {
    assertCycle(generatePresetMock(index), index);
  }
});

test('generated C5 mocks apply the requested MSQ structure cycle', () => {
  for (const cycleIndex of [0, 1, 2, 3, 4]) {
    assertCycle(generateTopicMock(GATE_2027_TOPIC_IDS, [], cycleIndex), cycleIndex);
  }
});

test('generated C5 mocks survive repeated five-mock exclusion windows', () => {
  const history = [];
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const excluded = history.slice(0, 5).flat();
    const mock = generateTopicMock(GATE_2027_TOPIC_IDS, excluded, attempt % 5);
    assertCycle(mock, attempt % 5);
    history.unshift([...mock.section1, ...mock.section2].map((question) => question.id));
  }
});

test('topic-filtered C5 mocks preserve the selected topic while supplying four active structures', () => {
  for (const topic of GATE_2027_TOPIC_IDS) {
    for (let cycleIndex = 0; cycleIndex < 5; cycleIndex += 1) {
      const mock = generateTopicMock([topic], [], cycleIndex);
      const questions = [...mock.section1, ...mock.section2];
      const msqTypes = new Set(questions.filter((question) => question.type === 'MSQ').map((question) => question.msqType));
      assert.equal(msqTypes.size, 4, `${topic} cycle ${cycleIndex}`);
      assert.equal(questions.every((question) => question.topic === topic), true, topic);
    }
  }
});

test('preset C5 mocks do not reuse rotated MSQ IDs across the five papers', () => {
  const ids = Array.from({ length: 5 }, (_, index) => generatePresetMock(index))
    .flatMap((mock) => [...mock.section1, ...mock.section2])
    .filter((question) => question.type === 'MSQ')
    .map((question) => question.id);
  assert.equal(new Set(ids).size, ids.length);
});
