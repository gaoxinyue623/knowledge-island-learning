import type { ExerciseInstance, ExerciseTemplate, StructuredContent } from '@/types'
import { isProductionExerciseTemplate } from '@/services/production-readiness'

import { assertExerciseTemplateConstraints } from './exerciseConstraints'

interface SeededRandom {
  next(): number
  int(min: number, max: number): number
}

function hashSeed(seed: string): number {
  let hash = 2166136261
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0 || 1
}

function createRandom(seed: string): SeededRandom {
  let state = hashSeed(seed)
  return {
    next() {
      state = Math.imul(1664525, state) + 1013904223
      return (state >>> 0) / 4294967296
    },
    int(min, max) {
      return Math.floor(this.next() * (max - min + 1)) + min
    },
  }
}

function content(
  type: StructuredContent['blocks'][number]['type'],
  value: string,
): StructuredContent {
  return { blocks: [{ type, value }] }
}

function pick<T>(random: SeededRandom, values: readonly T[]): T {
  const value = values[random.int(0, values.length - 1)]
  if (value === undefined) throw new Error('EXERCISE_GENERATOR_EMPTY_PICK')
  return value
}

function uniqueNumbers(random: SeededRandom, min: number, max: number, count: number): number[] {
  const values = new Set<number>()
  let guard = 0
  while (values.size < count && guard < 1000) {
    values.add(random.int(min, max))
    guard += 1
  }
  if (values.size !== count) throw new Error('EXERCISE_GENERATOR_RANGE_TOO_SMALL')
  return [...values]
}

type InstanceFields = Omit<
  ExerciseInstance,
  'id' | 'templateId' | 'seed' | 'index' | 'isSample' | 'verificationStatus'
>

function buildInstance(
  template: ExerciseTemplate,
  seed: string,
  index: number,
  fields: InstanceFields,
): ExerciseInstance {
  return {
    id: `${template.id}:${seed}:${index}`,
    templateId: template.id,
    seed,
    index,
    isSample: template.isSample,
    verificationStatus: template.verificationStatus,
    ...fields,
  }
}

function addition(
  template: Extract<ExerciseTemplate, { templateType: 'addition_range' }>,
  random: SeededRandom,
  index: number,
  seed: string,
  usedPairs: Set<string>,
): ExerciseInstance {
  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const left = random.int(template.config.minAddend, template.config.maxAddend)
    const right = random.int(template.config.minAddend, template.config.maxAddend)
    const result = left + right
    const key = `${left}+${right}`
    if (
      (!template.config.allowZero && (left === 0 || right === 0)) ||
      result > template.config.maxResult
    )
      continue
    if (template.config.noCarry && (left % 10) + (right % 10) >= 10) continue
    if (template.config.noDuplicatePair && usedPairs.has(key)) continue
    usedPairs.add(key)
    return buildInstance(template, seed, index, {
      prompt: content('formula', `${left} + ${right} = ?`),
      answerSpec: { kind: 'numeric', value: result },
      explanation: content('text', `把 ${left} 和 ${right} 合在一起，结果是 ${result}。`),
      difficulty: template.difficulty,
      knowledgePointId: template.knowledgePointId,
      derivation: { operator: 'addition', operands: [left, right], result },
    })
  }
  throw new Error('EXERCISE_GENERATOR_NO_VALID_ADDITION')
}

function subtraction(
  template: Extract<ExerciseTemplate, { templateType: 'subtraction_range' }>,
  random: SeededRandom,
  index: number,
  seed: string,
  usedPairs: Set<string>,
): ExerciseInstance {
  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const minuend = random.int(template.config.minMinuend, template.config.maxMinuend)
    const subtrahend = random.int(template.config.minSubtrahend, template.config.maxSubtrahend)
    const result = minuend - subtrahend
    const key = `${minuend}-${subtrahend}`
    if (
      (!template.config.allowZero && (minuend === 0 || subtrahend === 0)) ||
      (template.config.nonNegative && result < 0)
    )
      continue
    if (template.config.noDuplicatePair && usedPairs.has(key)) continue
    usedPairs.add(key)
    return buildInstance(template, seed, index, {
      prompt: content('formula', `${minuend} − ${subtrahend} = ?`),
      answerSpec: { kind: 'numeric', value: result },
      explanation: content('text', `从 ${minuend} 中去掉 ${subtrahend}，还剩 ${result}。`),
      difficulty: template.difficulty,
      knowledgePointId: template.knowledgePointId,
      derivation: { operator: 'subtraction', operands: [minuend, subtrahend], result },
    })
  }
  throw new Error('EXERCISE_GENERATOR_NO_VALID_SUBTRACTION')
}

