# 卸载

## 普通卸载（保留数据）

```bash
cd wink-docker
./uninstall.sh
```

只停止并删除四个容器和 compose 网络，**保留**：

- `data/`（上传的图片视频 + 数据库备份 JSON）；
- `.env`（配置与密码）；
- 已构建的 `wink-app` / `wink-web` 镜像。

之后想再启用：`./install.sh` 或 `docker compose up -d`，数据原样恢复。

## 彻底清除（连数据一起删）

```bash
cd wink-docker
./uninstall.sh --purge
```

额外删除：

- mongo / redis 的 Docker 数据卷（数据库全部内容，**不可恢复**）；
- `data/` 目录（图片、视频、备份）；
- `.env`。

`wink-app` / `wink-web` 镜像仍会保留，需要的话手动 `docker rmi wink-app wink-web`。

> 执行 `--purge` 前建议先把 `${BACKUPS_DIR}` 和 `${UPLOADS_DIR}` 拷走一份，恢复方法见 [backup-restore.md](backup-restore.md)。

## 手动方式（等价操作）

```bash
cd wink-docker
docker compose down -v --remove-orphans   # 停容器、删卷
rm -rf data .env                          # 删本地数据（可选）
docker rmi wink-app wink-web               # 删镜像（可选）
```
