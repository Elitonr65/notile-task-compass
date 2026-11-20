import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/notile/empty-state";
import { ListSkeleton } from "@/components/notile/list-skeleton";
import { PageHeader } from "@/components/notile/page-header";
import { TaskItem } from "@/components/notile/task-item";
import { useTasks } from "@/hooks/use-tasks";
import { computeStats, filterTasks, sortTasks, type TaskFilter } from "@/lib/tasks";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/tarefas")({
  head: () => ({
    meta: [
      { title: "Minhas tarefas — NOTILE Task Manager" },
      { name: "description", content: "Veja, conclua, filtre e exclua suas tarefas pessoais." },
      { property: "og:title", content: "Minhas tarefas — NOTILE Task Manager" },
      { property: "og:description", content: "Veja, conclua, filtre e exclua suas tarefas pessoais." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TasksPage,
});

const EMPTY: Record<TaskFilter, { title: string; description: string }> = {
  todas: { title: "Nenhuma tarefa cadastrada", description: "Crie sua primeira tarefa para vê-la aqui." },
  pendentes: { title: "Nada pendente", description: "Você não tem tarefas pendentes no momento." },
  concluidas: { title: "Nenhuma concluída ainda", description: "Marque uma tarefa como concluída para vê-la aqui." },
};

function TasksPage() {
  const { tasks, ready } = useTasks();
  const [filter, setFilter] = useState<TaskFilter>("todas");
  const stats = computeStats(tasks);
  const visible = sortTasks(filterTasks(tasks, filter));

  const options: { value: TaskFilter; label: string; count: number }[] = [
    { value: "todas", label: "Todas", count: stats.total },
    { value: "pendentes", label: "Pendentes", count: stats.pending },
    { value: "concluidas", label: "Concluídas", count: stats.completed },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Tarefas"
        title="Minhas tarefas"
        description="Marque o que já foi feito e mantenha sua lista sempre organizada."
        action={
          <Button asChild size="lg" className="px-5">
            <Link to="/nova-tarefa">
              <Plus /> Nova tarefa
            </Link>
          </Button>
        }
      />

      <div role="tablist" aria-label="Filtrar tarefas" className="flex w-full gap-1 rounded-xl border border-border bg-card p-1 shadow-card sm:w-fit">
        {options.map((o) => {
          const active = filter === o.value;
          return (
            <button
              key={o.value}
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(o.value)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors sm:flex-none sm:px-4",
                active ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {o.label}
              <span
                className={cn(
                  "rounded-md px-1.5 text-xs tabular-nums",
                  active ? "bg-primary-foreground/15" : "bg-muted",
                )}
              >
                {ready ? o.count : "–"}
              </span>
            </button>
          );
        })}
      </div>

      {!ready ? (
        <ListSkeleton rows={4} />
      ) : visible.length === 0 ? (
        <EmptyState {...EMPTY[filter]} showAction={filter !== "concluidas"} />
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((t) => (
            <TaskItem key={t.id} task={t} />
          ))}
        </ul>
      )}
    </div>
  );
}
