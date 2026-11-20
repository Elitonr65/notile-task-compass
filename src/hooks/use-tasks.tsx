import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  STORAGE_KEY,
  makeTask,
  parseStoredTasks,
  removeTask,
  toggleTask as toggle,
  type NewTaskInput,
  type Task,
} from "@/lib/tasks";

interface TasksContextValue {
  tasks: Task[];
  ready: boolean;
  addTask: (input: NewTaskInput) => Task;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
}

const TasksContext = createContext<TasksContextValue | null>(null);

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setTasks(parseStoredTasks(window.localStorage.getItem(STORAGE_KEY)));
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setTasks(parseStoredTasks(e.newValue));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks, ready]);

  const addTask = useCallback((input: NewTaskInput) => {
    const task = makeTask(input, crypto.randomUUID());
    setTasks((prev) => [task, ...prev]);
    return task;
  }, []);

  const toggleTask = useCallback((id: string) => setTasks((prev) => toggle(prev, id)), []);
  const deleteTask = useCallback((id: string) => setTasks((prev) => removeTask(prev, id)), []);

  const value = useMemo(
    () => ({ tasks, ready, addTask, toggleTask, deleteTask }),
    [tasks, ready, addTask, toggleTask, deleteTask],
  );

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

export function useTasks() {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error("useTasks must be used inside TasksProvider");
  return ctx;
}
