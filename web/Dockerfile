# web 镜像：构建前端产物后放进 nginx，是整个包唯一对外入口
# syntax=docker/dockerfile:1

# ---------- 构建阶段 ----------
FROM node:20-bookworm-slim AS build
WORKDIR /app

# package.json 里锁定了 yarn 4，用 corepack 取同版本，保证与本地构建一致
RUN corepack enable
COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install --immutable

COPY tsconfig.json tsconfig.node.json vite.config.ts index.html ./
COPY public ./public
COPY src ./src
RUN yarn build

# ---------- 运行阶段 ----------
FROM nginx:alpine AS runtime

# nginx:alpine 不带 tzdata，装了 TZ 才真的生效（日志、缓存头时间）
RUN apk add --no-cache tzdata
ENV TZ=Asia/Shanghai

COPY --from=build /app/dist /usr/share/nginx/html

# 官方镜像启动时会对 /etc/nginx/templates/*.template 做 envsubst，
# 只替换已定义的环境变量（MAX_UPLOAD_MB 等），$uri 这类 nginx 变量不受影响
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
RUN rm -f /etc/nginx/conf.d/default.conf

EXPOSE 80
