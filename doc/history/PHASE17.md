# PHASE 17 — Knowledge Island Education Agent

2026-09-17 · Agent Foundation。用户本轮明确授权继续 PHASE 17；PHASE 16 文档中的历史停止点不代表本阶段的限制。

## 1. 当前交付范围

实现了课程上下文解析、学生状态投影、确定性 Planner、结构化 Decision / Activity、Question / Content Provider 协议、独立生成校验、确定性 AnswerAnalyzer、轻量 Orchestrator、Trace、内存模拟和场景评估。

开发入口：`/dev/learning-agent`。无需 API Key。正式学生页面尚未接入 Agent，生产模式保留现有 `/dev/*` 守卫；即使课程全部审核通过，Agent 也不会把模拟资源交付到正式学习流程。

用户附件在 `Scenario C` 标题处结束。A / B 按附件实现；C～H 按前文规则补充，未推定存在其他未提供的验收要求。

## 2. 架构检查与复用边界

开发前检查了 README、PRODUCT、PHASE 历史、课程和生产索引、课程审核、地图、LessonPlayer、Question Engine / Assessment、Evidence / Mastery、STRATEGY_V1、WrongBook / Review Queue / History、Reward、Home / DailyPlan、ParentReport、存储与当前测试；发现既有 Exercise Template Engine 已提供 seedable generation，因此不另建随机出题系统。

| 既有能力 | PHASE 17 的用法 |
| --- | --- |
| StudentCurriculumProfile、Textbook / Grade / Semester / Subject / Publisher | 课程身份和教材选择的事实源 |
| CurriculumAccessPolicy、正式 Curriculum Service / Index | 校验地区教材关系、有效期、审核状态和课程引用；拒绝上下文错配 |
| LearningMap Adapter、StrategyMapNode、KnowledgeRelation | 读取现有节点可用状态和前置关系，始终不写进度或解锁 |
| Question、QuestionKnowledgePoint | 直接复用题目和权重关联，禁止用 legacy 单知识点字段取代映射 |
| QuestionSession、QuestionAttempt | 模拟也使用现有会话身份与提交语义 |
| LearningEvidence、MasteryRecord、MasteryEngine | 原始学习事实与掌握度唯一来源；不新增 Mastery 算法 |
| STRATEGY_V1 | 提供继续 / 巩固 / Next 候选，尤其 Next 只能采用已有可进入候选 |
| ExerciseTemplate、ExerciseInstance、GeneratedQuestionAdapter | Mock 复用种子生成器，数值范围按显式模板约束选择 |
| WrongBook / Review Queue / LearningHistory | Context 只读；模拟完成后的投影使用原服务和显式内存存储 |
| DailyLearningPlan | 读取既有快照；Agent 不生成第二份每日计划 |
| Reward、Home、ParentReport | 不改其领域规则、不接入模型输出、不向其写入模拟事实 |

目录沿用项目的 `src/types/`、`src/services/`、`src/stores/`、`src/data/`、`src/pages/` 组织，没有创建平行的 domain/application/infrastructure 根目录。

```text
read-only source / CurriculumResolver
    → scoped existing facts
    → StudentKnowledgeStateBuilder + STRATEGY_V1
    → LearningPlanner → LearningDecisionEngine → LearningActivityPlan
    → Generation Requests → Provider
    → independent validators
    → READY resources or BLOCKED / REQUIRES_REVIEW

READY simulation task
    → committed QuestionSession / QuestionAttempt
    → AnswerAnalyzer + existing deterministic answer validator
    → existing LearningEvidence extractor
    → existing MASTERY_V1 rebuild
    → in-memory WrongBook / History / Review projections
    → next context / decision
```

## 3. 学生状态投影

`StudentKnowledgeState` 是读取模型，不是可写掌握度事实：

- `MasteryRecord.masteryScore` 保持 **0～100**，Agent 投影显式除以 100。
- 作答统计来自当前档案、教材、映射下的已提交 `correct / incorrect` Attempt；以 Session + Question 去重。草稿和待人工判断不进入正确率分母。
- 近期窗口默认 10 次；时间相同时以稳定业务身份排序。
- Evidence 必须具有当前档案、教材会话和知识点关系；共享知识点 Mastery 身份仍然是 profile + knowledge point。
- 记录总体正确率、近期正确率、连续正确 / 错误、最近学习时间、薄弱信号和错误类型。时间不会衰减掌握度。
- 缺少历史时不直接判定“学生薄弱”，默认 CONTINUE 并保留 0 证据置信度。
- `confidence` 表示证据充分程度。它不是孩子心理状态，也不是新训练模型的概率。

## 4. Strategy 与 Planner

`STRATEGY_V1` 不变，继续产生候选。Planner 负责单次下一步决策，增加实时连续错误、到期复习、补救和难度选择，不复制 Strategy 的下一节点解析器。

规则及参数集中在 `plannerConfig.ts`：

