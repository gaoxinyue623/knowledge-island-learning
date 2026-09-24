# 知识岛学习

面向小学阶段的课程、学习地图、课堂播放、练习与掌握度体验原型。项目文档已按职责整理到 [`doc/README.md`](doc/README.md)，根目录保留运行入口和工程状态。

## 技术栈与环境

- Vue 3、TypeScript、Vite、Vue Router、Pinia
- Vitest、Vue Test Utils、JSDOM
- Node.js `>=24.0.0`

生产镜像使用 Node.js 24。2026-09-24 已修复 Node.js 26.7.0 下的 JSDOM 存储测试兼容问题；最新完整验证见 [PHASE28](doc/history/PHASE28.md)，未修改本机全局 Node 安装。

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

开发入口：`/agent`（短路径，跳转到 `/dev/learning-agent`），无需模型 API Key。主项目首页和“我的知识岛”在本地开发模式下也提供 Agent 实验室入口。包含确定性决策、受约束 Mock 生成、独立校验、答题证据闭环、Trace 和 A～H 场景模拟；正式学生入口为 `/learning-agent`，并复用 `/assessment` 完成正式答题。开发模拟与正式学生流程保持隔离。架构、复用边界和验证见 [PHASE17](doc/history/PHASE17.md)。

运行场景评估：`npm run agent:evaluate`。2026-09-17 验证：Node.js 24.20.0 下 70 个测试文件、824 项测试通过（其中 Agent 专项 65 项）；类型检查、lint、生产构建和 A～H 场景评估通过。

## PHASE 19 Learning Agent 本地服务

REAL_LLM 实验室使用独立的本地服务。开发时另开终端运行 `npm run agent:server`，再运行 `npm run dev`；服务从被忽略的 `.env.local` 读取 `LLM_*` 配置，浏览器不会接触 API Key。服务默认监听 `127.0.0.1:8788`，仅接受本机来源；服务状态可通过 `GET /api/agent/health` 检查。详细边界见 [PHASE19](doc/history/PHASE19.md)。

FastAPI 网关已提供可选实现。安装 `requirements-fastapi.txt` 后，将 `AGENT_API_BACKEND=FASTAPI` 写入 `.env.local`，启动 `npm run agent:server` 和 `npm run agent:fastapi`，再启动前端。FastAPI 默认监听 `127.0.0.1:8789`，负责安全校验、并发限制和错误归一化，并把生成请求转发给现有 Node Agent 核心；这样可以逐步迁移 Python 业务而不复制题目校验逻辑。

FastAPI 还支持本地运行摘要存储，但默认关闭。设置 `FASTAPI_AGENT_RUN_PERSISTENCE=true` 后，可通过 `/api/agent/runs` 查看最近运行状态；SQLite 只保存有限元数据，不保存题面、学生上下文、Prompt、模型原文或凭据。

## 当前验证状态

- 2026-09-08 学生体验分支在 Node.js 24.20.0 下验证：build、lint、68 个测试文件中的 759 项测试全部通过，runtime 专项 2 项通过。
- Windows 下 npm 子进程启动和 TTS 缓存路径断言已修复；`npm run release:check` 退出码为 0，结果为 `READY_WITH_LIMITATIONS`。
- 间隔复习、本领册、周计划、宠物故事、档案恢复和家庭同步已通过独立审查及 320px、390px 浏览器检查；双设备冲突和恢复使用临时本地服务验证。
- 当前边界：8 节内容不计自动判分覆盖，豆包语音限本地开发，家庭云同步需要部署后端；正式 Agent 可绑定云端档案并自动上传，跨设备恢复仍需家长确认；三年级为 9 节原创拓展短课，暂未教师校审。尚未完成生产部署、真机手机及学生试用。

真实模型验收记录见 [PHASE20](doc/history/PHASE20.md)。验收命令示例：`npm run llm:evaluate -- --batches=5 --batch-size=20 --chunk-size=5 --timeout-ms=60000 --prompt-version=7 --temperature=0 --thinking=disabled`。报告会区分 REAL_LLM_ONLY 与 SYSTEM_FINAL；人工抽查保持 PENDING 时，报告不会标记为通过。

Agent 实验室现支持 [PHASE21 个性化学习计划](doc/history/PHASE21.md)：可在 SAMPLE 隔离环境中创建 1–5 组任务、逐题提交答案、查看判分与解释，并根据本组 Evidence / Mastery 安排下一组。该功能尚未接入正式学生档案和每日计划。

PHASE22 增加学习复盘：计划完成后可查看新增 Evidence、掌握度前后变化、错题回顾和下一步决策依据，并从本次内存快照继续练习。复盘不会写入正式学生档案。

PHASE23 增加隔离计划会话恢复：开发页刷新后可恢复未完成的 SAMPLE 题组、已完成任务和复盘状态。检查点仅保存在当前浏览器会话中，存储不可用时不影响计划运行。

PHASE24 增加断点续答：会话恢复会保留当前题号和数字草稿，并提供“保存并暂停”。检查点会重新校验题目和 SAMPLE 快照，不进入正式学习事实。

PHASE25 建立正式运行时只读决策边界：Agent 可以读取审核通过的正式 Profile 数据并返回下一步决策。PHASE26 增加正式执行服务，PHASE27 已将决策、已审核题目和 Evidence / Mastery 写入接入学生页面；入口为 `/learning-agent`，开发模拟仍使用 `/agent`。

本批功能、入口与分项提交见 [学生持续学习功能验收](doc/product/STUDENT_GROWTH_IMPLEMENTATION.md)，路线图见 [学生学习体验改进](doc/product/STUDENT_LEARNING_ROADMAP.md)。历史修复见 [本地正式课程与学习流程修复](doc/operations/LOCAL_RELEASE_FIXES.md)。

文档分类入口：[`doc/README.md`](doc/README.md)。

## PHASE28 多设备同步与 UCloud 部署准备

正式 Agent 支持数学、语文、英语切换，按当前学生已配置教材显示科目；默认顺序仍为数学 → 语文 → 英语。家庭档案预览上传时可勾选自动同步，正式 Agent 完成学习后自动上传完整快照，冲突时保留本机记录。其他学习流程仍可手动同步。

本地容器启动：

```sh
docker compose --env-file deploy/local.env.example -f docker-compose.production.yml up -d --build
```

访问 http://localhost:8081 。[UCloud 部署说明](doc/operations/UCLOUD_DEPLOYMENT.md) 提供无域名预览、HTTPS 配置、持久化和备份步骤；[电脑/手机/学生试用清单](doc/operations/DEVICE_STUDENT_ACCEPTANCE.md) 用于实际验收。当前尚未发布 UCloud，也未完成真实学生和手机真机试用。
