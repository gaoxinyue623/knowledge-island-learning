import type { ContentBlock } from '@/types'

import { contentBlockSchema } from './schemas'

export interface ValidationReport {
  valid: boolean
  issues: string[]
}

export function validateContentBlock(block: unknown): ValidationReport {
  const result = contentBlockSchema.safeParse(block)
  if (result.success) {
    return { valid: true, issues: [] }
  }

  return {
    valid: false,
    issues: result.error.issues.map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'contentBlock'
      return `${path}: ${issue.message}`
    }),
  }
}

export function validateContentBlocks(blocks: unknown[]): ValidationReport {
  const issues = blocks.flatMap((block, index) =>
    validateContentBlock(block).issues.map((issue) => `blocks[${index}].${issue}`),
  )
  return { valid: issues.length === 0, issues }
}

export function isContentBlock(value: unknown): value is ContentBlock {
  return validateContentBlock(value).valid
}
