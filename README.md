# 知识岛学习

面向小学阶段的课程、学习地图、课堂播放、练习与掌握度体验原型。项目文档已按职责整理到 [`doc/README.md`](doc/README.md)，根目录保留运行入口和工程状态。

## 技术栈与环境

- Vue 3、TypeScript、Vite、Vue Router、Pinia
- Vitest、Vue Test Utils、JSDOM
- Node.js `>=24.0.0`

当前本机 Node.js 为 `22.19.0`，低于项目要求；这与其他验证结果分别记录，不能据此推断脚本失败原因。

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

- build、lint 已通过。
- 既有测试中 660/661 通过；`tests/tts-server.test.ts` 有 1 项既有缓存绝对路径断言失败。
- runtime 专项 2 项通过。
- Windows 下 `release:check` 的 `spawnSync('npm')` 返回 `ENOENT`；Node 版本不足是另一个独立环境问题。
- 上述结果为 2026-09-08 迁移前复测；迁移后类型检查、文档链接检查和隔离报告生成均通过。当前不具备全绿的发布验证结果。

历史文档中的 `READY_WITH_LIMITATIONS` 是 2026-09-07 快照；已实现修复见 [`doc/operations/LOCAL_RELEASE_FIXES.md`](doc/operations/LOCAL_RELEASE_FIXES.md)，当前验证结果以上述 2026-09-08 记录为准。

文档分类入口：[`doc/README.md`](doc/README.md)。
