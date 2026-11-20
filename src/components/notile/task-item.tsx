import { CalendarDays, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useTasks } from "@/hooks/use-tasks";
import { isOverdue, todayISO, type Task } from "@/lib/tasks";
import { cn } from "@/lib/utils";
import { formatDue } from "./format";
import { PriorityBadge } from "./priority-badge";

export function TaskItem({ task, compact = false }: { task: Task; compact?: boolean }) {
  const { toggleTask, deleteTask } = useTasks();
  const overdue = isOverdue(task, todayISO());
  const checkboxId = `task-${task.id}`;

  return (
    <li
      className={cn(
        "group flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/25 hover:shadow-card sm:gap-4",
        task.completed && "bg-muted/50",
      )}
    >
      <Checkbox
        id={checkboxId}
        checked={task.completed}
        onCheckedChange={() => {
          toggleTask(task.id);
          toast.success(task.completed ? "Tarefa reaberta" : "Tarefa concluída", {
            description: task.title,
          });
        }}
        aria-label={task.completed ? "Marcar como pendente" : "Marcar como concluída"}
        className="mt-0.5 size-5 rounded-md border-2 border-primary/40 data-[state=checked]:border-success data-[state=checked]:bg-success data-[state=checked]:text-success-foreground [&_svg]:size-3.5"
      />
      <div className="min-w-0 flex-1">
        <label
          htmlFor={checkboxId}
          className={cn(
            "block cursor-pointer break-words font-semibold text-foreground",
            task.completed && "text-muted-foreground line-through",
          )}
        >
          {task.title}
        </label>
        {task.description && !compact && (
          <p
            className={cn(
              "mt-1 break-words text-sm text-muted-foreground",
              task.completed && "opacity-70",
            )}
          >
            {task.description}
          </p>
        )}
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <PriorityBadge priority={task.priority} />
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground",
              overdue && "text-destructive",
            )}
          >
            <CalendarDays className="size-3.5" />
            {formatDue(task.dueDate)}
            {overdue && " · atrasada"}
          </span>
          {task.completed && (
            <span className="text-xs font-semibold text-success">Concluída</span>
          )}
        </div>
      </div>
      <AlertDialog>
        <AlertDialogTrigger
          aria-label={`Excluir ${task.title}`}
          className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive-soft hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
            <AlertDialogDescription>
              “{task.title}” será removida permanentemente. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                deleteTask(task.id);
                toast("Tarefa excluída", { description: task.title });
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}
