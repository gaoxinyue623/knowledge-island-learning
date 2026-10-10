import type { ContentSource, Question, QuestionKnowledgePoint } from '@/types'

// Approval applies only to this explicit batch; the original draft is preserved for audit.
export const CHINESE_READING_RELEASE_APPROVAL = 'OWNER_CHINESE_READING_PRACTICE_2026_10_08'

export const chineseReadingReview = {
  id: 'OWNER_CHINESE_READING_PRACTICE_2026_10_08',
  reviewer: '项目所有者（本次会话确认）',
  reviewedAt: '2026-10-08T06:55:54.863Z',
  decision: 'APPROVED',
  evidence: '审核通过并接入',
  draftId: 'CHINESE_READING_ONLY_DRAFT_20261008',
  draftSha256: '9c059c60aa9737f303e2315a19b57d9f10e9bfc0a53ad950306926191c9a5540',
  questionIds: [
    'CHINESE_READING_ONLY_20261008_Q01',
    'CHINESE_READING_ONLY_20261008_Q02',
    'CHINESE_READING_ONLY_20261008_Q03',
    'CHINESE_READING_ONLY_20261008_Q04',
    'CHINESE_READING_ONLY_20261008_Q05',
    'CHINESE_READING_ONLY_20261008_Q06',
    'CHINESE_READING_ONLY_20261008_Q07',
    'CHINESE_READING_ONLY_20261008_Q08',
    'CHINESE_READING_ONLY_20261008_Q09',
    'CHINESE_READING_ONLY_20261008_Q10',
    'CHINESE_READING_ONLY_20261008_Q11',
    'CHINESE_READING_ONLY_20261008_Q12',
    'CHINESE_READING_ONLY_20261008_Q13',
    'CHINESE_READING_ONLY_20261008_Q14',
    'CHINESE_READING_ONLY_20261008_Q15',
    'CHINESE_READING_ONLY_20261008_Q16',
    'CHINESE_READING_ONLY_20261008_Q17',
    'CHINESE_READING_ONLY_20261008_Q18',
    'CHINESE_READING_ONLY_20261008_Q19',
    'CHINESE_READING_ONLY_20261008_Q20',
    'CHINESE_READING_ONLY_20261008_Q21',
    'CHINESE_READING_ONLY_20261008_Q22',
    'CHINESE_READING_ONLY_20261008_Q23',
    'CHINESE_READING_ONLY_20261008_Q24',
  ],
} as const

export const chineseReadingGroups = [
  {
    title: '我爱学语文',
    alignment: {
      knowledgePointId: 'G1_PEP_CHINESE_S1_KP_04',
      lessonId: 'G1_PEP_CHINESE_S1_LESSON_04',
      unitId: 'G1_PEP_CHINESE_S1_INTRO',
      textbookId: 'G1_PEP_CHINESE_S1_2024_CANDIDATE',
      contentId: 'G1_PEP_CHINESE_S1_PERSONAL_PDF_CONTENT_04',
      sourceId: 'G1_PEP_CHINESE_S1_PERSONAL_PDF_SOURCE',
      objectives: ['能分辨听说读写四种学习活动。', '能说出一条自己想养成的语文习惯。'],
      printedPageStart: 7,
      printedPageEnd: 7,
    },
    questionIds: [
      'CHINESE_READING_ONLY_20261008_Q01',
      'CHINESE_READING_ONLY_20261008_Q02',
      'CHINESE_READING_ONLY_20261008_Q03',
    ],
  },
  {
    title: '天地人',
    alignment: {
      knowledgePointId: 'G1_PEP_CHINESE_S1_KP_05',
      lessonId: 'G1_PEP_CHINESE_S1_LESSON_05',
      unitId: 'G1_PEP_CHINESE_S1_UNIT_01',
      textbookId: 'G1_PEP_CHINESE_S1_2024_CANDIDATE',
      contentId: 'G1_PEP_CHINESE_S1_PERSONAL_PDF_CONTENT_05',
      sourceId: 'G1_PEP_CHINESE_S1_PERSONAL_PDF_SOURCE',
      objectives: ['认识天、地、人三个字。', '能把字音、字形和图景联系起来。'],
      printedPageStart: 8,
      printedPageEnd: 8,
    },
    questionIds: [
      'CHINESE_READING_ONLY_20261008_Q04',
      'CHINESE_READING_ONLY_20261008_Q05',
      'CHINESE_READING_ONLY_20261008_Q06',
    ],
  },
  {
    title: 'a o e',
    alignment: {
      knowledgePointId: 'G1_PEP_CHINESE_S1_KP_11',
      lessonId: 'G1_PEP_CHINESE_S1_LESSON_11',
      unitId: 'G1_PEP_CHINESE_S1_UNIT_02',
      textbookId: 'G1_PEP_CHINESE_S1_2024_CANDIDATE',
      contentId: 'G1_PEP_CHINESE_S1_PERSONAL_PDF_CONTENT_11',
      sourceId: 'G1_PEP_CHINESE_S1_PERSONAL_PDF_SOURCE',
      objectives: ['能认读 a、o、e。', '能听辨并读出四声变化。'],
      printedPageStart: 20,
      printedPageEnd: 21,
    },
    questionIds: [
      'CHINESE_READING_ONLY_20261008_Q07',
      'CHINESE_READING_ONLY_20261008_Q08',
      'CHINESE_READING_ONLY_20261008_Q09',
    ],
  },
  {
    title: 'i u ü',
    alignment: {
      knowledgePointId: 'G1_PEP_CHINESE_S1_KP_12',
      lessonId: 'G1_PEP_CHINESE_S1_LESSON_12',
      unitId: 'G1_PEP_CHINESE_S1_UNIT_02',
      textbookId: 'G1_PEP_CHINESE_S1_2024_CANDIDATE',
      contentId: 'G1_PEP_CHINESE_S1_PERSONAL_PDF_CONTENT_12',
      sourceId: 'G1_PEP_CHINESE_S1_PERSONAL_PDF_SOURCE',
      objectives: ['能认读 i、u、ü。', '能在四线格中观察字母位置。'],
      printedPageStart: 22,
      printedPageEnd: 23,
    },
    questionIds: [
      'CHINESE_READING_ONLY_20261008_Q10',
      'CHINESE_READING_ONLY_20261008_Q11',
      'CHINESE_READING_ONLY_20261008_Q12',
    ],
  },
  {
    title: 'b p m f',
    alignment: {
      knowledgePointId: 'G1_PEP_CHINESE_S1_KP_13',
      lessonId: 'G1_PEP_CHINESE_S1_LESSON_13',
      unitId: 'G1_PEP_CHINESE_S1_UNIT_02',
      textbookId: 'G1_PEP_CHINESE_S1_2024_CANDIDATE',
      contentId: 'G1_PEP_CHINESE_S1_PERSONAL_PDF_CONTENT_13',
      sourceId: 'G1_PEP_CHINESE_S1_PERSONAL_PDF_SOURCE',
      objectives: ['能认读 b、p、m、f。', '能分辨 b 与 p 的发音差异并尝试拼读。'],
      printedPageStart: 24,
      printedPageEnd: 25,
    },
    questionIds: [
      'CHINESE_READING_ONLY_20261008_Q13',
      'CHINESE_READING_ONLY_20261008_Q14',
      'CHINESE_READING_ONLY_20261008_Q15',
    ],
  },
  {
    title: '快乐读书吧 读读童谣和儿歌',
    alignment: {
      knowledgePointId: 'G1_PEP_CHINESE_S2_KP_06',
      lessonId: 'G1_PEP_CHINESE_S2_LESSON_06',
      unitId: 'G1_PEP_CHINESE_S2_UNIT_01',
      textbookId: 'G1_PEP_CHINESE_S2_2024_CANDIDATE',
      contentId: 'G1_PEP_CHINESE_S2_CONTENT_06',
      sourceId: 'G1_PEP_CHINESE_S2_TEXTBOOK_CONTENT',
      objectives: [
        '能正确朗读并理解《快乐读书吧：读读童谣和儿歌》的主要内容。',
        '能从课文中找出关键信息并用自己的话表达。',
      ],
    },
    questionIds: [
      'CHINESE_READING_ONLY_20261008_Q16',
      'CHINESE_READING_ONLY_20261008_Q17',
      'CHINESE_READING_ONLY_20261008_Q18',
    ],
  },
  {
    title: '快乐读书吧 读读童话故事',
    alignment: {
      knowledgePointId: 'G2_PEP_CHINESE_S1_KP_05',
      lessonId: 'G2_PEP_CHINESE_S1_LESSON_05',
      unitId: 'G2_PEP_CHINESE_S1_UNIT_01',
      textbookId: 'G2_PEP_CHINESE_S1_2024_CANDIDATE',
      contentId: 'G2_PEP_CHINESE_S1_CONTENT_05',
      sourceId: 'G2_PEP_CHINESE_S1_TEXTBOOK_CONTENT',
      objectives: [
        '能正确朗读并理解《快乐读书吧：读读童话故事》的主要内容。',
        '能从课文中找出关键信息并用自己的话表达。',
      ],
    },
    questionIds: [
      'CHINESE_READING_ONLY_20261008_Q19',
      'CHINESE_READING_ONLY_20261008_Q20',
      'CHINESE_READING_ONLY_20261008_Q21',
    ],
  },
  {
    title: '快乐读书吧 读读儿童故事',
    alignment: {
      knowledgePointId: 'G2_PEP_CHINESE_S2_KP_06',
      lessonId: 'G2_PEP_CHINESE_S2_LESSON_06',
      unitId: 'G2_PEP_CHINESE_S2_UNIT_01',
      textbookId: 'G2_PEP_CHINESE_S2_2024_CANDIDATE',
      contentId: 'G2_PEP_CHINESE_S2_CONTENT_06',
      sourceId: 'G2_PEP_CHINESE_S2_TEXTBOOK_CONTENT',
      objectives: [
        '能围绕《快乐读书吧：读读儿童故事》选择儿童故事进行阅读和分享。',
        '能说出故事中的一个人物或情节。',
      ],
    },
    questionIds: [
      'CHINESE_READING_ONLY_20261008_Q22',
      'CHINESE_READING_ONLY_20261008_Q23',
      'CHINESE_READING_ONLY_20261008_Q24',
    ],
  },
] as const

export const chineseReadingSource = {
  id: 'AI_AUTHORED_CHINESE_READING_ONLY_DRAFT_20261008',
  sourceType: 'AI_GENERATED',
  title: '八个语文知识点的原创配套练习',
  sourceVersion: '2026-10-08-v1',
  copyrightStatus: 'PENDING',
  verificationStatus: 'REVIEWED',
  notes:
    '题目与三篇阅读材料由 Codex 起草。项目所有者于 2026-10-08 确认审核通过并接入；保留原创配套内容标记，不代表教材原题或外部机构认证。',
  verifiedAt: '2026-10-08T06:55:54.863Z',
  releaseApprovalId: 'OWNER_CHINESE_READING_PRACTICE_2026_10_08',
} satisfies ContentSource

