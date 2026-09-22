# PHASE 18.1–18.3：LLM Runtime、结构化输出与真实题目生成

日期：2026-09-17。范围止于真实 Question Generator，未进入正式学生流程；不修改 Planner、Strategy、Mastery / Evidence 算法，不新增 AI Content Generator。

## 架构与接入

```text
确定性 LearningPlanner → QuestionGenerationRequest
  → QuestionGeneratorProvider
      ├─ MOCK：原 MockQuestionGenerator / 模板引擎
      └─ REAL_LLM：DevQuestionGeneratorClient
          → 本机 Vite BFF → AIQuestionGenerator
          → PromptRegistry / QuestionGenerationPromptBuilder
          → LLMRuntime → LLMProvider → OpenAICompatibleLLMProvider
          → JSON Parse / Zod → 现有 Question Adapter
          → Phase 17 GeneratedQuestionValidator → READY / REJECTED / FALLBACK
  → QuestionGenerationService 再次独立验证 → Orchestrator
```

- `src/types/llm.ts`：Provider 能力、Structured Request / Result、错误类别、Usage、Pricing 扩展和生成遥测。
- `src/services/llm/`：Runtime、错误归一化、严格 Zod Schema、MockLLMProvider、Prompt Registry / Builder；不包含 HTTP 厂商实现。
- `server/llm/`：服务端配置、OpenAI-compatible `/chat/completions` 适配器、可信模拟课程 BFF handler。
- `scripts/llm/vitePlugin.ts`：仅开发 server 注册 `POST /api/dev/learning-agent/questions`。
- `src/services/learning-agent/aiQuestionGenerator.ts`：实现原 Provider 接口，逐题验证、修复和有界回退。
- `generatedQuestionValidator.ts` 增量复用原 Schema、课程、知识映射、模板语义、答案、难度、去重和安全校验。未知 Provider 仍须审核。
- Simulation / Store 仅增加 Provider mode 注入；Orchestrator 把生成遥测接入原 Trace，资源放行规则不变。

## 配置和运行

在已有的、被 Git 忽略的 `.env.local` 中添加以下服务端变量，然后重启 `npm run dev`。不要覆盖已有配置。示例值均为占位符：

```dotenv
LLM_PROVIDER=OPENAI_COMPATIBLE
LLM_BASE_URL=https://your-compatible-provider.example/v1
LLM_API_KEY=placeholder
LLM_MODEL=your-model-name
LLM_NATIVE_STRUCTURED_OUTPUT=true
LLM_TIMEOUT_MS=30000
LLM_MAX_RETRIES=2
```

`baseURL` 是 API 根地址，适配器在末尾添加 `/chat/completions`。不硬编码供应商或模型。远程地址要求 HTTPS；本机模型允许 localhost / 127.0.0.1 / ::1 的 HTTP。禁止重定向转发 Authorization。

打开 `/dev/learning-agent`，选择 `REAL_LLM`，点击 Run Agent。默认页面 mode 与未设置的服务端 provider 都是 MOCK。选择 REAL_LLM 但缺少完整配置时，明确记录 `CONFIG_ERROR` 并回退模板题；不会假装调用了真实模型。

Vite 会把 `VITE_*` 注入浏览器，因此本实现使用 **server-only `LLM_*`**，不兼容密钥的公开前缀。`VITE_LLM_API_KEY` 非空时 dev/build 直接拒绝启动，并提示迁移到 `LLM_API_KEY`；其他 `VITE_LLM_PROVIDER / BASE_URL / MODEL` 不作为服务端配置使用。`.env.example` 只有占位值；所有 `.env.*`（除 example）均被忽略且禁止 Vite 静态读取。

BFF 只允许 loopback TCP 来源、HTTP loopback Origin 与 Host 完全匹配、JSON POST 和 `X-Knowledge-LLM: 1`。请求体上限 64 KiB、读取上限 10 秒，同时最多两次生成。生产 build / preview 不安装该接口；关闭开发路由也关闭 BFF。浏览器没有可配置的 Key、Base URL、Model 或 Prompt 输入框。

## 结构化输出与 Prompt

Schema 版本为 `question-generation.v1`。LLM wire DTO 使用严格对象，仅包含：

```json
{
  "questions": [{
    "temporaryId": "q1",
    "questionType": "calculation",
    "stem": "52 - 27 = ?",
    "expectedAnswer": 25,
    "explanation": "从 52 中去掉 27，还剩 25。",
    "knowledgePointIds": ["AGENT_KP_CURRENT"],
    "difficulty": 0.7
  }]
}
```

