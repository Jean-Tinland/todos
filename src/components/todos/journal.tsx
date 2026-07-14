"use client";

import * as React from "react";
import classNames from "classnames";
import Button from "jt-design-system/es/button";
import Checkbox from "jt-design-system/es/checkbox";
import { useSnackbar } from "jt-design-system/es/snackbar";
import Icon from "@/components/icon";
import { toDateKey, shiftDateKey, formatDateHeading } from "@/lib/date";
import type { TodoGroup, TodoItem } from "@/types/todo";
import * as API from "@/services/api";
import styles from "./journal.module.css";

type Props = {
  groups: TodoGroup[];
  loading: boolean;
  setLoading: (loading: boolean) => void;
  onRefresh: () => Promise<void>;
};

const WINDOW_DAYS = 10;

export default function Journal({
  groups,
  loading,
  setLoading,
  onRefresh,
}: Props) {
  const snackbar = useSnackbar();
  const [recentGroups, setRecentGroups] = React.useState<TodoGroup[]>(groups);
  const [oldGroups, setOldGroups] = React.useState<TodoGroup[]>([]);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [nextReference, setNextReference] = React.useState(() =>
    shiftDateKey(toDateKey(new Date()), -groups.length),
  );

  React.useEffect(() => {
    setRecentGroups(groups);
  }, [groups]);

  const journal = React.useMemo(
    () => [...oldGroups, ...recentGroups],
    [oldGroups, recentGroups],
  );

  const today = toDateKey(new Date());

  const loadMore = React.useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const olderGroups = await API.getOlderGroups(nextReference, WINDOW_DAYS);
      const hasEntries = olderGroups.some((group) => group.items.length > 0);
      if (!hasEntries) {
        snackbar.show({
          type: "information",
          message:
            "No entries available for previous days, keep clicking to load more",
          filler: false,
        });
      }
      setOldGroups((current) => [...olderGroups, ...current]);
      setNextReference((current) => shiftDateKey(current, -WINDOW_DAYS));
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, nextReference, snackbar]);

  const loadFirstPast = React.useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const firstPastGroup = await API.getFirstPastGroup();
      if (!firstPastGroup || firstPastGroup.items.length === 0) {
        snackbar.show({
          type: "information",
          message: "No past entries available",
          filler: false,
        });
        return;
      }
      setOldGroups((current) => [firstPastGroup, ...current]);
      setNextReference((current) => shiftDateKey(current, -1));
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, snackbar]);

  const toggleDone = React.useCallback(
    async (day: string, id: number, done: boolean) => {
      if (loading) return;
      setLoading(true);
      try {
        await API.updateTodo(day, id, { done });
        await onRefresh();
      } catch {
        snackbar.show({
          type: "error",
          message: "Failed to update todo",
          filler: false,
        });
      } finally {
        setLoading(false);
      }
    },
    [loading, setLoading, onRefresh, snackbar],
  );

  const deleteTodo = React.useCallback(
    async (day: string, id: number) => {
      if (loading) return;
      setLoading(true);
      try {
        await API.deleteTodo(day, id);
        mutateGroups({ day, id }, () => null);
        snackbar.show({
          type: "success",
          message: "Todo deleted",
          filler: false,
        });
      } catch {
        snackbar.show({
          type: "error",
          message: "Failed to delete todo",
          filler: false,
        });
      } finally {
        setLoading(false);
      }
    },
    [loading, setLoading, snackbar],
  );

  const transferToToday = React.useCallback(
    async (sourceDate: string, id: number) => {
      if (loading) return;
      setLoading(true);
      try {
        await API.transferTodo(sourceDate, id);
        await onRefresh();
        mutateOldGroups(sourceDate, id);
        snackbar.show({ type: "success", message: "Todo moved to today" });
      } catch {
        snackbar.show({
          type: "error",
          message: "Failed to transfer todo",
          filler: false,
        });
      } finally {
        setLoading(false);
      }
    },
    [loading, setLoading, onRefresh, snackbar],
  );

  const mutateGroups = React.useCallback(
    (
      entryRef: { day: string; id: number },
      updater: (item: TodoItem) => TodoItem | null,
    ) => {
      const mutate = (source: TodoGroup[]) =>
        source.map((group) =>
          group.date !== entryRef.day
            ? group
            : {
                ...group,
                items: group.items.flatMap((item) => {
                  if (item.id !== entryRef.id) {
                    return [item];
                  }
                  const nextItem = updater(item);
                  return nextItem ? [nextItem] : [];
                }),
              },
        );

      setOldGroups((current) => mutate(current));
      setRecentGroups((current) => mutate(current));
    },
    [],
  );

  const mutateOldGroups = React.useCallback(
    (sourceDate: string, id: number) => {
      setOldGroups((current) =>
        current.map((group) =>
          group.date !== sourceDate
            ? group
            : {
                ...group,
                items: group.items.filter((item) => item.id !== id),
              },
        ),
      );
    },
    [],
  );

  // Group items by date for display (today first, then older descending)
  const groupedByDate = React.useMemo(() => {
    const dateMap = new Map<string, TodoItem[]>();

    for (const group of journal) {
      const existing = dateMap.get(group.date) || [];
      dateMap.set(group.date, [...existing, ...group.items]);
    }

    const dates = Array.from(dateMap.keys()).sort((a, b) => b.localeCompare(a));

    // Move today to front when present
    const idx = dates.indexOf(today);
    if (idx > 0) {
      dates.splice(idx, 1);
      dates.unshift(today);
    }

    return dates
      .map((date) => ({
        date,
        items: dateMap.get(date) || [],
      }))
      .filter((group) => group.items.length > 0);
  }, [journal, today]);

  return (
    <div className={styles.journal}>
      <div className={styles.buttons}>
        <Button
          variant="secondary"
          className={styles.loadMore}
          onClick={loadMore}
          disabled={loadingMore}
        >
          Load {WINDOW_DAYS} previous days
        </Button>
        <Button
          variant="secondary"
          className={styles.loadFirstPast}
          onClick={loadFirstPast}
          disabled={loadingMore}
        >
          Load first past item not done
        </Button>
      </div>

      {groupedByDate.map((group, groupIndex) => {
        const isToday = group.date === today;
        const heading = formatDateHeading(group.date);
        const doneCount = group.items.filter((t) => t.done).length;

        return (
          <React.Fragment key={group.date}>
            {groupIndex > 0 && <div className={styles.separator} />}
            <div className={styles.dayHeader}>
              <span className={styles.dayTitle}>{heading}</span>
              {group.items.length > 0 && (
                <span className={styles.dayStats}>
                  {doneCount}/{group.items.length} done
                </span>
              )}
            </div>
            {group.items.map((item) => (
              <div
                key={`${group.date}-${item.id}`}
                className={classNames(styles.todo, {
                  [styles.done]: item.done,
                })}
              >
                <Checkbox
                  className={styles.checkbox}
                  checked={item.done}
                  onCheckedChange={(checked) =>
                    toggleDone(group.date, item.id, checked)
                  }
                  aria-label={item.done ? "Mark as pending" : "Mark as done"}
                />
                <span className={styles.content}>{item.content}</span>
                <div className={styles.actions}>
                  {!isToday && !item.done && (
                    <button
                      className={classNames(
                        styles.action,
                        styles.transferAction,
                      )}
                      onClick={() => transferToToday(group.date, item.id)}
                    >
                      Move to today
                    </button>
                  )}
                  <button
                    className={classNames(styles.action, styles.deleteAction)}
                    onClick={() => deleteTodo(group.date, item.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </React.Fragment>
        );
      })}
    </div>
  );
}
