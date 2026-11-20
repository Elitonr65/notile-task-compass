import { describe, expect, it } from "vitest";
import {
  computeStats,
  filterTasks,
  isOverdue,
  makeTask,
  parseStoredTasks,
  removeTask,
  sortTasks,
  toggleTask,
  type Task,
} from "./tasks";

const base = (over: Partial<Task>): Task => ({
  ...makeTask({ title: "T", description: "", dueDate: "2026-11-20", priority: "media" }, "x"),
  ...over,
});

const tasks: Task[] = [
  base({ id: "a", completed: false }),
  base({ id: "b", completed: true }),
  base({ id: "c", completed: false }),
];

describe("tarefas", () => {
  it("dashboard conta total, pendentes e concluídas", () => {
    expect(computeStats(tasks)).toMatchObject({ total: 3, pending: 2, completed: 1 });
  });

  it("filtra entre todas, pendentes e concluídas", () => {
    expect(filterTasks(tasks, "todas").map((t) => t.id)).toEqual(["a", "b", "c"]);
    expect(filterTasks(tasks, "pendentes").map((t) => t.id)).toEqual(["a", "c"]);
    expect(filterTasks(tasks, "concluidas").map((t) => t.id)).toEqual(["b"]);
  });

  it("marcar como concluída alterna o estado", () => {
    const once = toggleTask(tasks, "a");
    expect(once.find((t) => t.id === "a")?.completed).toBe(true);
    expect(toggleTask(once, "a").find((t) => t.id === "a")?.completed).toBe(false);
  });

  it("excluir remove apenas a tarefa escolhida", () => {
    expect(removeTask(tasks, "b").map((t) => t.id)).toEqual(["a", "c"]);
  });

  it("nova tarefa começa pendente", () => {
    expect(makeTask({ title: " Ler ", description: "", dueDate: "2026-12-01", priority: "alta" }, "n")).toMatchObject({
      title: "Ler",
      completed: false,
      priority: "alta",
    });
  });

  it("ordena pendentes primeiro e alta prioridade antes", () => {
    const sorted = sortTasks([
      base({ id: "done", completed: true, dueDate: "2026-01-01" }),
      base({ id: "low", priority: "baixa" }),
      base({ id: "high", priority: "alta" }),
    ]);
    expect(sorted.map((t) => t.id)).toEqual(["high", "low", "done"]);
  });

  it("tarefa pendente com data passada está atrasada", () => {
    expect(isOverdue(base({ dueDate: "2026-11-19" }), "2026-11-20")).toBe(true);
    expect(isOverdue(base({ dueDate: "2026-11-19", completed: true }), "2026-11-20")).toBe(false);
  });

  it("ignora dados inválidos salvos no navegador", () => {
    expect(parseStoredTasks("not json")).toEqual([]);
    expect(parseStoredTasks(JSON.stringify([{ id: 1 }, tasks[0]]))).toHaveLength(1);
  });
});
