import {
  validateChallenge,
  validateExerciseTemplate,
  validateExtensionActivity,
  validateInteractiveActivity,
  validatePracticeSet,
} from '@/services/validation'
import type { ContentExpansionBundle } from '@/types'

export interface ContentExpansionIntegrityReport {
  valid: boolean
  issues: string[]
}

export function validateContentExpansionBundle(
  bundle: ContentExpansionBundle,
): ContentExpansionIntegrityReport {
  const issues: string[] = []
  const ids = new Set<string>()
  const addId = (id: string, kind: string) => {
    if (ids.has(id)) issues.push(`重复 ${kind} ID: ${id}`)
    ids.add(id)
  }
  for (const activity of bundle.activities) {
    addId(activity.id, 'activity')
    if (activity.knowledgePointId !== bundle.knowledgePointId)
      issues.push(`activity 知识点引用错误: ${activity.id}`)
    if (!validateInteractiveActivity(activity).success)
      issues.push(`activity 配置无效: ${activity.id}`)
  }
  for (const template of bundle.exerciseTemplates) {
    addId(template.id, 'template')
    if (template.knowledgePointId !== bundle.knowledgePointId)
      issues.push(`template 知识点引用错误: ${template.id}`)
    if (!validateExerciseTemplate(template).success)
      issues.push(`template 配置无效: ${template.id}`)
  }
  const templateIds = new Set(bundle.exerciseTemplates.map((template) => template.id))
  for (const practice of bundle.practiceSets) {
    addId(practice.id, 'practice')
    if (practice.knowledgePointId !== bundle.knowledgePointId)
      issues.push(`practice 知识点引用错误: ${practice.id}`)
    if (!practice.templateIds.every((id) => templateIds.has(id)))
      issues.push(`practice 模板引用错误: ${practice.id}`)
    if (!validatePracticeSet(practice).success) issues.push(`practice 配置无效: ${practice.id}`)
  }
  for (const extension of bundle.extensionActivities) {
    addId(extension.id, 'extension')
    if (extension.knowledgePointId !== bundle.knowledgePointId)
      issues.push(`extension 知识点引用错误: ${extension.id}`)
    if (!validateExtensionActivity(extension).success)
      issues.push(`extension 配置无效: ${extension.id}`)
  }
  for (const item of bundle.challenges) {
    addId(item.id, 'challenge')
    if (item.knowledgePointId !== bundle.knowledgePointId)
      issues.push(`challenge 知识点引用错误: ${item.id}`)
    if (!validateChallenge(item).success) issues.push(`challenge 配置无效: ${item.id}`)
  }
  return { valid: issues.length === 0, issues }
}
