import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  batch01Manifest,
  batch01MathG1S1Package,
  batch01MathG1S2Package,
  batch01SourceManifest,
  curriculumSourceManifest,
} from '../src/data/curriculum'
import { sampleKnowledgePoints } from '../src/data/curriculum/knowledge-points'
import {
  buildCurriculumBatchManualReviewReport,
  CurriculumBatchManualReviewReportSchema,
  renderCurriculumBatchEvidenceReview,
  renderCurriculumBatchManualReviewReport,
  renderCurriculumBatchPhysicalEvidenceRequest,
  renderManualReviewChecklist,
} from '../src/services/curriculum'
import type { CurriculumBatchPackageInput } from '../src/types'

const packageById = new Map([
  [batch01MathG1S1Package.textbook.id, batch01MathG1S1Package],
  [batch01MathG1S2Package.textbook.id, batch01MathG1S2Package],
])

const packageInputs: readonly CurriculumBatchPackageInput[] = batch01Manifest.packages.map(
  (descriptor) => {
    const packageRecord = descriptor.packageId.includes('S1')
      ? batch01MathG1S1Package
      : batch01MathG1S2Package
    if (!packageById.has(packageRecord.textbook.id)) {
      throw new Error(`Batch 01 package is not registered: ${descriptor.packageId}`)
    }
    return { descriptor, package: packageRecord }
  },
)

const report = buildCurriculumBatchManualReviewReport({
  manifest: batch01Manifest,
  sourceManifest: batch01SourceManifest,
  sourceReferences: curriculumSourceManifest,
  packageInputs,
  existingKnowledgePoints: sampleKnowledgePoints,
})
const schemaResult = CurriculumBatchManualReviewReportSchema.safeParse(report)
if (!schemaResult.success) {
  throw new Error(`Curriculum Data Review 01 schema invalid: ${schemaResult.error.message}`)
}

const outputDirectory = resolve(process.cwd(), 'doc/curriculum')
mkdirSync(outputDirectory, { recursive: true })

const artifacts = [
  {
    path: 'CURRICULUM_BATCH_01_MANUAL_REVIEW.md',
    contents: renderCurriculumBatchManualReviewReport(report),
  },
  {
    path: 'CURRICULUM_BATCH_01_EVIDENCE_REVIEW.md',
    contents: renderCurriculumBatchEvidenceReview(report),
  },
  {
    path: 'MANUAL_REVIEW_CHECKLIST.md',
    contents: renderManualReviewChecklist(report),
  },
  {
    path: 'BATCH_01_PHYSICAL_EVIDENCE_REQUEST.md',
    contents: renderCurriculumBatchPhysicalEvidenceRequest(report),
  },
]

for (const artifact of artifacts) {
  writeFileSync(resolve(outputDirectory, artifact.path), `${artifact.contents.trimEnd()}\n`, 'utf8')
}

console.log(`Curriculum Data Review 01: ${report.status}`)
console.log(`Slots: ${report.slotCount}`)
console.log(`Evidence complete: ${report.evidenceCompleteSlots.length}`)
console.log(`Evidence missing: ${report.evidenceMissingSlots.length}`)
console.log(`Evidence conflict: ${report.evidenceConflictSlots.length}`)
console.log(`Production Index: ${report.productionIndexChange}`)
for (const artifact of artifacts) console.log(`Artifact: ${resolve(outputDirectory, artifact.path)}`)
