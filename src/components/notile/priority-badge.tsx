import { cva } from "class-variance-authority";
import { PRIORITY_LABEL, type Priority } from "@/lib/tasks";
import { cn } from "@/lib/utils";

export const priorityVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      priority: {
        baixa: "bg-success-soft text-success",
        media: "bg-warning-soft text-warning-foreground",
        alta: "bg-destructive-soft text-destructive",
      },
    },
  },
);

export const priorityDot: Record<Priority, string> = {
  baixa: "bg-success",
  media: "bg-warning",
  alta: "bg-destructive",
};

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  return (
    <span className={cn(priorityVariants({ priority }), className)}>
      <span className={cn("size-1.5 rounded-full", priorityDot[priority])} />
      {PRIORITY_LABEL[priority]}
    </span>
  );
}
