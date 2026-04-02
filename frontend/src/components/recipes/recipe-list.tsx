import { useRecipes } from "@/hooks/use-recipes";
import { useAppStore } from "@/stores/app-store";
import { RecipeCard } from "./recipe-card";
import { AddRecipeDialog } from "./add-recipe-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, BookOpen } from "lucide-react";
import { AnimatePresence } from "framer-motion";

export function RecipeList() {
  const { data: recipes, isLoading, error } = useRecipes();
  const setAddRecipeDialogOpen = useAppStore(
    (s) => s.setAddRecipeDialogOpen
  );

  return (
    <div className="flex flex-col gap-4 p-4 md:p-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            My Recipes
          </h2>
          <p className="text-sm text-muted-foreground">
            {recipes?.length
              ? `${recipes.length} recipe${recipes.length !== 1 ? "s" : ""} this week`
              : "Add recipes to build your grocery list"}
          </p>
        </div>
        <Button onClick={() => setAddRecipeDialogOpen(true)} size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          Add Recipe
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load recipes: {error.message}
        </div>
      )}

      {recipes && recipes.length === 0 && !isLoading && (
        <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <BookOpen className="h-7 w-7" />
          </div>
          <div>
            <p className="font-medium text-foreground">
              No recipes yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Paste a recipe URL to get started
            </p>
          </div>
          <Button
            onClick={() => setAddRecipeDialogOpen(true)}
            size="sm"
            className="mt-2"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add Your First Recipe
          </Button>
        </div>
      )}

      <AnimatePresence mode="popLayout">
        {recipes?.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </AnimatePresence>

      <AddRecipeDialog />
    </div>
  );
}
