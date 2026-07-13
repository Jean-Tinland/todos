import {
  buildDateWindow,
  isDateKey,
  shiftDateKey,
  toDateKey,
} from "@/lib/date";
import type { GroupedTodosPayload, TodoGroup, TodoItem } from "@/types/todo";
import * as FileTodos from "@/lib/file-todos-repository";

export type TodosGroupQuery = {
  reference?: string;
  windowDays?: number;
};

function normalizeDays(windowDays?: number) {
  const DEFAULT_WINDOW_DAYS = 7;
  const MIN_WINDOW_DAYS = 1;
  const MAX_WINDOW_DAYS = 30;
  if (!Number.isFinite(windowDays)) return DEFAULT_WINDOW_DAYS;
  return Math.min(
    MAX_WINDOW_DAYS,
    Math.max(MIN_WINDOW_DAYS, Math.trunc(windowDays as number)),
  );
}

export async function getGroupedTodos(
  query: TodosGroupQuery = {},
): Promise<GroupedTodosPayload> {
  const days = normalizeDays(query.windowDays);
  const reference =
    query.reference && isDateKey(query.reference)
      ? query.reference
      : toDateKey(new Date());
  const window = buildDateWindow(reference, days);
  const oldestDate = window[0] ?? reference;

  const allTodosByDate: Record<string, TodoItem[]> = {};
  for (const date of window) {
    allTodosByDate[date] = await FileTodos.getTodosByDate(date);
  }

  const groups = window.map((date) => ({
    date,
    items: allTodosByDate[date] || [],
  }));

  const allTodos = Object.values(allTodosByDate).flat();
  const stats = {
    total: allTodos.length,
    today: allTodosByDate[toDateKey(new Date())]?.length || 0,
    done: allTodos.filter((t) => t.done).length,
  };

  const allDays = await FileTodos.getTodoDays();
  const hasMore = allDays.some((d) => d < oldestDate);

  return {
    groups,
    meta: {
      reference,
      days,
      oldestDate,
      nextReference: shiftDateKey(oldestDate, -1),
      hasMore,
    },
    stats,
  };
}

export async function createTodo(content: string) {
  return FileTodos.addTodo(content);
}

export async function updateTodo(
  date: string,
  id: number,
  patch: Partial<Pick<TodoItem, "content" | "done">>,
) {
  return FileTodos.updateTodo(date, id, patch);
}

export async function deleteTodo(date: string, id: number) {
  return FileTodos.deleteTodo(date, id);
}

export async function transferTodo(sourceDate: string, id: number) {
  return FileTodos.transferTodo(sourceDate, id);
}

export async function getFirstPastGroup(
  reference?: string,
): Promise<TodoGroup | null> {
  const ref =
    reference && isDateKey(reference) ? reference : toDateKey(new Date());
  const days = (await FileTodos.getTodoDays()).sort();

  for (const day of [...days].reverse()) {
    if (day >= ref) continue;

    const items = await FileTodos.getTodosByDate(day);
    if (items.length > 0) {
      return { date: day, items };
    }
  }

  return null;
}
