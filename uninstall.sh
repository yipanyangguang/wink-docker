#!/usr/bin/env bash
# 瞬间 · 卸载（保留数据）
#   ./uninstall.sh   只停止并删除容器与网络，其余一切原样保留
set -euo pipefail

cd "$(dirname "$0")"

info() { printf '\033[32m[瞬间]\033[0m %s\n' "$1"; }
warn() { printf '\033[33m[瞬间]\033[0m %s\n' "$1"; }

if [ $# -gt 0 ]; then
  if [ "$1" = "--purge" ]; then
    warn "彻底清除已拆成独立脚本：./uninstall-purge.sh"
    warn "它会删除数据卷、上传文件、备份、.env 与应用镜像，且不可恢复"
    exit 1
  fi
  echo "用法：./uninstall.sh" >&2
  exit 1
fi

UPLOADS_DIR="$(awk -F= '$1=="UPLOADS_DIR"{sub(/^[^=]*=/,"");print;exit}' .env 2>/dev/null || true)"
BACKUPS_DIR="$(awk -F= '$1=="BACKUPS_DIR"{sub(/^[^=]*=/,"");print;exit}' .env 2>/dev/null || true)"
[ -n "$UPLOADS_DIR" ] || UPLOADS_DIR=./data/uploads
[ -n "$BACKUPS_DIR" ] || BACKUPS_DIR=./data/backups

info "正在停止并删除容器与网络…"
docker compose down --remove-orphans

echo
info "卸载完成。以下内容全部保留："
echo "  · MongoDB / Redis 数据卷（账号、帖子、评论、话题、分享链接）"
echo "  · ${UPLOADS_DIR}（图片、视频、缩略图、_trash）"
echo "  · ${BACKUPS_DIR}（备份 JSON）"
echo "  · .env（配置与密码）"
echo "  · 本地镜像 wink-app / wink-web"
echo
echo "  重新启用：./install.sh   数据原样恢复"
echo "  彻底清除：./uninstall-purge.sh   不可恢复，需重走首次安装流程"
