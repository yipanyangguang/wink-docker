# 备份与恢复

## 备份机制

管理端（`#/admin`，仅管理员）打开「每天 0:00 导出数据库 JSON」开关后，每天 0:00（按 `.env` 的 `TZ`）自动执行：

- 导出 7 个集合：`token_list`、`user_row`、`wink_list`、`wink_comment`、`topics`、`nacos`、`system`；
- 格式为 **EJSON**（`_id`、`ObjectId`、日期都是结构化类型，恢复时不会退化成普通字符串）；
- 目录结构：`${BACKUPS_DIR}/wink-YYYY-MM-DD/`，每集合一个 `.json`，文件权限 600；
- **只保留最近 7 份**，更早的整个目录自动删除；
- 任务失败会写进容器日志（`docker compose logs app`），不影响服务运行。

开关即时生效：打开立即注册任务，关闭立即注销，**不需要重启容器**。

## ⚠️ 备份不含图片

**这是最重要的一条**：JSON 里只有文件名，没有图片和视频本身。

完整的备份 = `${BACKUPS_DIR}`（数据库 JSON）**＋** `${UPLOADS_DIR}`（图片、视频、缩略图）。

两个目录都要带走，缺一个恢复出来都是缺图的。

建议把 `UPLOADS_DIR` 和 `BACKUPS_DIR` 都配置到宿主机的常规备份盘/云盘同步范围内（改法见 [configuration.md](configuration.md)）。

## 无引用文件清理（配合备份）

管理端打开「每天 3:00 清理无引用文件」后，每天 3:00 扫描上传目录**顶层文件**：

- 判定「无引用」：文件名不出现在 `wink_list.images / video.path / video.cover`、`wink_comment.image`、`topics.background`、`user_row.avatar` 这 6 处；
- 无引用的文件**移入 `${UPLOADS_DIR}/_trash/`**，不是物理删除，误判可以手工移回；
- `compress/`（缩略图）、`_trash/` 是子目录，天然不参与扫描；
- 已停用成员的历史帖子、评论、头像都算「有引用」，不会被清。

## 恢复到新机器

前提：拿到一份 `${BACKUPS_DIR}/wink-YYYY-MM-DD/` 和当时的 `${UPLOADS_DIR}`。

1. 新机器装好 Docker，把整个 `wink-docker` 目录拷过去；
2. `./install.sh` 安装，**先不要**初始化（不要注册管理员、`.env` 预置留空）；
3. 把旧 `uploads` 目录内容拷到新 `${UPLOADS_DIR}`（注意属主改成 `.env` 里的 `APP_UID`，一般就是当前用户）；
4. 恢复数据库（在宿主机执行，替换用户名/密码/目录为实际值；mongo 端口未对外发布，借助 `docker compose exec` 传入）：

```bash
for coll in token_list user_row wink_list wink_comment topics nacos system; do
  docker compose exec -T mongo mongoimport \
    --uri "mongodb://<MONGO_USER>:<MONGO_PASSWORD>@127.0.0.1:27017/wink?authSource=wink" \
    --collection "$coll" \
    --file "/dev/stdin" < "${BACKUPS_DIR}/wink-YYYY-MM-DD/${coll}.json"
done
```

> `mongoimport` 能直接吃 EJSON 格式（带 `$oid` / `$date` 扩展），无需转换。

5. 恢复的关键点：`system` 集合里有 `initialized: true` 标记，导入后系统会跳过初始化向导，直接用**旧数据库里的账号密码**登录（备份时的所有账号都能用，包括当时的会话 token）；
6. 打开 `http://<主机IP>:8080` 验证内容完整。

## 验证备份可用性

想确认备份文件没坏：

```bash
# 任意一台有 node 的机器上解析 EJSON
node -e "const {EJSON}=require('bson'); const d=EJSON.parse(require('fs').readFileSync('wink_list.json','utf8')); console.log('帖子数', d.length)"
```

或在 mongo 容器里用 `mongoimport --dryRun`（新版本）目视导入过程无报错。
