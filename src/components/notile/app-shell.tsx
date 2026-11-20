import { Link } from "@tanstack/react-router";
import { LayoutDashboard, ListChecks, Menu, Plus } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useTasks } from "@/hooks/use-tasks";
import { computeStats } from "@/lib/tasks";
import { Logo } from "./logo";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tarefas", label: "Tarefas", icon: ListChecks },
  { to: "/nova-tarefa", label: "Nova tarefa", icon: Plus },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={onNavigate}
          activeOptions={{ exact: true }}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          activeProps={{
            className: "bg-sidebar-accent text-sidebar-accent-foreground",
          }}
        >
          <Icon className="size-[18px]" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

function ProgressCard() {
  const { tasks, ready } = useTasks();
  const { rate, completed, total } = computeStats(tasks);
  return (
    <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/60 p-4">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-sidebar-muted">
          Progresso
        </span>
        <span className="font-display text-lg font-semibold text-sidebar-foreground">
          {ready ? `${rate}%` : "—"}
        </span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-sidebar-border">
        <div
          className="h-full rounded-full bg-success transition-all duration-500"
          style={{ width: `${ready ? rate : 0}%` }}
        />
      </div>
      <p className="mt-2.5 text-xs text-sidebar-muted">
        {ready ? `${completed} de ${total} tarefas concluídas` : "Carregando…"}
      </p>
    </div>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-8 bg-sidebar p-5 text-sidebar-foreground">
      <Logo className="px-1 pt-1" />
      <div className="flex flex-col gap-2">
        <span className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-sidebar-muted/80">
          Menu
        </span>
        <NavLinks onNavigate={onNavigate} />
      </div>
      <div className="mt-auto">
        <ProgressCard />
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <SidebarBody />
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between bg-sidebar px-4 py-3 lg:hidden">
        <Logo />
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className="grid size-10 place-items-center rounded-lg text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
            aria-label="Abrir menu"
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-72 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <SidebarBody onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </header>

      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
