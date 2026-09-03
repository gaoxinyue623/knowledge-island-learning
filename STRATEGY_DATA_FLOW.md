# Strategy Data Flow｜PHASE 11 数据流

## 文档状态

| 项目 | 状态 |
| --- | --- |
| Question → Mastery → Strategy 主链 | 已实现 |
| Home / Assessment / LearningMap 展示接入 | 已实现 |
| `/dev/strategy` Showcase | 已实现 |
| 浏览器多视口与完整工程命令 | 待本阶段最终校验完成后更新 |

## 1. 运行数据流

```text
QuestionSession completed
        ↓
MasteryProcessingService
        ↓
MasteryRecord refresh
        ↓
LearningMapViewModel + MasteryRecord
        ↓
LearningStrategyService
        ↓
LearningRecommendation / ReviewRecommendation
        ↓
Home / Assessment completion / LearningMap auxiliary hint
```

策略层只读上游结果。`QuestionStore`、`MasteryStore`、`LearningMapStore` 不直接写 StrategyStore；页面或应用编排层在掌握度刷新后显式调用 `LearningStrategyService`。

## 2. Adapter 边界

`toStrategyMapNodes` 把现有 `LearningMapViewModel` 展平为只读节点；`toStrategyKnowledgeRelations` 把已由地图服务解析的 connection 投影成策略可读关系。策略不从标题、视觉坐标、页面数组位置或未通过闸门的原始数据推断课程关系。

地图的 `status`、`progress`、`prerequisites` 和 `LearningMapProgressRecord` 保持原样。策略为了读取 progress 只在内存中建立副本，永不调用地图解锁服务或写入地图存储。

## 3. 完成与失败

- Assessment 完成后，Mastery 处理成功才读取新掌握度并生成策略。
- Mastery 处理失败时，Assessment 仍保持 `completed`，策略清空，不生成未知数据的强推荐。
- 缺少有效地图节点或课程关系时返回 `NO_RECOMMENDATION` 和稳定 diagnostic。
- 存储、档案、教材或来源异常时优先返回安全空状态；不覆盖掌握度事实。

## 4. 页面消费

- Home：`LearningRecommendationCard` 只展示一个当前主动作。
- Assessment completion：掌握度刷新后显示下一步 / 巩固 / 证据不足提示。
- LearningMap：显示轻量辅助卡片，CTA 只聚焦已有节点，不改变解锁和完成度。
- `/dev/strategy`：使用固定 SAMPLE 与 UNVERIFIED 夹具检查规则、警示、诊断和响应式布局。

PHASE 11 只实现 deterministic strategy；Review 是当前巩固建议，不是复习排程；不实现 AI Learning Path、WrongBook、Spaced Repetition、Review Scheduling、KnowledgeEnergy、Reward，也不进入 PHASE 12。
