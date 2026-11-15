import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createRoot, type Root } from "react-dom/client";

import styles from "./index.module.less";

export interface ActionSheetAction {
  key: string;
  text: ReactNode;
  description?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
  bold?: boolean;
  onClick?: () => void | Promise<void>;
}

export interface ActionSheetProps {
  visible?: boolean;
  actions?: ActionSheetAction[];
  cancelText?: ReactNode;
  closeOnAction?: boolean;
  closeOnMaskClick?: boolean;
  onClose?: () => void;
  onAction?: (action: ActionSheetAction, index: number) => void | Promise<void>;
}

export interface ConfirmDialogProps {
  content: ReactNode;
  confirmText?: ReactNode;
  cancelText?: ReactNode;
  danger?: boolean;
  onConfirm?: () => void | Promise<void>;
}

const ActionSheet = (props: ActionSheetProps) => {
  const {
    visible = false,
    actions = [],
    cancelText,
    closeOnAction = false,
    closeOnMaskClick = true,
    onClose,
    onAction,
  } = props;
  const [mounted, setMounted] = useState(visible);
  const [entered, setEntered] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();
  const enterFrame = useRef<number>();

  useEffect(() => {
    if (visible) {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      setMounted(true);
      setEntered(false);
      enterFrame.current = requestAnimationFrame(() => setEntered(true));
      return;
    }
    setEntered(false);
    closeTimer.current = setTimeout(() => setMounted(false), 220);
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      if (enterFrame.current) cancelAnimationFrame(enterFrame.current);
    };
  }, [visible]);

  useEffect(() => {
    if (!mounted) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mounted]);

  const handleAction = async (action: ActionSheetAction, index: number) => {
    if (closeOnAction) onClose?.();
    await action.onClick?.();
    await onAction?.(action, index);
  };

  if (!mounted) return null;

  return (
    <div
      className={`${styles.root} ${entered && visible ? styles.visible : styles.hidden}`}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className={styles.mask}
        aria-label="关闭操作菜单"
        onClick={closeOnMaskClick ? onClose : undefined}
      />
      <div className={styles.sheet} onClick={(event) => event.stopPropagation()}>
        <div className={styles.grabber} aria-hidden="true" />
        <div className={styles.actionList} role="menu">
          {actions.map((action, index) => (
            <button
              key={action.key}
              type="button"
              role="menuitem"
              disabled={action.disabled}
              className={`${styles.action} ${action.danger ? styles.danger : ""} ${action.bold ? styles.bold : ""}`}
              onClick={() => void handleAction(action, index)}
            >
              <span>{action.text}</span>
              {action.description && <small>{action.description}</small>}
            </button>
          ))}
        </div>
        {cancelText && (
          <button type="button" className={`${styles.action} ${styles.cancel}`} onClick={onClose}>
            {cancelText}
          </button>
        )}
      </div>
    </div>
  );
};

let imperativeRoot: Root | null = null;
let imperativeHost: HTMLDivElement | null = null;

const closeImperative = () => {
  imperativeRoot?.unmount();
  imperativeRoot = null;
  imperativeHost?.remove();
  imperativeHost = null;
};

const ImperativeActionSheet = (props: ActionSheetProps) => {
  const [visible, setVisible] = useState(true);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();
  const close = () => {
    if (!visible) return;
    props.onClose?.();
    setVisible(false);
    closeTimer.current = setTimeout(closeImperative, 240);
  };

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  return <ActionSheet {...props} visible={visible} onClose={close} />;
};

const show = (props: ActionSheetProps) => {
  closeImperative();
  imperativeHost = document.createElement("div");
  document.body.appendChild(imperativeHost);
  imperativeRoot = createRoot(imperativeHost);
  imperativeRoot.render(<ImperativeActionSheet {...props} />);
};

const ConfirmDialog = ({
  content,
  confirmText = "确定",
  cancelText = "取消",
  danger = false,
  onConfirm,
  onResolve,
}: ConfirmDialogProps & { onResolve: (confirmed: boolean) => void }) => {
  const [entered, setEntered] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleResolve = async (confirmed: boolean) => {
    if (busy) return;
    setBusy(true);
    try {
      if (confirmed) await onConfirm?.();
    } finally {
      onResolve(confirmed);
    }
  };

  return (
    <div
      className={`${styles.confirmRoot} ${entered ? styles.confirmVisible : styles.confirmHidden}`}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className={styles.confirmMask}
        aria-label="关闭确认弹窗"
        onClick={() => void handleResolve(false)}
      />
      <div className={styles.confirmCard} onClick={(event) => event.stopPropagation()}>
        <div className={styles.confirmContent}>{content}</div>
        <div className={styles.confirmActions}>
          <button
            type="button"
            className={`${styles.confirmAction} ${styles.confirmCancel}`}
            disabled={busy}
            onClick={() => void handleResolve(false)}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`${styles.confirmAction} ${danger ? styles.confirmDanger : styles.confirmPrimary}`}
            disabled={busy}
            onClick={() => void handleResolve(true)}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

let confirmRoot: Root | null = null;
let confirmHost: HTMLDivElement | null = null;

const closeConfirm = () => {
  confirmRoot?.unmount();
  confirmRoot = null;
  confirmHost?.remove();
  confirmHost = null;
};

const confirm = (props: ConfirmDialogProps): Promise<boolean> =>
  new Promise((resolve) => {
    closeConfirm();
    confirmHost = document.createElement("div");
    document.body.appendChild(confirmHost);
    confirmRoot = createRoot(confirmHost);
    confirmRoot.render(
      <ConfirmDialog
        {...props}
        onResolve={(confirmed) => {
          resolve(confirmed);
          closeConfirm();
        }}
      />
    );
  });

export const ActionSheetContext = createContext<ActionSheetProps | null>(null);
export const useActionSheet = () => useContext(ActionSheetContext);

export default Object.assign(ActionSheet, { show, confirm });
