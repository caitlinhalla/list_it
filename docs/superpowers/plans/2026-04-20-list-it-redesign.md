# List It Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the Claude-Design "warm editorial" redesign (`/Users/challa/Downloads/list-it/project/`) to the existing React + Phoenix list_it app, touching only the frontend, preserving all existing business logic, data fetching, and backend integrations.

**Architecture:** Keep the existing React 19 + Vite + Tailwind v4 + shadcn + TanStack Query + Zustand stack. Swap the neutral `oklch(…)` palette for the warm editorial tokens (bone / cream / olive, Fraunces serif + Inter sans + JetBrains Mono). Introduce `react-router-dom` (already a dependency) for `/`, `/recipes`, `/grocery` routes. Replace the old two-panel `AppShell` with a desktop **left sidebar + main content** layout (mobile falls back to bottom tabs), matching redesign screen 11.

**Tech Stack:** React 19, Vite 8, Tailwind v4 (CSS-in-CSS, `@theme inline`), shadcn (existing primitives), lucide-react icons, react-router-dom v7, TanStack Query v5, Zustand v5, framer-motion, sonner, Google Fonts CDN (Fraunces, Inter, JetBrains Mono).

---

## Scope (agreed with user)

**In scope:**
- Theme tokens (palette, typography, radii, shadows, animations)
- Desktop sidebar + mobile tab-bar shell (matches redesign screen 11 on ≥md, screen 05 tabs on <md)
- `/` Home page (greeting, paste hero, list summary card, recent-recipes rail) — screen 02
- `/recipes` page restyled — screen 07
- `/grocery` page restyled with client-side aisle grouping, progress, recipe dots — screen 06
- Add-recipe dialog redesigned as a bottom sheet, with parsing + error states driven by `useAddRecipe` mutation — screens 03 / 04 / 05

**Deferred (no backend model — separate plans later):**
- Onboarding (screen 01)
- Meal Plan (screen 08)
- Pantry (screen 10)
- Household (screen 09)

Deferred sections are **hidden** from nav until their backend models land.

## Implementation notes

- **Aisle classification** is a client-side keyword heuristic (`src/lib/aisle-classifier.ts`). The backend has no `aisle` field on `ingredient.ex`. A backend-level classifier is tracked as a follow-up TODO, not part of this plan.
- **Pantry dim / recipe hue** from the redesign require data we don't have (pantry set, per-recipe theme color). We **skip the pantry-dim overlay** on grocery rows (no model), and we **derive a deterministic hue** from the recipe title (hash → HSL) in `src/lib/recipe-visuals.ts`.
- **No frontend test infrastructure** exists in this project (no `test` script, no vitest/jest). Full TDD for a pure visual restyle would mean standing up a test harness just for this redesign — not proportionate. Verification model for this plan: `npm run build`, `npm run lint`, and a manual walkthrough of each redesign screen in `npm run dev`. Keep this in mind when executing.
- Tailwind v4's `@theme inline` block is extended so color/font tokens like `bg-surface`, `text-ink-2`, `font-serif`, `font-mono` work as utility classes alongside direct `var(--…)` references.

---

## File Structure

**New files:**
- `frontend/src/lib/aisle-classifier.ts` — keyword → aisle-key heuristic
- `frontend/src/lib/recipe-visuals.ts` — title → hue + emoji
- `frontend/src/pages/home-page.tsx` — `/`
- `frontend/src/pages/recipes-page.tsx` — `/recipes`
- `frontend/src/pages/grocery-page.tsx` — `/grocery`
- `frontend/src/components/layout/sidebar.tsx` — desktop left nav
- `frontend/src/components/layout/mobile-tabs.tsx` — mobile bottom nav
- `frontend/src/components/ui/eyebrow.tsx` — small-caps mono label
- `frontend/src/components/ui/display.tsx` — serif display heading
- `frontend/src/components/ui/pill.tsx` — tonal pill (default / accent / ghost / dark)

**Modified files:**
- `frontend/src/index.css` — replace `@theme inline` block + `:root` tokens; add fonts + keyframes
- `frontend/src/App.tsx` — add `BrowserRouter` + `<Routes>`; drop inline `Header`
- `frontend/src/stores/app-store.ts` — remove `activeView` (URL is source of truth); keep `addRecipeDialogOpen`, `unitPreference`
- `frontend/src/components/layout/app-shell.tsx` — rewrite as `<Sidebar> + <Outlet> + <MobileTabs>` wrapper
- `frontend/src/components/recipes/recipe-list.tsx` — editorial header + search + chip filters + card grid
- `frontend/src/components/recipes/recipe-card.tsx` — image tile + serif title + mono source + pills
- `frontend/src/components/recipes/add-recipe-dialog.tsx` — bottom-sheet layout + parsing + error states
- `frontend/src/components/grocery/grocery-list.tsx` — editorial header + progress + grouping toggle + aisle sections
- `frontend/src/components/grocery/grocery-item.tsx` — rounded check + serif-adjacent name + mono qty + recipe dots

**Deleted files:**
- `frontend/src/components/layout/header.tsx` — role is absorbed into `sidebar.tsx`

---

## Task 1: Replace theme tokens, fonts, and base CSS

**Why:** The current palette is shadcn-neutral. The redesign is warm editorial (bone/cream/olive) with Fraunces + Inter + JetBrains Mono. Swapping tokens at the CSS layer cascades into every shadcn component without rewriting them.

**Files:**
- Modify: `frontend/src/index.css`

- [ ] **Step 1: Rewrite `frontend/src/index.css`**

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;450;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

@custom-variant dark (&:is([data-mode="dark"] *));

