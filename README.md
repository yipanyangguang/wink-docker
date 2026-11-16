# 瞬间 · Docker 独立部署包

家庭内部使用的「瞬间」照片墙 / 动态流，打包成 4 个 Docker 容器（nginx / app / mongo / redis），单端口对外，一条命令安装。

## 快速开始

```bash
# 默认从 Docker Hub 拉取镜像（yipanzwx/wink-app、yipanzwx/wink-web，双架构）
./install.sh

# 或从本源码构建镜像（二次开发 / 拉不到镜像时）
./install.sh --build
```

然后浏览器打开 `http://<主机IP>:8080`：

- 没有预置管理员 → 自动进入初始化向导，注册第一个管理员账号；
- `.env` 里预置了管理员 → 直接用预置账号登录。

详细步骤与注意事项见 [docs/install.md](docs/install.md)。

## 它包含什么

- **发帖 / 评论 / 话题 / 分享**：图片自动压缩成 webp、mp4 视频原样落盘，帖子可生成免登录分享链接；
- **两档身份**：管理员（管成员、删任意内容、进管理端）与成员（只能动自己的内容）；
- **管理端**（`#/admin`，仅管理员）：加成员、停用成员、两个运维开关；
- **两个定时任务**（默认关闭，管理端随时开关、即时生效）：
  - 每天 0:00 导出数据库 JSON 备份（保留最近 7 份，**不含图片**）；
  - 每天 3:00 把无引用文件移入回收目录 `_trash`（不物理删除）。

## 文档目录

| 文档 | 内容 |
|---|---|
| [docs/install.md](docs/install.md) | 安装步骤、两条初始化路径、常见安装问题 |
| [docs/configuration.md](docs/configuration.md) | `.env` 全部字段说明 |
| [docs/backup-restore.md](docs/backup-restore.md) | 备份机制、如何恢复到新机器 |
| [docs/uninstall.md](docs/uninstall.md) | 卸载与数据清理 |
| [docs/faq.md](docs/faq.md) | 常见问题 |

## 目录结构

```
wink-docker/
├── app/                 # Koa 后端（TypeScript 编译后运行）
├── web/                 # React 前端（构建产物放进 nginx 容器）
├── data/                # 运行时数据（可改路径，不进 git）
│   ├── uploads/         # 图片、视频、缩略图、_trash 回收目录
│   └── backups/         # 每日数据库 JSON 备份
├── docker-compose.yml   # 四容器编排，只有 web 发布端口
├── install.sh           # 一键安装 / 升级
├── uninstall.sh         # 卸载：保留数据
├── uninstall-purge.sh   # 卸载：彻底清除（不可恢复，重装走完整流程）
└── .env.example         # 配置模板
```

## 升级 / 维护

- 升级：重新执行 `./install.sh`，会拉取（或 `--build` 时重新构建）最新镜像并重启容器，**数据库与上传文件全部保留**，已有密码不会被重置。
- 卸载：`./uninstall.sh` 只停服务、数据全留；`./uninstall-purge.sh` 彻底删除数据卷、上传文件、备份、`.env` 与应用镜像，之后重装走完整首次安装流程。
- `docker compose down && docker compose up -d`：重启全部服务，数据不丢。
- 日常备份见 [docs/backup-restore.md](docs/backup-restore.md)。