DTO 只是传输协议，适配到既有 Question / QuestionKnowledgePoint，不建立第二套题目领域。第一版仅支持数学计算题；选择题、应用题及自由解释不自动放行。`difficulty` 必须与请求数值完全相同，并继续绑定原模板难度。

Prompt Registry 保存 system、user、repair 三个不可变定义，ID 分别为：

- `question-generation.system.v1`
- `question-generation.user.v1`
- `question-generation.repair.v1`

每个定义都有 version、task、schemaVersion。输入只包含可信教材名称、年级、学期、科目、目标知识点、允许模板范围、难度、数量、题型、题目比例，以及白名单弱项 / 错误代码、最多 100 条近期算式摘要。不会发送 profileId、原始 requestId、seed、学生姓名、整份课程或历史。Runtime 使用新的不透明请求 ID；第三方 HTTP body 不含领域请求 ID。修复仅携带失败算式/数值、校验代码和不可修改的已接受算式；不回传任意模型文本作为指令。

原生模式使用 `response_format: { type: 'json_schema', json_schema: { name, strict: true, schema } }`。不支持此能力的兼容服务应设置 `LLM_NATIVE_STRUCTURED_OUTPUT=false`，改用严格 JSON 指令且不发送 response_format。两条路径均进行 JSON Parse 和本地 Zod 校验；不接受 Markdown 代码围栏、不剥离非法额外字段、不自动把字符串答案转换为数字。不会在未知供应商报错后自动猜测切换协议。

协议参考：[OpenAI Docs — Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)。兼容供应商对 JSON Schema 支持仍需实际验证。

## 数学与安全放行边界

沿用 `DeterministicAnswerValidator` 从完整可见算式解析运算，独立重算答案，不使用 eval 或 LLM 自评。

- 数值：整数，操作数和结果均受 minNumber / maxNumber 约束；REAL_LLM 默认 0～100，同时不能突破原模板范围。
- 运算：AllowedOperations；当前自动放行只允许加减。
- 进位：加法且两个个位之和 ≥ 10。
- 借位：减法且被减数个位 < 减数个位。
- 课程绑定：目标 KP 和难度必须匹配已授权模板；仅 demo / SAMPLE，保持 AI_GENERATED、needsVerification 和 DRAFT 映射。
- 默认从可信知识点名称识别进位/退位要求；模板为个位数的 SIMPLIFY 基础练习不强制借位。请求可以显式给出数学约束；无法满足时拒绝，不偷偷放宽模板。
- 解析只接受 Phase 17 的标准、可核对中文算式解释格式。非标准说明、额外 hint、HTML、媒体、链接继续拒绝或进入 REQUIRES_REVIEW；不会把未验证的解释直接展示。

这仍然是受限制的开发样本能力，不代表正式教材内容审核或通用语义理解已完成。

## Retry、Repair、部分成功和 Fallback

**Runtime retry** 仅用于 network、timeout、429、408、临时 500/502/503/504。默认一次初始请求加最多两次重试，退避 250ms、500ms；有界配置且时钟/等待可注入。每次调用默认 30 秒，通过 AbortController 取消；即便 Provider 不响应取消，Runtime 也会按时失败。上游响应上限 256 KiB。不把鉴权、永久模型错误或题目业务错误当成网络重试。

**Generation attempts = 3 总次数**：initial + repair 1 + repair 2。解析、Schema、答案、知识点、难度、约束、数量不足、重复、安全问题进入修复。保留已经 VALID 的题目和 ID，只请求缺少的数量；即使整批 Schema 失败，也逐个严格解析可恢复的兄弟题。超额输出被丢弃，不能覆盖已接受题。

每次 generation 最多三次 transport，因此最坏上界为九次上游调用。不可修复的配置、鉴权或耗尽的传输故障直接结束 generation 并回退，避免再次花费三轮网络重试。

耗尽尝试后，记录 `fallbackUsed=true` 和 `fallbackReason`，仅用既有 MockQuestionGenerator 为缺失位置补题。最多检查 300 个模板候选，所有题仍按完整 REAL_LLM 数学约束和原 Validator 校验；约束冲突或题库容量不足时返回 REJECTED，Orchestrator 隐藏生成资源。不会为凑数量降低标准。最终成功的混合批次保留原生成器元数据，题目 ID 与遥测明确区分原 AI 题和模板补题。

浏览器→BFF 网络故障属于服务不可用，页面显示 `LLM_DEV_SERVICE_UNAVAILABLE` 并隐藏资源；有服务端生成结果时才能显示该结果的模型 fallback 信息。

## Usage、Trace 与隐私

