# 安装指南

## 前置要求

| 项 | 要求 |
|---|---|
| Docker | 20.10+，带 `docker compose` 插件 |
| 架构 | arm64 与 x86_64 均可，镜像从本机源码构建，架构自动匹配，无需选择 |
| 网络 | 首次构建需能拉取 `node:20-bookworm-slim`、`nginx:alpine`、`mongo:7`、`redis:7-alpine` 基础镜像 |
| 磁盘 | 建议 ≥ 2GB 剩余空间（镜像约 600MB + 数据） |
| 端口 | 默认占用 8080，可在 `.env` 改 `PORT` |

## 安装步骤

```bash
cd wink-docker
./install.sh
```

脚本会依次做这些事（全程无需人工输入）：

1. 不存在 `.env` 时，从 `.env.example` 复制一份，随机生成 Mongo / Redis 密码并写入；
2. 创建 `data/uploads`、`data/backups` 目录并设置权限（属主与当前用户一致）；
3. 检查端口占用；
4. 本地构建 `wink-app`、`wink-web` 两个镜像并启动四个容器；
5. 轮询 `/api/health` 直到全部就绪（最长 3 分钟）；
6. 若 `.env` 预置了管理员且初始化成功，自动清空 `.env` 里的 `ADMIN_PASSWORD`。

看到「安装完成」后，浏览器打开 `http://<主机IP>:8080`。

## 初始化：两条路径

### 路径 A：网页向导（默认）

`.env` 里 `ADMIN_USERNAME` / `ADMIN_PASSWORD` 留空时，首次打开网页会自动进入 `#/setup` 向导：

- 页面会先展示 MongoDB / Redis / 上传目录三项自检，全部绿灯才能继续；
- 注册第一个账号，这个账号就是**管理员**；
- 初始化接口是一次性的：完成后 `POST /api/setup/init` 永久关闭，重复调用返回错误。

### 路径 B：`.env` 预置

安装前在 `.env` 填：

```env
ADMIN_USERNAME=你的用户名
ADMIN_PASSWORD=你的密码
```

首次启动会自动创建该管理员，之后 `.env` 里的密码会被清空（真实密码已 bcrypt 入库）。

> **注意**：预置用户名必须 2~30 字、密码至少 6 位。不满足时启动会直接失败（这是有意的校验，不是 bug），修好 `.env` 后重新 `./install.sh` 即可。

两条路径选一条即可。既预置又走向导时，以先完成者为准——预置生效后向导会显示「已完成初始化」。

## 安装后检查

```bash
docker compose ps          # 四个服务都应是 healthy
curl http://127.0.0.1:8080/api/health   # {"healthy":true,...}
```

## 重复执行 install.sh（升级）

`install.sh` 是幂等的：

- 已有的 Mongo / Redis 密码**不会**被重置（重置会导致旧数据卷连不上）；
- 数据库内容、上传文件、账号全部保留；
- 只会重新构建镜像并重建容器。

## 卸载

见 [uninstall.md](uninstall.md)。
