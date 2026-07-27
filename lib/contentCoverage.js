import { GATE_2027_ORIGINAL_TARGET, GATE_2027_TOPICS } from './gateSyllabus';
import { GATE_STYLE_MOCK_QUESTIONS } from './mockQuestionBank';
import { getAllPlayableQuestions } from './mockGenerator';
import { inferSyllabusLeaf } from './questionMetadata';

function countBy(items, field, values) {
  return Object.fromEntries(values.map((value) => [value, items.filter((item) => item[field] === value).length]));
}

export function getContentCoverageReport() {
  const original = GATE_STYLE_MOCK_QUESTIONS;
  const imported = getAllPlayableQuestions();
  const questions = [...original, ...imported];

  const topics = GATE_2027_TOPICS.map((topic) => {
    const topicQuestions = questions.filter((question) =>
      question.topic === topic.id || question.topics?.includes(topic.id)
    );
    const topicOriginal = original.filter((question) => question.topic === topic.id);
    const target = topic.leaves.reduce((sum, leaf) => sum + leaf.target, 0);

    const classifiedTopicQuestions = topicQuestions.map((question) => {
      if (question.topic === topic.id) return question;
      return { ...question, ...inferSyllabusLeaf(question, topic.id) };
    });
    const leaves = topic.leaves.map((leaf) => {
      const leafQuestions = classifiedTopicQuestions.filter((question) => question.syllabusLeaf === leaf.id);
      const originalCount = leafQuestions.filter((question) => question.sourceType === 'original-gate').length;
      const importedCount = leafQuestions.filter((question) => question.sourceType === 'imported-ap').length;
      return {
        ...leaf,
        original: originalCount,
        imported: importedCount,
        total: leafQuestions.length,
        remaining: Math.max(0, leaf.target - originalCount),
        status: originalCount >= leaf.target ? 'covered' : originalCount > 0 ? 'developing' : 'gap',
      };
    });

    return {
      id: topic.id,
      section: topic.section,
      label: topic.label,
      original: topicOriginal.length,
      imported: topicQuestions.filter((question) => question.sourceType === 'imported-ap').length,
      total: topicQuestions.length,
      target,
      remaining: Math.max(0, target - topicOriginal.length),
      progress: target ? Math.min(100, Math.round((topicOriginal.length / target) * 100)) : 100,
      gaps: leaves.filter((leaf) => leaf.status === 'gap').length,
      leaves,
    };
  });

  return {
    summary: {
      total: questions.length,
      original: original.length,
      imported: imported.length,
      reviewed: original.filter((question) => question.qualityStatus === 'reviewed').length,
      originalTarget: GATE_2027_ORIGINAL_TARGET,
      targetRemaining: Math.max(0, GATE_2027_ORIGINAL_TARGET - original.length),
      explicitMappings: questions.filter((question) => question.syllabusLeafSource === 'explicit').length,
      inferredMappings: questions.filter((question) => question.syllabusLeafSource === 'inferred').length,
      fallbackMappings: questions.filter((question) => question.syllabusLeafSource === 'topic-fallback').length,
      formats: countBy(questions, 'format', ['MCQ', 'MSQ', 'NAT']),
      difficulties: countBy(questions, 'difficulty', ['easy', 'medium', 'hard']),
      cognitiveLevels: countBy(questions, 'cognitiveLevel', ['recall', 'understanding', 'application', 'analysis']),
    },
    topics,
  };
}