每一次 transport 调用（含失败和重试）产生独立 `LLMUsageRecord`：provider、model、promptId/version、schemaVersion、tokens、latencyMs、retryCount、repairCount、status/errorType、createdAt。每条 latency 仅统计该次调用，不含退避。SUCCESS 表示结构化输出成功，题目业务校验结果看 generation status。未知 token 留空，未知价格不填，`LLMPricingResolver` 可后续注入。

扩展原 Trace 包括 REQUEST_CREATED/STARTED、RESPONSE_RECEIVED、STRUCTURED_OUTPUT_PARSED/INVALID、QUESTION_VALIDATION_STARTED/FAILED、QUESTION_REPAIR_STARTED/COMPLETED、QUESTION_GENERATION_READY/FALLBACK。UI 显示 usage、修复次数和明确回退原因。无生成成功事件时不会显示 READY 题目。

日志和 Trace 不保存 Key、HTTP 头、原始响应或任意异常信息。只有本地短期错误对象保留非枚举的 Schema 失败数据用于兄弟题恢复，不序列化到浏览器。整个实验仍为内存模拟，不写 localStorage、学生档案或生产题库。

## 验证

新增 Runtime / AI Generator / BFF 测试，以及开发页 REAL_LLM 回退展示测试，覆盖：原生与指令 JSON、非法 Schema、HTTP 错误分类、超时取消和重试上限、修复上限、18 有效 + 2 失败保留、独立算术、进退位/范围/操作约束、去重、无效 fallback 拒绝、PII 最小化、同源/体积/并发/生产访问限制。本地 HTTP 测试经过真实 compatible adapter → Runtime → Prompt → Generator → Validator；原有 A～H 场景继续通过。

浏览器检查覆盖 MOCK、REAL_LLM 缺配置显式回退、已校验题目与用量展示；修复了浏览器 fetch 的调用绑定兼容问题。外部模型未配置 API Key / endpoint / model，**尚未进行真实供应商联网生成验收**。配置完成后，以 `status=READY`、`fallbackUsed=false`、实际 provider/model/usage 和全部 validation PASS 作为验收依据，不能把 FALLBACK 算作真实模型成功。

本次验收结果：Node 24.20.0 下 73 个测试文件、869 tests passed（原 824 + 新增 45）；type-check、lint、production build 通过；Agent Evaluation 8/8 通过。生产构建仍有既有的大 chunk 和 Zod 注释告警，无构建失败。以虚拟 Key 做隔离构建，确认服务端 Key 与 `/chat/completions` 适配器不进入前端产物，公开前缀 Key 被拒绝且错误不回显 Key。浏览器验证退位错误作答后仍由原确定性流程得到 REINFORCE → SIMPLIFY。

## PHASE 18.3.1：Real LLM Acceptance

新增 `npm run llm:evaluate -- --batches=1` 独立验收 runner。支持 `1 / 5 / 10 / 20 / 50` 批次，每批默认 20 道题；真实调用不会进入默认 `npm test`。runner 保存 `REAL_LLM_ONLY` 与 `SYSTEM_FINAL` 两套指标，并生成 40 道人工抽查样本（8 个场景各 5 道，结果初始为 `PENDING`）。四档难度 `0.20 / 0.40 / 0.60 / 0.80` 单独观测数值复杂度、进位/借位比例、题型复杂度、应用题比例和推理步骤比例。

2026-09-18 的一次真实验收样本如下：

| 项目 | 结果 |
| --- | --- |
| Provider / Model | `OPENAI_COMPATIBLE` / `deepseek-v4-flash-0731` |
| Prompt Version | `question-generation.user.v1@1`、`question-generation.repair.v1@1`（实际使用项以报告为准） |
| Golden Evaluation Sample | 8 场景 × 20 题 = 160 题；另有 4 档难度各 5 题 |
| REAL_LLM_ONLY | 120 / 160 题，First-pass Valid `74.375%`，Final Valid `75%` |
| SYSTEM_FINAL | 160 / 160 题，Final Valid `100%`（包含 Mock Fallback，不代表真实模型质量） |
| Math Correctness | REAL_LLM_ONLY `100%`；SYSTEM_FINAL `100%` |
| Knowledge Point Match | REAL_LLM_ONLY `100%` |
| Constraint Compliance | REAL_LLM_ONLY `100%` |
| Repair Rate / Success | `25.625%` / `2.44%` |
| Fallback Rate | `22.22%` |
| Exact / Normalized Duplicate | `0%` / `0%` |
| Average / P95 Latency | `49,123.8 ms` / `60,013 ms` |
| Input / Output Tokens | `6,475` / `17,306` |
| Human Review | 40 道已抽样，尚未完成 PASS / NEEDS_REVISION / REJECT 标注 |
| Acceptance Status | **FAIL** |

