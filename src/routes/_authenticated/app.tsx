import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/notile/app-shell";
import { TasksProvider } from "@/hooks/use-tasks";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({ meta: [{ name: "robots", content: "noindex" }] }),
  component: AppLayout,
});

function AppLayout() {
  return (
    <TasksProvider>
      <AppShell>
        <Outlet />
      </AppShell>
    </TasksProvider>
  );
}
