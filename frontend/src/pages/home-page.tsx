import { Link as RouterLink } from "react-router-dom";
import { BookOpen, ChevronRight, Link as LinkIcon, ShoppingBasket } from "lucide-react";

import { useRecipes } from "@/hooks/use-recipes";
import { useGroceryList } from "@/hooks/use-grocery";
import { useAppStore } from "@/stores/app-store";
import { classifyAisle, aisleByKey, type AisleKey } from "@/lib/aisle-classifier";
import { recipeVisual } from "@/lib/recipe-visuals";

import { Eyebrow } from "@/components/ui/eyebrow";
import { Display } from "@/components/ui/display";
import { Pill } from "@/components/ui/pill";

function today() {
  const now = new Date();
  const weekday = now.toLocaleDateString(undefined, { weekday: "long" });
  const monthDay = now.toLocaleDateString(undefined, { month: "long", day: "numeric" });
  return { weekday, monthDay };
}

export function HomePage() {
  const { data: recipes } = useRecipes();
  const { data: grocery } = useGroceryList();
  const openAdd = useAppStore((s) => s.setAddRecipeDialogOpen);

  const { weekday, monthDay } = today();
  const totalItems = grocery?.length ?? 0;
  const recipeCount = recipes?.length ?? 0;

  // Top aisles summary
  const aisleCounts: Record<string, number> = {};
  for (const it of grocery ?? []) {
    const k = classifyAisle(it.name);
    aisleCounts[k] = (aisleCounts[k] ?? 0) + 1;
  }
  const topAisles = Object.entries(aisleCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([k, n]) => ({ label: aisleByKey(k as AisleKey).label, count: n }));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-5 md:p-10">
      {/* Greeting */}
      <div>
        <Eyebrow>
          {weekday} · {monthDay}
        </Eyebrow>
        <Display size="lg" className="mt-2">
          Hello.
          <br />
          <em className="italic font-light text-text-2">What's cooking?</em>
        </Display>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Paste hero */}
        <div className="rounded-3xl border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
          <button
            type="button"
            onClick={() => openAdd(true)}
            className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-line bg-bg px-4 py-3.5 text-left"
          >
            <LinkIcon className="h-4 w-4 text-text-3" strokeWidth={1.6} />
            <span className="flex-1 text-[14.5px] text-text-3">
              Paste a recipe link…
            </span>
            <Pill tone="dark" className="px-2 py-0.5">⌘V</Pill>
          </button>
          <div className="mt-2.5 flex gap-2">
            <RouterLink
              to="/recipes"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-bg px-3 py-2.5 text-[13px] font-medium text-text-2"
            >
              <BookOpen className="h-3.5 w-3.5" strokeWidth={1.6} />
              Browse recipes
            </RouterLink>
            <RouterLink
              to="/grocery"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-bg px-3 py-2.5 text-[13px] font-medium text-text-2"
            >
              <ShoppingBasket className="h-3.5 w-3.5" strokeWidth={1.6} />
              Open list
            </RouterLink>
          </div>
        </div>

        {/* List summary card (dark) */}
        <RouterLink
          to="/grocery"
          className="rounded-3xl bg-ink p-5 text-paper transition-opacity hover:opacity-95"
        >
          <div className="flex items-start justify-between">
            <div>
              <Eyebrow className="text-paper/60">
                This week's list
              </Eyebrow>
              <div className="serif mt-1.5 text-[34px] leading-[1.05] tracking-[-0.02em]">
                {totalItems} items
                <span className="text-paper/40">,</span>
              </div>
              <div className="mt-0.5 text-[15px] text-paper/75">
                from {recipeCount} recipe{recipeCount === 1 ? "" : "s"}
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-paper/10">
              <ShoppingBasket className="h-5 w-5 text-paper" strokeWidth={1.6} />
            </div>
          </div>
          {topAisles.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {topAisles.map(({ label, count }) => (
                <span
                  key={label}
                  className="flex items-center gap-1.5 rounded-full bg-paper/10 px-2.5 py-1 text-[12px]"
                >
                  <span className="text-paper/70">{label}</span>
                  <span className="font-semibold">{count}</span>
                </span>
              ))}
            </div>
          )}
        </RouterLink>
      </div>

      {/* Recipes rail */}
      {recipes && recipes.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Eyebrow>This week</Eyebrow>
            <RouterLink
              to="/recipes"
              className="flex items-center gap-1 text-[12px] text-text-3 hover:text-text-2"
            >
              {recipes.length} recipe{recipes.length === 1 ? "" : "s"}
              <ChevronRight className="h-3 w-3" />
            </RouterLink>
          </div>
          <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1 md:-mx-10 md:px-10">
            {recipes.slice(0, 6).map((r) => {
              const v = recipeVisual(r.title);
              return (
                <RouterLink
                  key={r.id}
                  to="/recipes"
                  className="shrink-0 overflow-hidden rounded-2xl border border-line bg-surface"
                  style={{ width: 170 }}
                >
                  <div
                    className="flex h-[100px] items-end p-2.5"
                    style={{
                      background: r.image_url
                        ? `url(${r.image_url}) center/cover`
                        : v.background,
                    }}
                  >
                    {!r.image_url && (
                      <span className="text-[28px] drop-shadow">{v.emoji}</span>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="serif text-[15px] leading-[1.2] tracking-[-0.015em]">
                      {r.title}
                    </div>
                    <div className="mt-1 font-mono text-[11.5px] text-text-3">
                      {r.source_name}
                    </div>
                  </div>
                </RouterLink>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