Blocking Gate 均通过：数学正确率 100%、超纲或无效题进入 READY 为 0、API Key 未进入报告、儿童安全违规为 0。Quality Gate 失败集中在 First-pass Valid、Final REAL_LLM Valid、Repair Rate、Repair Success 和 Fallback Rate。B（进位加法）与 G（错题变式）各整批超时并回退 Mock；因此不能把 SYSTEM_FINAL 的完整题量当作真实模型通过。难度观测的数值复杂度在 `0.80` 档回落，`gradientPassed=false`，需要后续优化 Prompt / 超时策略 / 变式约束后重新验收。

报告文件写入被 Git 忽略的 `.data/llm-evaluations/real-llm-2026-09-18T03-35-10-477Z.json`。本阶段判定为 **FAIL**，不进入 PHASE 19；人工抽查完成和质量指标修复后再重新运行同一 runner。

## PHASE 18.3.2：Real LLM Quality Hardening

### PHASE 18.3.2 ROOT CAUSE ANALYSIS

保留上文 18.3.1 的原始 FAIL 和原始 JSON，不回写历史指标。

- 原验收 160 个请求槽位只有 120 个真实题，B / G 两个场景缺失。49.1s 平均耗时、60.0s P95 与当时 60s 超时上限接近。原报告没有保存逐次调用或失败 DTO，因此不能从旧报告断言具体题目的 Validation Error，也不能确证每次超时的供应商内部原因。
- 5 题探测可成功。后续 `07-49-55-289Z-evidence.json` 在 4×5 分块下仍出现 5 次输出 token 恰好为 2048 的 `INVALID_RESPONSE`，另有一次 60s 超时。这是输出预算不足/截断的证据，旧探测尚未保存 `finish_reason`，因此只标为高度疑似，不伪称已确证。
- 4096 输出预算的 B 单批复测（`07-59-36-920Z`）20/20 首轮通过、无修复/回退；4 次响应均为 HTTP 200、`finishReason=stop`，其中一次实际消耗 3262 output tokens，超过先前 2048 上限。平均 24.6s，P95 43.5s。改善是局部证据，不代表全量通过。
- 旧 Repair Success = 1 / 41，把两批传输失败导致的 40 个缺失槽位也放入分母，无法单独衡量内容修复质量。新统计只把真正发起 content repair 的缺失槽位计入，timeout/network 重试独立记录。结构化响应/JSON 错误仍算需要修复的模型输出失败，不会从质量统计中消失。
- 原四档难度都是单步借位减法，只有 `difficulty` 数值，没有明确数值复杂度约束；实际平均复杂度 0.42 / 0.582 / 0.686 / 0.522，最高档回落。没有应用题或多步推理证据，不能声称已具备这些难度维度。

### Changes / Strategies

Provider / Model：UCloud ModelVerse，`OPENAI_COMPATIBLE` / `deepseek-v4-flash-0731`。沿用现有服务器环境配置，Key 不写入本文、报告或前端。

- **Chunk Strategy**：默认逻辑 20 题拆成顺序 4×5，每次最多一个请求；不足 5 题的尾块按实际数量生成。块间已接受题加入排重摘要，最后按原始 requestId/count 重新组装并执行完整 Validator。分块内部不会发布整体 READY 事件。
- **Provider**：每块至少 4096 输出 token 预算；未延长超时上限。Runtime 继续使用 AbortController，最多两次有限退避重试，仅处理 timeout/network/429/408/指定临时 5xx；内容修复最多两次，互相独立。30s 压力复测出现传输耗尽，另以原验收 60s 上限作同条件比较，不提高到 120s。
- **Prompt Version**：新增 `question-generation.system.v2` / `user.v2` / `repair.v2`，保留 v1；Schema 仍为 `question-generation.v1`。v2 增加操作数难度范围解释、错题两操作数必须变化以及精确题量要求，不放宽数学、知识点和课程范围。
- **Repair Strategy**：有效题保留，仅请求缺失槽位；输入仅含失败算式/答案、校验代码、年级/知识点及必要约束和去重摘要，不含完整 Student Context / WrongBook。修复输出仍逐题、逐块、整批校验。每题记录 REAL_LLM / MOCK 来源，fallback 不冒充模型成功。
- **Difficulty Strategy**：评估请求显式注入 `DifficultyProfile`：LOW 最大操作数 1–19、MEDIUM 20–49、UPPER 50–79、HIGH 80–99。程序独立验证上下限，并保留整数/答案 ≤100、进位/借位、运算和模板约束。这里仅验证同一借位知识点的数值梯度；应用题、题型复杂度、推理步骤暂为 0，不能推断教学难度全面达标。
- **Evidence**：每次调用记录 HTTP 状态、finish reason、响应字节、prompt 字符数、token 上限、latency、retry；每次内容尝试记录 received/accepted、数学/KP/约束、重复和失败算式/代码。报告明确区分交付质量与被过滤的原始候选质量。超时 token 未知不当作零成本。
- **Acceptance**：定向测试不能获得整体 PASS；全量必须覆盖 8 场景、每场景至少 5×20、四档难度各至少 100 个请求槽位（另外统计实际真实题量）。人工审核缺失时为 INCONCLUSIVE（若自动门槛已失败则仍为 FAIL）。人工审核导入绑定具体题面、答案、解析和 Prompt Version；不能复用旧候选的审核。

