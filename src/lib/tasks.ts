export type Priority = "baixa" | "media" | "alta";
export type TaskFilter = "todas" | "pendentes" | "concluidas";

export interface Task {
  id: string;
  title: string;
  description: string;
  /** YYYY-MM-DD */
  dueDate: string;
  priority: Priority;
  completed: boolean;
  createdAt: string;
  completedAt: string | null;
}

export interface NewTaskInput {
  title: string;
  description: string;
  dueDate: string;
  priority: Priority;
}

export const STORAGE_KEY = "notile.tasks.v1";

export const PRIORITIES: Priority[] = ["baixa", "media", "alta"];

export const PRIORITY_LABEL: Record<Priority, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};

const PRIORITY_WEIGHT: Record<Priority, number> = { alta: 0, media: 1, baixa: 2 };

export function filterTasks(tasks: Task[], filter: TaskFilter): Task[] {
  if (filter === "pendentes") return tasks.filter((t) => !t.completed);
  if (filter === "concluidas") return tasks.filter((t) => t.completed);
  return tasks;
}

export function computeStats(tasks: Task[]) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending = total - completed;
  const rate = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { total, pending, completed, rate };
}

/** Pending first, then earliest due date, then highest priority. */
export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
    return PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
  });
}

export function todayISO(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isOverdue(task: Task, today: string): boolean {
  return !task.completed && task.dueDate < today;
}

export function makeTask(input: NewTaskInput, id: string, now = new Date()): Task {
  return {
    id,
    title: input.title.trim(),
    description: input.description.trim(),
    dueDate: input.dueDate,
    priority: input.priority,
    completed: false,
    createdAt: now.toISOString(),
    completedAt: null,
  };
}

export function toggleTask(tasks: Task[], id: string, now = new Date()): Task[] {
  return tasks.map((t) =>
    t.id === id
      ? { ...t, completed: !t.completed, completedAt: t.completed ? null : now.toISOString() }
      : t,
  );
}

export function removeTask(tasks: Task[], id: string): Task[] {
  return tasks.filter((t) => t.id !== id);
}

function isTask(value: unknown): value is Task {
  if (!value || typeof value !== "object") return false;
  const t = value as Partial<Record<keyof Task, unknown>>;
  return (
    typeof t.id === "string" &&
    typeof t.title === "string" &&
    typeof t.dueDate === "string" &&
    typeof t.completed === "boolean" &&
    PRIORITIES.includes(t.priority as Priority)
  );
}

export function parseStoredTasks(raw: string | null): Task[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isTask).map((t) => ({
      ...t,
      description: typeof t.description === "string" ? t.description : "",
      createdAt: typeof t.createdAt === "string" ? t.createdAt : new Date(0).toISOString(),
      completedAt: typeof t.completedAt === "string" ? t.completedAt : null,
    }));
  } catch {
    return [];
  }
}
