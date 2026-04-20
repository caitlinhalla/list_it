import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Clock, ExternalLink, MoreHorizontal, Trash2 } from "lucide-react";

import type { Recipe } from "@/types";
import { useDeleteRecipe } from "@/hooks/use-recipes";
import { recipeVisual } from "@/lib/recipe-visuals";

import { Pill } from "@/components/ui/pill";
import { Button } from "@/components/ui/button";

function formatDuration(iso: string | null): string | null {
  if (!iso) return null;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return null;
  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  if (hours && minutes) return `${hours}h ${minutes}m`;
  if (hours) return `${hours}h`;
  if (minutes) return `${minutes}m`;
  return null;
}

type Variant = "hero" | "compact";

interface RecipeCardProps {
  recipe: Recipe;
  variant?: Variant;
}

export function RecipeCard({ recipe, variant = "hero" }: RecipeCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteRecipe = useDeleteRecipe();
  const visual = recipeVisual(recipe.title);

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    deleteRecipe.mutate(recipe.id, {
      onSuccess: () => toast.success(`Removed "${recipe.title}"`),
    });
  };

  const prepTime = formatDuration(recipe.prep_time);
  const cookTime = formatDuration(recipe.cook_time);

  const tileSize = variant === "hero" ? 72 : 56;
  const emojiSize = variant === "hero" ? 28 : 22;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -60 }}
      transition={{ duration: 0.2 }}
      className="flex gap-3.5 rounded-2xl border border-line bg-surface p-3"
    >
      {/* Tile */}
      <div
        className="flex shrink-0 items-center justify-center rounded-xl"
        style={{
          width: tileSize,
          height: tileSize,
          background: recipe.image_url ? undefined : visual.background,
        }}
      >
        {recipe.image_url ? (
          <img
            src={recipe.image_url}
            alt=""
            className="h-full w-full rounded-xl object-cover"
          />
        ) : (
          <span
            style={{
              fontSize: emojiSize,
              filter: "drop-shadow(0 1px 2px rgba(0,0,0,.12))",
            }}
          >
            {visual.emoji}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="serif text-[16.5px] leading-tight tracking-[-0.015em] text-text">
              {recipe.title}
            </div>
            <a
              href={recipe.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.04em] text-text-3 hover:text-text-2"
            >
              {recipe.source_name}
              <ExternalLink className="h-3 w-3" strokeWidth={1.6} />
            </a>
          </div>
          {variant === "hero" ? (
            <Button
              variant={confirmDelete ? "destructive" : "ghost"}
              size="icon"
              className="h-8 w-8 rounded-full text-text-3"
              onClick={handleDelete}
              disabled={deleteRecipe.isPending}
              aria-label={confirmDelete ? "Confirm delete" : "Delete recipe"}
            >
              {confirmDelete ? (
                <Trash2 className="h-4 w-4" />
              ) : (
                <MoreHorizontal className="h-4 w-4" />
              )}
            </Button>
          ) : (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteRecipe.isPending}
              className="rounded-full bg-bg px-3 py-1.5 text-[12px] font-medium text-text-2 hover:bg-line-2"
              aria-label="Delete recipe"
            >
              {confirmDelete ? "Confirm?" : "Remove"}
            </button>
          )}
        </div>

        {variant === "hero" && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Pill className="px-2 py-0.5 text-[10.5px]">
              {recipe.ingredients.length} ings
            </Pill>
            {prepTime && (
              <Pill className="px-2 py-0.5 text-[10.5px]">
                <Clock className="h-2.5 w-2.5" />
                Prep {prepTime}
              </Pill>
            )}
            {cookTime && (
              <Pill className="px-2 py-0.5 text-[10.5px]">
                <Clock className="h-2.5 w-2.5" />
                Cook {cookTime}
              </Pill>
            )}
            {recipe.servings && (
              <Pill className="px-2 py-0.5 text-[10.5px]">
                Serves {recipe.servings}
              </Pill>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