| 优先级 | 条件 | Action |
| --- | --- | --- |
| 1 | 连续错误 ≥ 2，存在当前地图可进入的薄弱前置知识（掌握度 < 0.45） | REMEDIATE |
| 2 | 连续错误 ≥ 2，近期正确率 < 0.40 | SIMPLIFY |
| 3 | 已有 active ReviewQueueItem 的显式 dueAt 到期，目标可进入 | REVIEW |
| 4 | 已有证据且掌握度 < 0.45 | REINFORCE |
| 5 | 至少 3 次作答、confidence ≥ 0.5、掌握度 ≥ 0.90、近期正确率 ≥ 0.90 | CHALLENGE |
| 6 | 至少 3 次作答、confidence ≥ 0.5、掌握度 ≥ 0.85、近期正确率 ≥ 0.80，并有 STRATEGY_V1 的下一候选 | NEXT |
| 7 | 采用已有 Strategy 的巩固建议，否则收集证据 | REINFORCE / CONTINUE |

CHALLENGE 优先于 NEXT，避免两个阈值都满足时挑战分支不可达。持续失败优先于到期复习，避免学生一直在失败状态下继续当前难度。

Decision 保存结构化 reason code、message、evidenceType、reference、weight，以及 evidenceRefs、算法版本、时间、确定性身份。引用既包括课程知识点 / 前置关系 / Review item，也包括已有 Evidence ID。

QuestionMix 校验所有比例在 0～1，且总和为 1。V1 Mock 只承诺 directPractice=1；其他混合比例在协议中可表达，但 Mock 会明确拒绝，不能把直接计算题标成错题变式或应用题。

## 5. 生成与校验

`QuestionGeneratorProvider`、`ContentGeneratorProvider`、`AnswerAnalyzerProvider` 均不依赖模型 SDK。Mock 通过 request + seed + 显式模板生成可重放结果；Orchestrator 向 Provider 传入副本，Provider 无法修改用于校验的可信请求。

题目流水线：

```text
GENERATED → SCHEMA → CURRICULUM → KNOWLEDGE_POINT
          → ANSWER → DIFFICULTY → DUPLICATE → SAFETY
          → VALID / INVALID / REQUIRES_REVIEW
```

- 复用现有 Question Zod schema / validateQuestion；校验 requestId、数量、档案和完整课程身份。
- 校验映射引用、权重之和、重复映射、模板知识点与生成约束。
- 数学答案直接从**可见题面**重新解析计算，不信任 Provider 给出的结果或 derivation；支持二元加减乘除、数值比较。禁止 eval。
- 除零、错误答案、无效难度、跨教材题目和重复题目被拒绝。
- 精确与规范化去重覆盖批内和显式近期 / 避免题目引用；保留 SemanticDuplicateDetector 接口，不引入向量库。
- 未知题式、未知模板语义、非 Mock Provider 和非模板解析需要审核，不自动 READY。
- 自动通过的内容限制为受控纯文本 / 算式，拒绝富文本、脚本、外链、未知媒体与基础不安全文本。安全检查不是通用内容审查模型。
- 批次整体失败时 `generatedResources` 为空；Trace 记录失败代码，不泄漏未验证题面或 Provider 异常原文。
- 所有 Mock 题保留 `AI_GENERATED + SAMPLE + needsVerification`，不会伪装成 `REVIEWED / PUBLISHED`。批次内携带 generator provider / model / promptVersion。

内容使用现有 `ContentBlock`，独立包裹 `AI_GENERATED_SUPPLEMENT`、完整 Curriculum、Lesson、KnowledgePoint、Difficulty、生成时间和校验状态；不会更新正式课文。Mock 当前提供六类通用学习提示，只有与受控模板一致的内容可自动通过；自由生成的概念解释仍须审核。

## 6. Answer Analyzer 与错误分类

确定性判分复用 `validateQuestionAnswer`。`expectedAnswer` 必须与题目规则一致；生成数学题的标准答案还须通过独立计算。开放题、空答案、课程会话身份不匹配、重复知识点映射、错误标准答案均不产生 Mastery Evidence。

Evidence 仅从已完成且所有题目已提交的会话中提取，作答必须与已提交事实一致。使用既有稳定 Evidence ID 和 MASTERY_V1，可重放、可去重；Analyzer 不拥有 MasteryRepository 写权限。

错误类型使用 `{ domain, category, code, confidence }`，支持通用类型和学科扩展。第一版数学支持 Carrying / Borrowing / PlaceValue / Calculation Detector。只看最终答案时返回 UNKNOWN；只有显式的中间数位结果支持时才给出具体分类，避免把所有计算错误解释为“粗心”。语文、英语不会运行数学错误类型推断。

例：`52 − 27` 答 `35`，只给最终答案时 UNKNOWN；若学生中间结果是 tens=3、ones=5，可记录 BORROWING_ERROR（confidence=0.8）。错误分类置信度与判分置信度分开。

## 7. 数据与存储

只对既有 Domain 增加可选字段：

- `QuestionAttempt.errorPatterns?`，同步现有 QuestionSession storage schema。
- `ReviewQueueItem.dueAt?`，同步现有 ReviewQueue storage schema；Strategy refresh 保留已存在的 dueAt。

