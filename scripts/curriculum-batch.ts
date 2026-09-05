import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import path from 'node:path'

import {
  batch01Manifest,
  batch01MathG1S1Package,
  batch01MathG1S2Package,
  batch01SourceManifest,
  curriculumSourceManifest,
} from '../src/data/curriculum'
import {
  buildCurriculumBatchImportSummary,
  buildCurriculumBatchReviewReport,
  renderCurriculumBatchReport,
  validateCurriculumBatchManifest,
} from '../src/services/curriculum'
import type { CurriculumBatchPackageInput, CurriculumImportPackage } from '../src/types'

const packageByDescriptorId = new Map<string, CurriculumImportPackage>([
  ['B01_SZ_G1_MATH_S1_BNUP_2024_CANDIDATE', batch01MathG1S1Package],
  ['B01_SZ_G1_MATH_S2_BNUP_2024_CANDIDATE', batch01MathG1S2Package],
])

const packageInputs: readonly CurriculumBatchPackageInput[] = batch01Manifest.packages.map(
  (descriptor) => {
    const packageRecord = packageByDescriptorId.get(descriptor.packageId)
    if (!packageRecord)
      throw new Error(`Batch 01 package is not registered: ${descriptor.packageId}`)
    return { descriptor, package: packageRecord }
  },
)

function printSummary(summary: ReturnType<typeof buildCurriculumBatchImportSummary>): void {
  const added = summary.diff.byEntity
  console.log(`Package: ${summary.packageId}`)
  console.log(`  import=${summary.success ? 'PASS' : 'FAIL'} report=${summary.reportStatus}`)
  console.log(
    `  add: textbook=${added.textbook.added.length} unit=${added.unit.added.length} lesson=${added.lesson.added.length} knowledgePoint=${added.knowledgePoint.added.length} mapping=${added.lessonKnowledgePoint.added.length} relation=${added.knowledgeRelation.added.length}`,
  )
  console.log(
    `  fingerprint=${summary.fingerprint.slice(0, 24)}… (stable JSON length=${summary.fingerprint.length})`,
  )
  console.log(`  releaseEligible=${summary.releaseEligible ? 'YES' : 'NO'}`)
  for (const issue of summary.issues) console.log(`  issue=${issue}`)
}

function runBatch01(args: string[]): number {
  const sourceValidation = validateCurriculumBatchManifest(
    batch01Manifest,
    batch01SourceManifest,
    curriculumSourceManifest,
  )
  console.log(`Batch: ${batch01Manifest.id}`)
  console.log(
    `Scope: ${batch01Manifest.regionName} / G${batch01Manifest.grade} / ${batch01Manifest.schoolYear}`,
  )
  console.log(`Source manifest: ${sourceValidation.valid ? 'PASS' : 'FAIL'}`)
  for (const issue of sourceValidation.issues) console.log(`  issue=${issue}`)
  for (const sourceId of sourceValidation.missingSourceReferenceIds) {
    console.log(`  missingSourceReference=${sourceId}`)
  }

  const summaries = packageInputs.map(buildCurriculumBatchImportSummary)
  for (const summary of summaries) printSummary(summary)
  const reportInput = {
    manifest: batch01Manifest,
    sourceManifest: batch01SourceManifest,
    sourceReferences: curriculumSourceManifest,
    packageInputs,
    packageSummaries: summaries,
  }
  const report = buildCurriculumBatchReviewReport(reportInput)
  console.log(
    `Batch status: ${report.status}; slots=${report.slotCount}; packages=${report.packageCount}; candidates=${report.knowledgePointCandidateCount}; reused=${report.reusedKnowledgePointCount}; productionIndex=${report.productionIndexChange}`,
  )
  if (args.includes('--print-report')) console.log(renderCurriculumBatchReport(reportInput, report))
  console.log(
    'write=SKIPPED (batch command is a dry-run/review artifact; no production storage is mutated)',
  )
  const validationPassed =
    sourceValidation.valid &&
    summaries.every((summary) => summary.success) &&
    report.importValidation === 'PASS' &&
    report.integrityValidation === 'PASS' &&
    report.dagValidation === 'PASS' &&
    report.importDiff === 'PASS' &&
    report.reviewedOverwriteGuard === 'PASS'
  if (!validationPassed) return 1
  return 0
}

async function loadPackage(filePath: string): Promise<CurriculumImportPackage> {
  const absolutePath = path.resolve(process.cwd(), filePath)
  if (absolutePath.endsWith('.json')) {
    return JSON.parse(readFileSync(absolutePath, 'utf8')) as CurriculumImportPackage
  }
  const loaded = (await import(pathToFileURL(absolutePath).href)) as {
    default?: CurriculumImportPackage
    [key: string]: unknown
  }
  const packageRecord =
    loaded.default ?? Object.values(loaded).find((value) => value && typeof value === 'object')
  if (!packageRecord || typeof packageRecord !== 'object') {
    throw new Error(`No CurriculumImportPackage export found in ${filePath}`)
  }
  return packageRecord as CurriculumImportPackage
}

async function runImport(filePath: string | undefined): Promise<number> {
  if (!filePath) {
    console.error('Usage: npm run curriculum:import -- <package.json|package.ts> [--dry-run]')
    return 1
  }
  const packageRecord = await loadPackage(filePath)
  const descriptor = {
    packageId: packageRecord.textbook.id,
    slotId: 'CLI_IMPORT',
    relativePath: filePath,
    status: 'CANDIDATE' as const,
  }
  const summary = buildCurriculumBatchImportSummary({ descriptor, package: packageRecord })
  printSummary(summary)
  console.log(
    'write=SKIPPED (import is a dry-run/review artifact; no production storage is mutated)',
  )
  return summary.success ? 0 : 1
}

const args = process.argv.slice(2)
const command = args[0]
let exitCode = 0

if (command === 'batch-01') {
  exitCode = runBatch01(args.slice(1))
} else if (command === 'import') {
  exitCode = await runImport(args[1])
} else {
  console.error('Usage: npm run curriculum:batch -- [--dry-run|--print-report]')
  console.error('   or: npm run curriculum:import -- <package.json|package.ts> [--dry-run]')
  exitCode = 1
}

process.exitCode = exitCode
