import { Button, Input, message, Spin } from "antd";
import { useEffect, useState } from "react";

import { getSetupStatus, setupInit, type SetupStatus } from "@/APIS/system";
import { navigateWithTransition } from "@/utils/navigation";

import styles from "./index.module.less";

const goLogin = () => navigateWithTransition("#/login", { replace: true });

const Setup = () => {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getSetupStatus();
      if (res?.error || !res?.data) {
        setStatus(null);
        setError(res?.msg || "获取初始化状态失败");
        return;
      }
      setStatus(res.data);
    } catch (err) {
      setStatus(null);
      setError(err instanceof Error ? err.message : "获取初始化状态失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleSubmit = async () => {
    setFormError("");
    const name = userName.trim();
    if (name.length < 2 || name.length > 30) {
      message.error("用户名需为 2~30 个字符");
      return;
    }
    if (password.length < 6) {
      message.error("密码至少 6 位");
      return;
    }
    if (password !== confirmPassword) {
      message.error("两次输入的密码不一致");
      return;
    }

    setSubmitting(true);
    try {
      const res = await setupInit(name, password);
      if (res?.error) {
        setFormError(res.msg || "初始化失败");
        return;
      }
      message.success("初始化成功，请登录");
      goLogin();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "初始化失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={styles.warp}>
      <section className={styles.card}>
        <header className={styles.header}>
          <h1 className={styles.title}>首次运行向导</h1>
          <p className={styles.subtitle}>{status?.siteName || "瞬间"}</p>
        </header>

        {loading && (
          <div className={styles.state}>
            <Spin />
            <p>正在检查系统状态…</p>
          </div>
        )}

        {!loading && error && (
          <div className={styles.state}>
            <p className={styles.errorText}>{error}</p>
            <Button onClick={() => void load()}>重新检查</Button>
          </div>
        )}

        {!loading && !error && status && (
          <>
            <div className={styles.info}>
              <div className={styles.infoRow}>
                <span>站点名称</span>
                <strong>{status.siteName || "瞬间"}</strong>
              </div>
              <div className={styles.infoRow}>
                <span>版本</span>
                <strong>{status.version || "-"}</strong>
              </div>
              <div className={styles.infoRow}>
                <span>初始化状态</span>
                <strong className={status.initialized ? styles.ok : styles.bad}>
                  {status.initialized ? "已完成初始化" : "尚未初始化"}
                </strong>
              </div>
            </div>

            <div className={styles.checks}>
              <p className={styles.sectionTitle}>环境自检</p>
              <div className={styles.checkRow}>
                <i className={status.checks?.mongo ? styles.dotOk : styles.dotBad} />
                <span>MongoDB 连接</span>
                <em>{status.checks?.mongo ? "正常" : "异常"}</em>
              </div>
              <div className={styles.checkRow}>
                <i className={status.checks?.redis ? styles.dotOk : styles.dotBad} />
                <span>Redis 连接</span>
                <em>{status.checks?.redis ? "正常" : "异常"}</em>
              </div>
              <div className={styles.checkRow}>
                <i className={status.checks?.storage ? styles.dotOk : styles.dotBad} />
                <span>上传目录可写</span>
                <em>{status.checks?.storage ? "正常" : "异常"}</em>
              </div>
            </div>

            {status.initialized && (
              <div className={styles.done}>
                <p>已完成初始化</p>
                <Button type="primary" size="large" block onClick={goLogin}>
                  去登录
                </Button>
              </div>
            )}

            {!status.initialized && status.adminPreset && (
              <div className={styles.done}>
                <div className={styles.infoRow}>
                  <span>管理员账号</span>
                  <strong>{status.adminUserName || "admin"}</strong>
                </div>
                <p className={styles.hint}>管理员账号已由配置预置，请直接使用该账号登录。</p>
                <Button type="primary" size="large" block onClick={goLogin}>
                  去登录
                </Button>
              </div>
            )}

            {!status.initialized && !status.adminPreset && (
              <div className={styles.form}>
                <p className={styles.sectionTitle}>创建管理员账号</p>
                <Input
                  className={styles.input}
                  size="large"
                  autoComplete="username"
                  placeholder="用户名（2~30 字）"
                  value={userName}
                  onChange={(event) => setUserName(event.target.value)}
                />
                <Input.Password
                  className={styles.input}
                  size="large"
                  autoComplete="new-password"
                  placeholder="密码（至少 6 位）"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <Input.Password
                  className={styles.input}
                  size="large"
                  autoComplete="new-password"
                  placeholder="确认密码"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  onPressEnter={handleSubmit}
                />
                {formError && <p className={styles.errorText}>{formError}</p>}
                <Button
                  type="primary"
                  size="large"
                  block
                  loading={submitting}
                  onClick={handleSubmit}
                >
                  完成初始化
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
};

export default Setup;
