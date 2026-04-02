import { useGroceryList, useUncheckAll } from "@/hooks/use-grocery";
import { useAppStore } from "@/stores/app-store";
import { convertGroceryList } from "@/lib/unit-conversion";
import { GroceryItem } from "./grocery-item";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  ShoppingBasket,
  RotateCcw,
  CheckCircle2,
  Scale,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";

export function GroceryList() {
  const { data: rawItems, isLoading, error } = useGroceryList();
  const uncheckAll = useUncheckAll();
  const { unitPreference, setUnitPreference } = useAppStore();

  const items = rawItems
    ? convertGroceryList(rawItems, unitPreference)
    : [];

  const uncheckedItems = items.filter((i) => !i.checked);
  const checkedItems = items.filter((i) => i.checked);
  const totalItems = items.length;
  const checkedCount = checkedItems.length;

  return (
    <div className="flex flex-col gap-4 p-4 md:p-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Grocery List
          </h2>
          <p className="text-sm text-muted-foreground">
            {totalItems > 0
              ? `${checkedCount}/${totalItems} items checked`
              : "Items appear as you add recipes"}
          </p>
        </div>
        {checkedCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => uncheckAll.mutate()}
            disabled={uncheckAll.isPending}
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Reset
          </Button>
        )}
      </div>

      {/* Unit preference toggle */}
      {totalItems > 0 && (
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-muted-foreground" />
          <div className="inline-flex rounded-lg border border-border">
            <button
              onClick={() => setUnitPreference("imperial")}
              className={`px-3 py-1 text-xs font-medium transition-colors rounded-l-lg ${
                unitPreference === "imperial"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Imperial
            </button>
            <button
              onClick={() => setUnitPreference("metric")}
              className={`px-3 py-1 text-xs font-medium transition-colors rounded-r-lg ${
                unitPreference === "metric"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Metric
            </button>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {totalItems > 0 && (
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{
              width: `${(checkedCount / totalItems) * 100}%`,
            }}
          />
        </div>
      )}

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load grocery list: {error.message}
        </div>
      )}

      {!isLoading && totalItems === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShoppingBasket className="h-6 w-6" />
          </div>
          <div>
            <p className="font-medium text-foreground">
              Your list is empty
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add some recipes to auto-generate your grocery list
            </p>
          </div>
        </div>
      )}

      {/* All done celebration */}
      {totalItems > 0 && checkedCount === totalItems && (
        <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-3 text-sm font-medium text-primary">
          <CheckCircle2 className="h-5 w-5" />
          All items checked off — you're all set!
        </div>
      )}

      {/* Unchecked items */}
      <AnimatePresence mode="popLayout">
        {uncheckedItems.map((item) => (
          <GroceryItem
            key={`${item.name}-${item.displayUnit}`}
            item={item}
          />
        ))}
      </AnimatePresence>

      {/* Checked items section */}
      {checkedItems.length > 0 && uncheckedItems.length > 0 && (
        <>
          <Separator />
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Checked ({checkedItems.length})
          </p>
        </>
      )}

      <AnimatePresence mode="popLayout">
        {checkedItems.map((item) => (
          <GroceryItem
            key={`${item.name}-${item.displayUnit}`}
            item={item}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
