import { productionCurriculumData, mvpCurriculumScope } from '../src/data/curriculum/production'
import { resolveProductionConfig } from '../src/config/production'
import {
  evaluateMVPReleaseGate,
  validateProductionReadiness,
} from '../src/services/production-readiness'

const readiness = validateProductionReadiness(productionCurriculumData, mvpCurriculumScope)
const gate = evaluateMVPReleaseGate({
  readiness,
  config: resolveProductionConfig({ isProduction: true }),
  engineering: {},
  qa: {},
  regression: {},
  documentation: { phase16Artifacts: true },
  limitations: [
    '当前 MVP Scope 没有 RELEASED Curriculum 条目。',
    '正式 Lesson Content 与 Question 数据仍待来源、版权和人工审核闭环。',
  ],
})

console.log(`MVP Release Decision: ${gate.decision}`)
console.log(`MVP Curriculum Scope: ${mvpCurriculumScope.id}`)
console.log(
  `Production records: ${readiness.curriculum.reviewedTextbookCount} textbooks, ${readiness.curriculum.reviewedUnitCount} units, ${readiness.curriculum.reviewedLessonCount} lessons, ${readiness.curriculum.reviewedKnowledgePointCount} knowledge points, ${readiness.content.reviewedContentCount} contents, ${readiness.questions.reviewedQuestionCount} questions`,
)
console.log(`Blocking issues: ${gate.blockingIssues.length}`)
console.log(`Limitations: ${gate.limitations.length}`)
for (const blockingIssue of gate.blockingIssues) console.log(`BLOCKING: ${blockingIssue}`)