export const chineseReadingQuestions = [
  {
    id: 'CHINESE_READING_ONLY_20261008_Q01',
    questionType: 'singleChoice',
    stem: [
      {
        type: 'TEXT',
        text: '小宁认真听老师讲故事。小宁正在进行哪一种学习活动？',
      },
    ],
    answerRule: {
      ruleType: 'SINGLE_OPTION',
      correctOptionKey: 'B',
    },
    knowledgePointId: 'G1_PEP_CHINESE_S1_KP_04',
    textbookVersionId: 'G1_PEP_CHINESE_S1_2024_CANDIDATE',
    gradeId: 'GRADE_1',
    semesterId: 'SEMESTER_UPPER',
    subjectId: 'SUBJECT_CHINESE',
    difficulty: 'FOUNDATION',
    contentType: 'EXTENSION',
    sourceId: 'AI_AUTHORED_CHINESE_READING_ONLY_DRAFT_20261008',
    status: 'PUBLISHED',
    needsVerification: false,
    estimatedSeconds: 45,
    tags: ['chinese-reading-companion-release', 'original-companion-practice'],
    media: [],
    hints: [
      {
        id: 'CHINESE_READING_ONLY_20261008_Q01:hint',
        order: 1,
        trigger: 'ON_REQUEST',
        content: [
          {
            type: 'TEXT',
            text: '先想想本课学过的内容，再比较三个选项。',
          },
        ],
      },
    ],
    explanation: {
      summary: [
        {
          type: 'TEXT',
          text: '小宁在听老师讲故事，对应的学习活动是“听”。',
        },
      ],
      steps: [],
    },
    isSample: false,
    verificationStatus: 'REVIEWED',
    questionVersion: 1,
    options: [
      {
        id: 'CHINESE_READING_ONLY_20261008_Q01:option:A',
        questionId: 'CHINESE_READING_ONLY_20261008_Q01',
        optionKey: 'A',
        content: [
          {
            type: 'TEXT',
            text: '说',
          },
        ],
        sortOrder: 0,
      },
      {
        id: 'CHINESE_READING_ONLY_20261008_Q01:option:B',
        questionId: 'CHINESE_READING_ONLY_20261008_Q01',
        optionKey: 'B',
        content: [
          {
            type: 'TEXT',
            text: '听',
          },
        ],
        sortOrder: 1,
      },
      {
        id: 'CHINESE_READING_ONLY_20261008_Q01:option:C',
        questionId: 'CHINESE_READING_ONLY_20261008_Q01',
        optionKey: 'C',
        content: [
          {
            type: 'TEXT',
            text: '写',
          },
        ],
        sortOrder: 2,
      },
    ],
    releaseApprovalId: 'OWNER_CHINESE_READING_PRACTICE_2026_10_08',
  },
  {
    id: 'CHINESE_READING_ONLY_20261008_Q02',
    questionType: 'singleChoice',
    stem: [
      {
        type: 'TEXT',
        text: '小雨用笔把“人”字写在本子上。这是哪一种学习活动？',
      },
    ],
    answerRule: {
      ruleType: 'SINGLE_OPTION',
      correctOptionKey: 'A',
    },
    knowledgePointId: 'G1_PEP_CHINESE_S1_KP_04',
    textbookVersionId: 'G1_PEP_CHINESE_S1_2024_CANDIDATE',
    gradeId: 'GRADE_1',
    semesterId: 'SEMESTER_UPPER',
    subjectId: 'SUBJECT_CHINESE',
    difficulty: 'FOUNDATION',
    contentType: 'EXTENSION',
    sourceId: 'AI_AUTHORED_CHINESE_READING_ONLY_DRAFT_20261008',
    status: 'PUBLISHED',
    needsVerification: false,
    estimatedSeconds: 45,
    tags: ['chinese-reading-companion-release', 'original-companion-practice'],
    media: [],
    hints: [
      {
        id: 'CHINESE_READING_ONLY_20261008_Q02:hint',
        order: 1,
        trigger: 'ON_REQUEST',
        content: [
          {
            type: 'TEXT',
            text: '先想想本课学过的内容，再比较三个选项。',
          },
        ],
      },
    ],
    explanation: {
      summary: [
        {
          type: 'TEXT',
          text: '用笔把字写在本子上，对应“写”。',
        },
      ],
      steps: [],
    },
    isSample: false,
    verificationStatus: 'REVIEWED',
    questionVersion: 1,
    options: [
      {
        id: 'CHINESE_READING_ONLY_20261008_Q02:option:A',
        questionId: 'CHINESE_READING_ONLY_20261008_Q02',
        optionKey: 'A',
        content: [
          {
            type: 'TEXT',
            text: '写',
          },
        ],
        sortOrder: 0,
      },
      {
        id: 'CHINESE_READING_ONLY_20261008_Q02:option:B',
        questionId: 'CHINESE_READING_ONLY_20261008_Q02',
        optionKey: 'B',
        content: [
          {
            type: 'TEXT',
            text: '听',
          },
        ],
        sortOrder: 1,
      },
      {
        id: 'CHINESE_READING_ONLY_20261008_Q02:option:C',
        questionId: 'CHINESE_READING_ONLY_20261008_Q02',
        optionKey: 'C',
        content: [
          {
            type: 'TEXT',
            text: '说',
          },
        ],
        sortOrder: 2,
      },
    ],
    releaseApprovalId: 'OWNER_CHINESE_READING_PRACTICE_2026_10_08',
  },
  {
    id: 'CHINESE_READING_ONLY_20261008_Q03',
    questionType: 'singleChoice',
    stem: [
      {
        type: 'TEXT',
        text: '下面哪一组活动都属于“说”？',
      },
    ],
    answerRule: {
      ruleType: 'SINGLE_OPTION',
      correctOptionKey: 'C',
    },
    knowledgePointId: 'G1_PEP_CHINESE_S1_KP_04',
    textbookVersionId: 'G1_PEP_CHINESE_S1_2024_CANDIDATE',
    gradeId: 'GRADE_1',
    semesterId: 'SEMESTER_UPPER',
    subjectId: 'SUBJECT_CHINESE',
    difficulty: 'STANDARD',
    contentType: 'EXTENSION',
    sourceId: 'AI_AUTHORED_CHINESE_READING_ONLY_DRAFT_20261008',
    status: 'PUBLISHED',
    needsVerification: false,
    estimatedSeconds: 45,
    tags: ['chinese-reading-companion-release', 'original-companion-practice'],
    media: [],
    hints: [
      {
        id: 'CHINESE_READING_ONLY_20261008_Q03:hint',
        order: 1,
        trigger: 'ON_REQUEST',
        content: [
          {
            type: 'TEXT',
            text: '先想想本课学过的内容，再比较三个选项。',
          },
        ],
      },
    ],
    explanation: {
      summary: [
        {
          type: 'TEXT',
          text: '介绍名字和讲故事都需要用话语表达；看书、写字、听讲话分别属于其他学习活动。',
        },
      ],
      steps: [],
    },
    isSample: false,
    verificationStatus: 'REVIEWED',
    questionVersion: 1,
    options: [
      {
        id: 'CHINESE_READING_ONLY_20261008_Q03:option:A',
        questionId: 'CHINESE_READING_ONLY_20261008_Q03',
        optionKey: 'A',
        content: [
          {
            type: 'TEXT',
            text: '看图画书、在本子上写字',
          },
        ],
        sortOrder: 0,
      },
      {
        id: 'CHINESE_READING_ONLY_20261008_Q03:option:B',
        questionId: 'CHINESE_READING_ONLY_20261008_Q03',
        optionKey: 'B',
        content: [
          {
            type: 'TEXT',
            text: '听老师讲话、看书上的图画',
          },
        ],
        sortOrder: 1,
      },
      {
        id: 'CHINESE_READING_ONLY_20261008_Q03:option:C',
        questionId: 'CHINESE_READING_ONLY_20261008_Q03',
        optionKey: 'C',
        content: [
          {
            type: 'TEXT',
            text: '介绍自己的名字、给同学讲故事',
          },
        ],
        sortOrder: 2,
      },
    ],
    releaseApprovalId: 'OWNER_CHINESE_READING_PRACTICE_2026_10_08',
  },
  {
    id: 'CHINESE_READING_ONLY_20261008_Q04',
    questionType: 'singleChoice',
    stem: [
      {
        type: 'TEXT',
        text: '下面哪个字表示天空？',
      },
    ],
    answerRule: {
      ruleType: 'SINGLE_OPTION',
      correctOptionKey: 'C',
    },
    knowledgePointId: 'G1_PEP_CHINESE_S1_KP_05',
    textbookVersionId: 'G1_PEP_CHINESE_S1_2024_CANDIDATE',
    gradeId: 'GRADE_1',
    semesterId: 'SEMESTER_UPPER',
    subjectId: 'SUBJECT_CHINESE',
    difficulty: 'FOUNDATION',
    contentType: 'EXTENSION',
    sourceId: 'AI_AUTHORED_CHINESE_READING_ONLY_DRAFT_20261008',
    status: 'PUBLISHED',
    needsVerification: false,
    estimatedSeconds: 45,
    tags: ['chinese-reading-companion-release', 'original-companion-practice'],
    media: [],
    hints: [
      {
        id: 'CHINESE_READING_ONLY_20261008_Q04:hint',
        order: 1,
        trigger: 'ON_REQUEST',
        content: [
          {
            type: 'TEXT',
            text: '先想想本课学过的内容，再比较三个选项。',
          },
        ],
      },
    ],
    explanation: {
      summary: [
        {
          type: 'TEXT',
          text: '“天”可以表示天空；“地”表示地面，“人”表示人。',
        },
      ],
      steps: [],
    },
    isSample: false,
    verificationStatus: 'REVIEWED',
    questionVersion: 1,
    options: [
      {
        id: 'CHINESE_READING_ONLY_20261008_Q04:option:A',
        questionId: 'CHINESE_READING_ONLY_20261008_Q04',
        optionKey: 'A',
        content: [
          {
            type: 'TEXT',
            text: '人',
          },
        ],
        sortOrder: 0,
      },
      {
        id: 'CHINESE_READING_ONLY_20261008_Q04:option:B',
        questionId: 'CHINESE_READING_ONLY_20261008_Q04',
        optionKey: 'B',
        content: [
          {
            type: 'TEXT',
            text: '地',
          },
        ],
        sortOrder: 1,
      },
      {
        id: 'CHINESE_READING_ONLY_20261008_Q04:option:C',
        questionId: 'CHINESE_READING_ONLY_20261008_Q04',
        optionKey: 'C',
        content: [
          {
            type: 'TEXT',
            text: '天',
          },
        ],
        sortOrder: 2,
      },
    ],
    releaseApprovalId: 'OWNER_CHINESE_READING_PRACTICE_2026_10_08',
  },
  {
    id: 'CHINESE_READING_ONLY_20261008_Q05',
    questionType: 'singleChoice',
    stem: [
      {
        type: 'TEXT',
        text: '词语“土地”中的“地”指什么？',
      },
    ],
    answerRule: {
      ruleType: 'SINGLE_OPTION',
      correctOptionKey: 'B',
    },
    knowledgePointId: 'G1_PEP_CHINESE_S1_KP_05',
    textbookVersionId: 'G1_PEP_CHINESE_S1_2024_CANDIDATE',
    gradeId: 'GRADE_1',
    semesterId: 'SEMESTER_UPPER',
    subjectId: 'SUBJECT_CHINESE',
    difficulty: 'FOUNDATION',
    contentType: 'EXTENSION',
    sourceId: 'AI_AUTHORED_CHINESE_READING_ONLY_DRAFT_20261008',
    status: 'PUBLISHED',
    needsVerification: false,
    estimatedSeconds: 45,
    tags: ['chinese-reading-companion-release', 'original-companion-practice'],
    media: [],
    hints: [
      {
        id: 'CHINESE_READING_ONLY_20261008_Q05:hint',
        order: 1,
        trigger: 'ON_REQUEST',
        content: [
          {
            type: 'TEXT',
            text: '先想想本课学过的内容，再比较三个选项。',
          },
        ],
      },
    ],
    explanation: {
      summary: [
        {
          type: 'TEXT',
          text: '“土地”的“地”与地面、土地有关。',
        },
      ],
      steps: [],
    },
    isSample: false,
    verificationStatus: 'REVIEWED',
    questionVersion: 1,
    options: [
      {
        id: 'CHINESE_READING_ONLY_20261008_Q05:option:A',
        questionId: 'CHINESE_READING_ONLY_20261008_Q05',
        optionKey: 'A',
        content: [
          {
            type: 'TEXT',
            text: '天空',
          },
        ],
        sortOrder: 0,
      },
      {
        id: 'CHINESE_READING_ONLY_20261008_Q05:option:B',
        questionId: 'CHINESE_READING_ONLY_20261008_Q05',
        optionKey: 'B',
        content: [
          {
            type: 'TEXT',
            text: '地面、土地',
          },
        ],
        sortOrder: 1,
      },
      {
        id: 'CHINESE_READING_ONLY_20261008_Q05:option:C',
        questionId: 'CHINESE_READING_ONLY_20261008_Q05',
        optionKey: 'C',
        content: [
          {
            type: 'TEXT',
            text: '人',
          },
        ],
        sortOrder: 2,
      },
    ],
    releaseApprovalId: 'OWNER_CHINESE_READING_PRACTICE_2026_10_08',
  },
  {
    id: 'CHINESE_READING_ONLY_20261008_Q06',
    questionType: 'singleChoice',
    stem: [
      {
        type: 'TEXT',
        text: '白云飘在天上，小草长在地上，小朋友在路上走。句子中的“小朋友”对应哪个字？',
      },
    ],
    answerRule: {
      ruleType: 'SINGLE_OPTION',
      correctOptionKey: 'A',
    },
    knowledgePointId: 'G1_PEP_CHINESE_S1_KP_05',
    textbookVersionId: 'G1_PEP_CHINESE_S1_2024_CANDIDATE',
    gradeId: 'GRADE_1',
    semesterId: 'SEMESTER_UPPER',
    subjectId: 'SUBJECT_CHINESE',
    difficulty: 'STANDARD',
    contentType: 'EXTENSION',
    sourceId: 'AI_AUTHORED_CHINESE_READING_ONLY_DRAFT_20261008',
    status: 'PUBLISHED',
    needsVerification: false,
    estimatedSeconds: 45,
    tags: ['chinese-reading-companion-release', 'original-companion-practice'],
    media: [],
    hints: [
      {
        id: 'CHINESE_READING_ONLY_20261008_Q06:hint',
        order: 1,
        trigger: 'ON_REQUEST',
        content: [
          {
            type: 'TEXT',
            text: '先想想本课学过的内容，再比较三个选项。',
          },
        ],
      },
    ],
    explanation: {
      summary: [
        {
          type: 'TEXT',
          text: '小朋友是人；白云所在的天空对应“天”，小草所在的地面对应“地”。',
        },
      ],
      steps: [],
    },
    isSample: false,
    verificationStatus: 'REVIEWED',
    questionVersion: 1,
    options: [
      {
        id: 'CHINESE_READING_ONLY_20261008_Q06:option:A',
        questionId: 'CHINESE_READING_ONLY_20261008_Q06',
        optionKey: 'A',
        content: [
          {
            type: 'TEXT',
            text: '人',
          },
        ],
        sortOrder: 0,
      },
      {
        id: 'CHINESE_READING_ONLY_20261008_Q06:option:B',
        questionId: 'CHINESE_READING_ONLY_20261008_Q06',
        optionKey: 'B',
        content: [
          {
            type: 'TEXT',
            text: '天',
          },
        ],
        sortOrder: 1,
      },
      {
        id: 'CHINESE_READING_ONLY_20261008_Q06:option:C',
        questionId: 'CHINESE_READING_ONLY_20261008_Q06',
        optionKey: 'C',
        content: [
          {
            type: 'TEXT',
            text: '地',
          },
        ],
        sortOrder: 2,
      },
    ],
    releaseApprovalId: 'OWNER_CHINESE_READING_PRACTICE_2026_10_08',
  },
  {
    id: 'CHINESE_READING_ONLY_20261008_Q07',
    questionType: 'singleChoice',
    stem: [
      {
        type: 'TEXT',
        text: '下面哪一组全是本课学习的单韵母？',
      },
    ],
    answerRule: {
      ruleType: 'SINGLE_OPTION',
      correctOptionKey: 'A',
    },
    knowledgePointId: 'G1_PEP_CHINESE_S1_KP_11',
    textbookVersionId: 'G1_PEP_CHINESE_S1_2024_CANDIDATE',
    gradeId: 'GRADE_1',
    semesterId: 'SEMESTER_UPPER',
    subjectId: 'SUBJECT_CHINESE',
    difficulty: 'FOUNDATION',
    contentType: 'EXTENSION',
    sourceId: 'AI_AUTHORED_CHINESE_READING_ONLY_DRAFT_20261008',
    status: 'PUBLISHED',
    needsVerification: false,
    estimatedSeconds: 45,
    tags: ['chinese-reading-companion-release', 'original-companion-practice'],
    media: [],
    hints: [
      {
        id: 'CHINESE_READING_ONLY_20261008_Q07:hint',
        order: 1,
        trigger: 'ON_REQUEST',
        content: [
          {
            type: 'TEXT',
            text: '先想想本课学过的内容，再比较三个选项。',
          },
        ],
      },
    ],
    explanation: {
      summary: [
        {
          type: 'TEXT',
          text: 'a、o、e 是本课学习的三个单韵母；其余两组列出的是声母。',
        },
      ],
      steps: [],
    },
    isSample: false,
    verificationStatus: 'REVIEWED',
    questionVersion: 1,
    options: [
      {
        id: 'CHINESE_READING_ONLY_20261008_Q07:option:A',
        questionId: 'CHINESE_READING_ONLY_20261008_Q07',
        optionKey: 'A',
        content: [
          {
            type: 'TEXT',
            text: 'a、o、e',
          },
        ],
        sortOrder: 0,
      },
      {
        id: 'CHINESE_READING_ONLY_20261008_Q07:option:B',
        questionId: 'CHINESE_READING_ONLY_20261008_Q07',
        optionKey: 'B',
        content: [
          {
            type: 'TEXT',
            text: 'b、p、m',
          },
        ],
        sortOrder: 1,
      },
      {
        id: 'CHINESE_READING_ONLY_20261008_Q07:option:C',
        questionId: 'CHINESE_READING_ONLY_20261008_Q07',
        optionKey: 'C',
        content: [
          {
            type: 'TEXT',
            text: 'f、b、p',
          },
        ],
        sortOrder: 2,
      },
    ],
    releaseApprovalId: 'OWNER_CHINESE_READING_PRACTICE_2026_10_08',
  },
  {
    id: 'CHINESE_READING_ONLY_20261008_Q08',
    questionType: 'singleChoice',
    stem: [
      {
        type: 'TEXT',
        text: '看一看：ā、á、ǎ、à。下面哪一个是 a 的第二声？',
      },
    ],
    answerRule: {
      ruleType: 'SINGLE_OPTION',
      correctOptionKey: 'C',
    },
    knowledgePointId: 'G1_PEP_CHINESE_S1_KP_11',
    textbookVersionId: 'G1_PEP_CHINESE_S1_2024_CANDIDATE',
    gradeId: 'GRADE_1',
    semesterId: 'SEMESTER_UPPER',
    subjectId: 'SUBJECT_CHINESE',
    difficulty: 'FOUNDATION',
    contentType: 'EXTENSION',
    sourceId: 'AI_AUTHORED_CHINESE_READING_ONLY_DRAFT_20261008',
    status: 'PUBLISHED',
    needsVerification: false,
    estimatedSeconds: 45,
    tags: ['chinese-reading-companion-release', 'original-companion-practice'],
    media: [],
    hints: [
      {
        id: 'CHINESE_READING_ONLY_20261008_Q08:hint',
        order: 1,
        trigger: 'ON_REQUEST',
        content: [
          {
            type: 'TEXT',
            text: '先想想本课学过的内容，再比较三个选项。',
          },
        ],
      },
    ],
    explanation: {
      summary: [
        {
          type: 'TEXT',
          text: 'á 上方的符号表示第二声；ā 是第一声，ǎ 是第三声。',
        },
      ],
      steps: [],
    },
    isSample: false,
    verificationStatus: 'REVIEWED',
    questionVersion: 1,
    options: [
      {
        id: 'CHINESE_READING_ONLY_20261008_Q08:option:A',
        questionId: 'CHINESE_READING_ONLY_20261008_Q08',
        optionKey: 'A',
        content: [
          {
            type: 'TEXT',
            text: 'ā',
          },
        ],
        sortOrder: 0,
      },
      {
        id: 'CHINESE_READING_ONLY_20261008_Q08:option:B',
        questionId: 'CHINESE_READING_ONLY_20261008_Q08',
        optionKey: 'B',
        content: [
          {
            type: 'TEXT',
            text: 'ǎ',
          },
        ],
        sortOrder: 1,
      },
      {
        id: 'CHINESE_READING_ONLY_20261008_Q08:option:C',
        questionId: 'CHINESE_READING_ONLY_20261008_Q08',
        optionKey: 'C',
        content: [
          {
            type: 'TEXT',
            text: 'á',
          },
        ],
        sortOrder: 2,
      },
    ],
    releaseApprovalId: 'OWNER_CHINESE_READING_PRACTICE_2026_10_08',
  },
  {
    id: 'CHINESE_READING_ONLY_20261008_Q09',
    questionType: 'singleChoice',
    stem: [
      {
        type: 'TEXT',
        text: '按第一声、第二声、第三声、第四声的顺序，哪一组排列正确？',
      },
    ],
    answerRule: {
      ruleType: 'SINGLE_OPTION',
      correctOptionKey: 'B',
    },
    knowledgePointId: 'G1_PEP_CHINESE_S1_KP_11',
    textbookVersionId: 'G1_PEP_CHINESE_S1_2024_CANDIDATE',
    gradeId: 'GRADE_1',
    semesterId: 'SEMESTER_UPPER',
    subjectId: 'SUBJECT_CHINESE',
    difficulty: 'STANDARD',
    contentType: 'EXTENSION',
    sourceId: 'AI_AUTHORED_CHINESE_READING_ONLY_DRAFT_20261008',
    status: 'PUBLISHED',
    needsVerification: false,
    estimatedSeconds: 45,
    tags: ['chinese-reading-companion-release', 'original-companion-practice'],
    media: [],
    hints: [
      {
        id: 'CHINESE_READING_ONLY_20261008_Q09:hint',
        order: 1,
        trigger: 'ON_REQUEST',
        content: [
          {
            type: 'TEXT',
            text: '先想想本课学过的内容，再比较三个选项。',
          },
        ],
      },
    ],
    explanation: {
      summary: [
        {
          type: 'TEXT',
          text: 'a 的四声依次写作 ā、á、ǎ、à。',
        },
      ],
      steps: [],
    },
    isSample: false,
    verificationStatus: 'REVIEWED',
    questionVersion: 1,
    options: [
      {
        id: 'CHINESE_READING_ONLY_20261008_Q09:option:A',
        questionId: 'CHINESE_READING_ONLY_20261008_Q09',
        optionKey: 'A',
        content: [
          {
            type: 'TEXT',
            text: 'á、ā、à、ǎ',
          },
        ],
        sortOrder: 0,
      },
      {
        id: 'CHINESE_READING_ONLY_20261008_Q09:option:B',
        questionId: 'CHINESE_READING_ONLY_20261008_Q09',
        optionKey: 'B',
        content: [
          {
            type: 'TEXT',
            text: 'ā、á、ǎ、à',
          },
        ],
        sortOrder: 1,
      },
      {
        id: 'CHINESE_READING_ONLY_20261008_Q09:option:C',
        questionId: 'CHINESE_READING_ONLY_20261008_Q09',
        optionKey: 'C',
        content: [
          {
            type: 'TEXT',
            text: 'à、ǎ、á、ā',
          },
        ],
        sortOrder: 2,
      },
    ],
    releaseApprovalId: 'OWNER_CHINESE_READING_PRACTICE_2026_10_08',
  },
  {
    id: 'CHINESE_READING_ONLY_20261008_Q10',
    questionType: 'singleChoice',
    stem: [
      {
        type: 'TEXT',
        text: '下面哪个字母的上面有两个点？',
      },
    ],
    answerRule: {
      ruleType: 'SINGLE_OPTION',
      correctOptionKey: 'B',
    },
    knowledgePointId: 'G1_PEP_CHINESE_S1_KP_12',
    textbookVersionId: 'G1_PEP_CHINESE_S1_2024_CANDIDATE',
    gradeId: 'GRADE_1',
    semesterId: 'SEMESTER_UPPER',
    subjectId: 'SUBJECT_CHINESE',
    difficulty: 'FOUNDATION',
    contentType: 'EXTENSION',
    sourceId: 'AI_AUTHORED_CHINESE_READING_ONLY_DRAFT_20261008',
    status: 'PUBLISHED',
    needsVerification: false,
    estimatedSeconds: 45,
    tags: ['chinese-reading-companion-release', 'original-companion-practice'],
    media: [],
    hints: [
      {
        id: 'CHINESE_READING_ONLY_20261008_Q10:hint',
        order: 1,
        trigger: 'ON_REQUEST',
        content: [
          {
            type: 'TEXT',
            text: '先想想本课学过的内容，再比较三个选项。',
          },
        ],
      },
    ],
    explanation: {
      summary: [
        {
          type: 'TEXT',
          text: 'ü 的上面有两个点，i 的上面有一个点，u 的上面没有点。',
        },
      ],
      steps: [],
    },
    isSample: false,
    verificationStatus: 'REVIEWED',
    questionVersion: 1,
    options: [
      {
        id: 'CHINESE_READING_ONLY_20261008_Q10:option:A',
        questionId: 'CHINESE_READING_ONLY_20261008_Q10',
        optionKey: 'A',
        content: [
          {
            type: 'TEXT',
            text: 'u',
          },
        ],
        sortOrder: 0,
      },
      {
        id: 'CHINESE_READING_ONLY_20261008_Q10:option:B',
        questionId: 'CHINESE_READING_ONLY_20261008_Q10',
        optionKey: 'B',
        content: [
          {
            type: 'TEXT',
            text: 'ü',
          },
        ],
        sortOrder: 1,
      },
      {
        id: 'CHINESE_READING_ONLY_20261008_Q10:option:C',
        questionId: 'CHINESE_READING_ONLY_20261008_Q10',
        optionKey: 'C',
        content: [
          {
            type: 'TEXT',
            text: 'i',
          },
        ],
        sortOrder: 2,
      },
    ],
    releaseApprovalId: 'OWNER_CHINESE_READING_PRACTICE_2026_10_08',
  },
  {
    id: 'CHINESE_READING_ONLY_20261008_Q11',
    questionType: 'singleChoice',
    stem: [
      {
        type: 'TEXT',
        text: '给 i 标上第四声，哪一种写法正确？',
      },
    ],
    answerRule: {
      ruleType: 'SINGLE_OPTION',
      correctOptionKey: 'C',
    },
    knowledgePointId: 'G1_PEP_CHINESE_S1_KP_12',
    textbookVersionId: 'G1_PEP_CHINESE_S1_2024_CANDIDATE',
    gradeId: 'GRADE_1',
    semesterId: 'SEMESTER_UPPER',
    subjectId: 'SUBJECT_CHINESE',
    difficulty: 'FOUNDATION',
    contentType: 'EXTENSION',
    sourceId: 'AI_AUTHORED_CHINESE_READING_ONLY_DRAFT_20261008',
    status: 'PUBLISHED',
    needsVerification: false,
    estimatedSeconds: 45,
    tags: ['chinese-reading-companion-release', 'original-companion-practice'],
    media: [],
    hints: [
      {
        id: 'CHINESE_READING_ONLY_20261008_Q11:hint',
        order: 1,
        trigger: 'ON_REQUEST',
        content: [
          {
            type: 'TEXT',
            text: '先想想本课学过的内容，再比较三个选项。',
          },
        ],
      },
    ],
    explanation: {
      summary: [
        {
          type: 'TEXT',
          text: 'i 的第四声写作 ì；标调时 i 上原有的点省去。',
        },
      ],
      steps: [],
    },
    isSample: false,
    verificationStatus: 'REVIEWED',
    questionVersion: 1,
    options: [
      {
        id: 'CHINESE_READING_ONLY_20261008_Q11:option:A',
        questionId: 'CHINESE_READING_ONLY_20261008_Q11',
        optionKey: 'A',
        content: [
          {
            type: 'TEXT',
            text: 'í',
          },
        ],
        sortOrder: 0,
      },
      {
        id: 'CHINESE_READING_ONLY_20261008_Q11:option:B',
        questionId: 'CHINESE_READING_ONLY_20261008_Q11',
        optionKey: 'B',
        content: [
          {
            type: 'TEXT',
            text: 'ī',
          },
        ],
        sortOrder: 1,
      },
      {
        id: 'CHINESE_READING_ONLY_20261008_Q11:option:C',
        questionId: 'CHINESE_READING_ONLY_20261008_Q11',
        optionKey: 'C',
        content: [
          {
            type: 'TEXT',
            text: 'ì',
          },
        ],
        sortOrder: 2,
      },
    ],
    releaseApprovalId: 'OWNER_CHINESE_READING_PRACTICE_2026_10_08',
  },
  {
    id: 'CHINESE_READING_ONLY_20261008_Q12',
    questionType: 'singleChoice',
    stem: [
      {
        type: 'TEXT',
        text: '哪一组按 i、u、ü 的顺序写出了它们的第二声？',
      },
    ],
    answerRule: {
      ruleType: 'SINGLE_OPTION',
      correctOptionKey: 'A',
    },
    knowledgePointId: 'G1_PEP_CHINESE_S1_KP_12',
    textbookVersionId: 'G1_PEP_CHINESE_S1_2024_CANDIDATE',
    gradeId: 'GRADE_1',
    semesterId: 'SEMESTER_UPPER',
    subjectId: 'SUBJECT_CHINESE',
    difficulty: 'STANDARD',
    contentType: 'EXTENSION',
    sourceId: 'AI_AUTHORED_CHINESE_READING_ONLY_DRAFT_20261008',
    status: 'PUBLISHED',
    needsVerification: false,
    estimatedSeconds: 45,
    tags: ['chinese-reading-companion-release', 'original-companion-practice'],
    media: [],
    hints: [
      {
        id: 'CHINESE_READING_ONLY_20261008_Q12:hint',
        order: 1,
        trigger: 'ON_REQUEST',
        content: [
          {
            type: 'TEXT',
            text: '先想想本课学过的内容，再比较三个选项。',
          },
        ],
      },
    ],
    explanation: {
      summary: [
        {
          type: 'TEXT',
          text: 'i、u、ü 的第二声依次写作 í、ú、ǘ。ü 标调后仍保留两个点。',
        },
      ],
      steps: [],
    },
    isSample: false,
    verificationStatus: 'REVIEWED',
    questionVersion: 1,
    options: [
      {
        id: 'CHINESE_READING_ONLY_20261008_Q12:option:A',
        questionId: 'CHINESE_READING_ONLY_20261008_Q12',
        optionKey: 'A',
        content: [
          {
            type: 'TEXT',
            text: 'í、ú、ǘ',
          },
        ],
        sortOrder: 0,
      },
      {
        id: 'CHINESE_READING_ONLY_20261008_Q12:option:B',
        questionId: 'CHINESE_READING_ONLY_20261008_Q12',
        optionKey: 'B',
        content: [
          {
            type: 'TEXT',
            text: 'í、ǘ、ú',
          },
        ],
        sortOrder: 1,
      },
      {
        id: 'CHINESE_READING_ONLY_20261008_Q12:option:C',
        questionId: 'CHINESE_READING_ONLY_20261008_Q12',
        optionKey: 'C',
        content: [
          {
            type: 'TEXT',
            text: 'ì、ù、ǜ',
          },
        ],
        sortOrder: 2,
      },
    ],
    releaseApprovalId: 'OWNER_CHINESE_READING_PRACTICE_2026_10_08',
  },
  {
    id: 'CHINESE_READING_ONLY_20261008_Q13',
    questionType: 'singleChoice',
    stem: [
      {
        type: 'TEXT',
        text: '下面哪一组是本课学习的四个声母？',
      },
    ],
    answerRule: {
      ruleType: 'SINGLE_OPTION',
      correctOptionKey: 'C',
    },
    knowledgePointId: 'G1_PEP_CHINESE_S1_KP_13',
    textbookVersionId: 'G1_PEP_CHINESE_S1_2024_CANDIDATE',
    gradeId: 'GRADE_1',
    semesterId: 'SEMESTER_UPPER',
    subjectId: 'SUBJECT_CHINESE',
    difficulty: 'FOUNDATION',
    contentType: 'EXTENSION',
    sourceId: 'AI_AUTHORED_CHINESE_READING_ONLY_DRAFT_20261008',
    status: 'PUBLISHED',
    needsVerification: false,
    estimatedSeconds: 45,
    tags: ['chinese-reading-companion-release', 'original-companion-practice'],
    media: [],
    hints: [
      {
        id: 'CHINESE_READING_ONLY_20261008_Q13:hint',
        order: 1,
        trigger: 'ON_REQUEST',
        content: [
          {
            type: 'TEXT',
            text: '先想想本课学过的内容，再比较三个选项。',
          },
        ],
      },
    ],
    explanation: {
      summary: [
        {
          type: 'TEXT',
          text: '本课学习 b、p、m、f 四个声母；另外两组列出的是单韵母。',
        },
      ],
      steps: [],
    },
    isSample: false,
    verificationStatus: 'REVIEWED',
    questionVersion: 1,
    options: [
      {
        id: 'CHINESE_READING_ONLY_20261008_Q13:option:A',
        questionId: 'CHINESE_READING_ONLY_20261008_Q13',
        optionKey: 'A',
        content: [
          {
            type: 'TEXT',
            text: 'a、o、e、i',
          },
        ],
        sortOrder: 0,
      },
      {
        id: 'CHINESE_READING_ONLY_20261008_Q13:option:B',
        questionId: 'CHINESE_READING_ONLY_20261008_Q13',
        optionKey: 'B',
        content: [
          {
            type: 'TEXT',
            text: 'i、u、ü、a',
          },
        ],
        sortOrder: 1,
      },
      {
        id: 'CHINESE_READING_ONLY_20261008_Q13:option:C',
        questionId: 'CHINESE_READING_ONLY_20261008_Q13',
        optionKey: 'C',
        content: [
          {
            type: 'TEXT',
            text: 'b、p、m、f',
          },
        ],
        sortOrder: 2,
      },
    ],
    releaseApprovalId: 'OWNER_CHINESE_READING_PRACTICE_2026_10_08',
  },
  {
    id: 'CHINESE_READING_ONLY_20261008_Q14',
    questionType: 'singleChoice',
    stem: [
      {
        type: 'TEXT',
        text: '音节 bá 的声母是哪一个？',
      },
    ],
    answerRule: {
      ruleType: 'SINGLE_OPTION',
      correctOptionKey: 'A',
    },
    knowledgePointId: 'G1_PEP_CHINESE_S1_KP_13',
    textbookVersionId: 'G1_PEP_CHINESE_S1_2024_CANDIDATE',
    gradeId: 'GRADE_1',
    semesterId: 'SEMESTER_UPPER',
    subjectId: 'SUBJECT_CHINESE',
    difficulty: 'FOUNDATION',
    contentType: 'EXTENSION',
    sourceId: 'AI_AUTHORED_CHINESE_READING_ONLY_DRAFT_20261008',
    status: 'PUBLISHED',
    needsVerification: false,
    estimatedSeconds: 45,
    tags: ['chinese-reading-companion-release', 'original-companion-practice'],
    media: [],
    hints: [
      {
        id: 'CHINESE_READING_ONLY_20261008_Q14:hint',
        order: 1,
        trigger: 'ON_REQUEST',
        content: [
          {
            type: 'TEXT',
            text: '先想想本课学过的内容，再比较三个选项。',
          },
        ],
      },
    ],
    explanation: {
      summary: [
        {
          type: 'TEXT',
          text: 'bá 的声母是 b，后面的 á 是带第二声的韵母。',
        },
      ],
      steps: [],
    },
    isSample: false,
    verificationStatus: 'REVIEWED',
    questionVersion: 1,
    options: [
      {
        id: 'CHINESE_READING_ONLY_20261008_Q14:option:A',
        questionId: 'CHINESE_READING_ONLY_20261008_Q14',
        optionKey: 'A',
        content: [
          {
            type: 'TEXT',
            text: 'b',
          },
        ],
        sortOrder: 0,
      },
      {
        id: 'CHINESE_READING_ONLY_20261008_Q14:option:B',
        questionId: 'CHINESE_READING_ONLY_20261008_Q14',
        optionKey: 'B',
        content: [
          {
            type: 'TEXT',
            text: 'a',
          },
        ],
        sortOrder: 1,
      },
      {
        id: 'CHINESE_READING_ONLY_20261008_Q14:option:C',
        questionId: 'CHINESE_READING_ONLY_20261008_Q14',
        optionKey: 'C',
        content: [
          {
            type: 'TEXT',
            text: 'p',
          },
        ],
        sortOrder: 2,
      },
    ],
    releaseApprovalId: 'OWNER_CHINESE_READING_PRACTICE_2026_10_08',
  },
  {
    id: 'CHINESE_READING_ONLY_20261008_Q15',
    questionType: 'singleChoice',
    stem: [
      {
        type: 'TEXT',
        text: '声母 p 和韵母 a 组成两拼音节，按“声母在前，韵母在后”写出来，应是哪一个？',
      },
    ],
    answerRule: {
      ruleType: 'SINGLE_OPTION',
      correctOptionKey: 'B',
    },
    knowledgePointId: 'G1_PEP_CHINESE_S1_KP_13',
    textbookVersionId: 'G1_PEP_CHINESE_S1_2024_CANDIDATE',
    gradeId: 'GRADE_1',
    semesterId: 'SEMESTER_UPPER',
    subjectId: 'SUBJECT_CHINESE',
    difficulty: 'STANDARD',
    contentType: 'EXTENSION',
    sourceId: 'AI_AUTHORED_CHINESE_READING_ONLY_DRAFT_20261008',
    status: 'PUBLISHED',
    needsVerification: false,
    estimatedSeconds: 45,
    tags: ['chinese-reading-companion-release', 'original-companion-practice'],
    media: [],
    hints: [
      {
        id: 'CHINESE_READING_ONLY_20261008_Q15:hint',
        order: 1,
        trigger: 'ON_REQUEST',
        content: [
          {
            type: 'TEXT',
            text: '先想想本课学过的内容，再比较三个选项。',
          },
        ],
      },
    ],
    explanation: {
      summary: [
        {
          type: 'TEXT',
          text: '把声母 p 放在前面、韵母 a 放在后面，得到 pa；ba 的声母是 b。',
        },
      ],
      steps: [],
    },
    isSample: false,
    verificationStatus: 'REVIEWED',
    questionVersion: 1,
    options: [
      {
        id: 'CHINESE_READING_ONLY_20261008_Q15:option:A',
        questionId: 'CHINESE_READING_ONLY_20261008_Q15',
        optionKey: 'A',
        content: [
          {
            type: 'TEXT',
            text: 'ap',
          },
        ],
        sortOrder: 0,
      },
      {
        id: 'CHINESE_READING_ONLY_20261008_Q15:option:B',
        questionId: 'CHINESE_READING_ONLY_20261008_Q15',
        optionKey: 'B',
        content: [
          {
            type: 'TEXT',
            text: 'pa',
          },
        ],
        sortOrder: 1,
      },
      {
        id: 'CHINESE_READING_ONLY_20261008_Q15:option:C',
        questionId: 'CHINESE_READING_ONLY_20261008_Q15',
        optionKey: 'C',
        content: [
          {
            type: 'TEXT',
            text: 'ba',
          },
        ],
        sortOrder: 2,
      },
    ],
    releaseApprovalId: 'OWNER_CHINESE_READING_PRACTICE_2026_10_08',
  },
  {
    id: 'CHINESE_READING_ONLY_20261008_Q16',
    questionType: 'singleChoice',
    stem: [
      {
        type: 'TEXT',
        text: '原创阅读材料《读儿歌》\n翻开书本看一看，\n儿歌一句念两遍。\n合上书本轻轻放，\n明天还来读一遍。',
      },
      {
        type: 'TEXT',
        text: '根据这首儿歌，小朋友在念什么？',
      },
    ],
    answerRule: {
      ruleType: 'SINGLE_OPTION',
      correctOptionKey: 'A',
    },
    knowledgePointId: 'G1_PEP_CHINESE_S2_KP_06',
    textbookVersionId: 'G1_PEP_CHINESE_S2_2024_CANDIDATE',
    gradeId: 'GRADE_1',
    semesterId: 'SEMESTER_LOWER',
    subjectId: 'SUBJECT_CHINESE',
    difficulty: 'FOUNDATION',
    contentType: 'EXTENSION',
    sourceId: 'AI_AUTHORED_CHINESE_READING_ONLY_DRAFT_20261008',
    status: 'PUBLISHED',
    needsVerification: false,
    estimatedSeconds: 60,
    tags: ['chinese-reading-companion-release', 'original-companion-practice'],
    media: [],
    hints: [
      {
        id: 'CHINESE_READING_ONLY_20261008_Q16:hint',
        order: 1,
        trigger: 'ON_REQUEST',
        content: [
          {
            type: 'TEXT',
            text: '先找材料中的依据，再选择。',
          },
        ],
      },
    ],
    explanation: {
      summary: [
        {
          type: 'TEXT',
          text: '材料第二句写着“儿歌一句念两遍”，所以念的是儿歌。',
        },
      ],
      steps: [],
    },
    isSample: false,
    verificationStatus: 'REVIEWED',
    questionVersion: 1,
    options: [
      {
        id: 'CHINESE_READING_ONLY_20261008_Q16:option:A',
        questionId: 'CHINESE_READING_ONLY_20261008_Q16',
        optionKey: 'A',
        content: [
          {
            type: 'TEXT',
            text: '儿歌',
          },
        ],
        sortOrder: 0,
      },
      {
        id: 'CHINESE_READING_ONLY_20261008_Q16:option:B',
        questionId: 'CHINESE_READING_ONLY_20261008_Q16',
        optionKey: 'B',
        content: [
          {
            type: 'TEXT',
            text: '新闻',
          },
        ],
        sortOrder: 1,
      },
      {
        id: 'CHINESE_READING_ONLY_20261008_Q16:option:C',
        questionId: 'CHINESE_READING_ONLY_20261008_Q16',
        optionKey: 'C',
        content: [
          {
            type: 'TEXT',
            text: '说明书',
          },
        ],
        sortOrder: 2,
      },
    ],
    releaseApprovalId: 'OWNER_CHINESE_READING_PRACTICE_2026_10_08',
  },
  {
    id: 'CHINESE_READING_ONLY_20261008_Q17',
    questionType: 'singleChoice',
    stem: [
      {
        type: 'TEXT',
        text: '原创阅读材料《读儿歌》\n翻开书本看一看，\n儿歌一句念两遍。\n合上书本轻轻放，\n明天还来读一遍。',
      },
      {
        type: 'TEXT',
        text: '“儿歌一句念两遍”中的“两遍”表示什么？',
      },
    ],
    answerRule: {
      ruleType: 'SINGLE_OPTION',
      correctOptionKey: 'B',
    },
    knowledgePointId: 'G1_PEP_CHINESE_S2_KP_06',
    textbookVersionId: 'G1_PEP_CHINESE_S2_2024_CANDIDATE',
    gradeId: 'GRADE_1',
    semesterId: 'SEMESTER_LOWER',
    subjectId: 'SUBJECT_CHINESE',
    difficulty: 'STANDARD',
    contentType: 'EXTENSION',
    sourceId: 'AI_AUTHORED_CHINESE_READING_ONLY_DRAFT_20261008',
    status: 'PUBLISHED',
    needsVerification: false,
    estimatedSeconds: 60,
    tags: ['chinese-reading-companion-release', 'original-companion-practice'],
    media: [],
    hints: [
      {
        id: 'CHINESE_READING_ONLY_20261008_Q17:hint',
        order: 1,
        trigger: 'ON_REQUEST',
        content: [
          {
            type: 'TEXT',
            text: '先找材料中的依据，再选择。',
          },
        ],
      },
    ],
    explanation: {
      summary: [
        {
          type: 'TEXT',
          text: '“两遍”就是两次；喜欢的一句可以反复读。',
        },
      ],
      steps: [],
    },
    isSample: false,
    verificationStatus: 'REVIEWED',
    questionVersion: 1,
    options: [
      {
        id: 'CHINESE_READING_ONLY_20261008_Q17:option:A',
        questionId: 'CHINESE_READING_ONLY_20261008_Q17',
        optionKey: 'A',
        content: [
          {
            type: 'TEXT',
            text: '读一次',
          },
        ],
        sortOrder: 0,
      },
      {
        id: 'CHINESE_READING_ONLY_20261008_Q17:option:B',
        questionId: 'CHINESE_READING_ONLY_20261008_Q17',
        optionKey: 'B',
        content: [
          {
            type: 'TEXT',
            text: '读两次',
          },
        ],
        sortOrder: 1,
      },
      {
        id: 'CHINESE_READING_ONLY_20261008_Q17:option:C',
        questionId: 'CHINESE_READING_ONLY_20261008_Q17',
        optionKey: 'C',
        content: [
          {
            type: 'TEXT',
            text: '不读',
          },
        ],
        sortOrder: 2,
      },
    ],
    releaseApprovalId: 'OWNER_CHINESE_READING_PRACTICE_2026_10_08',
  },
  {
    id: 'CHINESE_READING_ONLY_20261008_Q18',
    questionType: 'singleChoice',
    stem: [
      {
        type: 'TEXT',
        text: '原创阅读材料《读儿歌》\n翻开书本看一看，\n儿歌一句念两遍。\n合上书本轻轻放，\n明天还来读一遍。',
      },
      {
        type: 'TEXT',
        text: '根据儿歌，下面哪一组顺序正确？',
      },
    ],
    answerRule: {
      ruleType: 'SINGLE_OPTION',
      correctOptionKey: 'C',
    },
    knowledgePointId: 'G1_PEP_CHINESE_S2_KP_06',
    textbookVersionId: 'G1_PEP_CHINESE_S2_2024_CANDIDATE',
    gradeId: 'GRADE_1',
    semesterId: 'SEMESTER_LOWER',
    subjectId: 'SUBJECT_CHINESE',
    difficulty: 'STANDARD',
    contentType: 'EXTENSION',
    sourceId: 'AI_AUTHORED_CHINESE_READING_ONLY_DRAFT_20261008',
    status: 'PUBLISHED',
    needsVerification: false,
    estimatedSeconds: 60,
    tags: ['chinese-reading-companion-release', 'original-companion-practice'],
    media: [],
    hints: [
      {
        id: 'CHINESE_READING_ONLY_20261008_Q18:hint',
        order: 1,
        trigger: 'ON_REQUEST',
        content: [
          {
            type: 'TEXT',
            text: '先找材料中的依据，再选择。',
          },
        ],
      },
    ],
    explanation: {
      summary: [
        {
          type: 'TEXT',
          text: '儿歌先写翻开书本，再写念儿歌，最后写合上书本。按材料的先后顺序排列即可。',
        },
      ],
      steps: [],
    },
    isSample: false,
    verificationStatus: 'REVIEWED',
    questionVersion: 1,
    options: [
      {
        id: 'CHINESE_READING_ONLY_20261008_Q18:option:A',
        questionId: 'CHINESE_READING_ONLY_20261008_Q18',
        optionKey: 'A',
        content: [
          {
            type: 'TEXT',
            text: '合上书本 → 念儿歌 → 翻开书本',
          },
        ],
        sortOrder: 0,
      },
      {
        id: 'CHINESE_READING_ONLY_20261008_Q18:option:B',
        questionId: 'CHINESE_READING_ONLY_20261008_Q18',
        optionKey: 'B',
        content: [
          {
            type: 'TEXT',
            text: '念儿歌 → 合上书本 → 翻开书本',
          },
        ],
        sortOrder: 1,
      },
      {
        id: 'CHINESE_READING_ONLY_20261008_Q18:option:C',
        questionId: 'CHINESE_READING_ONLY_20261008_Q18',
        optionKey: 'C',
        content: [
          {
            type: 'TEXT',
            text: '翻开书本 → 念儿歌 → 合上书本',
          },
        ],
        sortOrder: 2,
      },
    ],
    releaseApprovalId: 'OWNER_CHINESE_READING_PRACTICE_2026_10_08',
  },
  {
    id: 'CHINESE_READING_ONLY_20261008_Q19',
    questionType: 'singleChoice',
    stem: [
      {
        type: 'TEXT',
        text: '原创阅读材料《会说话的小树》\n森林里有一棵会说话的小树。小兔迷路了，急得哭起来。小树伸出枝条，指着远处说：“沿着小路往前走，就能到你家。”小兔照着小树说的路走，终于回到了家。',
      },
      {
        type: 'TEXT',
        text: '故事里的小树有什么奇妙的本领？',
      },
    ],
    answerRule: {
      ruleType: 'SINGLE_OPTION',
      correctOptionKey: 'B',
    },
    knowledgePointId: 'G2_PEP_CHINESE_S1_KP_05',
    textbookVersionId: 'G2_PEP_CHINESE_S1_2024_CANDIDATE',
    gradeId: 'GRADE_2',
    semesterId: 'SEMESTER_UPPER',
    subjectId: 'SUBJECT_CHINESE',
    difficulty: 'FOUNDATION',
    contentType: 'EXTENSION',
    sourceId: 'AI_AUTHORED_CHINESE_READING_ONLY_DRAFT_20261008',
    status: 'PUBLISHED',
    needsVerification: false,
    estimatedSeconds: 60,
    tags: ['chinese-reading-companion-release', 'original-companion-practice'],
    media: [],
    hints: [
      {
        id: 'CHINESE_READING_ONLY_20261008_Q19:hint',
        order: 1,
        trigger: 'ON_REQUEST',
        content: [
          {
            type: 'TEXT',
            text: '先找材料中的依据，再选择。',
          },
        ],
      },
    ],
    explanation: {
      summary: [
        {
          type: 'TEXT',
          text: '故事开头直接写出“有一棵会说话的小树”。会说话的小树是这篇原创童话的想象。',
        },
      ],
      steps: [],
    },
    isSample: false,
    verificationStatus: 'REVIEWED',
    questionVersion: 1,
    options: [
      {
        id: 'CHINESE_READING_ONLY_20261008_Q19:option:A',
        questionId: 'CHINESE_READING_ONLY_20261008_Q19',
        optionKey: 'A',
        content: [
          {
            type: 'TEXT',
            text: '会变成房子',
          },
        ],
        sortOrder: 0,
      },
      {
        id: 'CHINESE_READING_ONLY_20261008_Q19:option:B',
        questionId: 'CHINESE_READING_ONLY_20261008_Q19',
        optionKey: 'B',
        content: [
          {
            type: 'TEXT',
            text: '会说话',
          },
        ],
        sortOrder: 1,
      },
      {
        id: 'CHINESE_READING_ONLY_20261008_Q19:option:C',
        questionId: 'CHINESE_READING_ONLY_20261008_Q19',
        optionKey: 'C',
        content: [
          {
            type: 'TEXT',
            text: '会变出画笔',
          },
        ],
        sortOrder: 2,
      },
    ],
    releaseApprovalId: 'OWNER_CHINESE_READING_PRACTICE_2026_10_08',
  },
  {
    id: 'CHINESE_READING_ONLY_20261008_Q20',
    questionType: 'singleChoice',
    stem: [
      {
        type: 'TEXT',
        text: '原创阅读材料《会说话的小树》\n森林里有一棵会说话的小树。小兔迷路了，急得哭起来。小树伸出枝条，指着远处说：“沿着小路往前走，就能到你家。”小兔照着小树说的路走，终于回到了家。',
      },
      {
        type: 'TEXT',
        text: '小兔为什么急得哭起来？',
      },
    ],
    answerRule: {
      ruleType: 'SINGLE_OPTION',
      correctOptionKey: 'A',
    },
    knowledgePointId: 'G2_PEP_CHINESE_S1_KP_05',
    textbookVersionId: 'G2_PEP_CHINESE_S1_2024_CANDIDATE',
    gradeId: 'GRADE_2',
    semesterId: 'SEMESTER_UPPER',
    subjectId: 'SUBJECT_CHINESE',
    difficulty: 'STANDARD',
    contentType: 'EXTENSION',
    sourceId: 'AI_AUTHORED_CHINESE_READING_ONLY_DRAFT_20261008',
    status: 'PUBLISHED',
    needsVerification: false,
    estimatedSeconds: 60,
    tags: ['chinese-reading-companion-release', 'original-companion-practice'],
    media: [],
    hints: [
      {
        id: 'CHINESE_READING_ONLY_20261008_Q20:hint',
        order: 1,
        trigger: 'ON_REQUEST',
        content: [
          {
            type: 'TEXT',
            text: '先找材料中的依据，再选择。',
          },
        ],
      },
    ],
    explanation: {
      summary: [
        {
          type: 'TEXT',
          text: '材料写道“小兔迷路了，急得哭起来”，因此着急的原因是迷路。',
        },
      ],
      steps: [],
    },
    isSample: false,
    verificationStatus: 'REVIEWED',
    questionVersion: 1,
    options: [
      {
        id: 'CHINESE_READING_ONLY_20261008_Q20:option:A',
        questionId: 'CHINESE_READING_ONLY_20261008_Q20',
        optionKey: 'A',
        content: [
          {
            type: 'TEXT',
            text: '它迷路了',
          },
        ],
        sortOrder: 0,
      },
      {
        id: 'CHINESE_READING_ONLY_20261008_Q20:option:B',
        questionId: 'CHINESE_READING_ONLY_20261008_Q20',
        optionKey: 'B',
        content: [
          {
            type: 'TEXT',
            text: '它的画笔丢了',
          },
        ],
        sortOrder: 1,
      },
      {
        id: 'CHINESE_READING_ONLY_20261008_Q20:option:C',
        questionId: 'CHINESE_READING_ONLY_20261008_Q20',
        optionKey: 'C',
        content: [
          {
            type: 'TEXT',
            text: '它不想回家',
          },
        ],
        sortOrder: 2,
      },
    ],
    releaseApprovalId: 'OWNER_CHINESE_READING_PRACTICE_2026_10_08',
  },
  {
    id: 'CHINESE_READING_ONLY_20261008_Q21',
    questionType: 'singleChoice',
    stem: [
      {
        type: 'TEXT',
        text: '原创阅读材料《会说话的小树》\n森林里有一棵会说话的小树。小兔迷路了，急得哭起来。小树伸出枝条，指着远处说：“沿着小路往前走，就能到你家。”小兔照着小树说的路走，终于回到了家。',
      },
      {
        type: 'TEXT',
        text: '下面哪一组能按顺序讲清楚这个故事？',
      },
    ],
    answerRule: {
      ruleType: 'SINGLE_OPTION',
      correctOptionKey: 'C',
    },
    knowledgePointId: 'G2_PEP_CHINESE_S1_KP_05',
    textbookVersionId: 'G2_PEP_CHINESE_S1_2024_CANDIDATE',
    gradeId: 'GRADE_2',
    semesterId: 'SEMESTER_UPPER',
    subjectId: 'SUBJECT_CHINESE',
    difficulty: 'STANDARD',
    contentType: 'EXTENSION',
    sourceId: 'AI_AUTHORED_CHINESE_READING_ONLY_DRAFT_20261008',
    status: 'PUBLISHED',
    needsVerification: false,
    estimatedSeconds: 60,
    tags: ['chinese-reading-companion-release', 'original-companion-practice'],
    media: [],
    hints: [
      {
        id: 'CHINESE_READING_ONLY_20261008_Q21:hint',
        order: 1,
        trigger: 'ON_REQUEST',
        content: [
          {
            type: 'TEXT',
            text: '先找材料中的依据，再选择。',
          },
        ],
      },
    ],
    explanation: {
      summary: [
        {
          type: 'TEXT',
          text: '先发生小兔迷路，小树随后帮助指路，最后小兔照着小路回到了家。',
        },
      ],
      steps: [],
    },
    isSample: false,
    verificationStatus: 'REVIEWED',
    questionVersion: 1,
    options: [
      {
        id: 'CHINESE_READING_ONLY_20261008_Q21:option:A',
        questionId: 'CHINESE_READING_ONLY_20261008_Q21',
        optionKey: 'A',
        content: [
          {
            type: 'TEXT',
            text: '小树指路 → 小兔回家 → 小兔迷路',
          },
        ],
        sortOrder: 0,
      },
      {
        id: 'CHINESE_READING_ONLY_20261008_Q21:option:B',
        questionId: 'CHINESE_READING_ONLY_20261008_Q21',
        optionKey: 'B',
        content: [
          {
            type: 'TEXT',
            text: '小兔回家 → 小兔迷路 → 小树指路',
          },
        ],
        sortOrder: 1,
      },
      {
        id: 'CHINESE_READING_ONLY_20261008_Q21:option:C',
        questionId: 'CHINESE_READING_ONLY_20261008_Q21',
        optionKey: 'C',
        content: [
          {
            type: 'TEXT',
            text: '小兔迷路 → 小树指路 → 小兔回家',
          },
        ],
        sortOrder: 2,
      },
    ],
    releaseApprovalId: 'OWNER_CHINESE_READING_PRACTICE_2026_10_08',
  },
  {
    id: 'CHINESE_READING_ONLY_20261008_Q22',
    questionType: 'singleChoice',
    stem: [
      {
        type: 'TEXT',
        text: '原创阅读材料《借来的画笔》\n画画课上，小雨发现自己忘带蓝色画笔。她轻声问同桌小宁：“我能借一下你的蓝色画笔吗？”小宁把画笔递给她。小雨画好蓝天后，把笔还给小宁，并说：“谢谢你！”',
      },
      {
        type: 'TEXT',
        text: '小雨忘带了什么颜色的画笔？',
      },
    ],
    answerRule: {
      ruleType: 'SINGLE_OPTION',
      correctOptionKey: 'C',
    },
    knowledgePointId: 'G2_PEP_CHINESE_S2_KP_06',
    textbookVersionId: 'G2_PEP_CHINESE_S2_2024_CANDIDATE',
    gradeId: 'GRADE_2',
    semesterId: 'SEMESTER_LOWER',
    subjectId: 'SUBJECT_CHINESE',
    difficulty: 'FOUNDATION',
    contentType: 'EXTENSION',
    sourceId: 'AI_AUTHORED_CHINESE_READING_ONLY_DRAFT_20261008',
    status: 'PUBLISHED',
    needsVerification: false,
    estimatedSeconds: 60,
    tags: ['chinese-reading-companion-release', 'original-companion-practice'],
    media: [],
    hints: [
      {
        id: 'CHINESE_READING_ONLY_20261008_Q22:hint',
        order: 1,
        trigger: 'ON_REQUEST',
        content: [
          {
            type: 'TEXT',
            text: '先找材料中的依据，再选择。',
          },
        ],
      },
    ],
    explanation: {
      summary: [
        {
          type: 'TEXT',
          text: '材料第一句写着“小雨发现自己忘带蓝色画笔”。',
        },
      ],
      steps: [],
    },
    isSample: false,
    verificationStatus: 'REVIEWED',
    questionVersion: 1,
    options: [
      {
        id: 'CHINESE_READING_ONLY_20261008_Q22:option:A',
        questionId: 'CHINESE_READING_ONLY_20261008_Q22',
        optionKey: 'A',
        content: [
          {
            type: 'TEXT',
            text: '红色',
          },
        ],
        sortOrder: 0,
      },
      {
        id: 'CHINESE_READING_ONLY_20261008_Q22:option:B',
        questionId: 'CHINESE_READING_ONLY_20261008_Q22',
        optionKey: 'B',
        content: [
          {
            type: 'TEXT',
            text: '黄色',
          },
        ],
        sortOrder: 1,
      },
      {
        id: 'CHINESE_READING_ONLY_20261008_Q22:option:C',
        questionId: 'CHINESE_READING_ONLY_20261008_Q22',
        optionKey: 'C',
        content: [
          {
            type: 'TEXT',
            text: '蓝色',
          },
        ],
        sortOrder: 2,
      },
    ],
    releaseApprovalId: 'OWNER_CHINESE_READING_PRACTICE_2026_10_08',
  },
  {
    id: 'CHINESE_READING_ONLY_20261008_Q23',
    questionType: 'singleChoice',
    stem: [
      {
        type: 'TEXT',
        text: '原创阅读材料《借来的画笔》\n画画课上，小雨发现自己忘带蓝色画笔。她轻声问同桌小宁：“我能借一下你的蓝色画笔吗？”小宁把画笔递给她。小雨画好蓝天后，把笔还给小宁，并说：“谢谢你！”',
      },
      {
        type: 'TEXT',
        text: '小雨把画笔还给小宁之前，做了什么？',
      },
    ],
    answerRule: {
      ruleType: 'SINGLE_OPTION',
      correctOptionKey: 'B',
    },
    knowledgePointId: 'G2_PEP_CHINESE_S2_KP_06',
    textbookVersionId: 'G2_PEP_CHINESE_S2_2024_CANDIDATE',
    gradeId: 'GRADE_2',
    semesterId: 'SEMESTER_LOWER',
    subjectId: 'SUBJECT_CHINESE',
    difficulty: 'STANDARD',
    contentType: 'EXTENSION',
    sourceId: 'AI_AUTHORED_CHINESE_READING_ONLY_DRAFT_20261008',
    status: 'PUBLISHED',
    needsVerification: false,
    estimatedSeconds: 60,
    tags: ['chinese-reading-companion-release', 'original-companion-practice'],
    media: [],
    hints: [
      {
        id: 'CHINESE_READING_ONLY_20261008_Q23:hint',
        order: 1,
        trigger: 'ON_REQUEST',
        content: [
          {
            type: 'TEXT',
            text: '先找材料中的依据，再选择。',
          },
        ],
      },
    ],
    explanation: {
      summary: [
        {
          type: 'TEXT',
          text: '材料写道“小雨画好蓝天后，把笔还给小宁”，说明先画好蓝天，再还笔。',
        },
      ],
      steps: [],
    },
    isSample: false,
    verificationStatus: 'REVIEWED',
    questionVersion: 1,
    options: [
      {
        id: 'CHINESE_READING_ONLY_20261008_Q23:option:A',
        questionId: 'CHINESE_READING_ONLY_20261008_Q23',
        optionKey: 'A',
        content: [
          {
            type: 'TEXT',
            text: '把画笔丢在操场上',
          },
        ],
        sortOrder: 0,
      },
      {
        id: 'CHINESE_READING_ONLY_20261008_Q23:option:B',
        questionId: 'CHINESE_READING_ONLY_20261008_Q23',
        optionKey: 'B',
        content: [
          {
            type: 'TEXT',
            text: '用借来的画笔画好蓝天',
          },
        ],
        sortOrder: 1,
      },
      {
        id: 'CHINESE_READING_ONLY_20261008_Q23:option:C',
        questionId: 'CHINESE_READING_ONLY_20261008_Q23',
        optionKey: 'C',
        content: [
          {
            type: 'TEXT',
            text: '把画笔送给老师',
          },
        ],
        sortOrder: 2,
      },
    ],
    releaseApprovalId: 'OWNER_CHINESE_READING_PRACTICE_2026_10_08',
  },
  {
    id: 'CHINESE_READING_ONLY_20261008_Q24',
    questionType: 'singleChoice',
    stem: [
      {
        type: 'TEXT',
        text: '原创阅读材料《借来的画笔》\n画画课上，小雨发现自己忘带蓝色画笔。她轻声问同桌小宁：“我能借一下你的蓝色画笔吗？”小宁把画笔递给她。小雨画好蓝天后，把笔还给小宁，并说：“谢谢你！”',
      },
      {
        type: 'TEXT',
        text: '哪一句把故事中的人物和事情说对了？',
      },
    ],
    answerRule: {
      ruleType: 'SINGLE_OPTION',
      correctOptionKey: 'A',
    },
    knowledgePointId: 'G2_PEP_CHINESE_S2_KP_06',
    textbookVersionId: 'G2_PEP_CHINESE_S2_2024_CANDIDATE',
    gradeId: 'GRADE_2',
    semesterId: 'SEMESTER_LOWER',
    subjectId: 'SUBJECT_CHINESE',
    difficulty: 'STANDARD',
    contentType: 'EXTENSION',
    sourceId: 'AI_AUTHORED_CHINESE_READING_ONLY_DRAFT_20261008',
    status: 'PUBLISHED',
    needsVerification: false,
    estimatedSeconds: 60,
    tags: ['chinese-reading-companion-release', 'original-companion-practice'],
    media: [],
    hints: [
      {
        id: 'CHINESE_READING_ONLY_20261008_Q24:hint',
        order: 1,
        trigger: 'ON_REQUEST',
        content: [
          {
            type: 'TEXT',
            text: '先找材料中的依据，再选择。',
          },
        ],
      },
    ],
    explanation: {
      summary: [
        {
          type: 'TEXT',
          text: '这句话同时说对了借笔的人、借笔的颜色和归还的经过；其余选项与材料不符。',
        },
      ],
      steps: [],
    },
    isSample: false,
    verificationStatus: 'REVIEWED',
    questionVersion: 1,
    options: [
      {
        id: 'CHINESE_READING_ONLY_20261008_Q24:option:A',
        questionId: 'CHINESE_READING_ONLY_20261008_Q24',
        optionKey: 'A',
        content: [
          {
            type: 'TEXT',
            text: '小雨向小宁借了蓝色画笔，画好蓝天后归还',
          },
        ],
        sortOrder: 0,
      },
      {
        id: 'CHINESE_READING_ONLY_20261008_Q24:option:B',
        questionId: 'CHINESE_READING_ONLY_20261008_Q24',
        optionKey: 'B',
        content: [
          {
            type: 'TEXT',
            text: '小宁忘带画笔，向小雨借了一支红色画笔',
          },
        ],
        sortOrder: 1,
      },
      {
        id: 'CHINESE_READING_ONLY_20261008_Q24:option:C',
        questionId: 'CHINESE_READING_ONLY_20261008_Q24',
        optionKey: 'C',
        content: [
          {
            type: 'TEXT',
            text: '小雨借了小宁的画笔，画好蓝天后没有归还',
          },
        ],
        sortOrder: 2,
      },
    ],
    releaseApprovalId: 'OWNER_CHINESE_READING_PRACTICE_2026_10_08',
  },
] satisfies Array<Question & { releaseApprovalId: string }>

