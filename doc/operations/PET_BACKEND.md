# 宠物账号与备份后端

## 当前状态

第二阶段已实现 Node.js + TypeScript + SQLite 后端，提供家长注册、登录、会话、退出以及宠物账本备份和恢复所需接口。前后端共用 `src/services/pet/petPolicy.ts` 校验和重放规则；后端入口为 `server/index.ts`，HTTP 实现在 `server/petServer.ts`。已在本机进行接口和浏览器联调，未部署到公网。

账号只管理宠物备份。全站学习进度、教材设置、题目作答、错题本和语音服务未迁入该后端。自动多设备合并、服务器权威发奖、找回密码、账号删除页面和付费功能待后续独立开发。客户端声明的学习来源没有在服务器重新求证，备份不可作为防作弊账务。

## 本机启动

使用 Node.js 24 或更高版本。此项目通过 [Node.js SQLite API](https://nodejs.org/api/sqlite.html) 持久化，不需要额外安装数据库服务。依赖安装后在两个终端分别运行：

```sh
npm run server
```

```sh
npm run dev
```

默认 API 监听 `127.0.0.1:8787`；Vite 把 `/api/pet` 代理到该地址。前端使用 `http://localhost:5173` 或 `http://127.0.0.1:5173`。若 5173 被占用、Vite 自动换端口，需通过 `PET_ALLOWED_ORIGINS` 加入实际前端来源并重启后端。

```sh
PET_ALLOWED_ORIGINS=http://127.0.0.1:5183 npm run server
```

不需要填写第三方密钥。默认数据库位于 `.data/knowledge-island.sqlite`，目录已忽略 Git，Vite 禁止通过文件服务读取数据库。开发时可使用 `npm run server:dev` 自动重启；重启不会清除账号、会话或备份。

## 配置

| 变量 | 默认值 | 含义 |
| --- | --- | --- |
| PET_API_HOST | 127.0.0.1 | API 监听地址 |
| PET_API_PORT | 8787 | API 端口；改变时同时修改 Vite 代理或生产反向代理 |
| PET_DATABASE_PATH | .data/knowledge-island.sqlite | SQLite 文件路径 |
| PET_ALLOWED_ORIGINS | http://localhost:5173,http://127.0.0.1:5173 | 允许的前端来源，逗号分隔，需完整 scheme、host、port |
| NODE_ENV | 未设置 | production 时强制显式 HTTPS 来源并启用 Secure Cookie |

服务器使用 SQLite WAL、外键和事务；user_version 为 1，启动拒绝较新未知数据库版本。数据库表 `users`、`sessions`、`pet_backups` 的结构以 `server/petServer.ts` 为准。此实现适用于单个后端服务和持久磁盘，不支持多实例共享网络文件系统。

## 账号与请求约束

账号为 4～32 位字母、数字或下划线，存储时转小写；密码为 10～128 个字符。无需儿童姓名、生日或邮箱。密码通过随机盐和 [Node.js scrypt](https://nodejs.org/api/crypto.html#cryptoscryptpassword-salt-keylen-options-callback) 派生保存，不存明文。随机会话令牌只在 HttpOnly、SameSite=Strict Cookie 中发送，数据库只保留令牌摘要；7 天过期，退出会删除会话。

写请求要求受信任 Origin 和 `X-Knowledge-Island: pet-v2`。备份和退出请求还携带 `X-Pet-Account`（界面当前登录的账号名），必须与实际 Cookie 会话匹配；它是防止会话切换时误操作的附加检查，不能代替认证。API 不开放 CORS 凭据，前后端必须同源。

登录/注册每个直接连接 IP 每分钟最多 15 次，同时最多 4 个密码派生任务；登录后的接口每账号每分钟最多 120 次。服务重启会重置进程内限流计数。生产反向代理应在入口补充按客户端 IP 的限流；当前不信任可伪造的 X-Forwarded-For，因此代理后的登录请求可能共享一个额度。

## 接口

统一前缀 `/api/pet`；JSON 响应禁止缓存。失败返回 `{ "error": "中文说明" }`，不返回密码散列、SQL 内容或异常栈。

| 方法 | 路径 | 输入／结果 |
| --- | --- | --- |
| GET | /health | `{ ok: true }` |
| POST | /register | username、password；设置会话，返回 username |
| POST | /login | username、password；设置会话，返回 username |
| GET | /session | username 或 null |
| POST | /logout | 删除当前会话 |
| GET | /backups | 当前账号的 profileId、label、revision、updatedAt 列表 |
| GET | /backup?profileId=… | 单份备份详情和 account |
| PUT | /backup | profileId、label、revision、account；返回新 revision |

新备份 revision 为 0。后续上传需传已读版本；事务中再次检查版本。只有原历史是新历史完整前缀时才允许更新，完全相同的快照可安全重试，不额外递增版本。版本或历史冲突返回 409，原备份保持不变；前端需刷新列表并由家长处理。单请求最多 4 MiB，每账号最多 20 份备份。

客户端恢复时先重新读取云端、核对预览版本，再校验结构并映射到当前学习档案，再在 IndexedDB 事务里检查前缀关系。若本机更近则保留本机；若云端更近则恢复云端；分支历史停止恢复，不拼接消费流水。原始学习记录不会随恢复被修改。换设备应先恢复小屋再进行学习；未备份的变化不会自动出现于另一设备。

## 部署与维护边界

生产需要持久磁盘、HTTPS 和同源反向代理：静态站点来自 `npm run build` 的 dist，`/api/pet` 转发到 Node 服务。设置 `NODE_ENV=production`、实际 HTTPS `PET_ALLOWED_ORIGINS` 与持久磁盘 `PET_DATABASE_PATH`。后端仅提供 API，不直接托管 dist；Vite 开发服务器不作为生产服务。

SQLite 的正常关闭后文件副本可用于运维备份；不要在服务仍写入时只复制主文件而遗漏 WAL。数据库需仅对服务用户可读写。当前未提供自动运维备份、邮件找回或管理后台，部署前需根据实际使用方式补齐。尚未执行生产域名、证书、反向代理或真实远程设备的部署验证。

验证由 `tests/pet-server.test.ts`（真实 HTTP 和临时 SQLite）、`tests/pet-phase2.test.ts`（迁移、独立成长和恢复冲突）、`tests/pet-cloud-ui.test.ts`（会话失效、过期预览与档案切换）及原宠物回归测试覆盖；浏览器联调使用独立本地来源与测试数据库，详情见 [成长说明](../learning/PET_GROWTH.md)。
