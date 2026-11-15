#!/usr/bin/env bash
# 瞬间 · 卸载
#   ./uninstall.sh            停止并删除容器与网络，数据卷、上传目录、备份目录全部保留
#   ./uninstall.sh --purge    连数据卷一起删除（上传目录与备份目录仍保留，需要你手动处理）
set -euo pipefail

cd "$(dirname "$0")"

info() { printf '\033[32m[瞬间]\033[0m %s\n' "$1"; }
warn() { printf '\033[33m[瞬间]\033[0m %s\n' "$1"; }

UPLOADS_DIR="$(awk -F= '$1=="UPLOADS_DIR"{sub(/^[^=]*=/,"");print;exit}' .env 2>/dev/null || true)"
BACKUPS_DIR="$(awk -F= '$1=="BACKUPS_DIR"{sub(/^[^=]*=/,"");print;exit}' .env 2>/dev/null || true)"
[ -n "$UPLOADS_DIR" ] || UPLOADS_DIR=./data/uploads
[ -n "$BACKUPS_DIR" ] || BACKUPS_DIR=./data/backups

if [ "${1:-}" = "--purge" ]; then
  warn "即将删除 MongoDB / Redis 数据卷（帖子、用户、分享记录会全部消失）"
  warn "上传目录 $UPLOADS_DIR 与备份目录 $BACKUPS_DIR 不会被自动删除"
  printf '确认请输入 yes：'
  read -r answer
  [ "$answer" = "yes" ] || { info "已取消"; exit 0; }
  docker compose down -v
  info "容器、网络与数据卷已删除"
else
  docker compose down
  info "容器与网络已删除；数据卷、上传目录、备份目录均保留"
fi

echo
echo "  如需彻底清空，请自行确认后删除："
echo "    $UPLOADS_DIR"
echo "    $BACKUPS_DIR"
echo "    .env"
