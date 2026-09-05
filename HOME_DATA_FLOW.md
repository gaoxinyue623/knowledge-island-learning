# Home 数据流与页面边界

## 1. 读取链路

```text
StudentCurriculumProfile
        ↓
curriculumStore
        ↓
homeStore.load()
        ↓
HomeService
        ↓
HomeViewModel
        ↓
HomePage.vue
```

`HomeService` 通过现有 Repository / Service / session reader 读取数据，再组合成页面所需的快照。`HomePage.vue` 不直接读取任何 Storage，不写 Mastery、Strategy、Reward、Growth、Achievement、WrongBook 或 Review Queue。

## 2. HomeService 输入与输出

| 输入 | Home 的用途 | 是否拥有写权限 |
| --- | --- | --- |
| Profile / Curriculum | 当前学生、地区、年级、学期和教材上下文 | 否 |
| LearningMap / Progress | 学科卡片、Lesson / KnowledgePoint 映射、可用性 | 否 |
| LessonSession / QuestionSession | Continue 和历史会话读取 | 否；学习页负责写 |
| STRATEGY_V1 | Reinforce / Next 的原始 recommendation | 否；不重新算阈值 |
| LearningHistory | 最近学习摘要和完成事实 | 否 |
| WrongBook / ReviewQueue | 错题数量、巩固任务和完成状态 | 否 |
| Reward / Growth / Achievement | 成长反馈摘要 | 否 |
| DailyPlanService | 读取或保存当前快照 | 只保存 Daily Plan snapshot |

输出是 `HomeViewModel`：Profile、Greeting、Today、Continue、Subjects、Recent Learning、Shortcuts、Growth、Achievement、来源 flags 和 warning。

## 3. 页面区域

```text
Hero / greeting
      ↓
Today · Daily Plan V1
      ↓
Continue Learning（仍有未完成会话时）
      ↓
Subject Summary × 3
      ↓
Recent Learning
      ↓
Growth / Achievement
      ↓
Quick Actions
```

首页的主问题是“今天学什么”。入口控制在 Daily Plan 的 1～3 个合法任务；数据不足时显示实际数量，不用占位任务凑数。正式内容的 SAMPLE / UNVERIFIED / REJECTED 来源被过滤，开发首页通过 `/dev/home` 显示固定样本并保留提示。

## 4. CTA 回链

| 首页动作 | 目标 | 完成后如何回到首页 |
| --- | --- | --- |
| Continue / Lesson | `/lesson` 或 `/dev/lesson-player` | `returnTo=/home` 或 `/dev/home` |
| Assessment | `/assessment` 或 `/dev/question-engine` | 复用显式 AssessmentLaunchContext 和 returnTo |
| Wrong Question | `/wrong-book` 或 `/dev/wrong-book`，带 `questionId` | 错题本启动新的 wrong-book QuestionSession |
| Review | `/review-queue` 或 `/dev/review-queue`，带 `itemId` | Review Queue 完成当前 item 后回首页 / 刷新 |
| Next / Map | `/learning-map` 或 `/dev/learning-map` | 地图继续使用显式 knowledgePointId 聚焦 |

原始 LessonSession、QuestionAttempt 和 QuestionSession 不被覆盖。用户完成目标流程后重新读取 HomeService，Daily Plan 只更新完成状态、进度和 CTA 可用性。

## 5. 状态与失败恢复

- `loading`：显示“正在准备今天的学习安排”。
- `error`：显示可重试错误，不白屏。
- `empty`：没有历史时显示“完成学习后，这里会留下你的学习记录。”；没有任务时明确说明今天还没有安排。
- `warning`：Storage 损坏或来源受限时显示可理解提示。
- `completed`：按钮变为“已完成”，不再重复启动已完成的 Continue。
- `unavailable`：来源已不可用时保留任务快照但禁用 CTA，不伪造完成。

## 6. 设计与可访问性

首页使用统一 AppShell、AppButton、AppIcon、AppProgress、空态和错误态组件；任务操作是可聚焦的真实按钮，状态不只依赖颜色。布局在 Desktop / Tablet / Mobile 使用单列回流，关键 CTA 保持触控尺寸；`prefers-reduced-motion` 下关闭非必要过渡。

## 7. 验收关注点

验证 Home 的固定输入得到固定任务顺序；Profile、教材和 dataset 不串线；刷新不引入新的当天任务；完成 Lesson / Review / WrongBook 后回首页能反映新状态；正式首页不展示样本任务；页面在 375、390、430、768、1024、1440 宽度无横向溢出。
