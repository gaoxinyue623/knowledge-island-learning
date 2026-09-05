import type { ExerciseTemplate } from '@/types'

export interface ExerciseConstraintReport {
  valid: boolean
  issues: string[]
}

function rangeIssue(min: number, max: number, name: string, issues: string[]): void {
  if (!Number.isInteger(min) || !Number.isInteger(max) || min > max) {
    issues.push(`${name} 范围无效`)
  }
}

export function validateExerciseTemplateConstraints(
  template: ExerciseTemplate,
): ExerciseConstraintReport {
  const issues: string[] = []
  switch (template.templateType) {
    case 'addition_range': {
      const config = template.config
      rangeIssue(config.minAddend, config.maxAddend, '加数', issues)
      if (config.maxResult < config.maxAddend) issues.push('加法结果上限不能小于最大加数')
      if (config.maxResult < 1) issues.push('加法结果上限必须为正数')
      break
    }
    case 'subtraction_range': {
      const config = template.config
      rangeIssue(config.minMinuend, config.maxMinuend, '被减数', issues)
      rangeIssue(config.minSubtrahend, config.maxSubtrahend, '减数', issues)
      if (config.nonNegative && config.minMinuend < config.minSubtrahend) {
        issues.push('非负减法需要保证被减数范围覆盖减数')
      }
      break
    }
    case 'compare_numbers':
      rangeIssue(template.config.min, template.config.max, '比较数', issues)
      if (template.config.min === template.config.max && !template.config.allowEqual) {
        issues.push('不允许相等时需要至少两个可比较的数')
      }
      break
    case 'missing_number':
      rangeIssue(template.config.min, template.config.max, '未知数', issues)
      if (template.config.maxResult < template.config.max) issues.push('未知数范围不能超过结果上限')
      break
    case 'number_order':
      rangeIssue(template.config.min, template.config.max, '排序数', issues)
      if (template.config.count > template.config.max - template.config.min + 1) {
        issues.push('排序数量超过可用的不重复数字数量')
      }
      break
    case 'picture_count':
      rangeIssue(template.config.minCount, template.config.maxCount, '图示数量', issues)
      if (template.config.objectLabels.length === 0) issues.push('图示对象不能为空')
      break
    case 'word_problem_simple':
      if (template.config.maxResult < 1) issues.push('情境题结果上限必须为正数')
      if (template.config.contexts.length === 0) issues.push('情境题至少需要一个生活情境')
      break
    case 'equation_match':
      if (template.config.maxNumber < 2) issues.push('算式匹配的数字上限至少为 2')
      if (template.config.optionsPerQuestion < 2) issues.push('算式匹配至少需要两个选项')
      break
  }
  return { valid: issues.length === 0, issues }
}

export function assertExerciseTemplateConstraints(template: ExerciseTemplate): void {
  const report = validateExerciseTemplateConstraints(template)
  if (!report.valid) throw new Error(`EXERCISE_TEMPLATE_INVALID: ${report.issues.join('；')}`)
}
