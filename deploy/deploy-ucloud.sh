#!/usr/bin/env bash
set -Eeuo pipefail

REMOTE_USER="ubuntu"
REMOTE_HOST="117.50.75.85"
REMOTE_ROOT="/home/ubuntu/knowledge-island-learning"
COMPOSE_PROJECT="ki-learning-preview"
PUBLIC_URL="http://117.50.75.85:18081"
REMOTE="${REMOTE_USER}@${REMOTE_HOST}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

for command_name in ssh rsync; do
  if ! command -v "${command_name}" >/dev/null 2>&1; then
    printf '缺少命令：%s\n' "${command_name}" >&2
    exit 1
  fi
done

if [[ ! -t 0 ]]; then
  printf '请在终端中运行此脚本，以便输入服务器密码。\n' >&2
  exit 1
fi

CONTROL_DIR="$(mktemp -d /tmp/knowledge-island-deploy.XXXXXX)"
chmod 700 "${CONTROL_DIR}"
CONTROL_SOCKET="${CONTROL_DIR}/ssh.sock"

cleanup() {
  ssh -S "${CONTROL_SOCKET}" -O exit "${REMOTE}" >/dev/null 2>&1 || true
  rmdir "${CONTROL_DIR}" 2>/dev/null || true
}
trap cleanup EXIT

SSH_OPTIONS=(
  -o "ControlPath=${CONTROL_SOCKET}"
  -o ControlPersist=600
  -o StrictHostKeyChecking=accept-new
  -o PreferredAuthentications=password,keyboard-interactive
)

printf '连接 UCloud 服务器 %s。请输入一次 SSH 密码：\n' "${REMOTE}"
ssh -M "${SSH_OPTIONS[@]}" "${REMOTE}" true

ssh "${SSH_OPTIONS[@]}" -o ControlMaster=auto "${REMOTE}" 'bash -s' <<'REMOTE_INIT'
set -Eeuo pipefail
DEPLOY_ROOT='/home/ubuntu/knowledge-island-learning'

if [[ ! -d "${DEPLOY_ROOT}" || ! -f "${DEPLOY_ROOT}/.ki-learning-deploy-root" ]]; then
  printf '部署目录或安全标记不存在：%s\n' "${DEPLOY_ROOT}" >&2
  exit 1
fi

if [[ ! -f "${DEPLOY_ROOT}/.env.preview" ]]; then
  umask 077
  cat > "${DEPLOY_ROOT}/.env.preview" <<'ENV_PREVIEW'
NODE_ENV=staging
WEB_BIND_ADDRESS=0.0.0.0
WEB_PORT=18081
PET_ALLOWED_ORIGINS=http://117.50.75.85:18081
FORMAL_AI_ENABLED=false
ENV_PREVIEW
fi
REMOTE_INIT

RSYNC_SSH="ssh -o ControlPath=${CONTROL_SOCKET} -o ControlMaster=auto -o ControlPersist=600 -o StrictHostKeyChecking=accept-new -o PreferredAuthentications=password,keyboard-interactive"
rsync -rtz --delete-delay --rsh="${RSYNC_SSH}" \
  --exclude='/.git/' \
  --exclude='/node_modules/' \
  --exclude='/dist/' \
  --exclude='/.data/' \
  --exclude='/.env' \
  --exclude='/.env.*' \
  --exclude='/.tts-cache/' \
  --exclude='/coverage/' \
  --exclude='/tmp/' \
  --exclude='/outputs/' \
  --exclude='/.DS_Store' \
  --exclude='/.ki-learning-deploy-root' \
  "${PROJECT_ROOT}/" "${REMOTE}:${REMOTE_ROOT}/"

printf '源码已同步，开始在服务器构建和更新服务。\n'
ssh "${SSH_OPTIONS[@]}" -o ControlMaster=auto "${REMOTE}" 'bash -s' <<'REMOTE_DEPLOY'
set -Eeuo pipefail
DEPLOY_ROOT='/home/ubuntu/knowledge-island-learning'
COMPOSE_PROJECT='ki-learning-preview'
cd "${DEPLOY_ROOT}"

while IFS= read -r base_image; do
  [[ -n "${base_image}" ]] || continue
  if ! docker image inspect "${base_image}" >/dev/null 2>&1; then
    mirror_image="docker.m.daocloud.io/library/${base_image}"
    printf '拉取构建基础镜像：%s\n' "${mirror_image}"
    docker pull "${mirror_image}"
    docker tag "${mirror_image}" "${base_image}"
  fi
done < <(awk '$1 == "FROM" && $2 ~ /^(node|nginx):/ { print $2 }' Dockerfile | sort -u)

docker compose -p "${COMPOSE_PROJECT}" --env-file .env.preview -f docker-compose.production.yml config --quiet
DOCKER_BUILDKIT=0 docker build --pull=false --target api -t "${COMPOSE_PROJECT}-api:latest" .
DOCKER_BUILDKIT=0 docker build --pull=false --target web -t "${COMPOSE_PROJECT}-web:latest" .
docker compose -p "${COMPOSE_PROJECT}" --env-file .env.preview -f docker-compose.production.yml up -d --no-build --wait --wait-timeout 180
curl -fsS --max-time 10 http://127.0.0.1:18081/api/pet/health
printf '\n'
docker compose -p "${COMPOSE_PROJECT}" --env-file .env.preview -f docker-compose.production.yml ps
REMOTE_DEPLOY

printf '部署完成：%s\n' "${PUBLIC_URL}"
