import { useAppStore } from "@/stores/app-store";
import { RecipeList } from "@/components/recipes/recipe-list";
import { GroceryList } from "@/components/grocery/grocery-list";
import { Button } from "@/components/ui/button";
import { BookOpen, ShoppingBasket } from "lucide-react";

export function AppShell() {
  const { activeView, setActiveView } = useAppStore();

  return (
    <div className="flex flex-1 flex-col">
      {/* Mobile tab toggle */}
      <div className="flex border-b border-border md:hidden">
        <Button
          variant={activeView === "recipes" ? "default" : "ghost"}
          className="flex-1 rounded-none"
          onClick={() => setActiveView("recipes")}
        >
          <BookOpen className="mr-2 h-4 w-4" />
          Recipes
        </Button>
        <Button
          variant={activeView === "grocery" ? "default" : "ghost"}
          className="flex-1 rounded-none"
          onClick={() => setActiveView("grocery")}
        >
          <ShoppingBasket className="mr-2 h-4 w-4" />
          Grocery List
        </Button>
      </div>

      {/* Desktop: two panels. Mobile: toggle between them */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-0 md:gap-6 md:p-6">
        <div
          className={`flex-1 ${activeView === "recipes" ? "block" : "hidden"} md:block`}
        >
          <RecipeList />
        </div>

        <div
          className={`w-full md:w-[420px] md:flex-shrink-0 ${activeView === "grocery" ? "block" : "hidden"} md:block`}
        >
          <GroceryList />
        </div>
      </div>
    </div>
  );
}