@theme inline {
    /* Typography */
    --font-serif: 'Fraunces', 'Cormorant Garamond', Georgia, serif;
    --font-sans: 'Inter', -apple-system, 'SF Pro Text', system-ui, sans-serif;
    --font-mono: 'JetBrains Mono', ui-monospace, Menlo, monospace;
    --font-heading: var(--font-serif);

    /* Warm editorial palette — raw */
    --color-bone: var(--bone);
    --color-cream: var(--cream);
    --color-paper: var(--paper);
    --color-ink: var(--ink);
    --color-ink-2: var(--ink-2);
    --color-ink-3: var(--ink-3);
    --color-line: var(--line);
    --color-line-2: var(--line-2);
    --color-olive: var(--olive);
    --color-olive-ink: var(--olive-ink);
    --color-olive-wash: var(--olive-wash);
    --color-terracotta: var(--terracotta);
    --color-blush: var(--blush);
    --color-sage: var(--sage);

    /* Semantic */
    --color-bg: var(--bg);
    --color-surface: var(--surface);
    --color-surface-2: var(--surface-2);
    --color-text: var(--text);
    --color-text-2: var(--text-2);
    --color-text-3: var(--text-3);
    --color-accent-ink: var(--accent-ink);
    --color-accent-wash: var(--accent-wash);

    /* shadcn token bridge (keeps existing Dialog/Button/etc. looking right) */
    --color-background: var(--background);
    --color-foreground: var(--foreground);
    --color-card: var(--card);
    --color-card-foreground: var(--card-foreground);
    --color-popover: var(--popover);
    --color-popover-foreground: var(--popover-foreground);
    --color-primary: var(--primary);
    --color-primary-foreground: var(--primary-foreground);
    --color-secondary: var(--secondary);
    --color-secondary-foreground: var(--secondary-foreground);
    --color-muted: var(--muted);
    --color-muted-foreground: var(--muted-foreground);
    --color-accent: var(--accent);
    --color-accent-foreground: var(--accent-foreground);
    --color-destructive: var(--destructive);
    --color-border: var(--border);
    --color-input: var(--input);
    --color-ring: var(--ring);

    /* radii (kept from earlier setup so shadcn variants work) */
    --radius-sm: calc(var(--radius) * 0.6);
    --radius-md: calc(var(--radius) * 0.8);
    --radius-lg: var(--radius);
    --radius-xl: calc(var(--radius) * 1.4);
    --radius-2xl: calc(var(--radius) * 1.8);
    --radius-3xl: calc(var(--radius) * 2.2);
    --radius-4xl: calc(var(--radius) * 2.6);
}

:root {
    /* Warm editorial — light */
    --bone: #F5F1EA;
    --cream: #FBF8F2;
    --paper: #FFFDF8;
    --ink: #1E1C18;
    --ink-2: #4A463E;
    --ink-3: #8A8378;
    --line: #E4DFD4;
    --line-2: #EFEAE0;
    --olive: #5B6B3A;
    --olive-ink: #3A4724;
    --olive-wash: #E9ECDD;
    --terracotta: #C4683F;
    --blush: #F0E4D8;
    --sage: #B8C09A;

    /* Semantic */
    --bg: var(--bone);
    --surface: var(--cream);
    --surface-2: var(--paper);
    --text: var(--ink);
    --text-2: var(--ink-2);
    --text-3: var(--ink-3);
    --accent-ink: var(--olive-ink);
    --accent-wash: var(--olive-wash);

    /* shadcn bridge — point at warm equivalents */
    --background: var(--bone);
    --foreground: var(--ink);
    --card: var(--cream);
    --card-foreground: var(--ink);
    --popover: var(--paper);
    --popover-foreground: var(--ink);
    --primary: var(--ink);
    --primary-foreground: var(--paper);
    --secondary: var(--cream);
    --secondary-foreground: var(--ink-2);
    --muted: var(--cream);
    --muted-foreground: var(--ink-3);
    --accent: var(--olive-wash);
    --accent-foreground: var(--olive-ink);
    --destructive: oklch(0.577 0.245 27.325);
    --border: var(--line);
    --input: var(--line);
    --ring: var(--olive);

    --radius: 0.875rem;

    /* Shadows */
    --shadow-card: 0 1px 2px rgba(30,28,24,0.04), 0 8px 24px rgba(30,28,24,0.06);
    --shadow-pop: 0 4px 12px rgba(30,28,24,0.08), 0 24px 48px rgba(30,28,24,0.12);
}

/* Dark mode — applied via [data-mode="dark"] on <html> */
[data-mode="dark"] {
    --bg: #16140F;
    --surface: #1E1B15;
    --surface-2: #25221B;
    --text: #F2EEE4;
    --text-2: #B4AE9F;
    --text-3: #78736A;
    --line: #2D2A22;
    --line-2: #24221B;
    --accent-wash: #2A301D;

    --background: var(--bg);
    --foreground: var(--text);
    --card: var(--surface);
    --card-foreground: var(--text);
    --popover: var(--surface-2);
    --popover-foreground: var(--text);
    --primary: var(--text);
    --primary-foreground: var(--bg);
    --secondary: var(--surface);
    --secondary-foreground: var(--text-2);
    --muted: var(--surface);
    --muted-foreground: var(--text-3);
    --accent: var(--accent-wash);
    --accent-foreground: #D6DCBB;
    --border: var(--line);
    --input: var(--line);
    --shadow-card: 0 1px 2px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.3);
}

@layer base {
    * {
        @apply border-border outline-ring/50;
        box-sizing: border-box;
    }
    html {
        @apply font-sans;
        -webkit-font-smoothing: antialiased;
        text-rendering: optimizeLegibility;
    }
    body {
        @apply bg-background text-foreground;
    }
}

@layer utilities {
    .serif {
        font-family: var(--font-serif);
        font-optical-sizing: auto;
        font-variation-settings: "opsz" 144, "SOFT" 40;
    }
    .mono {
        font-family: var(--font-mono);
    }
}

/* Keyframes used by parsing state, chips, and toasts */
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
}
@keyframes pulse {
    0%, 100% { opacity: 1; }
    50%      { opacity: 0.5; }
}
@keyframes spin {
    to { transform: rotate(360deg); }
}
```

- [ ] **Step 2: Remove obsolete dep `@fontsource-variable/geist`**

Run:

```bash
cd frontend && npm uninstall @fontsource-variable/geist
```

Expected: `package.json` no longer lists `@fontsource-variable/geist`; `package-lock.json` updated.

- [ ] **Step 3: Verify build and dev server still start**

Run:

```bash
cd frontend && npm run build
```

Expected: exits 0. Fonts resolve from Google CDN at runtime.

Run:

```bash
cd frontend && npm run dev
```

Expected: Vite starts; open `http://localhost:5173`; the existing app loads with the new warm palette (bone background, olive ring on focus). Components may look misaligned — that's fixed in later tasks.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/index.css frontend/package.json frontend/package-lock.json
git commit -m "feat(frontend): swap to warm editorial theme tokens"
```

---

## Task 2: Add client-side aisle classifier

**Why:** The redesign groups grocery items by aisle (Produce / Meat & Fish / Dairy & Eggs / Pantry / Frozen). Our backend ingredient model has no aisle field, so we classify by keyword on the frontend. Known limitation: wrong for ambiguous names ("butter lettuce" → produce, "peanut butter" → pantry); good enough as a first pass.

**Files:**
- Create: `frontend/src/lib/aisle-classifier.ts`

- [ ] **Step 1: Write `frontend/src/lib/aisle-classifier.ts`**

```ts
export type AisleKey = "produce" | "meat" | "dairy" | "pantry" | "frozen";

