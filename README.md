# 知识岛学习

面向小学阶段的课程、学习地图、课堂播放、练习与掌握度体验原型。项目文档已按职责整理到 [`doc/README.md`](doc/README.md)，根目录保留运行入口和工程状态。

## 技术栈与环境

- Vue 3、TypeScript、Vite、Vue Router、Pinia
- Vitest、Vue Test Utils、JSDOM
- Node.js `>=24.0.0`

当前本机默认 Node.js 为 `22.19.0`；2026-09-08 已使用临时 Node.js `24.20.0` 通过完整发布检查，未修改全局安装。开发和验证请使用 Node.js 24 或更高版本。

## 快速开始

```sh
npm ci
npm run dev
```

可选的宠物账号与备份服务需另开终端：

```sh
npm run server
npm run dev
```

服务默认监听 `127.0.0.1:8787`，前端通过 `/api/pet` 代理访问；开发期间可使用 `npm run server:dev` 自动重启。服务边界与接口见 [`doc/operations/PET_BACKEND.md`](doc/operations/PET_BACKEND.md)。

## 常用命令

```sh
npm run build
npm run lint
npm run test
npm run curriculum:review
npm run release:check
```

## 当前验证状态

- 2026-09-08 学生体验分支在 Node.js 24.20.0 下验证：build、lint、59 个测试文件中的 689 项测试全部通过，runtime 专项 2 项通过。
- Windows 下 npm 子进程启动和 TTS 缓存路径断言已修复；`npm run release:check` 退出码为 0，结果为 `READY_WITH_LIMITATIONS`。
- 课程正文听读、三档字号和完成后只读回看已通过独立审查及 320px、390px 窄屏浏览器检查。
- 既有边界：8 节内容不计自动判分覆盖，豆包语音限本地开发，全站学习记录仍在本机；尚未完成真机手机及学生试用。

本批功能及后续计划见 [学生学习体验改进](doc/product/STUDENT_LEARNING_ROADMAP.md)。历史修复见 [`doc/operations/LOCAL_RELEASE_FIXES.md`](doc/operations/LOCAL_RELEASE_FIXES.md)，当前验证结果以上述记录为准。

文档分类入口：[`doc/README.md`](doc/README.md)。
