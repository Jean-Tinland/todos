export type TodoItem = {
  id: number;
  content: string;
  done: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TodoGroup = {
  date: string;
  items: TodoItem[];
};

export type GroupedTodosPayload = {
  groups: TodoGroup[];
  meta: {
    reference: string;
    days: number;
    oldestDate: string;
    nextReference: string;
    hasMore: boolean;
  };
  stats: {
    total: number;
    today: number;
    done: number;
  };
};
