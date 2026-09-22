# 知识岛学习

面向小学阶段的课程、学习地图、课堂播放、练习与掌握度体验原型。项目文档已按职责整理到 [`doc/README.md`](doc/README.md)，根目录保留运行入口和工程状态。

## 技术栈与环境

- Vue 3、TypeScript、Vite、Vue Router、Pinia
- Vitest、Vue Test Utils、JSDOM
- Node.js `>=24.0.0`

2026-09-17 本机默认 Node.js 为 `26.7.0`；项目回归继续使用 `24.20.0`，未修改全局安装。Node.js 26 的全局 localStorage 与现有 JSDOM 测试存在兼容问题，验证请使用 Node.js 24.20.0。

## 快速开始

```sh
npm ci
npm run dev
```

可选的家长账号、家庭档案与宠物备份服务需另开终端：

```sh
npm run server
npm run dev
```

服务默认监听 `127.0.0.1:8787`，前端通过 `/api/pet` 代理访问；开发期间可使用 `npm run server:dev` 自动重启。家庭完整档案同步与数据库升级说明见 [家庭档案服务运维](doc/operations/STUDENT_FAMILY_ARCHIVES.md)，宠物接口见 [宠物后端](doc/operations/PET_BACKEND.md)。

## 常用命令

```sh
npm run build
npm run lint
npm run test
npm run curriculum:review
npm run release:check
```

## PHASE 18.1–18.3 LLM 题目生成

`/dev/learning-agent` 已支持 MOCK / REAL_LLM。真实调用经仅本机开发环境开放的 BFF，包含严格 Zod 输出、独立数学验证、最多两次修复、部分成功保留、显式 Mock 回退和 Usage / Trace。Planner 与正式学生流程保持原边界。

在忽略的 `.env.local` 中配置服务端 `LLM_PROVIDER / LLM_BASE_URL / LLM_API_KEY / LLM_MODEL` 后重启开发服务；禁止 `VITE_LLM_API_KEY`。完整配置、支持范围与联网验收限制见 [PHASE18](doc/history/PHASE18.md)。

## PHASE 17 教育 Agent 基础架构

开发入口：`/agent`（短路径，跳转到 `/dev/learning-agent`），无需模型 API Key。主项目首页和“我的知识岛”在本地开发模式下也提供 Agent 实验室入口。包含确定性决策、受约束 Mock 生成、独立校验、答题证据闭环、Trace 和 A～H 场景模拟；正式学生页面尚未接入。架构、复用边界和验证见 [PHASE17](doc/history/PHASE17.md)。

运行场景评估：`npm run agent:evaluate`。2026-09-17 验证：Node.js 24.20.0 下 70 个测试文件、824 项测试通过（其中 Agent 专项 65 项）；类型检查、lint、生产构建和 A～H 场景评估通过。

## PHASE 19 Learning Agent 本地服务

REAL_LLM 实验室使用独立的本地服务。开发时另开终端运行 `npm run agent:server`，再运行 `npm run dev`；服务从被忽略的 `.env.local` 读取 `LLM_*` 配置，浏览器不会接触 API Key。服务默认监听 `127.0.0.1:8788`，仅接受本机来源；服务状态可通过 `GET /api/agent/health` 检查。详细边界见 [PHASE19](doc/history/PHASE19.md)。

## 当前验证状态

- 2026-09-08 学生体验分支在 Node.js 24.20.0 下验证：build、lint、68 个测试文件中的 759 项测试全部通过，runtime 专项 2 项通过。
- Windows 下 npm 子进程启动和 TTS 缓存路径断言已修复；`npm run release:check` 退出码为 0，结果为 `READY_WITH_LIMITATIONS`。
- 间隔复习、本领册、周计划、宠物故事、档案恢复和家庭同步已通过独立审查及 320px、390px 浏览器检查；双设备冲突和恢复使用临时本地服务验证。
- 当前边界：8 节内容不计自动判分覆盖，豆包语音限本地开发，家庭云同步需要自行部署后端并手动发起；三年级为 9 节原创拓展短课，暂未教师校审。尚未完成生产部署、真机手机及学生试用。

本批功能、入口与分项提交见 [学生持续学习功能验收](doc/product/STUDENT_GROWTH_IMPLEMENTATION.md)，路线图见 [学生学习体验改进](doc/product/STUDENT_LEARNING_ROADMAP.md)。历史修复见 [本地正式课程与学习流程修复](doc/operations/LOCAL_RELEASE_FIXES.md)。

文档分类入口：[`doc/README.md`](doc/README.md)。
