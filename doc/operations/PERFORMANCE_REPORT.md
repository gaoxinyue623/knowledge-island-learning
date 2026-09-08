# Performance Report

## 1. 构建快照

最近一次 `npm run build` 成功，使用 Vite production build。当前输出包含 route-level chunks；产品页和开发页不会全部合并进首屏入口。

| 输出 | 原始大小 | gzip |
| --- | ---: | ---: |
| 初始 JS 最大公共 chunk | 395.75 kB | 122.63 kB |
| 初始 CSS | 111.14 kB | 16.50 kB |
| Parent Dashboard chunk | 48.92 kB | 14.16 kB |
| Home chunk | 39.05 kB | 12.22 kB |
| Question Engine chunk | 36.61 kB | 11.42 kB |
| LessonPlayer chunk | 33.58 kB | 10.76 kB |

数字是构建输出的原始/gzip 近似值，不等于真实网络 RUM。当前未引入新的远程依赖或大媒体资源。

## 2. 已采取措施

- Router 对 Home、LearningMap、LessonPlayer、QuestionEngine、History、WrongBook、ReviewQueue、Reward、Parent Dashboard、Curriculum Settings 和 Dev pages 使用按路由加载。
- 正式 runtime 使用 production index，不在页面请求时遍历并暴露全量 SAMPLE 记录。
- 没有为了性能重写成熟的 Mastery、Strategy、History、WrongBook 或 ParentReport Domain。

## 3. 构建观察

Vite/Rollup 报告了 Zod 第三方文件中的 annotation 位置提示；这不是应用运行时 console warning，也没有导致构建失败。应在依赖升级时重新确认，不把第三方提示误报为课程数据或产品质量通过。

## 4. 后续阈值

如果未来正式课程包显著增大，应重新检查公共 chunk、课程 JSON、媒体资源和 route chunk；在没有真实内容规模前，不以虚构的压缩数字宣称性能达标。
