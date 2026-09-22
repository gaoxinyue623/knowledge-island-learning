# PHASE 19.1：Learning Agent Backend Foundation

日期：2026-09-21。

本增量把 Learning Agent 的本地后端传输边界从 Vite 专用中间件抽出为独立 Node 服务。生成逻辑仍复用 PHASE 18 的 `generateDevQuestions`、LLM Runtime、Prompt Registry、Structured Output 和完整 Validator；没有接入正式学生流程，也没有引入 FastAPI 或 PostgreSQL。

## PHASE 19.2：实验室接入独立服务

开发页 REAL_LLM 现在请求 `/api/agent/questions`，不再依赖 Vite 专用的 `/api/dev/learning-agent/questions`。Vite 只负责代理到独立服务；`npm run agent:server` 与 `npm run dev` 需要分别运行。独立进程按 `.env`、`.env.local`、开发环境文件和进程环境加载服务端配置，浏览器仍只获得健康状态和生成结果，不会获得 `LLM_API_KEY`、Base URL 或 Prompt。

服务启动时会拒绝非 loopback 的绑定地址、Origin 和非法端口。请求体读取有 64 KiB 上限和 10 秒超时，JSON Content-Type 支持参数，服务返回统一错误代码。开发页仍保留明确的配置回退和网络不可用状态。

验证：Node.js 24.20.0 下独立服务、Vite BFF 兼容回归和开发页相关测试通过；`type-check` 与生产构建通过。真实供应商联网验收仍使用 PHASE 18.3 runner，不因本次传输接入而视为通过。

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
