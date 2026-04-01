# ListIt — Meal Planning & Grocery Shopping App Design Spec

## Overview

ListIt is a web app that helps users plan grocery shopping based on recipes they'll cook during the week. Users paste recipe URLs, the app scrapes and parses ingredients, and aggregates them into a unified grocery list with intelligent unit conversion.

**Out of scope:** User management, authentication, multiple grocery lists.

---

## Architecture

Monorepo with two subdirectories — `backend/` (Phoenix JSON API) and `frontend/` (React SPA). Postgres 18 runs in Docker Compose. Backend and frontend run natively on the host. Vite proxies `/api` requests to Phoenix in development.

### Tech Stack

**Backend:**
- Elixir 1.18+ / Erlang 27+ (installed via Homebrew)
- Phoenix 1.8+ (API-only — no HTML, LiveView, Mailer, or Dashboard)
- Ecto with Postgres
- Req (HTTP client for recipe scraping)
- Floki (HTML parsing for JSON-LD extraction)
- Jason (JSON encoding/decoding)

**Frontend:**
- React 19, TypeScript, Vite
- Tailwind CSS v4
- shadcn/ui (New York style, zinc palette, CSS variables)
- Zustand (UI state — unit preference, dialog state, mobile view toggle)
- TanStack Query (server state — recipes, grocery list)
- Framer Motion (list enter/exit animations)
- Lucide React (icons)
- Sonner (toast notifications)
- React Router v7

**Infrastructure:**
- Docker Compose: Postgres 18 only
- Root Makefile + backend Makefile + frontend Makefile
- No one-off commands — all management tasks through Make

---

## Data Model

### recipes

| Column      | Type         | Notes                     |
|-------------|--------------|---------------------------|
| id          | uuid (PK)    | auto-generated            |
| title       | text         | not null                  |
| url         | text         | not null, unique          |
| source_name | text         | domain extracted from URL |
| image_url   | text         | nullable                  |
| servings    | text         | nullable, free-text       |
| prep_time   | text         | nullable, ISO 8601        |
| cook_time   | text         | nullable, ISO 8601        |
| inserted_at | utc_datetime | not null                  |
| updated_at  | utc_datetime | not null                  |

### ingredients

| Column      | Type         | Notes                                         |
|-------------|--------------|-----------------------------------------------|
| id          | uuid (PK)    | auto-generated                                |
| recipe_id   | uuid (FK)    | references recipes, on_delete: cascade        |
| raw_text    | text         | not null, original string from recipe         |
| name        | text         | not null, normalized (lowercase, trimmed)     |
| quantity    | float        | nullable (some ingredients have no qty)       |
| unit        | text         | nullable, normalized to canonical form        |
| inserted_at | utc_datetime | not null                                      |

### checked_items

| Column      | Type         | Notes                          |
|-------------|--------------|--------------------------------|
| id          | uuid (PK)    | auto-generated                 |
| name        | text         | not null, unique, normalized   |
| checked     | boolean      | not null, default false        |
| inserted_at | utc_datetime | not null                       |
| updated_at  | utc_datetime | not null                       |

### Relationships

- Recipe has many Ingredients (cascade delete)
- CheckedItem is keyed by normalized ingredient name, independent of recipe
- Units stored in canonical form; conversion happens at display time on the frontend

---

## API Endpoints

```
GET    /api/recipes              → list all recipes with ingredients
POST   /api/recipes              → {url: "..."} → scrape, parse, create recipe + ingredients
DELETE /api/recipes/:id          → delete recipe (cascade deletes ingredients)
GET    /api/grocery              → aggregated grocery list
PUT    /api/grocery/check        → {name: "...", checked: true/false} → toggle check
DELETE /api/grocery/checked      → clear all checked state
```

### POST /api/recipes — Response

```json
{
  "data": {
    "id": "uuid",
    "title": "Chicken Tikka Masala",
    "url": "https://...",
    "source_name": "allrecipes.com",
    "image_url": "https://...",
    "servings": "6",
    "prep_time": "PT20M",
    "cook_time": "PT40M",
    "ingredients": [
      {"id": "uuid", "raw_text": "2 cups basmati rice", "name": "basmati rice", "quantity": 2.0, "unit": "cup"}
    ],
    "inserted_at": "2026-04-01T..."
  }
}
```

