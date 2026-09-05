# KnowledgePoint Review — Batch 01

## 文档状态

| 项目 | 值 |
| --- | --- |
| Batch | `CURRICULUM_DATA_BATCH_01_SZ_G1_2026_2027` |
| 范围 | 深圳小学一年级数学上册 / 下册候选包 |
| 状态 | `PENDING_MANUAL_REVIEW` |
| Reviewer | `PENDING_MANUAL_REVIEW` |
| 生成日期 | `2026-09-03` |

本清单是候选 KnowledgePoint 的教研审核入口，不是人工审核记录。所有候选仍为 `UNVERIFIED`；名称和描述为项目原创概括，不是教材正文摘录。语文和英语暂未建立知识点候选，因为对应教材身份/目录证据尚未闭环。

## Candidate Registry

| Candidate ID | Code | 候选名称 | Mapped package / lesson context | Existing match | New / reused | Confidence | Manual review |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `B01_KP_MAT_COUNT_WITHIN_10` | `MAT-NUM-COUNT-WITHIN-10-001` | 认识并表示 10 以内的数 | 数学上册：生活中的数、10 以内数加减、总复习 | 未发现可直接复用的已核验实体 | new candidate | medium | required |
| `B01_KP_MAT_COMPARE_QUANTITY` | `MAT-NUM-COMPARE-QUANTITY-001` | 比较数量的多少 | 数学上册多个数与实践课；数学下册 100 以内数的认识 | 未发现可直接复用的已核验实体 | reused in Batch 01 | medium | required |
| `B01_KP_MAT_ADD_SUB_WITHIN_10` | `MAT-ADD-SUB-WITHIN-10-001` | 理解并解决 10 以内的加减问题 | 数学上册：5 以内、10 以内数加与减 | 未发现可直接复用的已核验实体 | new candidate | medium | required |
| `B01_KP_MAT_CLASSIFY_ATTRIBUTES` | `MAT-CLASSIFY-OBSERVABLE-ATTRIBUTES-001` | 按可观察属性进行分类 | 数学上册：整理与分类、统计与概率 | 未发现可直接复用的已核验实体 | new candidate | medium | required |
| `B01_KP_MAT_SHAPE_IDENTIFY_BASIC` | `MAT-SHAPE-IDENTIFY-BASIC-001` | 辨认常见图形并描述可观察特征 | 数学上册立体图形；数学下册图形大变身、平面图形 | 未发现可直接复用的已核验实体 | reused in Batch 01 | medium | required |
| `B01_KP_MAT_TIME_SEQUENCE_DAILY` | `MAT-TIME-SEQUENCE-DAILY-001` | 按时间顺序记录日常事件 | 数学上册：记录我的一天、综合与实践 | 未发现可直接复用的已核验实体 | new candidate | low | required |
| `B01_KP_MAT_PROBLEM_REPRESENT_REAL_LIFE` | `MAT-PROBLEM-REPRESENT-REAL-LIFE-001` | 用数量、图示或算式表达生活问题 | 数学上下册多个综合实践和情境课 | 未发现可直接复用的已核验实体 | reused in Batch 01 | medium | required |
| `B01_KP_MAT_COUNT_WITHIN_20` | `MAT-NUM-COUNT-WITHIN-20-001` | 认识并表示 20 以内的数 | 数学下册：20 以内数与加法/减法 | 未发现可直接复用的已核验实体 | new candidate | medium | required |
| `B01_KP_MAT_ADD_SUB_WITHIN_20` | `MAT-ADD-SUB-WITHIN-20-001` | 理解并解决 20 以内的加减问题 | 数学下册：20 以内数与加法/减法 | 未发现可直接复用的已核验实体 | new candidate | medium | required |
| `B01_KP_MAT_COUNT_WITHIN_100` | `MAT-NUM-COUNT-WITHIN-100-001` | 认识并比较 100 以内的数 | 数学下册：100 以内数的认识、总复习 | 未发现可直接复用的已核验实体 | new candidate | medium | required |
| `B01_KP_MAT_ADD_SUB_WITHIN_100` | `MAT-ADD-SUB-WITHIN-100-001` | 解决 100 以内的加减问题 | 数学下册：100 以内数加与减（一）、综合与实践 | 未发现可直接复用的已核验实体 | new candidate | medium | required |

## Mapping Review

- 数学上册：84 条 `LessonKnowledgePoint`，角色只使用 `core`、`secondary`、`extended`。
- 数学下册：89 条 `LessonKnowledgePoint`，角色只使用 `core`、`secondary`、`extended`。
- 每个候选 Lesson 都有至少一条候选映射；这只是结构完整性，不是教材教研结论。
- 跨上下册复用只按候选 `code` 统计；必须由 reviewer 确认名称、边界、年级范围和是否应合并。

## Relation Review

| Package | Relation candidates | Automatic result | Manual decision |
| --- | ---: | --- | --- |
| 数学上册 | 3 | prerequisite DAG `PASS` | `PENDING_MANUAL_REVIEW` |
| 数学下册 | 3 | prerequisite DAG `PASS` | `PENDING_MANUAL_REVIEW` |

自动 DAG 只证明当前候选图没有循环，不能证明“前置关系”符合教研事实。所有 relation 的 `verificationStatus` 仍为 `UNVERIFIED`。

## Reviewer Checklist

- [ ] 对照当前版次原书和课程标准核对候选 KnowledgePoint 的语义边界。
- [ ] 检查与现有 KnowledgePoint Registry 的同义、上下位和跨学科重复。
- [ ] 确认候选是否应跨上下册复用，或需要拆分为不同范围的知识点。
- [ ] 核对每条 LessonKnowledgePoint 的 `core` / `secondary` / `extended` 角色和权重。
- [ ] 核对每条 KnowledgeRelation 的方向、类型和事实来源。
- [ ] 写入真实 `MANUAL_REVIEW` reviewer、时间、依据和 review note。
- [ ] 只有完成审核并满足发布门禁后，才考虑转为 `REVIEWED`；本文件本身不能完成转状态。

## Decision

当前决策：**全部候选保留为 `UNVERIFIED`，不进入 Production Index。**
