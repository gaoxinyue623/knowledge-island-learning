# 知识岛｜Question Validator 规则

## 1. 设计原则

PHASE 9 的 Validator 是纯函数，输入为 `Question` 与 `QuestionAnswerDraft`，输出为 `QuestionAttemptResult`。它只依据题目数据中的 `QuestionAnswerRule` 判题，不读取模型、不猜教材、不修改题目、不产生学习事件。

## 2. 六类题型规则

| 题型 | 判定规则 | 自动评分 |
| --- | --- | --- |
| `singleChoice` | 将选项 ID 映射为 `optionKey`，与 `correctOptionKey` 精确匹配 | 1 / 0 |
| `multipleChoice` | 将选项 ID 映射为键集合，与 `correctOptionKeys` 做无序精确集合匹配 | 1 / 0 |
| `trueFalse` | 布尔值与 `correctValue` 严格相等 | 1 / 0 |
| `fillBlank` | 每个空位按自身 `acceptedAnswers` 和 `normalization` 匹配 | 1 / 0 |
| `calculation` | 输入规范化后与数值答案精确相等，或在声明的 tolerance 内 | 1 / 0 |
| `shortAnswer` | 保留学生文字并返回 `manual_review_required` | 不自动评分 |

## 3. 文本与数值规范化

填空题的接受答案来自题目数据，不能由前端写死。支持 `NONE`、`TRIM`、`CASE_INSENSITIVE` 和 `SIMPLIFIED_CHINESE` 标记；未声明时不擅自放宽答案。计算题会处理前后空白、全角数字、小数点和负号，再执行有限数值比较；只有题目提供容差时才允许范围内误差。

Validator 不执行任意表达式，不把分数、单位或自然语言猜成数值；如果题目需要这些能力，必须先扩展答案协议并补充审核规则。

## 4. 完整性与提交

空的单选、判断、填空、计算或简答输入不能提交；多选必须按题目允许规则检查。选项 ID、填空数量和答案类型不匹配时返回错误结果或由数据校验器阻止进入生产。提交后 `QuestionAttempt.submitted = true`，Store 不允许再次写入草稿或重新提交。

## 5. 分数汇总

`AssessmentResultSummary` 包含总题数、已提交数、答对数、答错数、待人工判断数、得分、满分、自动评分正确率和可评分题数。自动评分正确率的分母是 `correct + incorrect`，不包括 `manual_review_required`；零可评分题目时 percentage 为 `null`，UI 显示 `—`。

## 6. 学习算法隔离

Validator 不生成 `MasteryEvent`。未来若将结果映射为 `FIRST_CORRECT`、`CORRECT`、`WRONG` 等事件，应由独立学习行为服务完成，并遵循 `masteryScore` 只受七种事件影响、不做时间衰减的规则；复习时间信号由 `KnowledgeEnergy` 独立处理。