### GET /api/grocery — Response

```json
{
  "data": [
    {"name": "basmati rice", "quantity": 4.0, "unit": "cup", "checked": false, "recipe_count": 2},
    {"name": "salt", "quantity": null, "unit": null, "checked": false, "recipe_count": 3}
  ]
}
```

Quantities returned in canonical stored units. Frontend handles conversion to user's preferred system.

### Error Response Shape

```json
{"errors": {"detail": "No recipe data found on this page"}}
```

---

## Recipe Scraping

JSON-LD only. No fallback to Microdata, RDFa, or heuristic HTML scraping.

**Pipeline:**
1. Fetch URL with browser-like headers (User-Agent, Accept, etc.), follow redirects (up to 5), 15s timeout
2. Parse HTML with Floki
3. Find all `<script type="application/ld+json">` tags
4. Decode each as JSON, search for `@type: "Recipe"` — handle arrays, `@graph` wrappers, and mixed type lists
5. Extract: `name`, `image`, `recipeIngredient`, `recipeYield`, `prepTime`, `cookTime`
6. Extract domain from URL as `source_name`
7. If no Recipe JSON-LD found → `{:error, "No recipe data found on this page"}`

---

## Ingredient Parsing

Parses strings like "2 1/2 cups all-purpose flour" → `{quantity: 2.5, unit: "cup", name: "all-purpose flour"}`.

**Pipeline:**
1. Strip HTML tags
2. Remove parenthetical weight annotations like "(14 oz)"
3. Replace Unicode fractions (½→0.5, ⅓→0.333, ¼→0.25, ¾→0.75, etc.)
4. Extract quantity: mixed number ("1 1/2") → simple fraction ("1/2") → decimal/integer
5. Extract unit: match against known lookup table (60+ entries), multi-word units first ("fluid ounce", "fl oz")
6. Remaining text = ingredient name: lowercase, trim, remove trailing punctuation, collapse whitespace
7. Fallback: if nothing parsed, entire string becomes name with null quantity/unit

**Unit lookup table covers:** cup(s), tablespoon(s)/tbsp, teaspoon(s)/tsp, fl oz, ml, liter(s), pint(s), quart(s), gallon(s), oz/ounce(s), lb(s)/pound(s), g/gram(s), kg/kilogram(s), can(s), jar(s), bunch(es), clove(s), slice(s), piece(s), stick(s), sprig(s), head(s), pinch, dash, handful, large, medium, small, package(s)/pkg, bag(s), box(es).

---

## Unit Conversion System

Client-side only. The API returns quantities in canonical stored units. The frontend converts for display based on user preference.

### Conversion Factor Tables

**Volume (base: ml):** tsp=4.929, tbsp=14.787, fl oz=29.574, cup=236.588, pint=473.176, quart=946.353, liter=1000, gallon=3785.41

**Weight (base: g):** oz=28.3495, lb=453.592, kg=1000

### Unit Categories

- **Volume:** tsp, tbsp, cup, fl oz, ml, liter, pint, quart, gallon
- **Weight:** oz, lb, g, kg
- **Other (no conversion):** can, jar, bunch, clove, slice, piece, stick, sprig, head, pinch, dash, handful, large, medium, small, package, bag, box

### Conversion Algorithm

1. Look up item's unit category (volume, weight, other)
2. If "other" — display as-is, aggregate only on exact unit match
3. Convert quantity to base unit (ml or g)
4. Based on user preference, select target unit set:
   - Imperial volume: tsp, tbsp, cup, pint, quart, gallon
   - Imperial weight: oz, lb
   - Metric volume: ml, liter
   - Metric weight: g, kg
5. Pick the largest target unit where the converted value >= 1
6. Round: whole numbers if >= 10, one decimal if >= 1, two decimals otherwise

### Cross-Recipe Aggregation with Conversion

When multiple grocery rows share the same ingredient name with different but convertible units:
1. Group by ingredient name
2. Convert all quantities to base unit
3. Sum
4. Convert total to user's preferred display unit

Items with incompatible units for the same name remain separate line items.

### User Preference

Stored in Zustand with localStorage persistence. Toggle in the grocery list header (Imperial/Metric segmented control). Defaults to Imperial. Switching re-renders instantly without API refetch.

---

## Frontend UI

