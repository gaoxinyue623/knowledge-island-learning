# 知识岛｜Interactive Activity Engine

## 文档状态

| 项目 | 内容 |
| --- | --- |
| 状态 | CONTENT SYSTEM EXPANSION 01.2 已实现；首批 6 类 renderer 已验证，其余类型保持安全占位 |
| 类型来源 | `src/types/content-expansion.ts` |
| 注册表 | `src/services/interactive-activity/activityRegistry.ts` |
| 进度边界 | `src/services/interactive-activity/activityStorage.ts`、`activityService.ts`、`src/stores/interactiveActivityStore.ts` |
| 开发入口 | `/dev/activity-engine`、`/dev/content-expansion` |

## 1. Activity Contract

```ts
interface InteractiveActivity {
  id: string
  knowledgePointId: string
  activityType: InteractiveActivityType
  title: string
  instruction: string
  difficulty: 'L1' | 'L2' | 'L3' | 'L4' | 'L5'
  config: typed discriminated union
  learningGoal: string
  completionPolicy: 'all_items' | 'target_reached' | 'manual_check'
  sourceId: string
  verificationStatus: VerificationStatus
  isSample: boolean
  sort: number
}
```

首版登记 12 类：`drag_match`、`drag_classify`、`sort_order`、`number_line`、`build_object`、`select_region`、`connect_pairs`、`fill_container`、`simulation`、`step_operation`、`observe_discover`、`timed_challenge`。

首版真正渲染 6 类：

| 类型 | 操作 | 完成条件 |
| --- | --- | --- |
| `drag_match` | 选择来源，再选择目标 | 所有 match 完成 |
| `drag_classify` | 选择内容，再选择分组 | 所有 item 完成 |
| `sort_order` | 点击卡片组成顺序 | 顺序与 `correctOrder` 一致 |
| `number_line` | 点击数轴位置 | 选择 `target` |
| `select_region` | 点击逻辑区域并检查 | 目标区域集合一致 |
| `simulation` | 使用 typed templateKey 的有限操作 | 目标状态达到 |

其他类型仍进入 registry，但显示 `UnsupportedActivity`，不会因为未知配置导致白屏或执行动态代码。

## 2. Registry 与组件

`activityRegistry` 是 `activityType → { label, supported, component }` 的唯一映射。`InteractiveActivityRenderer.vue` 只读取映射并使用 Vue dynamic component；组件自己拥有交互状态和完成事件，页面不维护巨型 `v-if`。

当前组件位于 `src/components/interactive-activity/`：

- `DragMatchActivity.vue`
- `DragClassifyActivity.vue`
- `SortOrderActivity.vue`
- `NumberLineActivity.vue`
- `SelectRegionActivity.vue`
- `SimulationActivity.vue`
- `UnsupportedActivity.vue`

## 3. 触摸、键盘与视觉反馈

- 拖动类以 Pointer Events 响应鼠标、触摸和触控笔；没有使用 HTML5 Drag API。
- 每个可操作元素是 button，支持 Enter / Space，具备 `aria-pressed` 或明确 label。
- 目标尺寸至少 44px；反馈不只依赖颜色，使用文字和状态语义。
- 失败提示使用“再试试看”“看看还能放在哪里”等儿童友好措辞。
- 只使用轻量 CSS / SVG 视觉，不接入 Cocos、Phaser、Pixi 或 Three。
- `prefers-reduced-motion: reduce` 下关闭过渡和动画。

## 4. Progress Storage

Activity progress 使用独立 key：`knowledge-island.interactive-activity-progress`。

```ts
interface ActivityProgressStoragePayload {
  schemaVersion: 1
  progress: ActivityProgress[]
}
```

记录按 `profileId + activityId` 隔离。解析失败会删除损坏载荷、设置诊断并回退到空数组；不影响课程 Session、QuestionSession、Mastery 或地图进度。

## 5. 领域边界

`ActivityResult.status = completed` 只代表该交互按自己的 completion policy 完成。它不产生 `QuestionAttempt`，不进入 `LearningEvidence`，不修改 `MasteryRecord`、`LearningMap` unlock、`Strategy` 或 `DailyPlan`。若活动希望成为可评分练习，必须另行通过 `ExerciseTemplate → Question` 适配器进入正式 Question Engine。
