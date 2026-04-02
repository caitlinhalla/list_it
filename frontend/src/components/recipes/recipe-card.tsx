import { useState } from "react";
import type { Recipe } from "@/types";
import { useDeleteRecipe } from "@/hooks/use-recipes";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Clock, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

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

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteRecipe = useDeleteRecipe();

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }

    deleteRecipe.mutate(recipe.id, {
      onSuccess: () => {
        toast.success(`Removed "${recipe.title}"`);
      },
    });
  };

  const prepTime = formatDuration(recipe.prep_time);
  const cookTime = formatDuration(recipe.cook_time);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden">
        <div className="flex gap-4 p-4">
          {recipe.image_url && (
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="h-24 w-24 flex-shrink-0 rounded-lg object-cover"
            />
          )}
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold leading-tight text-foreground">
                  {recipe.title}
                </h3>
                <a
                  href={recipe.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  {recipe.source_name}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <Button
                variant={confirmDelete ? "destructive" : "ghost"}
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={handleDelete}
                disabled={deleteRecipe.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {recipe.ingredients.length} ingredient
                {recipe.ingredients.length !== 1 ? "s" : ""}
              </Badge>
              {prepTime && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Prep: {prepTime}
                </span>
              )}
              {cookTime && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Cook: {cookTime}
                </span>
              )}
              {recipe.servings && (
                <span className="text-xs text-muted-foreground">
                  Serves: {recipe.servings}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
