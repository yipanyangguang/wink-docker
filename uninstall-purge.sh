#!/usr/bin/env bash
# 瞬间 · 彻底清除（不可恢复）
#   ./uninstall-purge.sh   删除容器、数据卷、上传文件、备份、.env 与应用镜像
# 清除后再次 ./install.sh 会走完整首次安装流程：新密码 → 空库 → /setup 向导 → 引导内容重新写入
set -euo pipefail

cd "$(dirname "$0")"
ROOT="$(pwd -P)"

info() { printf '\033[32m[瞬间]\033[0m %s\n' "$1"; }
warn() { printf '\033[33m[瞬间]\033[0m %s\n' "$1"; }
die()  { printf '\033[31m[瞬间]\033[0m %s\n' "$1" >&2; exit 1; }

env_val() { awk -F= -v k="$1" '$1==k {sub(/^[^=]*=/,"");print;exit}' .env 2>/dev/null || true; }

# 从 .env 读路径，并强制限制在项目目录内，避免误删外部文件
env_path() {
  local key="$1" fallback="$2" raw abs
  raw="$(env_val "$key")"
  [ -n "$raw" ] || raw="$fallback"
  case "$raw" in
    *..*) die ".env 里的 $key 含 '..'，拒绝自动删除：$raw" ;;
  esac
  if [[ "$raw" = /* ]]; then
    abs="$raw"
  else
    abs="$ROOT/$raw"
  fi
  case "$abs" in
    "$ROOT"/*) ;;
    *) die ".env 里的 $key 不在项目目录内，拒绝自动删除：$abs" ;;
  esac
  [ ! -L "$abs" ] || die "$abs 是符号链接，拒绝自动删除"
  printf '%s' "$abs"
}

UPLOADS_DIR="$(env_path UPLOADS_DIR ./data/uploads)"
BACKUPS_DIR="$(env_path BACKUPS_DIR ./data/backups)"

APP_IMAGE="$(env_val APP_IMAGE)"; [ -n "$APP_IMAGE" ] || APP_IMAGE=yipanzwx/wink-app:latest
WEB_IMAGE="$(env_val WEB_IMAGE)"; [ -n "$WEB_IMAGE" ] || WEB_IMAGE=yipanzwx/wink-web:latest
case "$APP_IMAGE" in *:*) ;; *) APP_IMAGE="$APP_IMAGE:latest" ;; esac
case "$WEB_IMAGE" in *:*) ;; *) WEB_IMAGE="$WEB_IMAGE:latest" ;; esac

printf '\033[1m\033[31m【危险】此操作非常危险，可能导致不可逆的数据丢失！\033[0m\n'
cat <<EOF
即将永久删除：
  · 四个容器与 compose 网络
  · MongoDB / Redis 数据卷（全部账号、帖子、评论、话题、分享链接）
  · $UPLOADS_DIR 下的全部文件（图片、视频、缩略图、_trash）
  · $BACKUPS_DIR 下的全部备份
  · .env（含数据库密码，删后重装会生成全新密码）
  · 本地镜像：$APP_IMAGE / ${WEB_IMAGE}（下次安装会重新拉取）

保留：mongo:7 / redis:7-alpine 官方基础镜像（可能被其它容器使用）
EOF
printf '确认请输入 yes：'
read -r answer
[ "$answer" = "yes" ] || { info "已取消，未做任何改动"; exit 0; }

info "删除容器、网络与数据卷…"
docker compose down -v --remove-orphans

clear_dir() {
  local dir="$1"
  if [ -d "$dir" ]; then
    find "$dir" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
    info "已清空 $dir"
  else
    info "目录不存在，跳过：$dir"
  fi
}
clear_dir "$UPLOADS_DIR"
clear_dir "$BACKUPS_DIR"
rmdir "$ROOT/data" 2>/dev/null || true

if [ -f .env ]; then
  rm -f .env
  info "已删除 .env"
fi

info "删除本地应用镜像…"
for img in "$APP_IMAGE" "${APP_IMAGE%:*}:1.0.0" "$WEB_IMAGE" "${WEB_IMAGE%:*}:1.0.0"; do
  docker rmi "$img" >/dev/null 2>&1 || true
done

echo
info "彻底清除完成"
echo "  下次 ./install.sh 会从零开始："
echo "    · 重新生成 .env 与随机 MongoDB / Redis 密码"
echo "    · 空库启动，首次访问进入 /setup 初始化向导"
echo "    · 自动写入「欢迎使用」话题与 9 条引导瞬间"
echo "    · 从 Docker Hub 重新拉取应用镜像"
