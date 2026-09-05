import type { MvpCurriculumScope } from '@/types'

/**
 * The release scope is intentionally explicit and currently has no released
 * entries. The candidate target records the next investigation slice without
 * making an unreviewed textbook selectable in production.
 */
export const mvpCurriculumScope: MvpCurriculumScope = {
  id: 'MVP_SCOPE_SZ_PRIMARY_2026_2027',
  version: 1,
  title: '深圳小学 2026—2027 学年 MVP 首发范围',
  region: {
    code: 'CN-GD-SZ',
    name: '深圳市',
  },
  validFrom: '2026-09-01',
  validTo: '2027-08-31',
  entries: [
    {
      id: 'SZ-G3-MATH-UPPER-BNUP-CANDIDATE',
      regionCode: 'CN-GD-SZ',
      regionName: '深圳市',
      grade: 3,
      semester: 'UPPER',
      subjectCode: 'MATH',
      publisherCode: 'BNUP',
      status: 'CANDIDATE',
      sourceReferenceIds: [
        'SZ-TEXTBOOK-SELECTION-2022-2024',
        'SZ-SCHOOL-CALENDAR-2026-2027',
        'MATH-G3-UPPER-PUBLIC-CANDIDATE',
      ],
      blockingReasons: [
        '尚未取得可证明 2026—2027 学年深圳选用关系的当前官方清单。',
        '尚未核对同一版次原书版权页、目录页和 ISBN。',
        '尚未完成单元、课次、知识点映射及人工 REVIEWED 记录。',
      ],
    },
  ],
  sourceReferenceIds: [
    'SZ-TEXTBOOK-SELECTION-2022-2024',
    'SZ-SCHOOL-CALENDAR-2026-2027',
    'MOE-NATIONAL-CATALOG-2024',
    'MATH-G3-UPPER-PUBLIC-CANDIDATE',
  ],
  releaseNote:
    '当前只登记深圳三年级数学上册北师大版候选范围；没有实体进入 RELEASED，生产入口不得展示候选教材。',
}
