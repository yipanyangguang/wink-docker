# 配置说明

所有配置集中在一个 `.env` 文件（首次运行 `install.sh` 自动从 `.env.example` 生成）。改完配置执行 `docker compose up -d` 生效；涉及镜像构建的改动（无）需要 `./install.sh`。

## 对外访问

### `PORT`（默认 8080）

整个包唯一对外端口。浏览器访问 `http://<主机IP>:PORT`。改端口后 nginx、后端、健康检查会一起跟随。

### `TZ`（默认 Asia/Shanghai）

注入全部四个容器。**决定每天 0:00 备份、3:00 清理按哪个时区执行**。改成其它时区任务时间会跟着变。

### `SITE_NAME`（默认 瞬间）

站点名，显示在登录页与浏览器标题。

## 数据目录（宿主机路径）

### `UPLOADS_DIR`（默认 ./data/uploads）

图片、视频、压缩缩略图、`_trash` 回收目录都在这里。**换机器 / 恢复备份时必须连这个目录一起带走**。

建议改成绝对路径挂到大容量盘上，例如 `/Volumes/YourDisk/wink/uploads`。

### `BACKUPS_DIR`（默认 ./data/backups）

每日 0:00 导出的数据库 JSON 存放处（前提是管理端打开了备份开关）。只含数据库，不含图片。

## 预置管理员（可选）

### `ADMIN_USERNAME` / `ADMIN_PASSWORD`（默认空）

两项都填：首次启动自动建管理员，跳过网页向导。用户名 2~30 字、密码至少 6 位，不满足会启动失败。生效后脚本会清空 `ADMIN_PASSWORD`。

留空：首次打开网页进 `#/setup` 向导注册。

## 上传上限

### `MAX_UPLOAD_MB`（默认 100）

单文件上传上限，同时作用于 nginx 与后端。

## 内部凭据（自动生成）

### `MONGO_USER` / `MONGO_PASSWORD` / `REDIS_PASSWORD`

`install.sh` 随机生成并写入 `.env`，只在容器内部网络使用，不需要记。

> **已经初始化过数据卷后不要改 `MONGO_PASSWORD`**：`MONGO_INITDB_*` 只在首次建库时生效，改了会导致 app 连不上旧卷。确需修改，进容器改库内用户密码，或删卷重建（数据会丢）。

### `APP_UID` / `APP_GID`

后端容器运行用户，`install.sh` 自动填当前用户，保证上传文件属主与宿主机一致。

## 镜像版本

### `MONGO_IMAGE` / `REDIS_IMAGE`

默认 `mongo:7` / `redis:7-alpine`。改大版本前先备份（见 [backup-restore.md](backup-restore.md)）。

## 管理端可配置项（不在 .env）

两个运维开关存在数据库里（管理端 `#/admin` 页面即时开关，无需重启容器）：

| 开关 | 行为 | 时间 |
|---|---|---|
| 数据库备份 | 导出 7 个集合为 JSON，保留最近 7 份 | 每天 0:00 |
| 无引用文件清理 | 上传目录顶层无引用文件移入 `_trash` | 每天 3:00 |

默认全部关闭。详见 [backup-restore.md](backup-restore.md)。
