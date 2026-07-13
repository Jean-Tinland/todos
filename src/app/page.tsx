import Todos from "@/components/todos/todos";
import { getGroupedTodos } from "@/lib/todos-repository";
import type { TodoGroup } from "@/types/todo";
import styles from "./page.module.css";

const DEFAULT_DAYS = 10;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function fetchInitialGroups(days: number): Promise<TodoGroup[]> {
  const payload = await getGroupedTodos({ windowDays: days });
  return payload.groups;
}

export default async function HomePage() {
  const groups = await fetchInitialGroups(DEFAULT_DAYS);
  return (
    <main className={styles.main}>
      <Todos groups={groups} days={DEFAULT_DAYS} />
    </main>
  );
}
