#!/usr/bin/env bash
# 瞬间 · 一键安装 / 升级
#   默认：./install.sh           从 Docker Hub 拉取镜像（无需本地编译）
#   本地构建：./install.sh --build   用仓库源码构建镜像再启动（二次开发用）
#   升级：./install.sh           重新拉取/构建镜像并滚动重启，数据卷与上传目录不动
set -euo pipefail

cd "$(dirname "$0")"

BUILD_MODE=0
[ "${1:-}" = "--build" ] && BUILD_MODE=1
if [ $# -gt 0 ] && [ "$1" != "--build" ]; then
  echo "用法：./install.sh [--build]" >&2
  exit 1
fi

info() { printf '\033[32m[瞬间]\033[0m %s\n' "$1"; }
warn() { printf '\033[33m[瞬间]\033[0m %s\n' "$1"; }
die() { printf '\033[31m[瞬间]\033[0m %s\n' "$1" >&2; exit 1; }

# ---------- 0. 依赖检查 ----------
command -v docker >/dev/null 2>&1 || die "没有找到 docker，请先安装 Docker Engine / Docker Desktop"
docker compose version >/dev/null 2>&1 || die "没有找到 docker compose 插件（需要 Docker Compose v2）"
command -v curl >/dev/null 2>&1 || die "没有找到 curl，健康检查需要它"

# ---------- 1. .env ----------
if [ ! -f .env ]; then
  [ -f .env.example ] || die "缺少 .env.example，请在完整目录内运行"
  cp .env.example .env
  chmod 600 .env
  info "已从 .env.example 生成 .env"
else
  chmod 600 .env 2>/dev/null || true
fi

get_val() { awk -F= -v k="$1" '$1==k { sub(/^[^=]*=/, ""); print; exit }' .env; }

set_val() {
  local key="$1" val="$2" tmp
  tmp="$(mktemp)"
  awk -F= -v k="$key" -v v="$val" '
    $1==k { print k "=" v; found=1; next }
    { print }
    END { if (!found) print k "=" v }
  ' .env > "$tmp"
  cat "$tmp" > .env
  rm -f "$tmp"
}

gen_secret() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 16
  else
    od -An -tx1 -N16 /dev/urandom | tr -d ' \n'
  fi
}

[ -n "$(get_val PORT)" ] || set_val PORT 8080
[ -n "$(get_val TZ)" ] || set_val TZ Asia/Shanghai
[ -n "$(get_val MAX_UPLOAD_MB)" ] || set_val MAX_UPLOAD_MB 100
[ -n "$(get_val UPLOADS_DIR)" ] || set_val UPLOADS_DIR ./data/uploads
[ -n "$(get_val BACKUPS_DIR)" ] || set_val BACKUPS_DIR ./data/backups

# 内部凭据只在为空时生成，重复执行不会改掉已有密码（改了对已有数据卷是灾难）
if [ -z "$(get_val MONGO_PASSWORD)" ]; then
  set_val MONGO_PASSWORD "$(gen_secret)"
  info "已生成随机 MongoDB 密码"
fi
if [ -z "$(get_val REDIS_PASSWORD)" ]; then
  set_val REDIS_PASSWORD "$(gen_secret)"
  info "已生成随机 Redis 密码"
fi
[ -n "$(get_val MONGO_USER)" ] || set_val MONGO_USER wink

# 容器用当前用户身份运行，上传文件的属主才和宿主机一致
[ -n "$(get_val APP_UID)" ] || set_val APP_UID "$(id -u)"
[ -n "$(get_val APP_GID)" ] || set_val APP_GID "$(id -g)"

PORT="$(get_val PORT)"
UPLOADS_DIR="$(get_val UPLOADS_DIR)"
BACKUPS_DIR="$(get_val BACKUPS_DIR)"

# ---------- 2. 目录与权限 ----------
mkdir -p "$UPLOADS_DIR/compress" "$UPLOADS_DIR/_trash" "$BACKUPS_DIR"
chmod 755 "$UPLOADS_DIR" "$UPLOADS_DIR/compress" "$UPLOADS_DIR/_trash"
chmod 700 "$BACKUPS_DIR"
info "数据目录就绪：$UPLOADS_DIR / $BACKUPS_DIR"