export interface Aisle {
  key: AisleKey;
  label: string;
  icon: string;
  note: string;
}

export const AISLES: Aisle[] = [
  { key: "produce", label: "Produce",      icon: "🥬", note: "from the market" },
  { key: "meat",    label: "Meat & Fish",  icon: "🐓", note: "butcher counter" },
  { key: "dairy",   label: "Dairy & Eggs", icon: "🥚", note: "refrigerated" },
  { key: "pantry",  label: "Pantry",       icon: "🫙", note: "center aisles" },
  { key: "frozen",  label: "Frozen",       icon: "❄️", note: "freezer" },
];

// Keywords matched as substrings against lowercased ingredient name.
// Order matters only across categories (first match wins), not within a category.
const KEYWORDS: Record<AisleKey, string[]> = {
  produce: [
    "lettuce", "spinach", "kale", "arugula", "chard", "cabbage", "bok choy",
    "onion", "shallot", "garlic", "scallion", "leek", "chive",
    "tomato", "cucumber", "pepper", "chili", "jalapeno", "jalapeño",
    "carrot", "celery", "radish", "beet", "turnip", "parsnip",
    "potato", "sweet potato", "yam",
    "squash", "zucchini", "pumpkin", "eggplant",
    "broccoli", "cauliflower", "asparagus", "brussels",
    "mushroom",
    "avocado", "lemon", "lime", "orange", "grapefruit",
    "apple", "pear", "banana", "berry", "berries", "strawberr", "blueberr", "raspberr",
    "grape", "melon", "peach", "plum", "cherry", "pomegranate",
    "parsley", "cilantro", "basil", "mint", "thyme", "rosemary", "dill", "sage", "oregano",
    "ginger",
    "corn", "cucumb", "pea", "bean sprout", "green bean",
  ],
  meat: [
    "chicken", "turkey", "duck", "poultry",
    "beef", "steak", "ground beef", "brisket", "roast", "chuck",
    "pork", "bacon", "ham", "sausage", "prosciutto",
    "lamb",
    "salmon", "tuna", "cod", "halibut", "tilapia", "trout", "fish",
    "shrimp", "scallop", "crab", "lobster", "mussel", "clam", "oyster",
  ],
  dairy: [
    "milk", "cream", "half and half", "half-and-half",
    "butter", "ghee",
    "yogurt", "yoghurt", "kefir",
    "cheese", "parmesan", "cheddar", "mozzarella", "feta", "ricotta", "cotija", "goat cheese",
    "egg", "eggs",
    "tofu", "tempeh",
  ],
  frozen: [
    "frozen", "ice cream", "popsicle", "frozen peas", "frozen corn",
  ],
  pantry: [], // fallback
};

export function classifyAisle(name: string): AisleKey {
  const n = name.toLowerCase().trim();
  // frozen first so "frozen peas" wins over "pea" in produce
  for (const aisle of ["frozen", "meat", "dairy", "produce"] as AisleKey[]) {
    for (const kw of KEYWORDS[aisle]) {
      if (n.includes(kw)) return aisle;
    }
  }
  return "pantry";
}

export function aisleByKey(key: AisleKey): Aisle {
  return AISLES.find((a) => a.key === key)!;
}
```

- [ ] **Step 2: Build to verify TypeScript passes**

Run:

```bash
cd frontend && npm run build
```

Expected: exits 0. No TS errors (file has no dependencies on app code).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/aisle-classifier.ts
git commit -m "feat(frontend): add client-side aisle classifier"
```

---

## Task 3: Add recipe-visuals helper (deterministic hue + emoji)

**Why:** Cards in the redesign have a gradient tile and an emoji. Backend doesn't store these, so we derive them deterministically from the recipe title — same recipe → same colors on every render.

**Files:**
- Create: `frontend/src/lib/recipe-visuals.ts`

- [ ] **Step 1: Write `frontend/src/lib/recipe-visuals.ts`**

```ts
// Deterministic hash → visual style for a recipe card tile.
// Same title always yields the same hue + emoji — no randomness.

export interface RecipeVisual {
  hueDeg: number;          // base hue for gradient
  background: string;      // CSS gradient
  ring: string;            // solid color for accents/dots
  emoji: string;
}

const EMOJIS = [
  "🍗", "🍝", "🥬", "🍲", "🍓", "🥘", "🍜", "🥗",
  "🍳", "🧀", "🥖", "🌮", "🍛", "🥧", "🍰", "🫕",
];

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function recipeVisual(title: string): RecipeVisual {
  const h = hash(title || "recipe");
  // Keep hues inside warm / earthy range: 15°–130° + 300°–360°
  const warmHues = [18, 28, 38, 48, 78, 95, 115, 325, 345];
  const hueDeg = warmHues[h % warmHues.length];
  const sat = 45;     // muted saturation for editorial feel
  const lightTop = 78;
  const lightBottom = 48;
  const background = `linear-gradient(135deg, hsl(${hueDeg} ${sat}% ${lightTop}%), hsl(${hueDeg} ${sat}% ${lightBottom}%))`;
  const ring = `hsl(${hueDeg} ${sat}% ${lightBottom}%)`;
  const emoji = EMOJIS[(h >> 8) % EMOJIS.length];
  return { hueDeg, background, ring, emoji };
}
```

- [ ] **Step 2: Build to verify**

Run:

