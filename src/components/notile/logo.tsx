import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-8", className)}>
      <rect width="32" height="32" rx="9" className="fill-sidebar-primary" />
      <path
        d="M9.5 22V10l8 9.5V10"
        fill="none"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-sidebar"
      />
      <path
        d="M19.5 18.5l2.2 2.2 4-4.6"
        fill="none"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-success"
      />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <div className="leading-none">
        <div className="font-display text-lg font-bold tracking-[0.14em] text-sidebar-foreground">
          NOTILE
        </div>
        <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.22em] text-sidebar-muted">
          Task Manager
        </div>
      </div>
    </div>
  );
}
