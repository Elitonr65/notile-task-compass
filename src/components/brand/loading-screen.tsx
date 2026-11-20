import { BrandIcon } from "./brand-logo";

export function LoadingScreen({ label = "Carregando" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background">
      <BrandIcon className="size-16 animate-breathe" />
      <div className="text-center">
        <div className="font-display text-sm font-bold tracking-[0.3em] text-navy">NOTILE</div>
        <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          {label}
          <span className="inline-flex gap-0.5" aria-hidden>
            <span className="size-1 animate-pulse rounded-full bg-primary" />
            <span className="size-1 animate-pulse rounded-full bg-primary [animation-delay:150ms]" />
            <span className="size-1 animate-pulse rounded-full bg-primary [animation-delay:300ms]" />
          </span>
        </div>
      </div>
    </div>
  );
}