# 端口占用检查（已经是我们自己起着的服务则跳过）
if command -v lsof >/dev/null 2>&1 && lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  if docker compose ps --status running --services 2>/dev/null | grep -qx web; then
    info "端口 $PORT 由本项目占用，按升级处理"
  else
    die "端口 $PORT 已被其它程序占用，请在 .env 里改 PORT 后重试"
  fi
fi

# ---------- 3. 构建或拉取镜像并启动 ----------
if [ "$BUILD_MODE" -eq 1 ]; then
  info "本地构建镜像（首次需要几分钟，编译在你本机完成，架构自动匹配）"
  docker compose up -d --build
else
  info "从 Docker Hub 拉取镜像（yipanzwx/wink-app、yipanzwx/wink-web）…"
  if docker compose pull app web; then
    docker compose up -d
  elif [ -d app/src ] && [ -d web/src ]; then
    # 拉取失败（无外网 / 限流）且本地有源码时回落到本地构建
    warn "镜像拉取失败，改用本地源码构建…"
    docker compose up -d --build
  else
    die "镜像拉取失败且目录内没有源码。检查网络后重试，或克隆完整仓库后用 ./install.sh --build"
  fi
fi

# ---------- 4. 等健康检查 ----------
info "等待服务就绪…"
ready=0
for _ in $(seq 1 60); do
  if curl -fsS "http://127.0.0.1:${PORT}/api/health" >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 3
done

if [ "$ready" -ne 1 ]; then
  warn "健康检查未通过，最近日志如下："
  docker compose logs --tail=40 app || true
  # 定向诊断：数据卷已用旧密码初始化，与 .env 不匹配（MONGO_INITDB_* 只在空卷首次建库生效）
  if docker compose logs --tail=20 mongo 2>/dev/null | grep -q "AuthenticationFailed"; then
    die "MongoDB 认证失败：数据卷已用旧密码初始化，与 .env 里的 MONGO_PASSWORD 不匹配。
  处理方式：
  ① 保留数据：用旧密码启动后进容器改用户密码（mongosh -u wink --authenticationDatabase admin）
  ② 清空重建（会丢库内全部数据）：docker compose down -v && ./install.sh"
  fi
  die "启动失败。常见原因：端口冲突、目录无写权限、.env 里预置管理员不合法（用户名 2~30 字、密码至少 6 位）"
fi
info "四个容器全部就绪"

# ---------- 5. 预置管理员已生效后清空密码 ----------
status="$(curl -fsS "http://127.0.0.1:${PORT}/api/setup/status" 2>/dev/null || true)"
initialized="$(printf '%s' "$status" | grep -o '"initialized":[a-z]*' | head -1 | cut -d: -f2)"
admin_preset="$(printf '%s' "$status" | grep -o '"adminPreset":[a-z]*' | head -1 | cut -d: -f2)"

if [ "$initialized" = "true" ] && [ "$admin_preset" = "true" ]; then
  set_val ADMIN_PASSWORD ""
  # 重建 app，让容器环境里的 ADMIN_PASSWORD 也变成空，
  # 否则 /api/setup/status 的 adminPreset 会一直显示 true（与实际配置不符）
  docker compose up -d app >/dev/null 2>&1 || true
  for _ in $(seq 1 20); do
    curl -fsS "http://127.0.0.1:${PORT}/api/health" >/dev/null 2>&1 && break
    sleep 2
  done
  info "管理员已由 .env 预置并写入数据库，已清空 .env 里的 ADMIN_PASSWORD"
fi

# ---------- 6. 打印访问地址 ----------
ip=""
if command -v ipconfig >/dev/null 2>&1; then
  ip="$(ipconfig getifaddr en0 2>/dev/null || true)"
elif command -v ip >/dev/null 2>&1; then
  ip="$(ip route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src") print $(i+1)}' | head -1)"
fi

echo
info "安装完成"
echo "  本机访问：http://127.0.0.1:${PORT}"
[ -n "$ip" ] && echo "  局域网访问：http://${ip}:${PORT}"
echo
if [ "$initialized" = "true" ]; then
  echo "  下一步：直接用管理员账号登录；成员在「个人中心 → 管理端」里添加"
else
  echo "  下一步：打开上面的地址，首次会自动进入初始化向导（/setup）"
fi
echo "  查看状态：docker compose ps"
echo "  查看日志：docker compose logs -f app"
echo "  停止服务：./uninstall.sh   （只停容器，数据全留）"
echo "  彻底清除：./uninstall-purge.sh   （删卷、文件、.env、镜像，不可恢复）"
