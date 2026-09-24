# PHASE 19.1：Learning Agent Backend Foundation

日期：2026-09-21。

本增量把 Learning Agent 的本地后端传输边界从 Vite 专用中间件抽出为独立 Node 服务。生成逻辑仍复用 PHASE 18 的 `generateDevQuestions`、LLM Runtime、Prompt Registry、Structured Output 和完整 Validator；没有接入正式学生流程，也没有引入 FastAPI 或 PostgreSQL。

## PHASE 19.2：实验室接入独立服务

开发页 REAL_LLM 现在请求 `/api/agent/questions`，不再依赖 Vite 专用的 `/api/dev/learning-agent/questions`。Vite 只负责代理到独立服务；`npm run agent:server` 与 `npm run dev` 需要分别运行。独立进程按 `.env`、`.env.local`、开发环境文件和进程环境加载服务端配置，浏览器仍只获得健康状态和生成结果，不会获得 `LLM_API_KEY`、Base URL 或 Prompt。

服务启动时会拒绝非 loopback 的绑定地址、Origin 和非法端口。请求体读取有 64 KiB 上限和 10 秒超时，JSON Content-Type 支持参数，服务返回统一错误代码。开发页仍保留明确的配置回退和网络不可用状态。

验证：Node.js 24.20.0 下独立服务、Vite BFF 兼容回归和开发页相关测试通过；`type-check` 与生产构建通过。真实供应商联网验收仍使用 PHASE 18.3 runner，不因本次传输接入而视为通过。

## PHASE 19.3：FastAPI 网关

新增 `python_agent/` FastAPI 网关作为可选 Python 服务层。它复用现有 Node Agent 核心作为上游，避免在迁移阶段复制 Prompt、LLM Runtime、题目 Schema 和数学 Validator。网关提供同一组 `GET /api/agent/health`、`POST /api/agent/questions` 契约，执行 loopback 来源校验、JSON / 64 KiB 请求体限制、并发上限、上游超时和错误归一化；健康响应不包含 API Key。

安装与启动：

```sh
python3 -m pip install -r requirements-fastapi.txt
# 在被忽略的 .env.local 中设置 AGENT_API_BACKEND=FASTAPI
npm run agent:server
npm run agent:fastapi
npm run dev
```

Vite 通过 `AGENT_API_BACKEND` 选择 Node（默认 `8788`）或 FastAPI（默认 `8789`）。FastAPI 当前是网关，不代表 Python 已经取代 Node 领域核心；正式迁移前仍需为 Python 版 Generator、Validator 和持久化边界分别建立等价测试。

验证：`npm run agent:fastapi:test` 运行 9 项 Python 测试，覆盖 dotenv 优先级、绑定地址、健康检查、来源边界、chunked 请求体、超时、并发、上游转发、错误脱敏，以及 FastAPI → Node 核心的本地集成。

## PHASE 19.4：Agent 运行摘要存储

FastAPI 可选启用本地 SQLite 运行摘要：`FASTAPI_AGENT_RUN_PERSISTENCE=true`。只记录服务端生成的 UUID、时间、有限状态枚举、provider、是否回退、错误代码、题目数量和耗时；不会写入 profileId、requestId、学生上下文、题面、Prompt、原始模型响应、HTTP 头或凭据。默认关闭，因此原有内存开发流程仍不产生持久化。

启用后新增：

- `GET /api/agent/runs?limit=20`：读取最近 1–100 条运行摘要。
- `GET /api/agent/runs/:runId`：读取单条摘要。
- 响应使用 `X-Agent-Run-Id` 标识本次生成，SQLite 文件创建为本机私有权限并保留最近 1000 条记录。

读取接口仍只接受 loopback 和受信任本地来源；数据库版本和字段枚举不匹配时服务拒绝启动，不会自动改写已有文件。记录失败不会让已经完成的模型生成失败，也不会触发浏览器重试。

验证：`npm run agent:fastapi:test` 运行 17 项 Python 测试，覆盖数据库重启读取、保留上限、版本保护、权限、敏感字段隔离、查询授权、生成失败记录和存储故障降级。

## 接口

- `GET /api/agent/health`：返回服务状态、provider、model 和是否完成服务端配置；不会返回 API Key。
- `POST /api/agent/questions`：仅允许 loopback、受信任本地 Origin、JSON 和 `X-Knowledge-LLM: 1`，请求体上限 64 KiB，并发上限 2。
- 未知路径返回统一 `AGENT_NOT_FOUND`；服务关闭开发路由时生成接口返回 `AGENT_ACCESS_DENIED`。

启动：

```sh
npm run agent:server
```

默认监听 `127.0.0.1:8788`，Vite 开发服务器已代理 `/api/agent`。可用 `AGENT_API_HOST`、`AGENT_API_PORT` 和 `AGENT_ALLOWED_ORIGINS` 调整本地绑定。

## 安全边界

服务端读取 `LLM_*` 配置，浏览器不接触 Key、Base URL 或 Prompt。健康检查只返回 provider/model 元数据。请求失败统一返回错误代码，不回显上游异常、请求内容或凭据。

## 验证

`tests/learning-agent-server.test.ts` 覆盖健康检查、Key 隔离、本地来源校验、路由边界和开发路由开关。当前服务仍是本地开发后端；认证、持久化和正式学生 API 留待后续阶段。
