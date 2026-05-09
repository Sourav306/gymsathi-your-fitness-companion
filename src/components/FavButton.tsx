import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFavorites, type FavKind } from "@/hooks/use-favorites";

export function FavButton({
  kind,
  itemId,
  className,
}: {
  kind: FavKind;
  itemId: string;
  className?: string;
}) {
  const { isFav, toggle } = useFavorites();
  const active = isFav(kind, itemId);
  return (
    <button
      type="button"
      aria-label={active ? "Remove from favorites" : "Save to favorites"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(kind, itemId);
      }}
      className={cn(
        "grid h-9 w-9 place-items-center rounded-full border border-border bg-card transition-all hover:scale-105",
        active && "border-primary/30 bg-primary/10",
        className,
      )}
    >
      <Heart
        className={cn("h-4 w-4", active ? "fill-primary text-primary" : "text-muted-foreground")}
      />
    </button>
  );
}
