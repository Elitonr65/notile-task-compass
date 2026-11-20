import { Link } from "@tanstack/react-router";
import { ClipboardList, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({ title, description, showAction = true }: { title: string; description: string; showAction?: boolean }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-input bg-card px-6 py-12 text-center">
      <div className="grid size-12 place-items-center rounded-xl bg-primary-soft text-primary">
        <ClipboardList className="size-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {showAction && (
        <Button asChild className="mt-5">
          <Link to="/nova-tarefa">
            <Plus /> Nova tarefa
          </Link>
        </Button>
      )}
    </div>
  );
}
