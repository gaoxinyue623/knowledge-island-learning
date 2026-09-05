# MVP Release Checklist

## Curriculum

- [x] MVP Scope 有显式 ID、地区和有效期。
- [x] Source Manifest 区分官方、出版方、原书、候选和上下文来源。
- [x] Import / fingerprint / diff / reviewed overwrite guard 已实现。
- [ ] 当前 Scope 至少有一条真实 `RELEASED + REVIEWED` 教材；当前为 0。
- [ ] 当前地区教材关系、版次、目录、版权页和人工 review 记录闭环。

## Content

- [x] 复用既有 CourseContent / ContentBlock / LessonPlayer。
- [x] `REVIEWED + PUBLISHED`、来源、版权和媒体门禁已集中实现。
- [x] Content coverage report 和缺失/媒体诊断已实现。
- [ ] 正式 Lesson Content 覆盖已达到当前发布 Scope；当前为 0/0 的空 allow-list。

## Question

- [x] 复用既有 Question / QuestionKnowledgePoint / QuestionEngine / validator。
- [x] 题目状态、答案、映射、来源、媒体和最低题量门禁已实现。
- [x] Question coverage report 已实现。
- [ ] 正式题库覆盖当前发布 Scope；当前为 0/0 的空 allow-list。

## Routes / Production Config

- [x] 正式页面和开发页面通过 Vue Router 区分。
- [x] 生产 `devRoutes = false`，`/dev/*` 不可作为正式入口。
- [x] 生产缺失环境变量时所有 SAMPLE/未审核开关 fail safe 为 false。
- [x] Onboarding / Curriculum Service / Content / Question runtime 使用生产 allow-list。

## Storage / QA

- [x] Storage migration matrix、schemaVersion、损坏回退和孤儿恢复契约已记录。
- [x] Full regression、type-check、lint、format-check、build 和 diff check 已执行。
- [x] Route-level lazy loading 与构建输出已记录。
- [x] 正式页面响应式、Console、Accessibility、Reduced Motion 和 error fallback 已检查。

## Privacy / Copyright

- [x] 继续 local-first，无新增 tracking、账号、云同步或个人数据上传。
- [x] Parent Dashboard 仍为只读报告层。
- [x] 未复制教材全文；未确认版权的内容/媒体/题目不进入 production index。
- [ ] 真实发布包的逐项版权证明尚未完成。

## Release Decision

- [ ] `READY`
- [ ] `READY_WITH_LIMITATIONS`
- [x] `NOT_READY`

阻断项见 `MVP_RELEASE_REPORT.md`。PHASE 16 工程完成不等于 MVP 已发布；完成本阶段后停止，不进入 PHASE 17。
