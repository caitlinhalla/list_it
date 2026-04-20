import { AnimatePresence } from "framer-motion";
import { BookOpen, Plus, Search } from "lucide-react";

import { useRecipes } from "@/hooks/use-recipes";
import { useAppStore } from "@/stores/app-store";

import { RecipeCard } from "./recipe-card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Display } from "@/components/ui/display";
import { Pill } from "@/components/ui/pill";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// Visual-only filters; wiring a real filter needs metadata we don't store yet.
const FILTER_CHIPS = [
  "This week",
  "Quick (<30m)",
  "Kid-approved",
  "Vegetarian",
  "Weekends",
  "By source",
];

export function RecipeList() {
  const { data: recipes, isLoading, error } = useRecipes();
  const openAdd = useAppStore((s) => s.setAddRecipeDialogOpen);

  const total = recipes?.length ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-5 md:p-10">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <Eyebrow>
              Cookbook{total > 0 ? ` · ${total} saved` : ""}
            </Eyebrow>
            <Display size="md" className="mt-2">
              Your <em className="italic">recipes</em>.
            </Display>
          </div>
          <Button
            onClick={() => openAdd(true)}
            className="rounded-full bg-ink text-paper hover:bg-ink/90"
          >
            <Plus className="mr-1.5 h-4 w-4" strokeWidth={2} />
            Paste recipe
          </Button>
        </div>

        {/* Search (stub — not wired; matches redesign visual) */}
        <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-line bg-surface px-3.5 py-3">
          <Search className="h-4 w-4 text-text-3" strokeWidth={1.6} />
          <span className="flex-1 text-sm text-text-3">
            Search by name, source, or ingredient…
          </span>
        </div>

        {/* Filter chips (visual) */}
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
          {FILTER_CHIPS.map((label, i) => (
            <Pill
              key={label}
              tone={i === 0 ? "dark" : "default"}
              className="shrink-0"
            >
              {label}
            </Pill>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load recipes: {error.message}
        </div>
      )}

      {/* Empty */}
      {recipes && recipes.length === 0 && !isLoading && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line bg-surface/60 py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-olive-wash text-olive-ink">
            <BookOpen className="h-7 w-7" strokeWidth={1.6} />
          </div>
          <div className="serif text-xl text-text">No recipes yet.</div>
          <p className="max-w-xs text-sm text-text-3">
            Paste a recipe URL and we'll pull out the ingredients.
          </p>
          <Button
            onClick={() => openAdd(true)}
            className="mt-2 rounded-full bg-ink text-paper hover:bg-ink/90"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add your first recipe
          </Button>
        </div>
      )}

      {/* On this week's list — first 4 */}
      {recipes && recipes.length > 0 && (
        <>
          <div className="flex flex-col gap-2.5">
            <Eyebrow className="px-1">
              On this week's list · {Math.min(4, recipes.length)}
            </Eyebrow>
            <AnimatePresence mode="popLayout">
              {recipes.slice(0, 4).map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} variant="hero" />
              ))}
            </AnimatePresence>
          </div>

          {recipes.length > 4 && (
            <div className="flex flex-col gap-2.5">
              <Eyebrow className="px-1">Recently added</Eyebrow>
              <AnimatePresence mode="popLayout">
                {recipes.slice(4).map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} variant="compact" />
                ))}
              </AnimatePresence>
            </div>
          )}
        </>
      )}
    </div>
  );
}
