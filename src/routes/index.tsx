import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, CircleDashed, ListTodo, Plus } from "lucide-react";
import type { ComponentType } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/notile/empty-state";
import { formatToday } from "@/components/notile/format";
import { ListSkeleton } from "@/components/notile/list-skeleton";
import { PageHeader } from "@/components/notile/page-header";
import { priorityDot } from "@/components/notile/priority-badge";
import { TaskItem } from "@/components/notile/task-item";
import { useTasks } from "@/hooks/use-tasks";
import { PRIORITIES, PRIORITY_LABEL, computeStats, isOverdue, sortTasks, todayISO } from "@/lib/tasks";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — NOTILE Task Manager" },
      { name: "description", content: "Visão geral das suas tarefas: total, pendentes e concluídas." },
      { property: "og:title", content: "Dashboard — NOTILE Task Manager" },
      { property: "og:description", content: "Visão geral das suas tarefas: total, pendentes e concluídas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number | null;
  hint: string;
  icon: ComponentType<{ className?: string }>;
  tone: "primary" | "warning" | "success";
}) {
  const featured = tone === "primary";
  return (
    <div
      className={cn(
        "animate-rise rounded-2xl p-5 sm:p-6",
        featured ? "bg-gradient-primary text-primary-foreground shadow-elevated" : "surface-card",
      )}
    >
      <div className="flex items-center justify-between">
        <span className={cn("text-sm font-medium", featured ? "text-primary-foreground/80" : "text-muted-foreground")}>
          {label}
        </span>
        <span
          className={cn(
            "grid size-9 place-items-center rounded-lg",
            featured && "bg-primary-foreground/15",
            tone === "warning" && "bg-warning-soft text-warning-foreground",
            tone === "success" && "bg-success-soft text-success",
          )}
        >
          <Icon className="size-[18px]" />
        </span>
      </div>
      {value === null ? (
        <Skeleton className="mt-4 h-10 w-16" />
      ) : (
        <div className="mt-4 font-display text-4xl font-bold tracking-tight">{value}</div>
      )}
      <p className={cn("mt-1 text-xs", featured ? "text-primary-foreground/70" : "text-muted-foreground")}>
        {hint}
      </p>
    </div>
  );
}

function Dashboard() {
  const { tasks, ready } = useTasks();
  const stats = computeStats(tasks);
  const today = todayISO();
  const pendingTasks = tasks.filter((t) => !t.completed);
  const upcoming = sortTasks(pendingTasks).slice(0, 5);
  const overdueCount = pendingTasks.filter((t) => isOverdue(t, today)).length;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={ready ? formatToday() : "Dashboard"}
        title="Visão geral"
        description="Acompanhe o andamento das suas tarefas pessoais."
        action={
          <Button asChild size="lg" className="px-5 shadow-elevated">
            <Link to="/nova-tarefa">
              <Plus /> Nova tarefa
            </Link>
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total de tarefas" value={ready ? stats.total : null} hint="Todas as tarefas cadastradas" icon={ListTodo} tone="primary" />
        <StatCard
          label="Pendentes"
          value={ready ? stats.pending : null}
          hint={overdueCount > 0 ? `${overdueCount} atrasada${overdueCount > 1 ? "s" : ""}` : "Nenhuma atrasada"}
          icon={CircleDashed}
          tone="warning"
        />
        <StatCard label="Concluídas" value={ready ? stats.completed : null} hint={`${stats.rate}% do total`} icon={CheckCircle2} tone="success" />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Próximas tarefas</h2>
            <Link
              to="/tarefas"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary-glow hover:text-primary"
            >
              Ver todas <ArrowRight className="size-4" />
            </Link>
          </div>
          {!ready ? (
            <ListSkeleton />
          ) : upcoming.length === 0 ? (
            <EmptyState
              title={stats.total === 0 ? "Nenhuma tarefa ainda" : "Tudo em dia!"}
              description={
                stats.total === 0
                  ? "Cadastre sua primeira tarefa para começar a organizar o seu dia."
                  : "Você concluiu todas as suas tarefas. Que tal planejar a próxima?"
              }
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {upcoming.map((t) => (
                <TaskItem key={t.id} task={t} compact />
              ))}
            </ul>
          )}
        </section>

        <aside className="surface-card h-fit p-5 sm:p-6">
          <h2 className="text-lg font-semibold">Pendentes por prioridade</h2>
          <p className="mt-1 text-sm text-muted-foreground">Onde focar sua energia agora.</p>
          <ul className="mt-5 flex flex-col gap-4">
            {[...PRIORITIES].reverse().map((p) => {
              const count = pendingTasks.filter((t) => t.priority === p).length;
              const pct = pendingTasks.length ? (count / pendingTasks.length) * 100 : 0;
              return (
                <li key={p}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium">
                      <span className={cn("size-2 rounded-full", priorityDot[p])} />
                      {PRIORITY_LABEL[p]}
                    </span>
                    <span className="font-semibold tabular-nums">{ready ? count : "—"}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div className={cn("h-full rounded-full transition-all duration-500", priorityDot[p])} style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>
    </div>
  );
}
