# 知识岛｜课程事实核验

## 文档状态

| 项目 | 内容 |
| --- | --- |
| 所属阶段 | PHASE 6.1～6.3 |
| 状态 | 导入 Schema、完整性校验、状态机、自动报告和生产读取闸门已实现 |
| 权威类型 | `src/types/curriculum-verification.ts` |
| 当前数据 | 仅有一个 `UNVERIFIED` Golden Sample Framework；无真实已核验教材数据 |

## 1. 核验状态

`VerificationStatus` 专门表达课程事实的核验阶段：

| 状态 | 含义 | 生产可读 |
| --- | --- | --- |
| `SAMPLE` | 开发占位或测试夹具 | 否 |
| `UNVERIFIED` | 已有结构，但来源或事实尚未完成核验 | 否 |
| `VERIFIED` | 已按可靠来源完成事实核验，等待发布级审核 | 否 |
| `REVIEWED` | 责任人已完成审核，满足课程事实准入门槛 | 是，仍需满足实体生命周期和发布条件 |
| `REJECTED` | 被拒绝或等待修订 | 否 |

`isSample` 与 `needsVerification` 保留为兼容和快速闸门字段，但不能代替 `verificationStatus`。`ACTIVE` 是结构生命周期，`PUBLISHED` 是内容发布生命周期，均不等同于 `REVIEWED`。

## 2. 状态迁移

- `SAMPLE` 只能保持 SAMPLE，不能进入 `VERIFIED` 或 `REVIEWED`。
- `UNVERIFIED` 可以进入 `VERIFIED` 或 `REJECTED`，不能直接进入 `REVIEWED`。
- `VERIFIED` 可以进入 `REVIEWED` 或 `REJECTED`。
- `REJECTED` 必须先通过 `request_change` 回到 `UNVERIFIED`，不能直接进入 `REVIEWED`。
- `REVIEWED` 不通过状态覆盖修改；有变更时创建新版本并重新审核。

代码入口是 `canTransitionVerificationStatus()`、`validateReviewRecordTransition()` 和 `transitionVerificationStatus()`。

## 3. 记录与报告

课程事实审核使用 `CurriculumReviewRecord`，审核者只使用 `SYSTEM` 或 `MANUAL_REVIEW`：自动检查只能记录结构性结果，AI 不能单独制造 `REVIEWED`。`CurriculumReviewReport` 记录完整性统计、来源问题、SAMPLE 污染、知识关系 DAG 和最终结果。

执行：

```bash
npm run curriculum:review
```

输出：

- `CURRICULUM_VERIFICATION_REPORT.md`
- `curriculum-verification-report.json`

当前报告为 `errors = 0`、`samplePollution = PASS`、`knowledgeDag = PASS`、`finalResult = REQUIRES_MANUAL_REVIEW`。

## 4. 生产保护

`src/services/curriculum/accessPolicy.ts` 是唯一课程读取闸门。生产环境默认只读取 `verificationStatus = REVIEWED` 且未归档的记录；开发 Mock 是否允许 SAMPLE 或未核验数据由 `VITE_ALLOW_SAMPLE_CURRICULUM`、`VITE_ALLOW_UNREVIEWED_CURRICULUM` 集中配置，不在页面内分散判断。

PHASE 6 不实现审核后台、真实教材录入、学习地图业务或 PHASE 7 的学习运行逻辑。

