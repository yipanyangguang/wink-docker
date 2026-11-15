import { DatePicker, Switch } from "antd-mobile";
import dayjs from "dayjs";
import { useState } from "react";

import styles from "./index.module.less";

interface PublishTimeSettingProps {
  editing?: boolean;
  value?: Date;
  disabled?: boolean;
  onChange: (value: Date | undefined) => void;
}

const PublishTimeSetting = ({ editing = false, value, disabled, onChange }: PublishTimeSettingProps) => {
  const [visible, setVisible] = useState(false);
  const [initialTime, setInitialTime] = useState(new Date());
  const enabled = Boolean(value) || visible;

  const openPicker = () => {
    setInitialTime(new Date());
    setVisible(true);
  };

  return (
    <div className={styles.card}>
      {!editing && (
        <div className={styles.row}>
          <span className={styles.label}>补发到过去时间</span>
          <Switch
            aria-label="补发到过去时间"
            checked={enabled}
            disabled={disabled}
            style={{ "--width": "40px", "--height": "24px" }}
            onChange={(checked) => {
              if (checked) openPicker();
              else {
                setVisible(false);
                onChange(undefined);
              }
            }}
          />
        </div>
      )}
      {(editing || enabled) && (
        <div className={`${styles.row} ${styles.timeRow}`}>
          <span className={styles.label}>发布时间</span>
          <button type="button" className={styles.picker} disabled={disabled} onClick={openPicker}>
            {value ? dayjs(value).format("YYYY-MM-DD HH:mm") : "请选择时间"}
          </button>
        </div>
      )}
      <p className={styles.hint}>只能选择当前或过去的时间</p>
      <DatePicker
        visible={visible}
        value={value ?? initialTime}
        min={new Date(0)}
        max={new Date()}
        precision="minute"
        title="选择发布时间"
        cancelText="取消"
        confirmText="确定"
        onClose={() => setVisible(false)}
        onConfirm={(selected) => {
          onChange(editing ? selected : dayjs(selected).startOf("minute").toDate());
          setVisible(false);
        }}
      />
    </div>
  );
};

export default PublishTimeSetting;
