import type { CurriculumSourceManifestEntry } from '@/types'

import { batch01SourceReferences } from '../batch-01/source-manifest'

/**
 * Evidence inventory for the current release investigation. These records are
 * not themselves a review decision: a source can be reliable while still not
 * proving the current school-year textbook mapping or the copyright needed by
 * a release package.
 */
const phase16SourceManifest: CurriculumSourceManifestEntry[] = [
  {
    id: 'SZ-TEXTBOOK-SELECTION-2022-2024',
    type: 'official_document',
    title: '深圳市 2022 春—2024 春义务教育阶段免费课本政府选用目录',
    sourceUrl: 'https://www.sz.gov.cn/attachment/0/799/799233/8905786.pdf',
    publisher: '深圳市教育局',
    page: 'PDF 第 1 页（浏览器 viewer p. 0）',
    retrievedAt: '2026-09-03',
    evidenceLevel: 1,
    evidenceScope: '深圳地区历史教材选用；覆盖期为 2022 春至 2024 春。',
    status: 'RELIABLE_BUT_OUT_OF_DATE_FOR_RELEASE',
    validityNote: '不能单独证明 2026—2027 学年仍使用同一教材版本、版次或 ISBN。',
    evidenceTypes: ['REGIONAL_SELECTION'],
    note: '可作为历史地区映射证据，不作为当前生产发布依据。',
  },
  {
    id: 'SZ-SCHOOL-CALENDAR-2026-2027',
    type: 'official_document',
    title: '深圳市教育局关于印发 2026—2027 学年普通中小学校校历的通知',
    sourceUrl: 'https://szeb.sz.gov.cn/gkmlpt/content/12/12783/post_12783896.html',
    publisher: '深圳市教育局',
    retrievedAt: '2026-09-03',
    evidenceLevel: 1,
    evidenceScope: '确认 2026—2027 学年时间背景，不提供具体教材版本清单。',
    status: 'RELIABLE_CONTEXT_ONLY',
    validityNote: '仅用于学年有效期上下文，不能作为地区—教材关系的唯一来源。',
  },
  {
    id: 'MOE-NATIONAL-CATALOG-2024',
    type: 'official_document',
    title: '2024 年义务教育国家课程教学用书目录（根据 2022 年版课程标准修订）',
    sourceUrl: 'https://www.moe.gov.cn/srcsite/A26/s8001/202408/W020240805496325238752.pdf',
    publisher: '中华人民共和国教育部',
    page: 'PDF 首页',
    retrievedAt: '2026-09-03',
    curriculumStandardVersion: '2022 年版',
    evidenceLevel: 1,
    evidenceScope: '国家课程教材目录与出版单位背景。',
    status: 'RELIABLE_CONTEXT_ONLY',
    validityNote: '国家目录不等同于深圳当前学年地区选用证明。',
    evidenceTypes: ['NATIONAL_CATALOG'],
  },
  {
    id: 'MATH-G3-UPPER-PUBLIC-CANDIDATE',
    type: 'manual',
    title: '北师大版小学数学三年级上册公开目录候选页',
    sourceUrl: 'https://www.renjiaoshe.com/jiaocai/2428.html',
    retrievedAt: '2026-09-03',
    evidenceLevel: 5,
    evidenceScope: '用于候选目录采集和差异检测，不作为正式教材事实。',
    status: 'CANDIDATE_REQUIRES_MANUAL_REVIEW',
    validityNote: '必须与同一版次原书封面、版权页、目录页逐项比对。',
    evidenceTypes: ['TEXTBOOK_EXISTENCE', 'TEXTBOOK_IDENTITY', 'TEXTBOOK_CATALOG'],
    note: '公开目录页的版次、ISBN、完整版权和深圳适用关系尚未闭环。',
  },
]

/** Single source-reference registry consumed by production readiness and BATCH 01. */
export const curriculumSourceManifest: CurriculumSourceManifestEntry[] = [
  ...phase16SourceManifest,
  ...batch01SourceReferences,
]
