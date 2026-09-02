# 知识岛｜Curriculum Service 契约

## 文档状态

| 项目 | 内容 |
| --- | --- |
| 所属阶段 | PHASE 8.4：LessonPlayer / Knowledge Learning Flow（继承 PHASE 6 / 7） |
| 状态 | Mock Service、集中课程访问策略、导入验证、LearningMap curriculum source 和 LessonPlayer 上下文查询已实现；无真实 API / 数据库 |
| 实现入口 | `src/services/adapters/mock/curriculumMockAdapter.ts` |
| 对外导出 | `src/services/index.ts` |

## 1. 查询 API

`CurriculumService` 提供：

- `getRegions()`、`getGrades()`、`getSemesters()`、`getSubjects()`。
- `getTextbookVersions({ subjectId?, gradeId?, semesterId? })`、`getPublishers()`、`getPublisher(id)`。
- `getTextbookDisplay(id)`：返回教材版本和已解析的出版社详情，供页面展示。
- `resolveAvailableTextbooks({ regionId, gradeId, semesterId })`。
- `getUnitsByTextbookVersion(id)`、`getLessonsByUnit(id)`、`getKnowledgePointsByLesson(id)`、`getKnowledgePointById(id)`。
- `getLearningMapCurriculum(textbookVersionId)`：返回不含视觉字段的地图课程输入快照，供 `LearningMapAdapter` 生成 ViewModel。
- `getCurriculumProfile(studentId)`、`saveCurriculumProfile(profile)`。

PHASE 4 的 `listRegions`、`listGrades`、`listSemesters` 和 `getTextbook` 作为兼容别名保留。组件通过 Service 取数据，不直接拼接原始课程数组。

## 2. 教材解析结果

```ts
interface TextbookResolution {
  subjectId: Id;
  recommendedTextbookId?: Id;
  availableTextbooks: TextbookVersion[];
  resolutionStatus: "AUTO_RESOLVED" | "NEEDS_CONFIRMATION" | "NOT_AVAILABLE";
}
```

结果固定返回 `chinese`、`math`、`english` 三个独立分支。

解析规则：

1. 同时匹配 `regionId`、`gradeId`、`semesterId` 和学科 `subjectId`。
2. 地区关系按 `DEFAULT > SUPPORTED > OPTIONAL` 排序；相同教材的重复关系取优先级最高者。
3. 只有一个可用版本且存在唯一 `DEFAULT` 时返回 `AUTO_RESOLVED` 和推荐 ID。
4. 多个可用版本、没有唯一 `DEFAULT` 或出现多个 `DEFAULT` 时返回 `NEEDS_CONFIRMATION`，不会使用 `availableTextbooks[0]` 自动选定。
5. 没有候选版本时返回 `NOT_AVAILABLE`。
6. 多个 `DEFAULT` 会写入可读取的异常列表，供开发工具检查。

生产解析必须只读取当前有效、未归档且 `verificationStatus = REVIEWED` 的课程实体和地区教材关系，并满足 `ACTIVE`、来源、有效日期、出版社和版权等实体约束。教材版本已核验不能替代地区关系核验。Mock Service 通过 `CurriculumAccessPolicy` 集中过滤数据；开发环境可显式允许 SAMPLE 或其他未核验数据验证 UI 分支，不能用于生产候选集合。

## 3. Mock 模式

`MockCurriculumService` 支持 `success`、`empty`、`error`、`unsupported` 四种显式模式，以及可配置的 `delayMs`。默认延迟为 `0`，测试不会等待；没有随机错误。可以通过构造器注入数据和档案仓储，验证异常关系、空态和存储失败。

课程导入和自动审核不依赖数据库：`importCurriculumPackage()` 返回规范化包、错误、警告和 `CurriculumReviewReport`；`npm run curriculum:review` 生成 JSON / Markdown 报告。当前报告对象是一个 `UNVERIFIED` Golden Sample Framework，结构无错误但不能进入生产解析。

## 4. PHASE 7 地图读取边界

`getLearningMapCurriculum()` 只负责把当前教材的 `Unit`、`Lesson`、课次-知识点关系、`KnowledgePoint` 和 `KnowledgePrerequisite` 组合为地图适配器输入；它不添加坐标、主题、颜色、资源 URL 或节点完成度。`LearningMapStore` 再结合独立地图进度生成页面 ViewModel。

正式 `/learning-map` 只使用 `dataset = profile`，因此继续经过 `CurriculumAccessPolicy`，生产只允许 `verificationStatus = REVIEWED`。`dataset = golden` 和 `dataset = demo` 仅由开发路由显式读取：Golden 显示 `UNVERIFIED`，Demo 显示 `SAMPLE`，二者都不能成为生产回退。

课程实体缺失、前置关系端点不存在或没有可用数据时，Service / Adapter 返回空结果或诊断；页面显示可恢复状态，不在组件内猜测教材或制造课程内容。

## 5. PHASE 8 LessonPlayer 查询边界

LessonPlayer 复用 Curriculum Service 查询 Textbook、Unit、Lesson、KnowledgePoint 和 LessonKnowledgePoint 映射；`LearningContentRepository` 单独读取学习呈现内容，`LessonPlayerAdapter` 再生成页面 ViewModel。课程结构已 `REVIEWED` 不代表学习内容已发布，内容闸门由 `isLearningContentRecordReadable()` 独立执行。

正式 `/lesson` 只接受显式 `LessonLaunchContext`，开发 `/dev/lesson-player` 才能使用 Demo / Golden 数据集。该 Service 不查询题目、不提交答案、不计算掌握度。