```bash
cd frontend && npm run build
```

Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/recipe-visuals.ts
git commit -m "feat(frontend): add deterministic recipe visuals helper"
```

---

## Task 4: Simplify app-store (URL is the source of truth for routing)

**Why:** Previously `activeView` in Zustand drove the mobile tab toggle. With `react-router-dom` routes, the URL replaces that state. `addRecipeDialogOpen` and `unitPreference` remain.

**Files:**
- Modify: `frontend/src/stores/app-store.ts`

- [ ] **Step 1: Rewrite `frontend/src/stores/app-store.ts`**

```ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UnitPreference } from "@/lib/unit-conversion";

interface AppState {
  addRecipeDialogOpen: boolean;
  setAddRecipeDialogOpen: (open: boolean) => void;
  unitPreference: UnitPreference;
  setUnitPreference: (pref: UnitPreference) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      addRecipeDialogOpen: false,
      setAddRecipeDialogOpen: (open) => set({ addRecipeDialogOpen: open }),
      unitPreference: "imperial",
      setUnitPreference: (pref) => set({ unitPreference: pref }),
    }),
    {
      name: "listit-settings",
      partialize: (state) => ({
        unitPreference: state.unitPreference,
      }),
    }
  )
);
```

- [ ] **Step 2: Commit (build will still be broken because `activeView` is referenced in `app-shell.tsx`; fixed in Task 7)**

```bash
git add frontend/src/stores/app-store.ts
git commit -m "feat(frontend): drop activeView from store (routes own nav state)"
```

---

## Task 5: Add layout primitives — Eyebrow, Display, Pill

**Why:** The redesign uses three recurring text treatments: a mono small-caps eyebrow, a serif display heading, and tonal pills. Extracting them keeps every screen consistent without re-inventing inline styles.

**Files:**
- Create: `frontend/src/components/ui/eyebrow.tsx`
- Create: `frontend/src/components/ui/display.tsx`
- Create: `frontend/src/components/ui/pill.tsx`

- [ ] **Step 1: Write `frontend/src/components/ui/eyebrow.tsx`**

```tsx
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

export function Eyebrow({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-text-3",
        className
      )}
      {...props}
    />
  );
}
```

- [ ] **Step 2: Write `frontend/src/components/ui/display.tsx`**

```tsx
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

type Size = "sm" | "md" | "lg" | "xl";

const SIZE: Record<Size, string> = {
  sm: "text-[28px] leading-[1.05]",
  md: "text-[34px] leading-[1.04]",
  lg: "text-[42px] leading-[1.02]",
  xl: "text-[56px] leading-none",
};

interface DisplayProps extends ComponentProps<"h1"> {
  size?: Size;
}

export function Display({ size = "md", className, ...props }: DisplayProps) {
  return (
    <h1
      className={cn(
        "serif font-normal tracking-[-0.015em] text-text",
        SIZE[size],
        className
      )}
      {...props}
    />
  );
}
```

- [ ] **Step 3: Write `frontend/src/components/ui/pill.tsx`**

```tsx
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

type Tone = "default" | "accent" | "ghost" | "dark";

const TONE: Record<Tone, string> = {
  default: "bg-surface text-text-2 border-border",
  accent:  "bg-accent-wash text-accent-ink border-transparent",
  ghost:   "bg-transparent text-text-3 border-border",
  dark:    "bg-ink text-paper border-ink",
};

interface PillProps extends ComponentProps<"span"> {
  tone?: Tone;
}

export function Pill({ tone = "default", className, ...props }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-medium tracking-[-0.01em]",
        TONE[tone],
        className
      )}
      {...props}
    />
  );
}
```

- [ ] **Step 4: Build to verify**

Run:

```bash
cd frontend && npm run build
```

Expected: TS compiles. Build will still fail at `app-shell.tsx` (`activeView` removed) — that's fine, fixed in Task 7.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ui/eyebrow.tsx frontend/src/components/ui/display.tsx frontend/src/components/ui/pill.tsx
git commit -m "feat(frontend): add Eyebrow, Display, Pill primitives"
```

---

## Task 6: Create route skeletons (pages)

**Why:** Before wiring the router, give each route a thin wrapper page that delegates to the feature components. Keeps `App.tsx` readable, gives per-route shells for future evolution (page-level skeletons, error boundaries).

**Files:**
- Create: `frontend/src/pages/home-page.tsx`
- Create: `frontend/src/pages/recipes-page.tsx`
- Create: `frontend/src/pages/grocery-page.tsx`

- [ ] **Step 1: Write `frontend/src/pages/recipes-page.tsx` (delegates to existing RecipeList)**

```tsx
import { RecipeList } from "@/components/recipes/recipe-list";

export function RecipesPage() {
  return <RecipeList />;
}
```

- [ ] **Step 2: Write `frontend/src/pages/grocery-page.tsx` (delegates to existing GroceryList)**

```tsx
import { GroceryList } from "@/components/grocery/grocery-list";

export function GroceryPage() {
  return <GroceryList />;
}
```

- [ ] **Step 3: Write placeholder `frontend/src/pages/home-page.tsx`**

Full implementation lands in Task 10. For now, a stub so the route resolves.

```tsx
import { Eyebrow } from "@/components/ui/eyebrow";
import { Display } from "@/components/ui/display";

export function HomePage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <Eyebrow>Home</Eyebrow>
      <Display>Morning.</Display>
      <p className="text-sm text-text-2">
        Home dashboard arrives in Task 10.
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages
git commit -m "feat(frontend): add route-level page wrappers"
```

---

## Task 7: Rewrite AppShell — desktop sidebar + main + mobile tabs

**Why:** The redesign replaces the old centered two-panel layout with a persistent left sidebar (screen 11) on desktop and a bottom tab-bar (screens 02/05/etc.) on mobile. Navigation is URL-driven via `react-router-dom`.

**Files:**
- Create: `frontend/src/components/layout/sidebar.tsx`
- Create: `frontend/src/components/layout/mobile-tabs.tsx`
- Modify: `frontend/src/components/layout/app-shell.tsx`
- Delete: `frontend/src/components/layout/header.tsx`

- [ ] **Step 1: Write `frontend/src/components/layout/sidebar.tsx`**

