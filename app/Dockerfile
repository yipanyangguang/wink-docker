# app 镜像：编译期用完整依赖产出 dist，运行期只带生产依赖 + ImageMagick
# 目标机若是 arm64，本地构建会自动产出 arm64 镜像，无需 buildx
# syntax=docker/dockerfile:1

# ---------- 构建阶段 ----------
FROM node:20-bookworm-slim AS build
WORKDIR /app

# 先只拷清单，依赖层可被缓存复用
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---------- 运行阶段 ----------
FROM node:20-bookworm-slim AS runtime

# gm 走 ImageMagick 6（代码里是 GM.subClass({ imageMagick: true })，对应 convert / identify）
RUN apt-get update \
 && apt-get install -y --no-install-recommends imagemagick ca-certificates \
 && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    APP_PORT=3000 \
    STORAGE_DIR=/data/uploads \
    BACKUP_DIR=/data/backups

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund \
 && npm cache clean --force \
 && rm -rf /root/.npm

COPY --from=build /app/dist ./dist

# 初始化引导内容用的内置图片（seedGuide 按 dist 同级 assets/guide 读取）
COPY assets ./assets

# 上传与备份卷的挂载点（compose 会用宿主机目录覆盖）
RUN mkdir -p /data/uploads/compress /data/uploads/_trash /data/backups \
 && chown -R node:node /data

EXPOSE 3000

# 不用 npm start，避免多一层 shell 成为 PID 1；init: true 在 compose 里补
CMD ["node", "dist/index.js"]
