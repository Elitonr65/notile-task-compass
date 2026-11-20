import iconAsset from "@/assets/brand/notile-icon.png.asset.json";
import { cn } from "@/lib/utils";

export const BRAND_ICON_URL = iconAsset.url;

/** Official NOTILE icon. The name is rendered as text next to it (no separate wordmark file yet). */
export function BrandIcon({ className }: { className?: string }) {
  return <img src={iconAsset.url} alt="" aria-hidden className={cn("size-9 shrink-0 object-contain", className)} />;
}

export function BrandLogo({
  tone = "dark",
  showProduct = true,
  className,
}: {
  tone?: "dark" | "light";
  showProduct?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <BrandIcon />
      <div className="leading-none">
        <div
          className={cn(
            "font-display text-lg font-bold tracking-[0.16em]",
            tone === "light" ? "text-sidebar-foreground" : "text-navy",
          )}
        >
          NOTILE
        </div>
        {showProduct && (
          <div
            className={cn(
              "mt-1 text-[10px] font-medium uppercase tracking-[0.22em]",
              tone === "light" ? "text-sidebar-muted" : "text-muted-foreground",
            )}
          >
            Task Manager
          </div>
        )}
      </div>
    </div>
  );
}