function compare(
  template: Extract<ExerciseTemplate, { templateType: 'compare_numbers' }>,
  random: SeededRandom,
  index: number,
  seed: string,
): ExerciseInstance {
  const left = random.int(template.config.min, template.config.max)
  let right = random.int(template.config.min, template.config.max)
  if (!template.config.allowEqual && left === right)
    right = right < template.config.max ? right + 1 : right - 1
  const correctKey = left < right ? 'less' : left > right ? 'greater' : 'equal'
  return buildInstance(template, seed, index, {
    prompt: content('text', `比较 ${left} 和 ${right}，选一选。`),
    answerSpec: {
      kind: 'choice',
      options: [
        { key: 'less', label: '<' },
        { key: 'equal', label: '=' },
        { key: 'greater', label: '>' },
      ],
      correctKey,
    },
    explanation: content(
      'text',
      `${left} ${correctKey === 'less' ? '<' : correctKey === 'greater' ? '>' : '='} ${right}。`,
    ),
    difficulty: template.difficulty,
    knowledgePointId: template.knowledgePointId,
    derivation: { operator: 'comparison', operands: [left, right] },
  })
}

function missing(
  template: Extract<ExerciseTemplate, { templateType: 'missing_number' }>,
  random: SeededRandom,
  index: number,
  seed: string,
): ExerciseInstance {
  const min = template.config.excludeZero ? 1 : 0
  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const left = random.int(min, template.config.max)
    const right = random.int(min, template.config.max)
    if (template.config.operation === 'addition') {
      const result = left + right
      if (result > template.config.maxResult) continue
      return buildInstance(template, seed, index, {
        prompt: content('formula', `□ + ${right} = ${result}`),
        answerSpec: { kind: 'numeric', value: left },
        explanation: content('text', `找到缺少的数 ${left}，再检查算式关系。`),
        difficulty: template.difficulty,
        knowledgePointId: template.knowledgePointId,
        derivation: { operator: 'addition', operands: [left, right], result },
      })
    }
    if (left < right) continue
    const result = left - right
    return buildInstance(template, seed, index, {
      prompt: content('formula', `${left} − □ = ${result}`),
      answerSpec: { kind: 'numeric', value: right },
      explanation: content('text', `从 ${left} 中去掉 ${right}，得到 ${result}。`),
      difficulty: template.difficulty,
      knowledgePointId: template.knowledgePointId,
      derivation: { operator: 'subtraction', operands: [left, right], result },
    })
  }
  throw new Error('EXERCISE_GENERATOR_NO_VALID_MISSING_NUMBER')
}

function numberOrder(
  template: Extract<ExerciseTemplate, { templateType: 'number_order' }>,
  random: SeededRandom,
  index: number,
  seed: string,
): ExerciseInstance {
  const values = uniqueNumbers(
    random,
    template.config.min,
    template.config.max,
    template.config.count,
  )
  const correctOrder = [...values]
    .sort((left, right) =>
      template.config.direction === 'ascending' ? left - right : right - left,
    )
    .map(String)
  return buildInstance(template, seed, index, {
    prompt: content(
      'text',
      `把这些数按${template.config.direction === 'ascending' ? '从小到大' : '从大到小'}排列：${values.join('、')}`,
    ),
    answerSpec: { kind: 'ordered', correctOrder },
    explanation: content('text', '依次比较每个数的位置，就能得到正确顺序。'),
    difficulty: template.difficulty,
    knowledgePointId: template.knowledgePointId,
    derivation: { operator: 'ordering', operands: values },
  })
}

function pictureCount(
  template: Extract<ExerciseTemplate, { templateType: 'picture_count' }>,
  random: SeededRandom,
  index: number,
  seed: string,
): ExerciseInstance {
  const count = random.int(template.config.minCount, template.config.maxCount)
  const label = pick(random, template.config.objectLabels)
  return buildInstance(template, seed, index, {
    prompt: content('text', `数一数，有几${label}？`),
    answerSpec: { kind: 'numeric', value: count },
    explanation: content('text', `一个一个数，最后数到 ${count}。`),
    difficulty: template.difficulty,
    knowledgePointId: template.knowledgePointId,
    derivation: { operator: 'counting', operands: [count], result: count },
  })
}

function wordProblem(
  template: Extract<ExerciseTemplate, { templateType: 'word_problem_simple' }>,
  random: SeededRandom,
  index: number,
  seed: string,
): ExerciseInstance {
  const context = pick(random, template.config.contexts)
  const first = random.int(1, template.config.maxResult)
  const second =
    template.config.operation === 'subtraction'
      ? random.int(1, first)
      : random.int(1, Math.max(1, template.config.maxResult - first))
  const result = template.config.operation === 'addition' ? first + second : first - second
  const prompt =
    template.config.operation === 'addition'
      ? `${context.subject}有 ${first} 个，${context.verb} ${second} 个，一共有多少个？`
      : `${context.subject}有 ${first} 个，${context.verb} ${second} 个，还剩多少个？`
  return buildInstance(template, seed, index, {
    prompt: content('text', prompt),
    answerSpec: { kind: 'numeric', value: result },
    explanation: content(
      'text',
      `先找出数量的变化，再用${template.config.operation === 'addition' ? '加法' : '减法'}计算。`,
    ),
    difficulty: template.difficulty,
    knowledgePointId: template.knowledgePointId,
    derivation: { operator: template.config.operation, operands: [first, second], result },
  })
}

