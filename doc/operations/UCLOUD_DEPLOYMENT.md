# UCloud 部署与维护

截至 2026-09-24：Docker 构建、本机 Nginx → Node API 已验证；尚未连接 UCloud 主机或发布公网。正式学生 Agent 使用已审核题库和确定性决策，不需要公开开发用的 LLM/FastAPI 服务。

## 本机复现

安装 Docker Engine / Docker Desktop 和 Compose 后，在项目根目录运行：

```sh
docker compose --env-file deploy/local.env.example -f docker-compose.production.yml up -d --build
curl -f http://localhost:8081/api/pet/health
```

访问 http://localhost:8081 。本机配置明确使用 `staging`，只监听回环地址。生产 Compose 默认 `production`，且必须提供允许的来源，防止误用 HTTP 配置发布。

## 尚未确定域名时

准备 UCloud UHost Linux 云主机、系统盘/数据盘和公网 IP，安装官方 Docker Engine 与 Compose。建议先用 2 核、4 GB 内存做小范围试运行，再按监控扩容。安全组仅向运维来源开放 SSH。代码放在固定目录，例如 `/opt/knowledge-island-learning`，由有 Docker 权限的部署用户操作。

可先通过 SSH 转发访问服务器预览，无需域名：

```sh
ssh -L 8081:127.0.0.1:8081 <部署用户>@<公网IP>
```

服务器按“本机复现”命令启动。电脑访问 `http://localhost:8081`；这是测试环境。若需手机通过公网 IP 临时验收，在独立 `.env.preview` 中设置 `NODE_ENV=staging`、`WEB_BIND_ADDRESS=0.0.0.0`、`WEB_PORT=8081` 和 `PET_ALLOWED_ORIGINS=http://实际公网IP:8081`，并在安全组限定测试来源。运行时改用 `--env-file .env.preview`。HTTP 预览只使用虚构测试档案；正式家长登录和学生试用需 HTTPS。

## 正式 HTTPS 发布

1. 确定域名，将 A 记录指向 UCloud 公网 IP；如使用中国大陆节点，按 UCloud 要求办理备案。
2. 确保主机的 80/443 端口可用，安全组放通；8787/8788/8789 不对公网开放。
3. 复制 `deploy/ucloud.env.example` 为根目录 `.env.production`，将域名改为实际值。`PUBLIC_DOMAIN` 不带协议，`PET_ALLOWED_ORIGINS` 为完整 `https://域名`，不要带尾部斜杠。
4. 在服务器执行：

```sh
docker compose --env-file .env.production -f docker-compose.production.yml -f docker-compose.ucloud.yml config --quiet
docker compose --env-file .env.production -f docker-compose.production.yml -f docker-compose.ucloud.yml up -d --build
docker compose --env-file .env.production -f docker-compose.production.yml -f docker-compose.ucloud.yml ps
curl -f https://实际域名/api/pet/health
```

Caddy 自动申请/续期证书并代理到 Nginx；前端与 API 同源。数据库挂载到命名卷 `knowledge-island-data` 中的 `/data/knowledge-island.sqlite`；Caddy 的证书也使用持久卷。不要执行 `down -v`。本地 HTTP 与正式 HTTPS 使用不同 origin，浏览器本机记录不会自动迁移；先导出档案，再在目标站点预览恢复。

首次发布需逐项执行 [电脑、手机与学生试用清单](DEVICE_STUDENT_ACCEPTANCE.md)，验证会话 cookie 带 `HttpOnly; Secure; SameSite=Strict`、账号登录、云端上传、第二设备恢复、409 冲突和容器重启后数据保留。公网地址、证书签发和上述操作尚未实测。

## 备份与回滚

固定项目目录与 Compose 项目名，避免误创建空数据卷。升级前记录当前代码版本和镜像 ID；停止 API 写入，再复制整个数据目录：

```sh
mkdir -p backups
docker compose --env-file .env.production -f docker-compose.production.yml stop api
docker compose --env-file .env.production -f docker-compose.production.yml cp api:/data ./backups/pre-upgrade-data
docker compose --env-file .env.production -f docker-compose.production.yml start api
```

备份目录每次使用新的名称，并在服务之外保留受访问控制的副本。恢复演练应在独立临时卷进行，不覆盖运行中的数据库。当前数据库版本为 v2，回滚代码必须兼容 v2，详见 [家庭档案服务](STUDENT_FAMILY_ARCHIVES.md)。未配置自动备份和告警前，由运维明确安排备份、磁盘空间/健康状态监控；日志不要包含密码、cookie 或学习档案内容。

## 发布所需外部信息

还需要 UCloud 主机实例/公网 IP、部署用户名或已有 SSH 主机别名；密钥使用本机 SSH 配置，不在聊天发送。域名可后续确定，但正式开放账号同步前需完成 HTTPS。当前交付是可部署配置和本机验证，不能作为公网部署完成记录。
