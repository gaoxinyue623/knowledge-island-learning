# 知识岛｜Golden Content G1 Math

## 文档状态

| 项目 | 内容 |
| --- | --- |
| 数据集 | Batch 01 G1 Math candidate textbook context |
| 状态 | `SAMPLE + UNVERIFIED`，仅开发验证；不进入当前 production index |
| 内容来源 | `src/data/content-expansion/golden-g1-math.ts` |
| 人工审核 | 未完成；不得擅自改为 `VERIFIED` 或 `REVIEWED` |
| 使用入口 | `/dev/content-expansion`、`/dev/activity-engine` |

## 1. Golden KnowledgePoints

本批只选 4 个一年级数学候选知识点，不批量覆盖整册：

| KnowledgePoint | 体验层内容 |
| --- | --- |
| `B01_KP_MAT_COUNT_WITHIN_10` | 认识并表示 10 以内的数 |
| `B01_KP_MAT_COMPARE_QUANTITY` | 比较数量的多少 |
| `B01_KP_MAT_ADD_SUB_WITHIN_10` | 理解并解决 10 以内的加减问题 |
| `B01_KP_MAT_SHAPE_IDENTIFY_BASIC` | 辨认常见图形并描述可观察特征 |

每个 KnowledgePoint 包含：

- 1 个 LearningContent intro 和 1 个 concept block，共 2 个教学 blocks。
- 2 个 InteractiveActivity。
- basic、reinforce、application 各 1 组 PracticeSet。
- 1 个 ExtensionActivity。
- 1 个 Challenge。

## 2. 活动覆盖

Golden 数据覆盖首批 6 个渲染器：

`drag_match`、`drag_classify`、`sort_order`、`number_line`、`select_region`、`simulation`。

另外在开发 Activity Engine 中保留 1 个 `timed_challenge` 占位，验证未支持类型回退。它不会进入正式 Lesson 或 Question。

## 3. 模板覆盖

Golden 数据登记 8 类数学模板：

`addition_range`、`subtraction_range`、`compare_numbers`、`missing_number`、`number_order`、`picture_count`、`word_problem_simple`、`equation_match`。

实例只在页面预览或测试时按 seed 临时生成；数据文件不存储 1000 道展开题。

## 4. 生产验证清单

在人工审核前不得：

- 把 Golden KnowledgePoint、活动或模板合并进正式课程索引。
- 把 `isSample` 改为 `false`。
- 把 `verificationStatus` 改为 `REVIEWED`。
- 让正式 `/home`、`/learning-map`、`/lesson` 自动展示 Golden 内容。
- 把活动完成当作 Mastery、地图解锁或 Reward 事实。

后续如继续扩展，推荐先完成 `G1 Golden Content Expansion` 的人工内容复核，再决定是否进入 Curriculum Data Review；本阶段不进入 Grade 2 或 PHASE 17。
