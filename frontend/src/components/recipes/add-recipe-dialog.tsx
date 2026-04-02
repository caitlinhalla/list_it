import { useState } from "react";
import { useAppStore } from "@/stores/app-store";
import { useAddRecipe } from "@/hooks/use-recipes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Link } from "lucide-react";
import { toast } from "sonner";

export function AddRecipeDialog() {
  const { addRecipeDialogOpen, setAddRecipeDialogOpen } = useAppStore();
  const [url, setUrl] = useState("");
  const addRecipe = useAddRecipe();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    addRecipe.mutate(url.trim(), {
      onSuccess: (recipe) => {
        toast.success(`Added "${recipe.title}"`, {
          description: `${recipe.ingredients.length} ingredients from ${recipe.source_name}`,
        });
        setUrl("");
        setAddRecipeDialogOpen(false);
      },
      onError: (error) => {
        toast.error("Failed to add recipe", {
          description: error.message,
        });
      },
    });
  };

  return (
    <Dialog open={addRecipeDialogOpen} onOpenChange={setAddRecipeDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a Recipe</DialogTitle>
          <DialogDescription>
            Paste a recipe URL and we'll extract the ingredients for your
            grocery list.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Link className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.allrecipes.com/recipe/..."
                className="pl-9"
                disabled={addRecipe.isPending}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddRecipeDialogOpen(false)}
              disabled={addRecipe.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!url.trim() || addRecipe.isPending}>
              {addRecipe.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scraping...
                </>
              ) : (
                "Add Recipe"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
