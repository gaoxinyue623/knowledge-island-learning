# 知识岛｜LessonPlayer 内容协议与渲染

## 1. 内容分层

```text
Curriculum
  = 教材、Unit、Lesson、KnowledgePoint 等课程事实

LearningContent
  = 面向一次学习步骤的结构化呈现内容

ContentBlock
  = 文本、富文本、图片、音频、公式等原子内容
```

PHASE 8 复用现有 `ContentBlock`，不建立一套把内容都简化成 `string` 的平行协议。`LearningContent` 通过带稳定 ID 的内容块记录和 `LessonStep.contentBlockIds` 组织步骤，不改变 `CourseContent` 的课程归属。

## 2. 内容块类型

| LessonPlayer 类型 | 用途 | PHASE 8 允许的行为 |
| --- | --- | --- |
| `intro` | 进入本节、说明主题 | 读文本、看目标 |
| `concept` | 概念或知识点说明 | 读结构化内容 |
| `explanation` | 分步解释 | 展示段落、要点、重点 |
| `example` | 原创通用示例 | 观察示例过程，不判答案 |
| `media` | 图片、音频、视频、动画或 SVG | 播放 / 查看，失败时回退 |
| `interactive` | 非评分互动演示 | 揭示、切换、观察步骤或计时 |
| `practice` | Practice Placeholder | 非评分练习提示或过程观察 |
| `summary` | 本节回顾 | 查看重点、准备返回地图 |

未知类型不应导致页面白屏；开发环境显示可理解的未知内容占位和诊断，正式环境保持安全的不可用提示。

## 3. ContentBlock 安全规则

基础协议沿用：

```ts
type ContentBlockType = "TEXT" | "RICH_TEXT" | "IMAGE" | "AUDIO" | "FORMULA";

interface ContentBlock {
  type: ContentBlockType;
  text?: string;
  mediaAssetId?: string;
  altText?: string;
}
```

LessonPlayer 通过 Vue 文本节点渲染 `text`、段落、要点和标签，不使用 `v-html`。富文本在本阶段只按安全文本 / 结构化内容展示，不引入未审核的 HTML。媒体元素只接收数据层返回的显式 URL、MIME、尺寸、替代文本和文字稿。

## 4. 媒体引用与回退

内容块和 `CourseContent.media` 只引用 `mediaAssetId`；真实媒体事实由 `MediaAsset` 保存，包括 `sourceId`、`copyrightStatus`、`license`、`status`、`version`、`altText` 和 `transcript`。LessonPlayer 不保存 QuestionMedia 风格的真实 URI。

渲染器支持 `IMAGE`、`AUDIO` 和 `VIDEO`，并为动画 / SVG 保留可扩展入口。资源不存在、URL 为空或浏览器加载失败时显示“媒体内容暂时无法显示 / 暂未开放”等回退文本；失败不阻止继续阅读，也不把资源标记成已发布。

## 5. 非评分互动

`InteractiveBlock` 允许：

- `TOGGLE`：展开或收起说明。
- `REVEAL`：主动查看提示或过程。
- `TIMER`：显示一个观察用计时过程。
- `STEP_DEMO`：按顺序查看演示步骤。
- `DRAG_OBSERVE` / `ORDERING_DEMO`：观察移动或排序过程。

这些互动不包含 `answer`、`correct`、`wrong`、`score`、`submit` 或答案规则字段，不提交学生答案，不调用判题服务，也不产生 `MasteryEvent`、`MasteryScore` 或 `KnowledgeEnergy`。

## 6. 审核与示例内容

正式 LessonPlayer 必须同时满足课程事实和 LearningContent 审核闸门；未通过审核的学习内容显示为 `not_available`。开发页可以显式展示：

- `SAMPLE`：原创开发样本，显示开发样本警示。
- `UNVERIFIED`：待人工审核内容，显示未审核警示。
- `GOLDEN`：课程框架验证占位，不代表真实教材目录。

Demo Lesson 的内容是虚构、通用、原创的，不复制教材课文、教材例题或练习册。真实教材内容录入前仍必须完成来源、版权、内容审核和教材核验。

## 7. 内容渲染器

`LessonContentRenderer` 使用显式组件注册表映射内容类型：`IntroBlock`、`ConceptBlock`、`ExplanationBlock`、`ExampleBlock`、`MediaBlock`、`InteractiveBlock`、`PracticeBlock`、`SummaryBlock` 和 `UnknownContentBlock`。组件只消费 `LessonContentBlockViewModel`，不读取原始 Curriculum 数组。

`PracticeBlock` 仍只渲染非评分的思考提示；如果 Question Engine Adapter 确认存在可用 Assessment，它显示“开始练习”并发出 `AssessmentLaunchContext`，不在内容块中保存题目或答案。返回 LessonPlayer 后，摘要和完成状态由独立 Question Engine / LessonPlayer 页面处理。