```tsx
import { NavLink } from "react-router-dom";
import { Home, BookOpen, ShoppingBasket, Link as LinkIcon } from "lucide-react";
import { Eyebrow } from "@/components/ui/eyebrow";
import { useAppStore } from "@/stores/app-store";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/",         label: "Home",    icon: Home },
  { to: "/grocery",  label: "This week", icon: ShoppingBasket },
  { to: "/recipes",  label: "Recipes", icon: BookOpen },
];

export function Sidebar() {
  const openAdd = useAppStore((s) => s.setAddRecipeDialogOpen);

  return (
    <aside className="hidden md:flex md:w-[240px] md:flex-col md:border-r md:border-line md:bg-surface md:px-5 md:py-6">
      <div className="serif text-2xl font-medium tracking-[-0.02em] text-text">
        List It.
      </div>
      <nav className="mt-8 flex flex-col gap-0.5">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                isActive
                  ? "bg-accent-wash font-semibold text-accent-ink"
                  : "text-text-2 hover:bg-line-2"
              )
            }
          >
            <Icon className="h-4 w-4" strokeWidth={1.6} />
            <span className="flex-1">{label}</span>
          </NavLink>
        ))}
      </nav>

      <button
        type="button"
        onClick={() => openAdd(true)}
        className="mt-6 flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-paper transition-opacity hover:opacity-90"
      >
        <LinkIcon className="h-4 w-4" strokeWidth={2} />
        Paste recipe
      </button>

      <div className="mt-8">
        <Eyebrow>Saved sources</Eyebrow>
        <div className="mt-3 flex flex-col gap-1.5 text-[13px] text-text-2">
          <span className="px-2.5">NYT Cooking</span>
          <span className="px-2.5">Smitten Kitchen</span>
          <span className="px-2.5">Bon Appétit</span>
          <span className="px-2.5">Food52</span>
        </div>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Write `frontend/src/components/layout/mobile-tabs.tsx`**

```tsx
import { NavLink } from "react-router-dom";
import { Home, BookOpen, ShoppingBasket } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/",        label: "Home",    icon: Home },
  { to: "/grocery", label: "List",    icon: ShoppingBasket },
  { to: "/recipes", label: "Recipes", icon: BookOpen },
];