export const chineseReadingMappings = [
  {
    id: 'mapping:CHINESE_READING_ONLY_20261008_Q01',
    questionId: 'CHINESE_READING_ONLY_20261008_Q01',
    knowledgePointId: 'G1_PEP_CHINESE_S1_KP_04',
    relationType: 'PRIMARY',
    weight: 1,
    order: 1,
    isPrimary: true,
    sourceId: 'AI_AUTHORED_CHINESE_READING_ONLY_DRAFT_20261008',
    status: 'ACTIVE',
    needsVerification: false,
    isSample: false,
    verificationStatus: 'REVIEWED',
    releaseApprovalId: 'OWNER_CHINESE_READING_PRACTICE_2026_10_08',
  },
  {
    id: 'mapping:CHINESE_READING_ONLY_20261008_Q02',
    questionId: 'CHINESE_READING_ONLY_20261008_Q02',
    knowledgePointId: 'G1_PEP_CHINESE_S1_KP_04',
    relationType: 'PRIMARY',
    weight: 1,
    order: 2,
    isPrimary: true,
    sourceId: 'AI_AUTHORED_CHINESE_READING_ONLY_DRAFT_20261008',
    status: 'ACTIVE',
    needsVerification: false,
    isSample: false,
    verificationStatus: 'REVIEWED',
    releaseApprovalId: 'OWNER_CHINESE_READING_PRACTICE_2026_10_08',
  },
  {
    id: 'mapping:CHINESE_READING_ONLY_20261008_Q03',
    questionId: 'CHINESE_READING_ONLY_20261008_Q03',
    knowledgePointId: 'G1_PEP_CHINESE_S1_KP_04',
    relationType: 'PRIMARY',
    weight: 1,
    order: 3,
    isPrimary: true,
    sourceId: 'AI_AUTHORED_CHINESE_READING_ONLY_DRAFT_20261008',
    status: 'ACTIVE',
    needsVerification: false,
    isSample: false,
    verificationStatus: 'REVIEWED',
    releaseApprovalId: 'OWNER_CHINESE_READING_PRACTICE_2026_10_08',
  },
  {
    id: 'mapping:CHINESE_READING_ONLY_20261008_Q04',
    questionId: 'CHINESE_READING_ONLY_20261008_Q04',
    knowledgePointId: 'G1_PEP_CHINESE_S1_KP_05',
    relationType: 'PRIMARY',
    weight: 1,
    order: 1,
    isPrimary: true,
    sourceId: 'AI_AUTHORED_CHINESE_READING_ONLY_DRAFT_20261008',
    status: 'ACTIVE',
    needsVerification: false,
    isSample: false,
    verificationStatus: 'REVIEWED',
    releaseApprovalId: 'OWNER_CHINESE_READING_PRACTICE_2026_10_08',
  },
  {
    id: 'mapping:CHINESE_READING_ONLY_20261008_Q05',
    questionId: 'CHINESE_READING_ONLY_20261008_Q05',
    knowledgePointId: 'G1_PEP_CHINESE_S1_KP_05',
    relationType: 'PRIMARY',
    weight: 1,
    order: 2,
    isPrimary: true,
    sourceId: 'AI_AUTHORED_CHINESE_READING_ONLY_DRAFT_20261008',
    status: 'ACTIVE',
    needsVerification: false,
    isSample: false,
    verificationStatus: 'REVIEWED',
    releaseApprovalId: 'OWNER_CHINESE_READING_PRACTICE_2026_10_08',
  },
  {
    id: 'mapping:CHINESE_READING_ONLY_20261008_Q06',
    questionId: 'CHINESE_READING_ONLY_20261008_Q06',
    knowledgePointId: 'G1_PEP_CHINESE_S1_KP_05',
    relationType: 'PRIMARY',
    weight: 1,
    order: 3,
    isPrimary: true,
    sourceId: 'AI_AUTHORED_CHINESE_READING_ONLY_DRAFT_20261008',
    status: 'ACTIVE',
    needsVerification: false,
    isSample: false,
    verificationStatus: 'REVIEWED',
    releaseApprovalId: 'OWNER_CHINESE_READING_PRACTICE_2026_10_08',
  },
  {
    id: 'mapping:CHINESE_READING_ONLY_20261008_Q07',
    questionId: 'CHINESE_READING_ONLY_20261008_Q07',
    knowledgePointId: 'G1_PEP_CHINESE_S1_KP_11',
    relationType: 'PRIMARY',
    weight: 1,
    order: 1,
    isPrimary: true,
    sourceId: 'AI_AUTHORED_CHINESE_READING_ONLY_DRAFT_20261008',
    status: 'ACTIVE',
    needsVerification: false,
    isSample: false,
    verificationStatus: 'REVIEWED',
    releaseApprovalId: 'OWNER_CHINESE_READING_PRACTICE_2026_10_08',
  },
  {
    id: 'mapping:CHINESE_READING_ONLY_20261008_Q08',
    questionId: 'CHINESE_READING_ONLY_20261008_Q08',
    knowledgePointId: 'G1_PEP_CHINESE_S1_KP_11',
    relationType: 'PRIMARY',
    weight: 1,
    order: 2,
    isPrimary: true,
    sourceId: 'AI_AUTHORED_CHINESE_READING_ONLY_DRAFT_20261008',
    status: 'ACTIVE',
    needsVerification: false,
    isSample: false,
    verificationStatus: 'REVIEWED',
    releaseApprovalId: 'OWNER_CHINESE_READING_PRACTICE_2026_10_08',
  },
  {
    id: 'mapping:CHINESE_READING_ONLY_20261008_Q09',
    questionId: 'CHINESE_READING_ONLY_20261008_Q09',
    knowledgePointId: 'G1_PEP_CHINESE_S1_KP_11',
    relationType: 'PRIMARY',
    weight: 1,
    order: 3,
    isPrimary: true,
    sourceId: 'AI_AUTHORED_CHINESE_READING_ONLY_DRAFT_20261008',
    status: 'ACTIVE',
    needsVerification: false,
    isSample: false,
    verificationStatus: 'REVIEWED',
    releaseApprovalId: 'OWNER_CHINESE_READING_PRACTICE_2026_10_08',
  },
  {
    id: 'mapping:CHINESE_READING_ONLY_20261008_Q10',
    questionId: 'CHINESE_READING_ONLY_20261008_Q10',
    knowledgePointId: 'G1_PEP_CHINESE_S1_KP_12',
    relationType: 'PRIMARY',
    weight: 1,
    order: 1,
    isPrimary: true,
    sourceId: 'AI_AUTHORED_CHINESE_READING_ONLY_DRAFT_20261008',
    status: 'ACTIVE',
    needsVerification: false,
    isSample: false,
    verificationStatus: 'REVIEWED',
    releaseApprovalId: 'OWNER_CHINESE_READING_PRACTICE_2026_10_08',
  },
  {
    id: 'mapping:CHINESE_READING_ONLY_20261008_Q11',
    questionId: 'CHINESE_READING_ONLY_20261008_Q11',
    knowledgePointId: 'G1_PEP_CHINESE_S1_KP_12',
    relationType: 'PRIMARY',
    weight: 1,
    order: 2,
    isPrimary: true,
    sourceId: 'AI_AUTHORED_CHINESE_READING_ONLY_DRAFT_20261008',
    status: 'ACTIVE',
    needsVerification: false,
    isSample: false,
    verificationStatus: 'REVIEWED',
    releaseApprovalId: 'OWNER_CHINESE_READING_PRACTICE_2026_10_08',
  },
  {
    id: 'mapping:CHINESE_READING_ONLY_20261008_Q12',
    questionId: 'CHINESE_READING_ONLY_20261008_Q12',
    knowledgePointId: 'G1_PEP_CHINESE_S1_KP_12',
    relationType: 'PRIMARY',
    weight: 1,
    order: 3,
    isPrimary: true,
    sourceId: 'AI_AUTHORED_CHINESE_READING_ONLY_DRAFT_20261008',
    status: 'ACTIVE',
    needsVerification: false,
    isSample: false,
    verificationStatus: 'REVIEWED',
    releaseApprovalId: 'OWNER_CHINESE_READING_PRACTICE_2026_10_08',
  },
  {
    id: 'mapping:CHINESE_READING_ONLY_20261008_Q13',
    questionId: 'CHINESE_READING_ONLY_20261008_Q13',
    knowledgePointId: 'G1_PEP_CHINESE_S1_KP_13',
    relationType: 'PRIMARY',
    weight: 1,
    order: 1,
    isPrimary: true,
    sourceId: 'AI_AUTHORED_CHINESE_READING_ONLY_DRAFT_20261008',
    status: 'ACTIVE',
    needsVerification: false,
    isSample: false,
    verificationStatus: 'REVIEWED',
    releaseApprovalId: 'OWNER_CHINESE_READING_PRACTICE_2026_10_08',
  },
  {
    id: 'mapping:CHINESE_READING_ONLY_20261008_Q14',
    questionId: 'CHINESE_READING_ONLY_20261008_Q14',
    knowledgePointId: 'G1_PEP_CHINESE_S1_KP_13',
    relationType: 'PRIMARY',
    weight: 1,
    order: 2,
    isPrimary: true,
    sourceId: 'AI_AUTHORED_CHINESE_READING_ONLY_DRAFT_20261008',
    status: 'ACTIVE',
    needsVerification: false,
    isSample: false,
    verificationStatus: 'REVIEWED',
    releaseApprovalId: 'OWNER_CHINESE_READING_PRACTICE_2026_10_08',
  },
  {
    id: 'mapping:CHINESE_READING_ONLY_20261008_Q15',
    questionId: 'CHINESE_READING_ONLY_20261008_Q15',
    knowledgePointId: 'G1_PEP_CHINESE_S1_KP_13',
    relationType: 'PRIMARY',
    weight: 1,
    order: 3,
    isPrimary: true,
    sourceId: 'AI_AUTHORED_CHINESE_READING_ONLY_DRAFT_20261008',
    status: 'ACTIVE',
    needsVerification: false,
    isSample: false,
    verificationStatus: 'REVIEWED',
    releaseApprovalId: 'OWNER_CHINESE_READING_PRACTICE_2026_10_08',
  },
  {
    id: 'mapping:CHINESE_READING_ONLY_20261008_Q16',
    questionId: 'CHINESE_READING_ONLY_20261008_Q16',
    knowledgePointId: 'G1_PEP_CHINESE_S2_KP_06',
    relationType: 'PRIMARY',
    weight: 1,
    order: 1,
    isPrimary: true,
    sourceId: 'AI_AUTHORED_CHINESE_READING_ONLY_DRAFT_20261008',
    status: 'ACTIVE',
    needsVerification: false,
    isSample: false,
    verificationStatus: 'REVIEWED',
    releaseApprovalId: 'OWNER_CHINESE_READING_PRACTICE_2026_10_08',
  },
  {
    id: 'mapping:CHINESE_READING_ONLY_20261008_Q17',
    questionId: 'CHINESE_READING_ONLY_20261008_Q17',
    knowledgePointId: 'G1_PEP_CHINESE_S2_KP_06',
    relationType: 'PRIMARY',
    weight: 1,
    order: 2,
    isPrimary: true,
    sourceId: 'AI_AUTHORED_CHINESE_READING_ONLY_DRAFT_20261008',
    status: 'ACTIVE',
    needsVerification: false,
    isSample: false,
    verificationStatus: 'REVIEWED',
    releaseApprovalId: 'OWNER_CHINESE_READING_PRACTICE_2026_10_08',
  },
  {
    id: 'mapping:CHINESE_READING_ONLY_20261008_Q18',
    questionId: 'CHINESE_READING_ONLY_20261008_Q18',
    knowledgePointId: 'G1_PEP_CHINESE_S2_KP_06',
    relationType: 'PRIMARY',
    weight: 1,
    order: 3,
    isPrimary: true,
    sourceId: 'AI_AUTHORED_CHINESE_READING_ONLY_DRAFT_20261008',
    status: 'ACTIVE',
    needsVerification: false,
    isSample: false,
    verificationStatus: 'REVIEWED',
    releaseApprovalId: 'OWNER_CHINESE_READING_PRACTICE_2026_10_08',
  },
  {
    id: 'mapping:CHINESE_READING_ONLY_20261008_Q19',
    questionId: 'CHINESE_READING_ONLY_20261008_Q19',
    knowledgePointId: 'G2_PEP_CHINESE_S1_KP_05',
    relationType: 'PRIMARY',
    weight: 1,
    order: 1,
    isPrimary: true,
    sourceId: 'AI_AUTHORED_CHINESE_READING_ONLY_DRAFT_20261008',
    status: 'ACTIVE',
    needsVerification: false,
    isSample: false,
    verificationStatus: 'REVIEWED',
    releaseApprovalId: 'OWNER_CHINESE_READING_PRACTICE_2026_10_08',
  },
  {
    id: 'mapping:CHINESE_READING_ONLY_20261008_Q20',
    questionId: 'CHINESE_READING_ONLY_20261008_Q20',
    knowledgePointId: 'G2_PEP_CHINESE_S1_KP_05',
    relationType: 'PRIMARY',
    weight: 1,
    order: 2,
    isPrimary: true,
    sourceId: 'AI_AUTHORED_CHINESE_READING_ONLY_DRAFT_20261008',
    status: 'ACTIVE',
    needsVerification: false,
    isSample: false,
    verificationStatus: 'REVIEWED',
    releaseApprovalId: 'OWNER_CHINESE_READING_PRACTICE_2026_10_08',
  },
  {
    id: 'mapping:CHINESE_READING_ONLY_20261008_Q21',
    questionId: 'CHINESE_READING_ONLY_20261008_Q21',
    knowledgePointId: 'G2_PEP_CHINESE_S1_KP_05',
    relationType: 'PRIMARY',
    weight: 1,
    order: 3,
    isPrimary: true,
    sourceId: 'AI_AUTHORED_CHINESE_READING_ONLY_DRAFT_20261008',
    status: 'ACTIVE',
    needsVerification: false,
    isSample: false,
    verificationStatus: 'REVIEWED',
    releaseApprovalId: 'OWNER_CHINESE_READING_PRACTICE_2026_10_08',
  },
  {
    id: 'mapping:CHINESE_READING_ONLY_20261008_Q22',
    questionId: 'CHINESE_READING_ONLY_20261008_Q22',
    knowledgePointId: 'G2_PEP_CHINESE_S2_KP_06',
    relationType: 'PRIMARY',
    weight: 1,
    order: 1,
    isPrimary: true,
    sourceId: 'AI_AUTHORED_CHINESE_READING_ONLY_DRAFT_20261008',
    status: 'ACTIVE',
    needsVerification: false,
    isSample: false,
    verificationStatus: 'REVIEWED',
    releaseApprovalId: 'OWNER_CHINESE_READING_PRACTICE_2026_10_08',
  },
  {
    id: 'mapping:CHINESE_READING_ONLY_20261008_Q23',
    questionId: 'CHINESE_READING_ONLY_20261008_Q23',
    knowledgePointId: 'G2_PEP_CHINESE_S2_KP_06',
    relationType: 'PRIMARY',
    weight: 1,
    order: 2,
    isPrimary: true,
    sourceId: 'AI_AUTHORED_CHINESE_READING_ONLY_DRAFT_20261008',
    status: 'ACTIVE',
    needsVerification: false,
    isSample: false,
    verificationStatus: 'REVIEWED',
    releaseApprovalId: 'OWNER_CHINESE_READING_PRACTICE_2026_10_08',
  },
  {
    id: 'mapping:CHINESE_READING_ONLY_20261008_Q24',
    questionId: 'CHINESE_READING_ONLY_20261008_Q24',
    knowledgePointId: 'G2_PEP_CHINESE_S2_KP_06',
    relationType: 'PRIMARY',
    weight: 1,
    order: 3,
    isPrimary: true,
    sourceId: 'AI_AUTHORED_CHINESE_READING_ONLY_DRAFT_20261008',
    status: 'ACTIVE',
    needsVerification: false,
    isSample: false,
    verificationStatus: 'REVIEWED',
    releaseApprovalId: 'OWNER_CHINESE_READING_PRACTICE_2026_10_08',
  },
] satisfies Array<QuestionKnowledgePoint & { releaseApprovalId: string }>