两者都保持 schemaVersion 1 和旧记录兼容。未写 dueAt 的旧队列项是待巩固候选，**不能把 active 等同于到期**。本阶段不创建排程器，也不把 quest 级 SpacedReview 的 URL / 标题猜测成课程知识点映射；已有固定间隔复习仍独立运行。

Agent Context / Decision / Trace 是本次调用返回的内存快照，不新增长期存储，不同步云端。模拟使用独立 SAMPLE profile；持久化学生事实、奖励、Production Curriculum、地图完成状态均不被写入。正式 runtime source 通过公开读取接口聚合现有档案；尚无匹配模板时返回明确不可生成诊断。

## 8. API 与入口

```ts
import { learningOrchestrator } from '@/services/learning-agent'

const result = await learningOrchestrator.prepareNextLearningTask(profileId, textbookId, {
  now: '2026-09-17T08:00:00.000Z',
  seed: 'replay-001',
})
// Runtime profile 可读取并决策；PHASE 17 的生成资源不进入正式学生学习流。
```

开发使用 `LearningAgentSimulation(createAgentScenario('A'))`，`run(now, seed)` 返回同一 `LearningAgentResult` 协议，`answer(task, mode, now)` 在隔离内存中生成真实协议的会话和证据，再重算掌握度。重复提交同一批任务幂等。

页面可以查看课程、当前知识点、作答、薄弱信号、WrongBook / Review / History / DailyPlan、Strategy 候选、学生状态、Decision、Reasons、Confidence、Difficulty、Activity、已验证资源和 Trace，并执行正确、错误、退位、进位与连续失败模拟。进位 / 退位模式要求当前批次包含对应运算；没有对应题目会明确提示，可更换生成种子。可重放示例：种子 `test-seed`，F 情境可模拟退位；A 情境切换“基础加法”并 Run Agent 后可模拟进位。

Trace 保存系统事件和结构化决策依据，不记录隐藏 Chain-of-Thought。当前界面显示最近一次结果；需要长期审计时应由后续应用层增加版本化 Trace 仓储。

## 9. 场景与验证

| 场景 | 输入关键点 | 预期 |
| --- | --- | --- |
| A | mastery=0.30，近期正确率=0.30，无连续失败 | REINFORCE |
| B | mastery=0.40，近期正确率=0.30，连续错误=3 | SIMPLIFY |
| C | 连续失败，前置知识缺少掌握证据，地图允许回访 | REMEDIATE |
| D | 到期队列项 | REVIEW |
| E | mastery=0.88，近期正确率=0.90，Strategy 下一候选可进入 | NEXT |
| F | mastery=1.00，近期正确率=1.00 | CHALLENGE |
| G | 尚无学习证据 | CONTINUE |
| H | 课程来源 REJECTED | BLOCKED，资源为空 |

验证命令：

```sh
npm run agent:evaluate
npm run type-check
npm run lint
npm run build
npx --yes --package=node@24.20.0 node node_modules/vitest/vitest.mjs run
```

最终结果：70 个测试文件、824 项测试全部通过，其中 Agent 专项 65 项；type-check、lint、build、agent:evaluate 与 git diff --check 通过。生产构建保留原主包超过 500 kB 的 Vite 提示，Agent 页面按路由懒加载。

专项测试覆盖规则优先级、证据重放和权重、档案 / 课程隔离、地图锁定、未来 / 未排程复习、空状态、配置校验、种子重放、所有校验阶段、Provider 故障和篡改请求、内容审核、错误分类、旧存储兼容、实际页面答题调整和异步结果竞争。

验证环境说明：本机默认 Node 26.7.0 的全局 localStorage 行为与既有 JSDOM 测试不兼容；复用项目此前验证的 Node 24.20.0 执行回归，不修改全局 Node 安装。发现原周计划两个组件测试依赖真实日期落在 2026-09-08 所在周，已固定该测试文件的 Date 时钟到夹具日期，未修改周计划产品逻辑。

浏览器已验证桌面、390px 和 320px 页面无横向溢出；连续错答触发 REINFORCE → SIMPLIFY（0.35 → 0.15），八场景评估全部通过，控制台无错误。生产 preview 访问 `/dev/learning-agent` 被现有守卫重定向至产品入口。

## 10. 明确限制

- 没有真实 LLM、Multi-Agent、Agent-to-Agent、MCP、RAG、向量数据库或 Agent 框架。
- 自动生成覆盖受控数学模板，乘除答案可验证但首版 Mock 不新增乘除模板；其他学科保留协议与待审核路径。
- Activity 的 QuestionMix 当前只执行 directPractice；未实现错题语义变式、应用题混合和跨学科自由生成。
- Content Mock 是通用引导语，不宣称生成了经教研审核的新概念讲解。
- Agent 不写真实 Mastery、解锁地图或发布 AI 课程；完成闭环在隔离模拟中验证。
- 不改变 Home / DailyPlan、ParentReport、Reward 和现有学生学习体验的产品行为。
