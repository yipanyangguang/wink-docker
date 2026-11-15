import { Button, Input, message, Spin, Switch } from "antd";
import { useEffect, useState } from "react";

import ActionSheet from "@/components/ActionSheet";
import {
  addMember,
  getMembers,
  getSettings,
  removeMember,
  saveSettings,
  type Member,
  type SiteSettings,
} from "@/APIS/system";
import { getMyUserInfo } from "@/APIS/user";
import windowFunc from "@/utils/windowFunc";

import styles from "./index.module.less";

const DEFAULT_SETTINGS: SiteSettings = {
  dbBackup: false,
  cleanUnusedFiles: false,
};

type Access = "checking" | "allowed" | "denied";

const Admin = () => {
  const [access, setAccess] = useState<Access>("checking");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [myUserId, setMyUserId] = useState<number | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);

  const [newUserName, setNewUserName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [adding, setAdding] = useState(false);

  const loadData = async () => {
    const [membersRes, settingsRes] = await Promise.all([
      getMembers(),
      getSettings(),
    ]);
    if (membersRes?.error) throw new Error(membersRes.msg || "获取成员失败");
    if (settingsRes?.error) throw new Error(settingsRes.msg || "获取设置失败");
    setMembers(membersRes.data ?? []);
    setSettings(settingsRes.data ?? DEFAULT_SETTINGS);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await getMyUserInfo();
        if (cancelled) return;
        if (me?.role !== "admin") {
          setAccess("denied");
          return;
        }
        setMyUserId(me.userId);
        setAccess("allowed");
        await loadData();
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "加载失败");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const retry = () => {
    setLoadError("");
    setLoading(true);
    void loadData()
      .catch((err) =>
        setLoadError(err instanceof Error ? err.message : "加载失败")
      )
      .finally(() => setLoading(false));
  };

  const refreshMembers = async () => {
    const res = await getMembers();
    if (res?.error) throw new Error(res.msg || "获取成员失败");
    setMembers(res.data ?? []);
  };

  const handleAddMember = async () => {
    setFormError("");
    if (!newUserName.trim()) {
      setFormError("请输入用户名");
      return;
    }
    if (newPassword.length < 6) {
      setFormError("密码至少 6 位");
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError("两次输入的密码不一致");
      return;
    }

    setAdding(true);
    try {
      const res = await addMember(newUserName.trim(), newPassword);
      if (res?.error) {
        setFormError(res.msg || "添加失败");
        return;
      }
      setNewUserName("");
      setNewPassword("");
      setConfirmPassword("");
      message.success("成员添加成功");
      await refreshMembers();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "添加失败");
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = (member: Member) => {
    void ActionSheet.confirm({
      content: `确定删除成员「${member.userName}」？仅停用账号并清除登录状态，其帖子与评论将保留`,
      confirmText: "删除",
      danger: true,
      onConfirm: async () => {
        try {
          const res = await removeMember(member.userId);
          if (res?.error) throw new Error(res.msg || "删除失败");
          message.success("已删除成员");
          await refreshMembers();
        } catch (err) {
          message.error(err instanceof Error ? err.message : "删除失败");
        }
      },
    });
  };

  const handleToggle = async (key: keyof SiteSettings, value: boolean) => {
    const previous = settings[key];
    setSettings((current) => ({ ...current, [key]: value }));
    try {
      const res = await saveSettings({ [key]: value });
      if (res?.error) throw new Error(res.msg || "保存失败");
      if (res.data) setSettings(res.data);
    } catch (err) {
      setSettings((current) => ({ ...current, [key]: previous }));
      message.error(err instanceof Error ? err.message : "保存失败");
    }
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>管理端</h1>
        <p className={styles.subtitle}>成员与自动化任务设置</p>
      </header>

      {access === "checking" || loading ? (
        <div className={styles.state}>
          <Spin />
          <p>正在加载…</p>
        </div>
      ) : access === "denied" ? (
        <div className={styles.state}>
          <p className={styles.stateTitle}>只有管理员可以访问</p>
          <Button onClick={() => windowFunc.replace("#/center")}>返回</Button>
        </div>
      ) : loadError ? (
        <div className={styles.state}>
          <p className={styles.errorText}>{loadError}</p>
          <Button onClick={retry}>重新加载</Button>
        </div>
      ) : (
        <>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>成员列表</h2>
            {members.length === 0 ? (
              <p className={styles.empty}>暂无成员</p>
            ) : (
              <ul className={styles.memberList}>
                {members.map((member) => {
                  const canDelete =
                    member.role !== "admin" &&
                    member.status === "active" &&
                    member.userId !== myUserId;
                  return (
                    <li key={member.userId} className={styles.memberRow}>
                      <div className={styles.memberInfo}>
                        <span className={styles.memberName}>{member.userName}</span>
                        <span className={styles.memberMeta}>
                          {member.role === "admin" ? "管理员" : "成员"} ·{" "}
                          {member.status === "active" ? "正常" : "已停用"}
                        </span>
                      </div>
                      {canDelete && (
                        <button
                          type="button"
                          className={styles.deleteBtn}
                          onClick={() => handleRemove(member)}
                        >
                          删除
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>添加成员</h2>
            <Input
              className={styles.input}
              size="large"
              autoComplete="username"
              placeholder="用户名"
              value={newUserName}
              onChange={(event) => setNewUserName(event.target.value)}
            />
            <Input.Password
              className={styles.input}
              size="large"
              autoComplete="new-password"
              placeholder="密码（至少 6 位）"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
            <Input.Password
              className={styles.input}
              size="large"
              autoComplete="new-password"
              placeholder="确认密码"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
            {formError && <p className={styles.errorText}>{formError}</p>}
            <Button
              type="primary"
              size="large"
              block
              loading={adding}
              onClick={handleAddMember}
            >
              添加成员
            </Button>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>自动化任务</h2>
            <p className={styles.defaultHint}>以下功能默认关闭</p>
            <div className={styles.switchRow}>
              <div className={styles.switchText}>
                <span className={styles.switchLabel}>每天 0:00 导出数据库 JSON</span>
                <span className={styles.switchDesc}>
                  备份不含图片，恢复时需同时带走静态文件目录
                </span>
              </div>
              <Switch
                checked={settings.dbBackup}
                onChange={(checked) => void handleToggle("dbBackup", checked)}
              />
            </div>
            <div className={styles.switchRow}>
              <div className={styles.switchText}>
                <span className={styles.switchLabel}>每天 3:00 清理无引用文件</span>
                <span className={styles.switchDesc}>
                  孤儿文件只会移到回收目录，不会直接删除
                </span>
              </div>
              <Switch
                checked={settings.cleanUnusedFiles}
                onChange={(checked) =>
                  void handleToggle("cleanUnusedFiles", checked)
                }
              />
            </div>
          </section>
        </>
      )}
    </main>
  );
};

export default Admin;
