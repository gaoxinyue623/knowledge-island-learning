# PHASE28：学科切换、学习事实同步与部署准备

日期：2026-09-24。

## 学生 Agent

- 默认按数学 → 语文 → 英语选择当前档案已配置的第一科；支持下拉切换，路由 query 保存选择，错误状态下仍可换科。
- 正式档案沿用教材设置的自主选书规则：允许选择其他地区已经发布的教材，仍检查确认状态、年级/学期、审核状态、有效发布关系和课程引用。开发 SAMPLE 情境仍保持地区约束。
- 启动练习使用决策的目标知识点和对应课次；答题后返回原学科的 Agent。
- 修复浏览器中 Vue Proxy 无法被 structuredClone 克隆的问题：启动绑定使用 shallowRef，提交答案在页面边界转为普通快照。修复 320px 下长标识造成的横向溢出。

## 学习事实同步

家庭档案预览上传时可开启自动同步。正式 Agent 完成后导出经校验的完整本机档案，通过账号会话和 revision CAS 上传。冲突/离线时保留本机记录并提示家长，取消勾选并保存可关闭同步；上传返回时不会重新启用已关闭或已替换的绑定。

此版本不是后台双向实时同步：第二设备由家长下载、预览、恢复为新的本机副本，原档案保留。常规课程/阅读流程仍需手动上传，自动触发点仅为正式 Agent 完成学习。

## 发布准备

新增 Node 24 + Nginx 多阶段 Docker 镜像、带 SQLite 持久卷与健康检查的 Compose、本机验证环境配置，以及 UCloud 的 Caddy HTTPS 组合。正式 Compose 默认 production 且必须提供允许来源；HTTP staging 配置仅供明确的测试环境使用。

部署命令、无域名 IP/SSH 预览、域名 HTTPS、备份/回滚见 [UCloud 部署与维护](../operations/UCLOUD_DEPLOYMENT.md)。电脑、手机、双端同步和学生试用的执行表见 [验收清单](../operations/DEVICE_STUDENT_ACCEPTANCE.md)。

## 验证记录

- 修复 Node 26 sessionStorage 测试：生产代码使用实际 window.sessionStorage，存储不可用测试替换真实实例，不再依赖可能不同的全局 Storage 原型。
- 完整检查另暴露一项随机 SAMPLE UI 测试：使用随机 UUID 作为模板 seed 时，可能产生被独立重复题校验拦截的题组。UI 回归现在使用固定 seed，保持校验器和失败保护不变；不声称开发生成器在任意 seed 下均成功。
- 新增回归覆盖自动上传、无配置、冲突不重试、离线保留版本、上传期间关闭、取消绑定、跨地区已审核教材、学科切换、错误后换科、决策目标路由，以及页面传递可克隆答案。
- Node.js 24.20.0：`npm run test:run` 通过，86 个文件、959 项测试。
- Node.js 26.7.0：`npm run release:check` 退出码 0，包含类型检查、生产构建、lint、86 个文件的 959 项测试，以及额外 2 项发布 runtime 检查；结论 `READY_WITH_LIMITATIONS`，0 个阻塞项、3 项既有范围限制。仍有 Node 全局 localStorage 的实验性警告和构建包体积提示，但没有失败。
- `git diff --check` 通过。
- Docker 本地构建成功；API healthy；通过 Nginx 访问 `/api/pet/health` 返回 `{"ok":true}`，`/` 与 `/learning-agent` 返回 HTTP 200。
- 本机浏览器从新档案完成地区、年级和三科教材选择，验证默认数学、切换语文/英语、刷新保留选择。正式英语五题完成后显示“正式 Agent 已完成学习记录更新”，回到英语 Agent 后依据新记录显示“挑战练习”，置信度 80%。修复后该流程没有新增浏览器控制台 error。
- 1280×900、390×844、320×700 视口检查；最终 320px 英语 Agent 页 document scrollWidth 为 320，修复前为 353。这里是桌面浏览器移动视口，未冒充手机真机验收。
- UCloud Compose 配置语法检查通过。公网主机、域名 DNS、证书签发、生产登录/同步、真机触摸与音频和真实学生试用尚未执行。

本地可访问 http://localhost:8081 。UCloud 发布还需要具体云主机和已有 SSH 访问配置；域名未确定。当前可进行本地试用，不能将工程门禁通过等同于生产部署或真实学生验收完成。

## DataCloneError 后续修复

2026-09-24 收到 QuestionEnginePage 提交路径在 runtimeExecutionService.schedule 报错的反馈。页面 shallowRef/浅层 toRaw 不足以保证服务调用参数没有嵌套 Proxy，执行服务仍直接 structuredClone 整个请求。

执行入口现在同步递归复制纯记录、数组和基础值，接受各层 Vue 响应式包装，同时保持入队时快照隔离。循环或不可支持的请求返回 BLOCKED / AGENT_EXECUTION_INPUT_INVALID，不抛出未捕获的克隆异常，也不写学习记录。页面直接交由该统一入口处理答案。

新增真实执行服务测试覆盖深层响应式请求、嵌套 Proxy、提交后修改原答案、逐题提交到完成、无效输入后队列仍可用；页面测试覆盖提交后进入下一题及返回原学科。专项 37 项测试、类型检查与 lint 通过。生产容器重新构建。

修复后容器浏览器实测：英语正式练习提交首题后进入第 2 / 5 题，未出现新增控制台 error；没有清除本机学习记录。
