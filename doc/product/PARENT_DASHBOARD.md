# Parent Dashboard 页面说明

## 1. 入口与角色

| 入口 | 用途 | 数据权限 |
| --- | --- | --- |
| `/parent` | 正式家长学习报告 | 只读 profile，过滤不安全来源 |
| `/dev/parent-dashboard` | 开发状态 Showcase | 只读内存演示夹具，可显示 SAMPLE / UNVERIFIED 提示 |

当前没有家长账号、认证或多孩子系统。页面复用当前本地学习档案，不为了本阶段创建家长身份体系。

## 2. 信息架构

```text
Header / 返回孩子端 / 当前档案与范围
        ↓
Range + Subject controls
        ↓
最近学习概览
        ↓
最近学习活动
        ↓
学习完成记录 Trend
        ↓
学科进展
        ↓
知识点状态 + 值得回看
        ↓
错题记录 + 待巩固列表
        ↓
成长记录 + 已获得里程碑
        ↓
诊断信息
```

移动端第一屏优先呈现“最近学习概览”和“最近学习”，之后再展示趋势与详细分区。桌面端使用两列信息组，但保持内容分组和留白，不做企业 BI 数据墙。

## 3. 页面区域

### Header

显示当前学习档案、年级 / 学期 ID、报告阶段和返回孩子端按钮。`重新读取` 只重新聚合已有事实，不写入任何领域。

### Filters

- 报告范围：最近 7 天、最近 30 天、全部记录。
- 学科：全部、语文、数学、英语。
- 开发页额外提供 Full、Empty、Sample、Unverified、Weak-heavy、No WrongBook、No Review、Partial、Error 场景。

筛选偏好只保存到 `knowledge-island.parent-report-preferences`，不会保存或覆盖学习事实。

### Overview

最多六个事实指标：学习天数、完成课程、完成练习、Daily Plan completed / total、待处理错题、待巩固内容。它们不显示学习时长、综合分或质量评级。

### Recent Activity

显示最近完成课程、完成练习、完成 Review 和解决错题。Assessment 条目可以显示已有的题数、答对、答错、人工判断和完成百分比；不会复制完整题目尝试。

### Trend

使用 CSS 柱状条展示真实完成日期。图表旁有文字描述，每个日期同时显示记录数量；无数据时显示空态。没有未来预测，也不会为了填满日期自动制造数据点。

### Subjects / Mastery / Weak Knowledge

学科卡片展示课程、练习、已掌握和待巩固数量；无学科事实显示“暂无学习记录”。Mastery 使用“尚未开始 / 学习中 / 需要巩固 / 已掌握”四档。值得回看最多显示 5 条，来源是现有 Mastery state、Strategy review recommendation 和 active Review Queue，不产生新的阈值。

### WrongBook / Review / Growth / Achievement

- 错题区显示 active、resolved 和重复出错数量，并保留“查看错题本”导航。
- Review 区显示当前 pending、已完成和范围内完成数量，并保留“查看待巩固列表”导航。
- Growth 仅显示既有 KnowledgeEnergy、Growth level 和反馈进度；不解释为学习质量。
- Achievement 只显示已经解锁和范围内最近解锁的里程碑，不列出未获得成就作为压力清单。

## 4. CTA 边界

家长页提供的 CTA 只有导航：

| CTA | 目标 | 行为 |
| --- | --- | --- |
| 查看知识岛 | `/learning-map` 或 `/dev/learning-map` | 查看孩子端地图 |
| 查看错题本 | `/wrong-book` 或 `/dev/wrong-book` | 查看 / 进入既有错题复习流程 |
| 查看待巩固列表 | `/review-queue` 或 `/dev/review-queue` | 查看既有 Review Queue |
| 返回孩子端 | `/home` 或 `/dev/home` | 返回孩子端首页 |

家长页不自动 complete Lesson / Assessment，不 Resolve WrongBook，不完成 Review，不提高 Reward / Energy，不解锁地图，也不修改 Daily Plan priority。

## 5. 状态设计

- `loading`：使用现有 Loading 组件，说明正在整理报告。
- `ready + empty`：显示“这里还没有可展示的学习记录”以及返回孩子端 CTA。
- `error`：显示可重试错误组件；开发 Error 场景用于验证该路径。
- `partial`：保留可用区块，同时在 diagnostics 区显示部分来源失败信息。
- SAMPLE：显示“当前报告包含开发样本，只用于查看页面结构，不代表正式学习记录”。
- UNVERIFIED：显示“部分课程来源还在核验中，报告不会把它们当作正式学习结论”。

状态不只依靠颜色：文字、标题、图标、`role="status"` / `role="note"` 和实际数值共同传达信息。

## 6. 可访问性与响应式

- 使用真实 `button`、`select`、`label` 和 heading hierarchy。
- 进度条使用 `role="progressbar"` 与 `aria-valuenow`；Trend 同时提供文字摘要。
- 采用现有 `AppIcon` SVG 资产，功能图标不使用 Emoji。
- 保留全局 `focus-visible`；列表内容使用 `overflow-wrap`，长知识点名称可以换行。
- 通过 375、390、430、768、1024、1440 宽度验证无页面横向溢出。
- `prefers-reduced-motion: reduce` 下关闭非必要动画 / 过渡。

## 7. 主要实现

- 页面：`src/pages/ParentDashboardPage.vue`
- 样式：`src/styles/phase15.css`
- 状态：`src/stores/parentReportStore.ts`
- 领域聚合：`src/services/parent-report/parentReportService.ts`
- 路由：`src/router/index.ts`