export function MobileTabs() {
  return (
    <nav className="sticky bottom-0 z-40 flex border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      {TABS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10.5px] font-medium tracking-[0.02em]",
              isActive ? "text-text" : "text-text-3"
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon className="h-5 w-5" strokeWidth={isActive ? 1.8 : 1.5} />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
```

- [ ] **Step 3: Rewrite `frontend/src/components/layout/app-shell.tsx`**

```tsx
import { Outlet } from "react-router-dom";
import { Sidebar } from "./sidebar";
import { MobileTabs } from "./mobile-tabs";
import { AddRecipeDialog } from "@/components/recipes/add-recipe-dialog";

export function AppShell() {
  return (
    <div className="flex min-h-screen bg-bg text-text">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 overflow-x-hidden">
          <Outlet />
        </main>
        <MobileTabs />
      </div>
      <AddRecipeDialog />
    </div>
  );
}
```

Note: `AddRecipeDialog` lives at the shell so the "Paste recipe" CTA in the sidebar (and any other trigger) can open it from anywhere.

- [ ] **Step 4: Delete `frontend/src/components/layout/header.tsx`**

```bash
rm frontend/src/components/layout/header.tsx
```

Expected: file removed. Any remaining imports caught by TypeScript in Task 8.

- [ ] **Step 5: Also remove the AddRecipeDialog render from recipe-list.tsx** (prevent duplicate render now that AppShell owns it). We'll do the full recipe-list rewrite in Task 11 — for now, just confirm the codebase compiles after Task 8's App.tsx rewrite by noting: `recipe-list.tsx` still renders `<AddRecipeDialog />`; rendering twice is harmless (state is in Zustand), just visually redundant. Task 11's rewrite removes the duplicate. Don't edit here.

- [ ] **Step 6: Commit (build still breaks until Task 8 wires the router)**

```bash
git add frontend/src/components/layout
git commit -m "feat(frontend): add sidebar + mobile tabs; delete header"
```

---

## Task 8: Wire BrowserRouter in App.tsx

**Why:** Connect the pages from Task 6 to URLs, mount `AppShell` as the layout route. After this step, the build compiles end-to-end again.

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Rewrite `frontend/src/App.tsx`**

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { HomePage } from "@/pages/home-page";
import { RecipesPage } from "@/pages/recipes-page";
import { GroceryPage } from "@/pages/grocery-page";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      refetchOnWindowFocus: true,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route path="recipes" element={<RecipesPage />} />
            <Route path="grocery" element={<GroceryPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster
        position="bottom-right"
        richColors
        toastOptions={{
          className: "!bg-paper !text-ink !border-line",
        }}
      />
    </QueryClientProvider>
  );
}

export default App;
```

- [ ] **Step 2: Build**

Run:

```bash
cd frontend && npm run build
```

Expected: exits 0. All TS references resolve.

- [ ] **Step 3: Dev-server smoke test**

Run:

```bash
cd frontend && npm run dev
```

Expected: three routes navigable:
- `/` → HomePage placeholder
- `/recipes` → existing RecipeList (still in old styling)
- `/grocery` → existing GroceryList (still in old styling)

Sidebar visible on ≥md, tabs on <md. Clicking the sidebar "Paste recipe" button opens the existing Add Recipe dialog.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat(frontend): wire BrowserRouter with Home / Recipes / Grocery routes"
```

---

## Task 9: Restyle Grocery List with aisle grouping

**Why:** The grocery list is the most-visited surface. Redesign adds editorial header, progress, a grouping toggle (Aisle / Recipe / A–Z — only Aisle is implemented; the others are visual stubs tracked as TODOs), and aisle-grouped cards. Pantry-dim is skipped (no model).

**Files:**
- Modify: `frontend/src/components/grocery/grocery-list.tsx`

- [ ] **Step 1: Rewrite `frontend/src/components/grocery/grocery-list.tsx`**

```tsx
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
          <Eyebrow>Grocery list · Week of April 14</Eyebrow>
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

      {/* Grouping: RECIPE — not implemented (would require a recipe→ingredient breakdown from the backend that the current
          /api/grocery response doesn't expose). Show an unobtrusive hint. */}
      {totalItems > 0 && grouping === "recipe" && (
        <div className="rounded-2xl border border-dashed border-line bg-surface/60 p-6 text-sm text-text-3">
          Recipe grouping is coming once <code className="font-mono">/api/grocery</code> exposes
          per-ingredient recipe breakdowns.
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Build**

Run:

```bash
cd frontend && npm run build
```

Expected: TS error about `GroceryItem` missing `divider` prop — resolved in Task 10.

- [ ] **Step 3: Commit (partial; next task finishes the row component)**

```bash
git add frontend/src/components/grocery/grocery-list.tsx
git commit -m "feat(frontend): editorial grocery list with aisle grouping"
```

---

## Task 10: Restyle Grocery Item

**Why:** New row layout — circular checkbox (olive when checked), name, mono quantity, optional multi-recipe badge. Accepts a `divider` prop from the list so the parent can hide the last row's bottom border cleanly.

**Files:**
- Modify: `frontend/src/components/grocery/grocery-item.tsx`

- [ ] **Step 1: Rewrite `frontend/src/components/grocery/grocery-item.tsx`**

```tsx
import { motion } from "framer-motion";
import { Check } from "lucide-react";

import type { ConvertedGroceryItem } from "@/lib/unit-conversion";
import { useToggleCheck } from "@/hooks/use-grocery";
import { Pill } from "@/components/ui/pill";

interface GroceryItemProps {
  item: ConvertedGroceryItem;
  divider: boolean;
}

export function GroceryItem({ item, divider }: GroceryItemProps) {
  const toggleCheck = useToggleCheck();

  const handleToggle = () => {
    toggleCheck.mutate({ name: item.name, checked: !item.checked });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.18 }}
      className={
        divider
          ? "flex items-center gap-3 border-b border-line-2 px-4 py-3"
          : "flex items-center gap-3 px-4 py-3"
      }
    >
      <button
        type="button"
        onClick={handleToggle}
        aria-label={item.checked ? `Uncheck ${item.name}` : `Check ${item.name}`}
        className={
          item.checked
            ? "flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-olive bg-olive"
            : "flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-line"
        }
      >
        {item.checked && <Check className="h-3 w-3 text-paper" strokeWidth={3} />}
      </button>

      <div
        className={
          item.checked
            ? "flex min-w-0 flex-1 flex-col opacity-50"
            : "flex min-w-0 flex-1 flex-col"
        }
      >
        <span
          className={
            item.checked
              ? "text-[15px] font-medium text-text line-through decoration-text-3"
              : "text-[15px] font-medium text-text"
          }
        >
          {item.name}
        </span>
        {(item.displayQuantity || item.recipeCount > 1) && (
          <span className="mt-0.5 flex items-center gap-1.5 font-mono text-[12.5px] text-text-3">
            {item.displayQuantity ? (
              <>
                {item.displayQuantity}
                {item.displayUnit ? ` ${item.displayUnit}` : ""}
              </>
            ) : (
              "to taste"
            )}
            {item.recipeCount > 1 && (
              <span className="text-[11px]">· {item.recipeCount} recipes</span>
            )}
          </span>
        )}
      </div>

      {item.recipeCount > 1 && (
        <Pill tone="default" className="text-[10.5px]">
          {item.recipeCount}×
        </Pill>
      )}
    </motion.div>
  );
}
```

- [ ] **Step 2: Build + dev verify**

Run:

```bash
cd frontend && npm run build && npm run dev
```

Expected: build 0. `/grocery` renders with aisle-grouped cards, circular checkboxes, olive-filled when checked.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/grocery/grocery-item.tsx
git commit -m "feat(frontend): editorial grocery row with circular check"
```

---

## Task 11: Restyle Recipes page (list + card)

**Why:** Recipes become a magazine-like cookbook — editorial header, search stub, filter chips (visual only for now), and a card row with generated hue tile + serif title + mono source.

**Files:**
- Modify: `frontend/src/components/recipes/recipe-list.tsx`
- Modify: `frontend/src/components/recipes/recipe-card.tsx`

- [ ] **Step 1: Rewrite `frontend/src/components/recipes/recipe-list.tsx`**

```tsx
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
```

Note: this file previously rendered `<AddRecipeDialog />` inline. The dialog now lives at `AppShell`, so it's removed from here.

- [ ] **Step 2: Rewrite `frontend/src/components/recipes/recipe-card.tsx`**

```tsx
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
```

- [ ] **Step 3: Build + dev verify**

Run:

```bash
cd frontend && npm run build && npm run dev
```

Expected: build 0. `/recipes` shows the editorial header, filter chips row, and cards with gradient tiles or thumbnails.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/recipes/recipe-list.tsx frontend/src/components/recipes/recipe-card.tsx
git commit -m "feat(frontend): editorial cookbook layout + recipe cards"
```

---

## Task 12: Redesign Add Recipe dialog (sheet + parsing + error states)

**Why:** The redesign treats add-recipe as a tall bottom-sheet with three states: idle (paste), parsing (animated chips + steps), and error (fallback options). We drive these states from the `useAddRecipe` mutation — no new fetches.

**Files:**
- Modify: `frontend/src/components/recipes/add-recipe-dialog.tsx`

- [ ] **Step 1: Rewrite `frontend/src/components/recipes/add-recipe-dialog.tsx`**

```tsx
import { useState } from "react";
import { toast } from "sonner";
import {
  Check,
  Image as ImageIcon,
  Link as LinkIcon,
  Mic,
  Share2,
  Sparkles,
  Wand2,
} from "lucide-react";

import { useAppStore } from "@/stores/app-store";
import { useAddRecipe } from "@/hooks/use-recipes";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Display } from "@/components/ui/display";
import { Pill } from "@/components/ui/pill";

const ALT_METHODS = [
  { icon: Share2, title: "Share sheet", sub: "From Safari, Instagram, Chrome" },
  { icon: Mic, title: "Voice add", sub: "\"Lasagna from NYT Cooking\"" },
  { icon: ImageIcon, title: "Snap cookbook", sub: "OCR a printed page" },
  { icon: Wand2, title: "Type raw", sub: "Paste ingredient text" },
];

const SAVED_SOURCES = ["NYT Cooking", "Smitten Kitchen", "Bon Appétit", "Food52", "Goop"];

const PARSING_STEPS = [
  "Fetched the page",
  "Spotted ingredients",
  "Matched to your pantry",
  "Grouping by aisle",
];

const PARSING_CHIPS = [
  "chicken thighs",
  "harissa paste",
  "lemon",
  "olive oil",
  "fennel seeds",
  "parsley",
];

export function AddRecipeDialog() {
  const { addRecipeDialogOpen, setAddRecipeDialogOpen } = useAppStore();
  const [url, setUrl] = useState("");
  const addRecipe = useAddRecipe();

  const isParsing = addRecipe.isPending;
  const errorMsg = addRecipe.error?.message;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    addRecipe.mutate(url.trim(), {
      onSuccess: (recipe) => {
        toast.success(`Added "${recipe.title}"`, {
          description: `${recipe.ingredients.length} ingredients from ${recipe.source_name}`,
        });
        setUrl("");
        addRecipe.reset();
        setAddRecipeDialogOpen(false);
      },
    });
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      addRecipe.reset();
      setUrl("");
    }
    setAddRecipeDialogOpen(open);
  };

  return (
    <Dialog open={addRecipeDialogOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto border-line bg-surface p-0 sm:max-w-md"
        showCloseButton={false}
      >
        {/* drag handle */}
        <div className="flex justify-center pt-2">
          <div className="h-1 w-10 rounded-full bg-line" />
        </div>

        {/* top bar */}
        <div className="flex items-center justify-between px-5 pt-2">
          <button
            type="button"
            onClick={() => handleClose(false)}
            className="text-sm font-medium text-text-2"
          >
            Cancel
          </button>
          <Eyebrow>Add a recipe</Eyebrow>
          <span className="w-12" aria-hidden />
        </div>

        {/* State: ERROR */}
        {errorMsg && !isParsing && (
          <ErrorState message={errorMsg} onRetry={() => addRecipe.reset()} />
        )}

        {/* State: PARSING */}
        {isParsing && <ParsingState url={url} />}

        {/* State: IDLE (paste form) */}
        {!errorMsg && !isParsing && (
          <form onSubmit={handleSubmit}>
            <div className="px-5 pt-5">
              {/* base-ui Dialog.Title doesn't support asChild — use a
                  visually-hidden title for a11y and render the Display separately. */}
              <DialogTitle className="sr-only">Add a recipe</DialogTitle>
              <DialogDescription className="sr-only">
                Paste a recipe URL — we'll extract ingredients for your list.
              </DialogDescription>
              <Display size="sm">
                Paste a link.
                <br />
                <em className="italic text-olive">We'll do the rest.</em>
              </Display>
            </div>

            {/* URL input */}
            <div className="px-5 pt-5">
              <div className="rounded-2xl border-[1.5px] border-olive bg-surface p-4 shadow-[0_0_0_4px_var(--accent-wash)]">
                <div className="flex items-center gap-2.5">
                  <LinkIcon className="h-4 w-4 text-olive" strokeWidth={1.6} />
                  <input
                    autoFocus
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://cooking.nytimes.com/recipes/…"
                    className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-text placeholder:text-text-3 focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-2.5 flex items-center gap-2.5 rounded-xl bg-accent-wash px-3.5 py-2.5 text-[13px] text-accent-ink">
                <Sparkles className="h-3.5 w-3.5" strokeWidth={1.6} />
                Paste any recipe URL — we'll fetch, parse, and roll it into your list.
              </div>
            </div>

            {/* Alt methods (visual only) */}
            <div className="px-5 pt-5">
              <Eyebrow>Or try another way</Eyebrow>
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                {ALT_METHODS.map(({ icon: Icon, title, sub }) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-line bg-surface-2 p-3.5 opacity-60"
                    aria-disabled="true"
                    title="Coming soon"
                  >
                    <Icon className="h-4 w-4 text-olive" strokeWidth={1.6} />
                    <div className="mt-2 text-sm font-semibold text-text">
                      {title}
                    </div>
                    <div className="mt-0.5 text-[11.5px] leading-tight text-text-3">
                      {sub}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Saved sources */}
            <div className="px-5 pt-4">
              <Eyebrow>Saved sources</Eyebrow>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {SAVED_SOURCES.map((s) => (
                  <Pill key={s}>{s}</Pill>
                ))}
                <Pill tone="ghost">+ add</Pill>
              </div>
            </div>

            {/* Submit */}
            <div className="mt-5 border-t border-line-2 bg-surface-2 px-5 py-4">
              <button
                type="submit"
                disabled={!url.trim() || addRecipe.isPending}
                className="w-full rounded-full bg-ink px-4 py-3 text-sm font-semibold text-paper transition-opacity disabled:opacity-40"
              >
                Add recipe
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ParsingState({ url }: { url: string }) {
  let host = "";
  try { host = new URL(url).host; } catch { host = ""; }

  return (
    <div>
      <div className="px-5 pt-5">
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3.5">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl text-xl"
            style={{
              background: "linear-gradient(135deg, hsl(28 45% 78%), hsl(28 45% 48%))",
            }}
          >
            🍗
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-3">
              {host || "fetching…"}
            </div>
            <div className="truncate text-[14.5px] font-semibold text-text">
              Reading the page…
            </div>
          </div>
          <div
            className="h-6 w-6 rounded-full border-2 border-line border-t-olive"
            style={{ animation: "spin 0.8s linear infinite" }}
          />
        </div>
      </div>

      <div className="px-6 pt-5 text-center">
        <Display size="sm">
          Finding the <em className="italic text-olive">good stuff</em>…
        </Display>
      </div>

      <div className="flex flex-wrap justify-center gap-2 px-5 pt-5">
        {PARSING_CHIPS.map((c, i) => (
          <span
            key={c}
            className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-2 text-[13px] font-medium text-text"
            style={{ animation: `fadeIn .3s ease ${i * 0.1}s both` }}
          >
            <Check className="h-3 w-3 text-olive" strokeWidth={2.5} />
            {c}
          </span>
        ))}
      </div>

      <div className="flex flex-col gap-3 px-6 py-6">
        {PARSING_STEPS.map((step, i) => {
          const done = i < PARSING_STEPS.length - 1;
          return (
            <div key={step} className="flex items-center gap-3 text-sm">
              <span
                className={
                  done
                    ? "flex h-[18px] w-[18px] items-center justify-center rounded-full bg-olive"
                    : "flex h-[18px] w-[18px] items-center justify-center rounded-full border-[1.5px] border-line"
                }
              >
                {done ? (
                  <Check className="h-3 w-3 text-paper" strokeWidth={3} />
                ) : (
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-text-3"
                    style={{ animation: "pulse 1s infinite" }}
                  />
                )}
              </span>
              <span className={done ? "text-text-2" : "text-text-3"}>
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div>
      <div className="px-5 pt-5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F4E4D3] px-2.5 py-1 text-[12px] font-medium text-[#8C4F20]">
          <span className="h-1.5 w-1.5 rounded-full bg-terracotta" />
          Couldn't auto-parse
        </span>
        <Display size="sm" className="mt-3">
          This one's <em className="italic">tricky</em>.
        </Display>
        <p className="mt-2 text-[15px] leading-relaxed text-text-2">
          {message}
        </p>
      </div>

      <div className="flex flex-col gap-4 px-5 py-5">
        <button
          type="button"
          onClick={onRetry}
          className="w-full rounded-full bg-ink px-4 py-3 text-sm font-semibold text-paper"
        >
          Try another link
        </button>
        <p className="text-center text-[12.5px] text-text-3">
          Direct-paste and OCR fallbacks are on the roadmap.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build + manually verify three states**

Run:

```bash
cd frontend && npm run build && npm run dev
```

Expected: build 0. Exercising the dialog:
- Idle: editorial heading, olive-ringed URL input, alt methods visibly "coming soon," saved sources chips.
- Parsing: enter a valid recipe URL → animated chips, spin ring, steps.
- Error: enter an invalid URL (e.g., `http://example.com/nothing`) → mutation fails → error state with message + "Try another link" CTA.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/recipes/add-recipe-dialog.tsx
git commit -m "feat(frontend): add-recipe dialog with parsing and error states"
```

---

## Task 13: Build the Home page

**Why:** `/` becomes the landing — greeting, paste hero, list summary card (dark), recent-recipes row. Uses the same `useRecipes` / `useGroceryList` queries so no new backend work.

**Files:**
- Modify: `frontend/src/pages/home-page.tsx`

- [ ] **Step 1: Rewrite `frontend/src/pages/home-page.tsx`**

```tsx
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
```

- [ ] **Step 2: Build + dev verify**

Run:

```bash
cd frontend && npm run build && npm run dev
```

Expected: build 0. `/` shows greeting + two-column hero + horizontal recipes rail. Clicking the dark card navigates to `/grocery`. Clicking a recipe tile navigates to `/recipes`.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/home-page.tsx
git commit -m "feat(frontend): home page with greeting, paste hero, list summary"
```

---

## Task 14: End-to-end verification

**Why:** Confirm every screen in scope matches the redesign reference before declaring done.

**Files:** none modified.

- [ ] **Step 1: Full build + lint**

Run (in parallel):

```bash
cd frontend && npm run build
cd frontend && npm run lint
```

Expected: build exits 0; lint exits 0 (or with pre-existing warnings only — not new errors from this plan).

- [ ] **Step 2: Start backend + frontend and walk every surface**

Run in one terminal (backend):

```bash
cd backend && mix phx.server
```

And in another (frontend):

```bash
cd frontend && npm run dev
```

Walk through, comparing side-by-side against the HTML reference at `/Users/challa/Downloads/list-it/project/List It Redesign.html`:

| Route | Redesign screen | What to verify |
|---|---|---|
| `/` (desktop) | 11 (desktop) + 02 (home) | Sidebar left, "List It." serif logo, nav items, "Paste recipe" pill, saved sources. Main area: greeting, two-card row (paste hero + dark list summary), recipes rail. |
| `/` (mobile) | 02 | Stacked greeting, paste card, dark list summary, recipes rail. Bottom tabs: Home / List / Recipes. |
| `/recipes` | 07 | Editorial header + search stub + filter chips. Hero cards with gradient tile, serif title, mono source, info pills. |
| `/grocery` | 06 | Editorial header, progress bar + counter, grouping toggle (Aisle / Recipe / A–Z), unit toggle. Aisle-grouped cards with circular check, serif-adjacent names, mono quantities. |
| Add recipe (idle) | 03 | Bottom-sheet-style dialog, drag handle, "Paste a link. We'll do the rest.", olive-ringed URL field, alt methods grid (dimmed), saved sources. |
| Add recipe (parsing) | 04 | Animated chips fade in, spinning olive ring, step checklist. |
| Add recipe (error) | 05 | "Couldn't auto-parse" pill, error message, Try-another-link button. |

- [ ] **Step 3: Report any mismatches**

If a screen diverges from the redesign and the divergence isn't covered by the "Deferred" scope list at the top of this plan, create a follow-up task (not in this plan). Do **not** extend this plan's scope silently.

- [ ] **Step 4: Clean commit log check**

Run:

```bash
git log --oneline main..HEAD
```

Expected: ~13 commits, each a single logical unit. Squash is optional; keep individual commits if reviewers want to step through.

---

## Known trade-offs and follow-ups

- **Aisle classifier is a heuristic.** Wrong for things like "butter lettuce" (dairy → produce) or "peanut butter" (pantry correctly, but close call). Replace with a backend-side classifier or an `aisle` column on `ingredient.ex` when that model work happens.
- **Filter chips on `/recipes` are visual-only.** We don't store "quick", "kid-approved", "vegetarian" metadata. Wire them when we have either user-assigned tags or a structured data extract from the scraper.
- **Grocery grouping mode = "Recipe" is not implemented.** `/api/grocery` currently aggregates across recipes; restoring the per-item recipe breakdown requires either extending that endpoint or issuing a second fetch.
- **Pantry dim is skipped.** Rows look identical whether or not the user "has" something. Add a `pantry` schema + toggle on grocery rows in a future plan.
- **Dark mode tokens exist** (`[data-mode="dark"]` on `<html>`) but no UI toggle. Add a toggle later — low risk, high delight.
- **"Add recipe" alt methods (share / voice / OCR / raw paste) are visible but disabled.** They communicate roadmap; each one is its own product slice.
