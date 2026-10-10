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
npm run dev:all
```

`dev:all` 同时启动前端、家庭/宠物 API 和 Agent API，读取本地环境配置；启用 `AGENT_API_BACKEND=FASTAPI` 时也会启动 Python 网关（需先安装 `requirements-fastapi.txt`）。访问 http://127.0.0.1:5173 。按 Ctrl+C 会一起关闭本次启动的服务；任一服务启动失败或端口被占用时会退出，避免只启动部分服务。前端固定使用 5173，避免自动换端口后与后端允许来源不一致。

正式学习入口现在需要登录和账号 API，建议使用 `npm run dev:all`。单独运行 `npm run dev` 只启动前端，无法完成登录；开发实验室仍可单独调试。不要将 `dev:all` 与下面的分开启动命令同时运行。

也可以分开启动账号 API 与前端：

```sh
npm run server
npm run dev
```

服务默认监听 `127.0.0.1:8787`，前端通过 `/api/pet` 代理访问；开发期间可使用 `npm run server:dev` 自动重启。家庭完整档案同步与数据库升级说明见 [家庭档案服务运维](doc/operations/STUDENT_FAMILY_ARCHIVES.md)，宠物接口见 [宠物后端](doc/operations/PET_BACKEND.md)。

## 登录、注册与账号数据

- 统一入口 `/login`、`/register`；正式学习页面需要登录，新账号进入教材与角色设置，已有账号自动恢复记录。既有家长账号可以直接使用。
- 教材设置按“年级和册次 → 各科教材版本 → 角色”进行，不填写地区。已导入教材对所有账号开放；单一版本默认选中，多版本由用户确认。学习设置可修改年级、册次或单科版本，旧账号的教材选择和学习记录保留。
- 二年级下册数学提供北师大 2013 旧版和 2024 新课标改版两个独立选项，目录与版次按用户提供的信息录入。旧版 41 个、新版 37 个学习节点覆盖练习、整理复习与总复习，配有 234 道项目原创题；学习地图、正式练习和真实模型编排均按所选版本取题。各版本的知识点、题目与学习进度独立；这些内容是原创配套课程，不是出版社原书全文或原题。
- 二年级下册英语已接入《英语口语交际》（沪教牛津 2024 新版·深圳用，上海教育出版社；教材标注来自用户）。6 个单元包含上传的 31 个双语栏目、40 个重点词汇和 6 组核心句型，配有 18 道原创词义、对话和故事理解题，并复用英语跟读、拼写、配对与组句训练。单一版本可直接选择；未提供的栏目如实标注，口头表达不自动评分。原始上传文本与校验摘要保存在 `src/data/curriculum/grade-2/shenzhen-english-lower/`。
- `/account` 可查看同步状态、立即同步、退出、下载或恢复账号备份；首页顶部和“我的”页均有入口。
- 学习进度、课程与题组会话、掌握度、错题、复习、成长奖励、学习计划、阅读与思维训练、宠物背包、家庭档案和偏好设置均按账号隔离并自动保存。AI 专项继续直接保存在服务端，并使用恢复后保持不变的学习档案 ID。
- 登录时可勾选绑定此前的本机记录，仅限空账号；原始记录保留，每份旧数据只能认领一次。已有云端数据不会被旧本机记录直接覆盖。
- 每次本机变更后约 1.2 秒自动同步，联网、返回页面及每 30 秒重试或检查更新。退出前同步；尚未同步成功时保留本机数据并提示。登录和首次云端恢复需要网络连接。
- 多设备修改采用版本检查，冲突不会静默覆盖；用户选择版本前下载另一份备份，可通过账号页面恢复。账号快照不包含密码、Cookie、API Key、临时 Agent 启动参数或恢复日志。
- HTTP API：`GET/PUT /api/pet/account/data`，仅访问会话所属账号，写入需 `expectedRevision`。Nginx 和 API 请求体上限 8 MiB，快照内容最多 6 Mi 字符、4,000 个学习存储项、100 份宠物档案。
- 密码使用既有 scrypt 散列，登录使用 HttpOnly / SameSite Cookie，生产开启 Secure；注册、登录有限流。当前不提供邮箱验证和自助密码找回，请妥善保管凭据。

验收和数据库迁移见 [账号登录与同步验收](doc/operations/ACCOUNT_AUTH_RELEASE_2026-09-28.md)。

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
- 当前边界：豆包语音限本地开发，账号登录和自动同步需要部署后端；首次登录自动恢复账号数据，存在双端修改时由家长选择版本；三年级为 9 节原创拓展短课，暂未教师校审。尚未完成生产部署、真机手机及学生试用。

真实模型验收记录见 [PHASE20](doc/history/PHASE20.md)。验收命令示例：`npm run llm:evaluate -- --batches=5 --batch-size=20 --chunk-size=5 --timeout-ms=60000 --prompt-version=7 --temperature=0 --thinking=disabled`。报告会区分 REAL_LLM_ONLY 与 SYSTEM_FINAL；人工抽查保持 PENDING 时，报告不会标记为通过。

Agent 实验室现支持 [PHASE21 个性化学习计划](doc/history/PHASE21.md)：可在 SAMPLE 隔离环境中创建 1–5 组任务、逐题提交答案、查看判分与解释，并根据本组 Evidence / Mastery 安排下一组。该功能尚未接入正式学生档案和每日计划。

PHASE22 增加学习复盘：计划完成后可查看新增 Evidence、掌握度前后变化、错题回顾和下一步决策依据，并从本次内存快照继续练习。复盘不会写入正式学生档案。

PHASE23 增加隔离计划会话恢复：开发页刷新后可恢复未完成的 SAMPLE 题组、已完成任务和复盘状态。检查点仅保存在当前浏览器会话中，存储不可用时不影响计划运行。

PHASE24 增加断点续答：会话恢复会保留当前题号和数字草稿，并提供“保存并暂停”。检查点会重新校验题目和 SAMPLE 快照，不进入正式学习事实。

PHASE25 建立正式运行时只读决策边界：Agent 可以读取审核通过的正式 Profile 数据并返回下一步决策。PHASE26 增加正式执行服务，PHASE27 已将决策、已审核题目和 Evidence / Mastery 写入接入学生页面；入口为 `/learning-agent`，开发模拟仍使用 `/agent`。

本批功能、入口与分项提交见 [学生持续学习功能验收](doc/product/STUDENT_GROWTH_IMPLEMENTATION.md)，路线图见 [学生学习体验改进](doc/product/STUDENT_LEARNING_ROADMAP.md)。历史修复见 [本地正式课程与学习流程修复](doc/operations/LOCAL_RELEASE_FIXES.md)。

文档分类入口：[`doc/README.md`](doc/README.md)。

## PHASE28 多设备同步与 UCloud 部署准备

正式 Agent 支持数学、语文、英语切换，按当前学生已配置教材显示科目；默认顺序仍为数学 → 语文 → 英语。原有家庭档案手动备份入口继续保留；日常学习现已使用下述统一账号自动同步。

本地容器启动：

```sh
docker compose --env-file deploy/local.env.example -f docker-compose.production.yml up -d --build
```

访问 http://localhost:8081 。[UCloud 部署说明](doc/operations/UCLOUD_DEPLOYMENT.md) 提供无域名预览、HTTPS 配置、持久化和备份步骤；[电脑/手机/学生试用清单](doc/operations/DEVICE_STUDENT_ACCEPTANCE.md) 用于实际验收。当前尚未发布 UCloud，也未完成真实学生和手机真机试用。

### 正式页面的 AI 计算专项

正式知识点页面和 Agent 学习建议页已接入真实模型出题。当前开放一年级上册、下册及二年级上册中明确配置的加减计算知识点，范围由 `src/services/formal-ai/contract.ts` 的规则控制。其他知识点继续使用已审核内容。

- 从正式数学知识点进入「AI 计算专项」，家长登录或注册后生成 3 道题。
- 请求走 `/api/pet/ai/*`，复用家长账号的 HttpOnly 会话、同源检查和账号绑定，无需在生产环境开放开发 Agent 接口。
- 模型只收到服务端解析的知识点、运算约束和随机种子，不接收孩子的姓名、档案、答案或登录凭据。
- 后端独立验算答案、范围、进退位和重复题；任何错误整批拒绝，不使用 Mock 补齐。
- 答案提交前不下发解答；判分、幂等提交、作答及练习恢复均在 SQLite 中完成。AI 记录属于自动校验的专项练习，不标记为人工审核，也不自动写入课程掌握度、奖励或正式错题本。
- 每账号每小时最多 10 次、滚动 24 小时最多 30 次生成尝试；全服务滚动 24 小时最多 300 次；单进程最多同时生成 2 组、每账号 1 组。失败尝试也占额度，额度与幂等记录持久化。当前部署为单 API 实例，不支持横向扩容后的全局并发协调。

本地在忽略提交的 `.env.local` 配置 `FORMAL_AI_ENABLED=true`、`LLM_PROVIDER=OPENAI_COMPATIBLE` 和真实的 `LLM_BASE_URL`、`LLM_API_KEY`、`LLM_MODEL`，然后重启 `npm run dev:all`。开启 AI 但模型配置无效时，API 拒绝启动。

生产环境通过受保护的服务器环境文件或密钥管理服务提供这些 **server-only** 环境变量，不使用 `VITE_*` 存放密钥。Compose 已向 API 容器传入模型配置，Nginx 已将响应等待时间设为 75 秒；单次模型调用最长 45 秒，不自动重试。`FORMAL_AI_ENABLED` 默认关闭，发布时需要显式启用。现有 `deploy/Caddyfile` 负责公网 HTTPS，`PET_ALLOWED_ORIGINS` 必须与真实 HTTPS 域名一致。

```sh
docker compose --env-file /secure/path/knowledge-island.env \
  -f docker-compose.production.yml -f docker-compose.ucloud.yml up -d --build
```

发布前备份 SQLite 数据文件和 WAL。数据库将自动升级到版本 4（保留原表、AI 会话及记录，新增 `account_data` 账号快照表）；旧版 API 会拒绝打开更高版本数据库，回退应恢复发布前备份，不能手动降低版本号。
