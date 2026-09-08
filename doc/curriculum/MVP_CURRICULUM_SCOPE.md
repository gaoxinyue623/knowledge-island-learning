# MVP Curriculum Scope

## 1. Scope 身份

| 字段 | 值 |
| --- | --- |
| Scope ID | `MVP_SCOPE_SZ_PRIMARY_2026_2027` |
| 目标地区 | 中国广东省深圳市，`CN-GD-SZ` |
| 目标学段 | 小学 |
| 目标有效期 | 2026-09-01 ～ 2027-08-31 |
| 当前正式条目 | 0 |
| 当前候选条目 | 1 |
| 运行时行为 | 正式入口只读取 `RELEASED` 条目；候选不会展示给生产用户 |

## 2. 当前候选

| 候选 ID | 年级 | 学期 | 学科 | 出版社目标 | 状态 |
| --- | ---: | --- | --- | --- | --- |
| `SZ-G3-MATH-UPPER-BNUP-CANDIDATE` | 3 | 上册 | 数学 | 北京师范大学出版社（`BNUP` 候选代码） | `CANDIDATE` |

这条候选来自公开目录调查，不等于深圳 2026—2027 选用关系，也不等于 PEP Golden framework。当前仓库没有把 `PEP` Golden package 与 `BNUP` 候选强行合并。

阻断原因：

- 没有当前学年深圳官方教材选用清单可以证明地区—教材关系。
- 没有同一版次原书封面、版权页、目录页和可靠 ISBN 证据闭环。
- 没有完成 Unit、Lesson、KnowledgePoint、LessonKnowledgePoint 和 KnowledgeRelation 的人工审核。

## 3. 发布条件

候选只有在下列条件全部满足后，才可以复制为新的已审核 identity 并标为 `RELEASED`：

1. 主管部门/出版社/原书版权页等可追溯来源已经登记到 `SourceReference`。
2. 地区、学年、年级、学期、学科、出版社和教材版本逐项人工核对。
3. `Textbook`、`Unit`、`Lesson`、知识体系抽象和全部关系均有人工 `REVIEWED` 记录。
4. 版权、原创内容、媒体和题目来源已经单独通过门禁。
5. Lesson Content、Question 和每个已发布 KnowledgePoint 的覆盖报告通过。

`VERIFIED`、`UNVERIFIED`、`SAMPLE`、`CANDIDATE` 都不能替代 `REVIEWED`，也不能进入正式 Scope。

## 4. 入口约束

生产 Onboarding 读取 `productionCurriculumIndex` 和 `curriculumAccessConfig`。当前 index 为空，因此正式入口不会显示一个“可选但进入后不可用”的教材；开发路由可以继续使用既有 SAMPLE fixtures。

实现位置：

- `src/data/curriculum/production/mvp-scope.ts`
- `src/data/curriculum/production/index.ts`
- `src/services/production-readiness/productionIndex.ts`
- `src/services/adapters/mock/curriculumMockAdapter.ts`

## 5. Batch 01 边界

`CURRICULUM DATA BATCH 01` 调查深圳小学一年级语文、数学、英语上下册，共 6 个目标槽位；当前结果为 `CONFIRMED = 0`、`PARTIAL = 6`、`UNVERIFIED = 0`、`NOT_FOUND = 0`，没有任何 Batch 01 数据达到 `REVIEWED`。数学上下册仍仅登记为 `UNVERIFIED` 候选 Import Package；六个槽位的候选实体也仍为 `UNVERIFIED`。公开证据录入补充了候选身份和本地资源线索，但没有改变生产资格。

Batch 01 不修改本 Scope 的正式条目，不增加 `productionCurriculumData` 或 `productionCurriculumIndex`，也不会使 Production Onboarding 显示候选教材。详见 `CURRICULUM_BATCH_01_REPORT.md` 与 `CURRICULUM_SOURCE_MANIFEST.md`。
