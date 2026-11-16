# 卸载

两个独立脚本，按需要选一个：

| 脚本 | 删除 | 保留 | 场景 |
|---|---|---|---|
| `./uninstall.sh` | 容器、compose 网络 | 数据卷、上传文件、备份、`.env`、本地镜像 | 暂时停用、停机维护 |
| `./uninstall-purge.sh` | 上述全部 + 数据卷、上传文件、备份、`.env`、应用镜像 | 官方基础镜像（mongo / redis） | 彻底重置，重装走完整首次安装流程 |

## 保留数据卸载

```bash
cd wink-docker
./uninstall.sh
```

只停止并删除四个容器和 compose 网络，**保留**：

- mongo / redis 命名数据卷（账号、帖子、评论、话题、分享链接）；
- `data/`（上传的图片视频 + 数据库备份 JSON）；
- `.env`（配置与密码）；
- 本地 `wink-app` / `wink-web` 镜像。

之后想再启用：`./install.sh` 或 `docker compose up -d`，数据原样恢复。

## 彻底清除

```bash
cd wink-docker
./uninstall-purge.sh
```

脚本会先列出即将删除的全部内容，输入 `yes` 才继续。删除范围：

- 四个容器与 compose 网络；
- mongo / redis 命名数据卷（**不可恢复**）；
- `${UPLOADS_DIR:-./data/uploads}` 下的全部文件（图片、视频、缩略图、`_trash`）；
- `${BACKUPS_DIR:-./data/backups}` 下的全部备份；
- `.env`（含数据库密码）；
- 本地 `yipanzwx/wink-app` / `yipanzwx/wink-web` 镜像（含 `:1.0.0` tag）。

安全限制：脚本只删项目目录内的路径。若 `.env` 里的 `UPLOADS_DIR` / `BACKUPS_DIR` 指向项目外、含 `..` 或是符号链接，会直接拒绝执行。官方基础镜像 `mongo:7` / `redis:7-alpine` 不删（可能被其它容器使用）。

清除后再执行 `./install.sh` 即走完整首次安装流程：重新生成 `.env` 与随机密码 → 空库启动 → 首次访问进入 `/setup` 初始化向导 → 自动写入「欢迎使用」话题与 9 条引导瞬间。

> 执行前建议把 `${BACKUPS_DIR}` 和 `${UPLOADS_DIR}` 拷走一份，恢复方法见 [backup-restore.md](backup-restore.md)。

## 手动方式（等价操作）

```bash
cd wink-docker

# 保留数据
docker compose down --remove-orphans

# 彻底清除（在上面基础上继续执行）
docker compose down -v --remove-orphans
find data/uploads data/backups -mindepth 1 -maxdepth 1 -exec rm -rf {} +
rm -f .env
docker rmi yipanzwx/wink-app:latest yipanzwx/wink-web:latest
```