**Theme:** Light mode only. shadcn/ui New York style, zinc color palette, CSS variables.

### Layout

Two-panel side-by-side on desktop: recipes (~60% width) left, grocery list (~40% width, fixed 420px) right. Max-width 7xl container, centered. On mobile, a tab toggle bar switches between the two views.

### Header

App name "ListIt" with subtitle. Clean, minimal.

### Recipe Panel

- **Heading:** "My Recipes" with recipe count, "Add Recipe" button
- **Add Recipe Dialog:** shadcn Dialog, URL text input, submit button, loading spinner during scrape, toast on success/error, auto-close on success
- **Recipe Cards:** Title, source domain, image (if available), ingredient count badge, prep/cook time. Delete button with confirmation. Framer Motion enter/exit animations.
- **Empty state:** Dashed border box with icon, encouraging text, "Add Your First Recipe" button
- **Loading state:** 3 skeleton cards

### Grocery List Panel

- **Heading:** "Grocery List" with checked/total count, Reset button (visible when items checked)
- **Unit toggle:** Imperial/Metric segmented control
- **Progress bar:** Visual checked-off progress
- **Grocery items:** Checkbox, name, formatted quantity+unit (converted per preference), recipe count badge. Checked items get strikethrough + reduced opacity. Framer Motion animations.
- **Sections:** Unchecked items, separator, checked items below
- **"All done" banner:** Displayed when all items checked
- **Empty state:** Prompt explaining items appear as recipes are added
- **Loading state:** 5 skeleton rows

---

## File Structure

```
~/code/caitlin_decodes/list_it/
├── Makefile
├── docker-compose.yml
├── .gitignore
├── backend/
│   ├── Makefile
│   ├── mix.exs
│   ├── .formatter.exs
│   ├── config/
│   │   ├── config.exs
│   │   ├── dev.exs
│   │   ├── test.exs
│   │   └── runtime.exs
│   ├── lib/
│   │   ├── list_it/
│   │   │   ├── application.ex
│   │   │   ├── repo.ex
│   │   │   ├── recipes.ex
│   │   │   ├── recipes/
│   │   │   │   ├── recipe.ex
│   │   │   │   └── ingredient.ex
│   │   │   ├── grocery.ex
│   │   │   ├── grocery/
│   │   │   │   └── checked_item.ex
│   │   │   └── parser/
│   │   │       ├── scraper.ex
│   │   │       └── ingredient_parser.ex
│   │   └── list_it_web/
│   │       ├── endpoint.ex
│   │       ├── router.ex
│   │       └── controllers/
│   │           ├── fallback_controller.ex
│   │           ├── recipe_controller.ex
│   │           ├── recipe_json.ex
│   │           ├── grocery_controller.ex
│   │           └── grocery_json.ex
│   ├── priv/repo/migrations/
│   │   ├── *_create_recipes.exs
│   │   ├── *_create_ingredients.exs
│   │   └── *_create_checked_items.exs
│   └── test/
│       ├── test_helper.exs
│       ├── support/
│       │   ├── conn_case.ex
│       │   └── data_case.ex
│       ├── list_it/
│       │   ├── recipes_test.exs
│       │   ├── grocery_test.exs
│       │   └── parser/
│       │       ├── scraper_test.exs
│       │       └── ingredient_parser_test.exs
│       └── list_it_web/controllers/
│           ├── recipe_controller_test.exs
│           └── grocery_controller_test.exs
├── frontend/
│   ├── Makefile
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   ├── eslint.config.js
│   ├── index.html
│   ├── components.json
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css
│       ├── lib/
│       │   ├── utils.ts
│       │   └── unit-conversion.ts
│       ├── api/
│       │   └── client.ts
│       ├── types/
│       │   └── index.ts
│       ├── stores/
│       │   └── app-store.ts
│       ├── hooks/
│       │   ├── use-recipes.ts
│       │   └── use-grocery.ts
│       └── components/
│           ├── ui/
│           ├── layout/
│           │   ├── header.tsx
│           │   └── app-shell.tsx
│           ├── recipes/
│           │   ├── add-recipe-dialog.tsx
│           │   ├── recipe-card.tsx
│           │   └── recipe-list.tsx
│           └── grocery/
│               ├── grocery-item.tsx
│               └── grocery-list.tsx
└── docs/
```
