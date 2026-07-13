import type { GroupedTodosPayload, TodoGroup, TodoItem } from "@/types/todo";
import * as Cookies from "@/services/cookies";

function getAuthHeaders(): Record<string, string> {
  if (typeof document === "undefined") {
    return {};
  }

  const token = Cookies.get("token");
  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

async function extractErrorMessage(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { error?: unknown };
    if (typeof payload?.error === "string" && payload.error.trim()) {
      return payload.error;
    }
  } catch {
    // Ignore malformed payloads and keep fallback.
  }

  return fallback;
}

export async function getLatestGroups(days: number): Promise<TodoGroup[]> {
  const res = await fetch(`/api/todos?days=${days}`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  if (!res.ok) return [];
  const payload = (await res.json()) as GroupedTodosPayload;
  return payload.groups;
}

export async function getOlderGroups(
  reference: string,
  days: number,
): Promise<TodoGroup[]> {
  const res = await fetch(
    `/api/todos?days=${days}&reference=${encodeURIComponent(reference)}`,
    {
      cache: "no-store",
      headers: getAuthHeaders(),
    },
  );
  if (!res.ok) return [];
  const payload = (await res.json()) as GroupedTodosPayload;
  return payload.groups;
}

export async function getFirstPastGroup(): Promise<TodoGroup | null> {
  const res = await fetch(`/api/todos?firstPast=true`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) return null;

  const group = (await res.json()) as TodoGroup | null;
  return group && group.items.length > 0 ? group : null;
}

export async function createTodo(content: string) {
  const res = await fetch(`/api/todos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    throw new Error(await extractErrorMessage(res, "Failed to create todo"));
  }
  return res.json();
}

export async function updateTodo(
  date: string,
  id: number,
  patch: Partial<Pick<TodoItem, "content" | "done">>,
) {
  const res = await fetch(`/api/todos/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ date, ...patch }),
  });
  if (!res.ok) {
    throw new Error(await extractErrorMessage(res, "Failed to update todo"));
  }
  return res.json();
}

export async function deleteTodo(date: string, id: number) {
  const res = await fetch(`/api/todos/${id}?date=${encodeURIComponent(date)}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error(await extractErrorMessage(res, "Failed to delete todo"));
  }
  return res.json();
}

export async function transferTodo(sourceDate: string, id: number) {
  const res = await fetch(`/api/todos/${id}/transfer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ sourceDate }),
  });
  if (!res.ok) {
    throw new Error(await extractErrorMessage(res, "Failed to transfer todo"));
  }
  return res.json();
}

export async function login(password: string) {
  const response = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!response.ok) {
    const { error } = await response.json();
    throw new Error(error || "Login failed");
  }
  return response.json();
}