function equationMatch(
  template: Extract<ExerciseTemplate, { templateType: 'equation_match' }>,
  random: SeededRandom,
  index: number,
  seed: string,
): ExerciseInstance {
  const left = random.int(1, template.config.maxNumber)
  const right =
    template.config.operation === 'subtraction'
      ? random.int(1, left)
      : random.int(1, template.config.maxNumber)
  const result = template.config.operation === 'addition' ? left + right : left - right
  const operator = template.config.operation === 'addition' ? '+' : '−'
  const options = [{ key: 'correct', label: `${left} ${operator} ${right} = ${result}` }]
  for (let optionIndex = 1; optionIndex < template.config.optionsPerQuestion; optionIndex += 1) {
    options.push({
      key: `option-${optionIndex}`,
      label: `${left} ${operator} ${right} = ${result + optionIndex}`,
    })
  }
  return buildInstance(template, seed, index, {
    prompt: content('text', '选出正确的算式。'),
    answerSpec: { kind: 'choice', options, correctKey: 'correct' },
    explanation: content('formula', `${left} ${operator} ${right} = ${result}`),
    difficulty: template.difficulty,
    knowledgePointId: template.knowledgePointId,
    derivation: { operator: template.config.operation, operands: [left, right], result },
  })
}

export function generateExerciseInstances(
  template: ExerciseTemplate,
  seed: string,
  count: number,
): ExerciseInstance[] {
  assertExerciseTemplateConstraints(template)
  if (!Number.isInteger(count) || count < 0) throw new Error('EXERCISE_GENERATOR_COUNT_INVALID')
  const random = createRandom(seed)
  const usedPairs = new Set<string>()
  const instances: ExerciseInstance[] = []
  for (let index = 0; index < count; index += 1) {
    switch (template.templateType) {
      case 'addition_range':
        instances.push(addition(template, random, index, seed, usedPairs))
        break
      case 'subtraction_range':
        instances.push(subtraction(template, random, index, seed, usedPairs))
        break
      case 'compare_numbers':
        instances.push(compare(template, random, index, seed))
        break
      case 'missing_number':
        instances.push(missing(template, random, index, seed))
        break
      case 'number_order':
        instances.push(numberOrder(template, random, index, seed))
        break
      case 'picture_count':
        instances.push(pictureCount(template, random, index, seed))
        break
      case 'word_problem_simple':
        instances.push(wordProblem(template, random, index, seed))
        break
      case 'equation_match':
        instances.push(equationMatch(template, random, index, seed))
        break
    }
  }
  return instances
}

/** Production callers must opt into this guarded entry point. */
export function generateProductionExerciseInstances(
  template: ExerciseTemplate,
  seed: string,
  count: number,
): ExerciseInstance[] {
  if (!isProductionExerciseTemplate(template)) throw new Error('EXERCISE_TEMPLATE_NOT_REVIEWED')
  return generateExerciseInstances(template, seed, count)
}

export function validateGeneratedExerciseInstances(
  template: ExerciseTemplate,
  instances: readonly ExerciseInstance[],
): { valid: boolean; issues: string[] } {
  const issues: string[] = []
  const ids = new Set<string>()
  for (const instance of instances) {
    if (ids.has(instance.id)) issues.push(`重复实例 ID: ${instance.id}`)
    ids.add(instance.id)
    if (instance.templateId !== template.id) issues.push(`模板引用错误: ${instance.id}`)
    if (instance.knowledgePointId !== template.knowledgePointId)
      issues.push(`知识点引用错误: ${instance.id}`)
    if (instance.answerSpec.kind === 'numeric' && !Number.isFinite(instance.answerSpec.value))
      issues.push(`答案无效: ${instance.id}`)
    if (instance.derivation?.result !== undefined && instance.derivation.result < 0)
      issues.push(`结果不能为负数: ${instance.id}`)
    if (
      instance.derivation?.operator === 'addition' &&
      instance.derivation.operands &&
      instance.derivation.result !== undefined
    ) {
      if (
        instance.derivation.operands.reduce((sum, value) => sum + value, 0) !==
        instance.derivation.result
      )
        issues.push(`加法结果错误: ${instance.id}`)
    }
    if (
      instance.derivation?.operator === 'subtraction' &&
      instance.derivation.operands &&
      instance.derivation.result !== undefined
    ) {
      const [left, right] = instance.derivation.operands
      if (left !== undefined && right !== undefined && left - right !== instance.derivation.result)
        issues.push(`减法结果错误: ${instance.id}`)
    }
  }
  return { valid: issues.length === 0, issues }
}
