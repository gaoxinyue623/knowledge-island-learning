# 知识岛｜Exercise Template Engine

## 文档状态

| 项目 | 内容 |
| --- | --- |
| 状态 | CONTENT SYSTEM EXPANSION 01.3 已实现；当前聚焦 G1 Math Golden 开发夹具 |
| 模板实现 | `src/services/exercise-template/exerciseGenerator.ts`、`exerciseConstraints.ts` |
| Question 适配 | `src/services/exercise-template/generatedQuestionAdapter.ts` |
| 当前数据 | `src/data/content-expansion/golden-g1-math.ts` |

## 1. 模板类型

当前登记 8 类：

`addition_range`、`subtraction_range`、`compare_numbers`、`missing_number`、`number_order`、`picture_count`、`word_problem_simple`、`equation_match`。

模板包含：

```ts
interface ExerciseTemplate {
  id: string
  knowledgePointId: string
  templateType: ExerciseTemplateType
  difficulty: 'L1' | 'L2' | 'L3' | 'L4' | 'L5'
  config: typed config
  sourceId: string
  verificationStatus: VerificationStatus
  isSample: boolean
  version: number
}
```

## 2. 确定性生成

入口为：

```ts
generateExerciseInstances(template, seed, count)
```

生成器先校验模板约束，再使用字符串种子经过 hash 的小型 LCG。相同 `template + seed + count` 得到相同实例；更换 seed 会得到不同序列。禁止使用无种子 `Math.random()`。

实例身份为：

```text
templateId:seed:index
```

实例保存结构化 prompt、typed `AnswerSpec`、解释、难度、KnowledgePoint、样本状态和可审计的算术派生信息。1000 条校验样本只在验证时临时生成，不写入内容数据。

## 3. 约束

首版约束引擎只做可解释的基础检查：

- 数值范围合法且最小值不大于最大值。
- 加法结果不超过 `maxResult`；可选不进位。
- 减法可要求非负，并保证被减数不小于减数。
- 可选排除零和重复算式对。
- 排序数量不能超过可用的不重复数字数量。
- 题目配置必须引用存在的 KnowledgePoint；实例 ID、模板 ID 和答案必须有效。

不实现模型采样、概率调难度、AI 题面改写或跨年级推断。

## 4. Question Adapter

`exerciseInstanceToQuestionViewModel` 是边界适配器，不复制第二套题目引擎：

```text
ExerciseInstance
  ↓ GeneratedQuestionAdapter
Question
  ↓ existing QuestionRepository / QuestionSession / Validator
QuestionAttempt
```

适配题目的 `sourceId` 与 tag 使用 `GENERATED_FROM_VERIFIED_TEMPLATE`。数字答案映射为 `calculation`，比较 / 算式选择映射为 `singleChoice`，排序和文本答案映射为受约束的 `fillBlank`。生成题只有进入正式 Question Engine 后才可能成为作答事实；生成本身不写 Mastery、History 或 WrongBook。

`PracticeService.buildGeneratedPracticeSession()` 只创建新的 AssessmentDefinition、QuestionKnowledgePoint mapping 和 QuestionSession 起点，原有 Session / Attempt 不会覆盖。

## 5. 生产门禁

`generateProductionExerciseInstances()` 要求模板同时满足：

```text
isSample = false
verificationStatus = REVIEWED
```

开发 Golden 模板当前为 `SAMPLE + UNVERIFIED`，只能在开发数据集使用。模板审核不会自动改变 Batch 01 Curriculum 审核状态。
