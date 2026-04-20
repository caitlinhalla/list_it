import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { RotateCcw, Share2, CheckCircle2 } from "lucide-react";

import { useGroceryList, useUncheckAll } from "@/hooks/use-grocery";
import { useAppStore } from "@/stores/app-store";
import { convertGroceryList } from "@/lib/unit-conversion";
import { AISLES, classifyAisle, type AisleKey } from "@/lib/aisle-classifier";

import { GroceryItem } from "./grocery-item";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Display } from "@/components/ui/display";

type Grouping = "aisle" | "recipe" | "az";

function weekOf(): string {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday ... 6 = Saturday
  const diffToMonday = (day + 6) % 7; // Monday is week start
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  return monday.toLocaleDateString(undefined, { month: "long", day: "numeric" });
}

export function GroceryList() {
  const { data: rawItems, isLoading, error } = useGroceryList();
  const uncheckAll = useUncheckAll();
  const { unitPreference, setUnitPreference } = useAppStore();

  const [grouping, setGrouping] = useState<Grouping>("aisle");

  const items = rawItems ? convertGroceryList(rawItems, unitPreference) : [];
  const totalItems = items.length;
  const checkedCount = items.filter((i) => i.checked).length;

  // Bucket by aisle for grouping=aisle; for the other two, render as a single bucket.
  const groupedByAisle: Record<AisleKey, typeof items> = {
    produce: [], meat: [], dairy: [], pantry: [], frozen: [],
  };
  for (const it of items) {
    groupedByAisle[classifyAisle(it.name)].push(it);
  }

  const alphaSorted = [...items].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-5 md:p-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Eyebrow>Grocery list · Week of {weekOf()}</Eyebrow>
          <Display size="md" className="mt-2">
            <span>Your recipes, </span>
            <em className="italic text-olive">one list</em>
            <span>.</span>
          </Display>
        </div>
        <div className="flex gap-2">
          {checkedCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => uncheckAll.mutate()}
              disabled={uncheckAll.isPending}
              className="rounded-full"
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Reset
            </Button>
          )}
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-text-2"
            aria-label="Share list"
          >
            <Share2 className="h-4 w-4" strokeWidth={1.6} />
          </button>
        </div>
      </div>

      {/* Progress bar + counter */}
      {totalItems > 0 && (
        <div className="flex items-center gap-3">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-line-2">
            <div
              className="h-full rounded-full bg-olive transition-[width] duration-500 ease-out"
              style={{ width: `${(checkedCount / totalItems) * 100}%` }}
            />
          </div>
          <span className="font-mono text-xs text-text-3">
            {checkedCount}/{totalItems}
          </span>
        </div>
      )}

      {/* Grouping toggle */}
      {totalItems > 0 && (
        <div className="flex items-center justify-between gap-4">
          <div className="inline-flex items-center gap-1 rounded-full border border-line bg-surface p-1">
            {(
              [
                ["aisle", "Aisle"],
                ["recipe", "Recipe"],
                ["az", "A–Z"],
              ] as const
            ).map(([k, l]) => (
              <button
                key={k}
                type="button"
                onClick={() => setGrouping(k)}
                className={
                  grouping === k
                    ? "rounded-full bg-ink px-3.5 py-1.5 text-xs font-medium text-paper"
                    : "rounded-full px-3.5 py-1.5 text-xs font-medium text-text-2"
                }
              >
                {l}
              </button>
            ))}
          </div>

          {/* Unit preference toggle — keeps existing feature */}
          <div className="inline-flex items-center gap-1 rounded-full border border-line bg-surface p-1">
            {(["imperial", "metric"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setUnitPreference(p)}
                className={
                  unitPreference === p
                    ? "rounded-full bg-ink px-3.5 py-1.5 text-xs font-medium text-paper"
                    : "rounded-full px-3.5 py-1.5 text-xs font-medium text-text-2"
                }
              >
                {p === "imperial" ? "Imperial" : "Metric"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load grocery list: {error.message}
        </div>
      )}

      {/* Empty */}
      {!isLoading && totalItems === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line bg-surface/60 py-12 text-center">
          <div className="text-3xl">🧺</div>
          <div className="serif text-xl text-text">Nothing on the list yet.</div>
          <p className="text-sm text-text-3">
            Add recipes and ingredients will roll up here, grouped by aisle.
          </p>
        </div>
      )}

      {/* All done celebration */}
      {totalItems > 0 && checkedCount === totalItems && (
        <div className="flex items-center gap-2 rounded-xl bg-accent-wash px-4 py-3 text-sm font-medium text-accent-ink">
          <CheckCircle2 className="h-5 w-5" />
          Everything checked — you're all set.
        </div>
      )}

      {/* Grouping: AISLE */}
      {totalItems > 0 && grouping === "aisle" && (
        <div className="flex flex-col gap-4">
          {AISLES.filter((a) => groupedByAisle[a.key].length > 0).map((aisle) => (
            <section key={aisle.key} className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-1">
                <span className="text-base">{aisle.icon}</span>
                <Eyebrow>{aisle.label}</Eyebrow>
                <span className="font-mono text-[11px] text-text-3">
                  · {groupedByAisle[aisle.key].length}
                </span>
              </div>
              <div className="overflow-hidden rounded-2xl border border-line bg-surface">
                <AnimatePresence initial={false}>
                  {groupedByAisle[aisle.key].map((item, idx, arr) => (
                    <GroceryItem
                      key={`${item.name}-${item.displayUnit}`}
                      item={item}
                      divider={idx < arr.length - 1}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Grouping: A–Z (flat list) */}
      {totalItems > 0 && grouping === "az" && (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <AnimatePresence initial={false}>
            {alphaSorted.map((item, idx, arr) => (
              <GroceryItem
                key={`${item.name}-${item.displayUnit}`}
                item={item}
                divider={idx < arr.length - 1}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Grouping: RECIPE — not implemented */}
      {totalItems > 0 && grouping === "recipe" && (
        <div className="rounded-2xl border border-dashed border-line bg-surface/60 p-6 text-sm text-text-3">
          Recipe grouping is coming once <code className="font-mono">/api/grocery</code> exposes
          per-ingredient recipe breakdowns.
        </div>
      )}
    </div>
  );
}
