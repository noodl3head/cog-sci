import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { pathToFileURL } from 'node:url';

const moduleCache = new Map();

async function loadModule(filename) {
  const absolutePath = path.resolve(filename);
  if (moduleCache.has(absolutePath)) return await moduleCache.get(absolutePath);

  const loading = (async () => {
    const source = await fs.readFile(absolutePath, 'utf8');
    const module = new vm.SourceTextModule(source, {
      identifier: pathToFileURL(absolutePath).href,
    });
    await module.link((specifier) => {
      const importedPath = specifier.endsWith('.js') ? specifier : `${specifier}.js`;
      return loadModule(path.resolve(path.dirname(absolutePath), importedPath));
    });
    await module.evaluate();
    return module;
  })();
  moduleCache.set(absolutePath, loading);
  return await loading;
}

const quizDataModule = await loadModule('lib/quizData.js');
const qualityModule = await loadModule('lib/questionQuality.js');
const coverageModule = await loadModule('lib/contentCoverage.js');
const mockModule = await loadModule('lib/mockGenerator.js');
const syllabusModule = await loadModule('lib/gateSyllabus.js');
const audit = qualityModule.namespace.auditQuestionBank(quizDataModule.namespace.QUIZ_DATA);

console.log('Question quality audit');
console.log(`  Total mapped:     ${audit.total}`);
console.log(`  Playable:         ${audit.playable}`);
console.log(`  Context restored: ${audit.contextRestored}`);
console.log(`  Source cleaned:   ${audit.sourceCleaned}`);
console.log(`  Excluded:         ${audit.excluded}`);

if (audit.excluded) {
  console.log('\nExcluded questions');
  for (const record of audit.records.filter((entry) => entry.status === 'excluded')) {
    console.log(`  ${record.id} — ${record.reason}`);
  }
}

const coverage = coverageModule.namespace.getContentCoverageReport();
console.log('\nGATE content coverage');
console.log(`  Original GATE-style: ${coverage.summary.original}/${coverage.summary.originalTarget}`);
console.log(`  Imported AP support: ${coverage.summary.imported}`);
console.log(`  Formats:             ${coverage.summary.formats.MCQ} MCQ, ${coverage.summary.formats.MSQ} MSQ, ${coverage.summary.formats.NAT} NAT`);
console.log(`  Leaf mappings:       ${coverage.summary.explicitMappings} explicit, ${coverage.summary.inferredMappings} inferred, ${coverage.summary.fallbackMappings} fallback`);

function validateMock(mock, label) {
  const questions = [...mock.section1, ...mock.section2];
  if (questions.length !== 35) throw new Error(`${label} contains ${questions.length} questions instead of 35`);
  if (new Set(questions.map((question) => question.id)).size !== 35) throw new Error(`${label} contains duplicate questions`);
  for (const question of questions) {
    if (!question.syllabusLeaf || !question.difficulty || !question.cognitiveLevel || !question.sourceType) {
      throw new Error(`${label} has incomplete metadata for ${question.id}`);
    }
    if (question.type === 'NAT' && !Number.isFinite(Number(question.answer))) throw new Error(`${label} has an invalid NAT answer for ${question.id}`);
    if (question.type === 'MSQ' && !question.answers?.length) throw new Error(`${label} has an invalid MSQ answer for ${question.id}`);
    if (question.type === 'MCQ' && !question.options?.[question.answer]) throw new Error(`${label} has an invalid MCQ answer for ${question.id}`);
  }
}

for (let index = 0; index < 5; index += 1) validateMock(mockModule.namespace.generatePresetMock(index), `Preset mock ${index + 1}`);
const recentGeneratedIds = [];
for (let index = 0; index < 6; index += 1) {
  const excludedIds = recentGeneratedIds.slice(-5).flat();
  const generatedMock = mockModule.namespace.generateRandomMock(excludedIds);
  validateMock(generatedMock, `Generated mock ${index + 1}`);
  const generatedIds = [...generatedMock.section1, ...generatedMock.section2].map((question) => question.id);
  const repeatedIds = generatedIds.filter((questionId) => excludedIds.includes(questionId));
  if (repeatedIds.length) throw new Error(`Generated mock ${index + 1} repeated ${repeatedIds.length} recently used questions`);
  recentGeneratedIds.push(generatedIds);
}
for (const topicId of syllabusModule.namespace.GATE_2027_TOPIC_IDS) {
  validateMock(mockModule.namespace.generateTopicMock([topicId]), `Topic mock: ${topicId}`);
}
console.log('  Mock validation:     5 presets, 6 full (0 recent repeats) and 11 topic-only mocks passed');
