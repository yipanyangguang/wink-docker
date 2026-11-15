import { Button, Input, message } from "antd";
import { useState } from "react";

import { userLogin } from "@/APIS/user";
import { AUTH_CHANGED_EVENT, navigateWithTransition } from "@/utils/navigation";
import { getRouteSearchParams } from "@/utils/routes";

import styles from "./index.module.less";

const getReturnTo = () => {
  const value = getRouteSearchParams().get("returnTo");
  if (value?.startsWith("#/") && !value.startsWith("#/login")) return value;
  return "#/";
};

const Login = () => {
  const [userName, setUserName] = useState(localStorage.getItem("userName") ?? "");
  const [password, setPassword] = useState(localStorage.getItem("password") ?? "");
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    if (!userName.trim() || !password) {
      message.error("请输入名称和密码");
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      const { error, data, msg } = await userLogin(userName.trim(), password);
      if (error || !data?.token) {
        message.error(msg || (error ? String(error) : "登录失败"));
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("userName", userName.trim());
      localStorage.setItem("password", password);
      // 清掉旧版「动态码登录」留下的登录方式标记
      localStorage.removeItem("loginType");

      window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
      message.success("登录成功");
      navigateWithTransition(getReturnTo(), { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={styles.loginWarp}>
      <section className={styles.loginPanel} aria-label="登录">
        <Input
          className={styles.nameInput}
          size="large"
          autoComplete="username"
          placeholder="输入名称"
          value={userName}
          onChange={(event) => setUserName(event.target.value)}
        />

        <Input.Password
          className={styles.credentialInput}
          size="large"
          autoComplete="current-password"
          placeholder="输入密码"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          onPressEnter={handleLogin}
        />

        <Button
          className={styles.loginButton}
          type="primary"
          size="large"
          block
          loading={submitting}
          onClick={handleLogin}
        >
          登录
        </Button>
      </section>
    </main>
  );
};

export default Login;
