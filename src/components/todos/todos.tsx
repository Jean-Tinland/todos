"use client";

import * as React from "react";
import Button from "jt-design-system/es/button";
import Tooltip from "jt-design-system/es/tooltip";
import Icon from "@/components/icon";
import type { TodoGroup } from "@/types/todo";
import * as API from "@/services/api";
import Journal from "@/components/todos/journal";
import InputField from "@/components/todos/input-field";
import Settings from "@/components/settings";
import styles from "./todos.module.css";

type Props = {
  groups: TodoGroup[];
  days: number;
};

export default function Todos({ groups: defaultGroups, days }: Props) {
  const [groups, setGroups] = React.useState(defaultGroups);
  const [loading, setLoading] = React.useState(false);
  const [settingsOpened, setSettingsOpened] = React.useState(false);

  const refreshLatest = React.useCallback(async () => {
    const latestGroups = await API.getLatestGroups(days);
    setGroups(latestGroups);
  }, [days]);

  const openSettings = React.useCallback(() => {
    setSettingsOpened(true);
  }, []);

  const closeSettings = React.useCallback(() => {
    setSettingsOpened(false);
  }, []);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isShortcut = (event.metaKey || event.ctrlKey) && event.key === ",";

      if (!isShortcut || event.altKey || event.shiftKey) {
        return;
      }

      event.preventDefault();
      setSettingsOpened(true);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className={styles.todos}>
      <div className={`${styles.controls} ${styles.controlsRight}`}>
        <Tooltip content="Open settings">
          <Button
            className={styles.trigger}
            onClick={openSettings}
            aria-label="Open settings"
          >
            <Icon code="settings" />
          </Button>
        </Tooltip>
      </div>
      <Journal
        groups={groups}
        loading={loading}
        setLoading={setLoading}
        onRefresh={refreshLatest}
      />
      <InputField
        loading={loading}
        setLoading={setLoading}
        onTodoCreated={refreshLatest}
      />
      <Settings opened={settingsOpened} close={closeSettings} />
    </div>
  );
}
