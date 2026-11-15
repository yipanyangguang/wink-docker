import { Button, Input, message, Modal } from "antd";
import { useEffect, useState } from "react";

import { changePassword, getMyUserInfo } from "@/APIS/user";
import { getRouteLocation } from "@/utils/routes";
import windowFunc from "@/utils/windowFunc";

import styles from "./index.module.less";

const SettingsLinks = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadRole = () => {
      getMyUserInfo()
        .then((res) => {
          if (!cancelled) setIsAdmin(res?.role === "admin");
        })
        .catch(() => {
          if (!cancelled) setIsAdmin(false);
        });
    };
    loadRole();
    // UserCenter 是常驻 Tab 页，换账号（登出再登录）后组件不会重新挂载，
    // isAdmin 会残留上一个账号的值。SPA 导航走 history.pushState 不触发
    // hashchange，所以同时监听项目统一的 app:navigation 事件，
    // 每次进入个人中心时重新拉取角色
    const refreshRoleOnCenter = () => {
      if (getRouteLocation().path === "/center") loadRole();
    };
    window.addEventListener("app:navigation", refreshRoleOnCenter);
    window.addEventListener("hashchange", refreshRoleOnCenter);
    return () => {
      cancelled = true;
      window.removeEventListener("app:navigation", refreshRoleOnCenter);
      window.removeEventListener("hashchange", refreshRoleOnCenter);
    };
  }, []);

  const closeModal = () => {
    setModalOpen(false);
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setFormError("");
  };

  const handleChangePassword = async () => {
    setFormError("");
    if (!oldPassword) {
      setFormError("请输入原密码");
      return;
    }
    if (newPassword.length < 6) {
      setFormError("新密码至少 6 位");
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError("两次输入的新密码不一致");
      return;
    }

    setSubmitting(true);
    try {
      const res = await changePassword(oldPassword, newPassword);
      if (res?.error) {
        setFormError(res.msg || "修改失败");
        return;
      }
      message.success(res?.data || "密码修改成功");
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "修改失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.warp}>
      <div className={styles.card}>
        <p className={styles.title}>设置</p>

        <button
          type="button"
          className={styles.item}
          onClick={() => setModalOpen(true)}
        >
          <span>修改密码</span>
          <span className={styles.arrow}>›</span>
        </button>
        <button
          type="button"
          className={styles.item}
          onClick={() => windowFunc.open("#/users")}
        >
          <span>所有用户</span>
          <span className={styles.arrow}>›</span>
        </button>
        {isAdmin && (
          <button
            type="button"
            className={styles.item}
            onClick={() => windowFunc.open("#/admin")}
          >
            <span>管理端</span>
            <span className={styles.arrow}>›</span>
          </button>
        )}
      </div>

      <Modal
        title="修改密码"
        open={modalOpen}
        onCancel={closeModal}
        footer={null}
      >
        <div className={styles.modalForm}>
          <Input.Password
            className={styles.input}
            size="large"
            autoComplete="current-password"
            placeholder="原密码"
            value={oldPassword}
            onChange={(event) => setOldPassword(event.target.value)}
          />
          <Input.Password
            className={styles.input}
            size="large"
            autoComplete="new-password"
            placeholder="新密码（至少 6 位）"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
          <Input.Password
            className={styles.input}
            size="large"
            autoComplete="new-password"
            placeholder="确认新密码"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
          {formError && <p className={styles.errorText}>{formError}</p>}
          <Button
            type="primary"
            size="large"
            block
            loading={submitting}
            onClick={handleChangePassword}
          >
            确认修改
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default SettingsLinks;
