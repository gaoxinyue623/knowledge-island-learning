# 家庭学习档案服务运维说明

状态：功能代码已通过独立审查、Node.js 24 发布检查和临时服务双浏览器验证；生产服务尚未部署。本文件是部署与恢复边界说明，不授权执行生产操作。

## 服务范围

家庭服务沿用宠物服务的 `ki_session`、HttpOnly cookie、同源检查、`X-Knowledge-Island: pet-v2` CSRF 头和 `X-Pet-Account` 账号变化保护。cookie Path 保持 `/api/pet`。

接口位于 `/api/pet/family/profiles`：

- `GET` 仅返回档案 metadata。
- `POST` 由服务器生成 cloud profile id 并保存经共享 archive 校验的完整 snapshot。
- `GET /:id` 显式下载 snapshot，不会自动应用到本机。
- `PUT /:id` 使用 expected revision 的事务 CAS。内容相同为幂等；版本陈旧返回 `409 REVISION_CONFLICT`，不自动重试、覆盖或合并。

所有查询和更新均以 server session 的 user id 与 cloud profile id 联合隔离。客户端传入的用户名、本机 profile id 或 cloud profile id 不能作为授权依据。

## 配置和启动

沿用现有服务入口与环境变量：

```text
PET_API_PORT=8787
PET_API_HOST=127.0.0.1
PET_DATABASE_PATH=.data/knowledge-island.sqlite
PET_ALLOWED_ORIGINS=https://your-origin.example
NODE_ENV=production
npm.cmd run server
```

生产环境必须显式配置 HTTPS `PET_ALLOWED_ORIGINS`；会话 cookie 才会带 `Secure`。日志不得记录 archive、学生昵称、cookie、密码或服务端 user id。

## SQLite 版本和备份

SQLite 从 user_version 1 升级到 2 时新增 `family_profile_backups`，保留既有 `users`、`sessions` 和 `pet_backups`。升级前先在停止写入后备份 SQLite 主文件及 WAL/SHM 伴随文件，并通过临时副本演练启动和读取。

禁止用旧版服务直接打开已经升级到 v2 的数据库：旧代码可能不理解新表或版本边界。回滚应用代码时保留 v2 数据库和新表；恢复只能来自经过验证的完整数据库备份，不能用旧服务覆盖 v2 数据库。

## 运行限制

- 暂无密码找回、自动冲突合并、后台连续同步或生产部署。
- 家长操作的是完整手动 snapshot；恢复始终复制为新的本机档案，原档案保留。
- 409 表示远端已有新版本。应让家长下载、预览后复制恢复，或将本地快照另存为新的云端档案。
