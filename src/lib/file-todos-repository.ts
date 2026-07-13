import fs from "node:fs/promises";
import path from "node:path";
import { toDateKey } from "@/lib/date";
import type { TodoItem } from "@/types/todo";

const TODOS_DIR = path.join(process.cwd(), "contents", "todos");

async function ensureTodosDir() {
  await fs.mkdir(TODOS_DIR, { recursive: true });
}

function getTodoFilePath(date: string) {
  return path.join(TODOS_DIR, `${date}.json`);
}

async function readTodosFile(date: string): Promise<TodoItem[]> {
  const filePath = getTodoFilePath(date);

  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as TodoItem[];
  } catch {
    return [];
  }
}

async function writeTodosFile(date: string, todos: TodoItem[]) {
  const filePath = getTodoFilePath(date);
  await fs.writeFile(filePath, JSON.stringify(todos, null, 2), "utf-8");
}

export async function getTodosByDate(date: string): Promise<TodoItem[]> {
  await ensureTodosDir();
  return readTodosFile(date);
}

export async function addTodo(content: string): Promise<TodoItem> {
  await ensureTodosDir();

  const now = new Date();
  const dateKey = toDateKey(now);
  const todos = await readTodosFile(dateKey);

  const id = todos.length > 0 ? Math.max(...todos.map((t) => t.id)) + 1 : 1;
  const todo: TodoItem = {
    id,
    content,
    done: false,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  todos.push(todo);
  await writeTodosFile(dateKey, todos);

  return todo;
}

export async function updateTodo(
  date: string,
  id: number,
  patch: Partial<Pick<TodoItem, "content" | "done">>,
): Promise<TodoItem | null> {
  await ensureTodosDir();

  const todos = await readTodosFile(date);
  const index = todos.findIndex((t) => t.id === id);

  if (index === -1) return null;

  const updated: TodoItem = {
    ...todos[index],
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  todos[index] = updated;
  await writeTodosFile(date, todos);

  return updated;
}

export async function deleteTodo(date: string, id: number): Promise<boolean> {
  await ensureTodosDir();

  const todos = await readTodosFile(date);
  const newTodos = todos.filter((t) => t.id !== id);

  if (newTodos.length === todos.length) return false;

  await writeTodosFile(date, newTodos);

  return true;
}

export async function transferTodo(
  sourceDate: string,
  id: number,
): Promise<TodoItem | null> {
  await ensureTodosDir();

  const sourceTodos = await readTodosFile(sourceDate);
  const todoIndex = sourceTodos.findIndex((t) => t.id === id);

  if (todoIndex === -1) return null;

  const original = sourceTodos[todoIndex];

  // Remove from source
  sourceTodos.splice(todoIndex, 1);
  await writeTodosFile(sourceDate, sourceTodos);

  // Add to today
  const now = new Date();
  const todayKey = toDateKey(now);
  const todayTodos = await readTodosFile(todayKey);

  const newId =
    todayTodos.length > 0 ? Math.max(...todayTodos.map((t) => t.id)) + 1 : 1;
  const transferred: TodoItem = {
    id: newId,
    content: original.content,
    done: false,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  todayTodos.push(transferred);
  await writeTodosFile(todayKey, todayTodos);

  return transferred;
}

export async function getTodoDays(): Promise<string[]> {
  await ensureTodosDir();
  const files = await fs.readdir(TODOS_DIR);

  return files
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(".json", ""))
    .sort();
}
