import { z } from 'zod'

export const feedbackInput = z
  .object({
    id: z.string().uuid(),
    category: z.enum(['content', 'ai', 'textbook', 'account', 'suggestion']),
    message: z.string().trim().min(5).max(2000),
    // Only a local path and an explicit content identifier; never collect URL query secrets.
    page: z
      .string()
      .max(300)
      .regex(/^\/(?!\/)[a-zA-Z0-9_\-/]*$/),
    contentId: z.string().trim().max(200),
  })
  .strict()
export const feedbackUpdate = z
  .object({
    id: z.string().uuid(),
    revision: z.number().int().positive(),
    status: z.enum(['received', 'processing', 'resolved']),
    reply: z.string().trim().min(2).max(2000),
  })
  .strict()
export const feedbackTicket = feedbackInput.extend({
  status: z.enum(['received', 'processing', 'resolved']),
  reply: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  revision: z.number(),
  sequence: z.number(),
})
export type FeedbackTicket = z.infer<typeof feedbackTicket>
export const feedbackCategories = {
  content: '内容或答案有误',
  ai: 'AI 练习问题',
  textbook: '教材缺失或打不开',
  account: '账号与同步',
  suggestion: '功能建议',
}
export const feedbackStatuses = { received: '已收到', processing: '处理中', resolved: '已处理' }