### Reproducible Commands

真实供应商调用独立于 `npm test`：

```bash
npm run llm:evaluate -- --scenarios=B --batches=1 --no-difficulty-sweep
npm run llm:evaluate -- --scenarios=B --batches=5 --no-difficulty-sweep
npm run llm:evaluate -- --scenarios=G --batches=5 --no-difficulty-sweep
npm run llm:evaluate -- --scenarios=DIFFICULTY --batches=5
# 以上定向结果达标后才执行：
npm run llm:evaluate -- --batches=5
# 人工逐项填写生成的 40 题表后导入，另存 reviewed 报告：
npm run llm:review -- REPORT.json HUMAN-REVIEW.json
```

可用 `--replay=EVIDENCE.json` 和原始批次选项从已保存证据重新计算报告，不调用供应商，也不覆盖旧报告。Repair Rate = 首次内容修复槽位 / 请求槽位，另列 Repair Batch Rate；Fallback Rate = 使用回退的逻辑批次 / 逻辑批次（H 两部分合计一个批次）。旧版 Repair/Fallback 口径不完全相同，Before / After 保留原值并明确差异。Latency 为单次供应商调用耗时，顺序分块的整个 20 题等待时间仍是各调用与退避之和，不能拿单次延迟声称整批只需十几秒。

### Validation and Acceptance Results

定向评估与最终回归进行中；未授权进入 PHASE 19。

### Additional Evidence / Candidate Versions

- v2、4×5、30s：B 的 5 批首轮 93/100，最终真实题 95/100；2 个内容失败全部修复，1 个分块传输重试耗尽而回退。9 次 timeout，单调用均值 19.8s / P95 30.0s；完整运行 596.9s。报告 `08-04-15-996Z`，按新统计定义重算另存 `08-15-25-423Z`，不覆盖原文件。
- v2、10×2、30s 对照：B 单批 20/20，仍有 3 次 timeout；单调用均值 16.7s / P95 30.0s，整批 218.4s。因此未采用 2 题分块作为默认策略。
- v2、4×5、原基线 60s：B 5 批最终 100/100、无 fallback，但首轮仅 74%，Repair Rate 26%；Repair Success 26/26 = 100%，均值 29.2s / P95 60.0s。4 次 `finishReason=length` 且输出达到 4096，确认发生截断；5 次 timeout。报告 `08-20-17-409Z` 为 FAIL，不可包装成通过。
- 新诊断还发现 `DIFFICULTY_RANGE`：模型更改请求拥有的 difficulty 元数据，整块被拒绝。**Prompt v3** 明确复制固定难度，并用请求绑定 JSON Schema 固定题量、difficulty、单个合法知识点 ID。Schema 的传输字段结构仍为 v1，实际数学难度继续独立检查。
- `reasoning-probe-1789720678774.json` 的受控探测：默认响应实际带有 590 字符 `reasoning_content`；关闭 thinking 的请求返回 HTTP 200，未返回该字段，三次调用耗时 4.54 / 4.21 / 7.18s。但出现 Schema 错误，首轮仅接受 1/2，不能只凭速度采用。仅保存长度/用量，不保存推理正文。
- **Prompt v4** 保留前版，针对探测错误明确外层 questions 数组、七个必填字段、数字/数组类型，以及 requireCarrying / requireBorrowing 的现有数学条件；没有放宽 Validator。新增服务端显式 opt-in `LLM_THINKING_MODE=disabled`，其他供应商默认不发送 thinking 字段。Runner 可用 `--thinking=disabled` 比较，不自动改变现有本地环境配置。
