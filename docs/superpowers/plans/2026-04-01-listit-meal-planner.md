# ListIt — Meal Planning & Grocery Shopping App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a web app where users paste recipe URLs, the app extracts ingredients via JSON-LD scraping, and aggregates them into a unified grocery list with metric/imperial unit conversion.

**Architecture:** Phoenix JSON API backend handles recipe URL scraping (JSON-LD schema.org parsing), ingredient text parsing (regex-based), and ingredient aggregation. React SPA frontend with a two-panel layout (recipes + grocery list) and client-side unit conversion. Single grocery list — no auth, no users, no multi-list support. Docker Compose runs Postgres 18; Makefiles manage all commands.

**Tech Stack:**
- Backend: Elixir 1.19+, Phoenix 1.8+ (API-only), Ecto, Req (HTTP), Floki (HTML parsing), Jason
- Frontend: React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui, Zustand, TanStack Query, React Router v7, Framer Motion, Lucide Icons, Sonner (toasts)
- Infrastructure: Postgres 18 (Docker), Docker Compose, Make

**Runtimes already installed:** Elixir 1.19.5, Erlang/OTP 28, Node 24.6.0, npm 11.5.1, Docker 27.5.1, Docker Compose v2.32.4, Homebrew 5.1.3

---

## File Structure

```
~/code/caitlin_decodes/list_it/
├── Makefile                          # Root orchestration
├── docker-compose.yml                # Postgres 18
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
│           ├── ui/                   # shadcn (auto-generated)
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

---

## Task 1: Project Init — .gitignore, Docker Compose, Root Makefile

**Files:**
- Create: `.gitignore`
- Create: `docker-compose.yml`
- Create: `Makefile`

- [ ] **Step 1: Create .gitignore**

Create `~/code/caitlin_decodes/list_it/.gitignore`:

```gitignore
# Elixir
backend/_build/
backend/deps/
backend/*.ez
backend/.elixir_ls/

# Node
frontend/node_modules/
frontend/dist/
frontend/.vite/

# Docker
docker-data/

# OS
.DS_Store
*.swp

# Env
.env
.env.local
```

- [ ] **Step 2: Create docker-compose.yml**

Create `~/code/caitlin_decodes/list_it/docker-compose.yml`:

```yaml
services:
  db:
    image: postgres:18
    restart: unless-stopped
    environment:
      POSTGRES_USER: list_it
      POSTGRES_PASSWORD: list_it_dev
      POSTGRES_DB: list_it_dev
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U list_it"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

- [ ] **Step 3: Create root Makefile**

Create `~/code/caitlin_decodes/list_it/Makefile`:

```makefile
.PHONY: setup start stop test clean db-reset db-up

db-up: ## Start Postgres
	docker compose up -d db
	@echo "Waiting for Postgres to be healthy..."
	@until docker compose exec db pg_isready -U list_it > /dev/null 2>&1; do sleep 1; done
	@echo "Postgres is ready."

setup: db-up ## Install deps and set up databases
	cd backend && make setup
	cd frontend && make setup

start: db-up ## Start all services (backend + frontend)
	cd backend && make server &
	cd frontend && make dev

stop: ## Stop all services
	docker compose down
	-pkill -f "mix phx.server" 2>/dev/null
	-pkill -f "vite" 2>/dev/null

test: db-up ## Run all tests
	cd backend && make test

clean: ## Clean build artifacts
	cd backend && rm -rf _build deps
	cd frontend && rm -rf node_modules dist

db-reset: db-up ## Reset database
	cd backend && mix ecto.reset
```

- [ ] **Step 4: Verify Postgres starts**

```bash
cd ~/code/caitlin_decodes/list_it && make db-up
```

Expected: "Postgres is ready."

- [ ] **Step 5: Commit**

```bash
cd ~/code/caitlin_decodes/list_it
git add .gitignore docker-compose.yml Makefile
git commit -m "chore: add gitignore, Docker Compose with Postgres 18, root Makefile"
```

---

## Task 2: Phoenix Backend Scaffold

**Files:**
- Create: entire `backend/` directory via `mix phx.new`
- Modify: `backend/mix.exs` (add deps)
- Modify: `backend/config/dev.exs` (DB connection)
- Modify: `backend/config/test.exs` (DB connection)
- Modify: `backend/lib/list_it_web/endpoint.ex` (CORS)
- Create: `backend/Makefile`

- [ ] **Step 1: Install Phoenix project generator**

```bash
mix local.hex --force && mix local.rebar --force
mix archive.install hex phx_new --force
```

- [ ] **Step 2: Generate Phoenix API project**

```bash
cd ~/code/caitlin_decodes/list_it
mix phx.new backend --app list_it --no-html --no-assets --no-live --no-mailer --no-dashboard --binary-id
```

When prompted "Fetch and install dependencies?", answer `Y`.

- [ ] **Step 3: Add dependencies to mix.exs**

In `backend/mix.exs`, replace the `deps` function with:

```elixir
defp deps do
  [
    {:phoenix, "~> 1.8.5"},
    {:phoenix_ecto, "~> 4.5"},
    {:ecto_sql, "~> 3.13"},
    {:postgrex, ">= 0.0.0"},
    {:telemetry_metrics, "~> 1.0"},
    {:telemetry_poller, "~> 1.0"},
    {:gettext, "~> 1.0"},
    {:jason, "~> 1.2"},
    {:dns_cluster, "~> 0.2.0"},
    {:bandit, "~> 1.5"},
    {:req, "~> 0.5"},
    {:floki, "~> 0.37"},
    {:cors_plug, "~> 3.0"}
  ]
end
```

- [ ] **Step 4: Configure database in dev.exs**

In `backend/config/dev.exs`, replace the Repo config block with:

```elixir
config :list_it, ListIt.Repo,
  username: "list_it",
  password: "list_it_dev",
  hostname: "localhost",
  database: "list_it_dev",
  stacktrace: true,
  show_sensitive_data_on_connection_error: true,
  pool_size: 10
```

- [ ] **Step 5: Configure database in test.exs**

In `backend/config/test.exs`, replace the Repo config block with:

```elixir
config :list_it, ListIt.Repo,
  username: "list_it",
  password: "list_it_dev",
  hostname: "localhost",
  database: "list_it_test#{System.get_env("MIX_TEST_PARTITION")}",
  pool: Ecto.Adapters.SQL.Sandbox,
  pool_size: 10
```

- [ ] **Step 6: Add CORS plug to endpoint**

In `backend/lib/list_it_web/endpoint.ex`, add this line **before** `plug ListItWeb.Router`:

```elixir
plug CORSPlug, origin: ["http://localhost:5173"]
```

- [ ] **Step 7: Create backend Makefile**

Create `backend/Makefile`:

```makefile
.PHONY: deps setup server test migrate rollback format

deps:
	mix deps.get

setup: deps
	mix ecto.create
	mix ecto.migrate

server:
	mix phx.server

test:
	mix test

migrate:
	mix ecto.migrate

rollback:
	mix ecto.rollback

format:
	mix format
```

- [ ] **Step 8: Install deps and verify compilation**

```bash
cd ~/code/caitlin_decodes/list_it/backend && mix deps.get && mix compile
```

Expected: Compilation succeeds with no errors.

- [ ] **Step 9: Create database and run existing tests**

```bash
cd ~/code/caitlin_decodes/list_it/backend && mix ecto.create && mix test
```

Expected: Database created, default tests pass.

- [ ] **Step 10: Commit**

```bash
cd ~/code/caitlin_decodes/list_it
git add backend/ .gitignore
git commit -m "feat: scaffold Phoenix API backend with Req, Floki, CORS deps"
```

---

## Task 3: Database Migrations

**Files:**
- Create: `backend/priv/repo/migrations/*_create_recipes.exs`
- Create: `backend/priv/repo/migrations/*_create_ingredients.exs`
- Create: `backend/priv/repo/migrations/*_create_checked_items.exs`

- [ ] **Step 1: Generate migration files**

```bash
cd ~/code/caitlin_decodes/list_it/backend
mix ecto.gen.migration create_recipes
mix ecto.gen.migration create_ingredients
mix ecto.gen.migration create_checked_items
```

- [ ] **Step 2: Write recipes migration**

Replace the contents of the generated `*_create_recipes.exs` file:

```elixir
defmodule ListIt.Repo.Migrations.CreateRecipes do
  use Ecto.Migration

  def change do
    create table(:recipes, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :title, :text, null: false
      add :url, :text, null: false
      add :source_name, :text
      add :image_url, :text
      add :servings, :text
      add :prep_time, :text
      add :cook_time, :text
      timestamps(type: :utc_datetime)
    end

    create unique_index(:recipes, [:url])
  end
end
```

- [ ] **Step 3: Write ingredients migration**

Replace the contents of the generated `*_create_ingredients.exs` file:

```elixir
defmodule ListIt.Repo.Migrations.CreateIngredients do
  use Ecto.Migration

  def change do
    create table(:ingredients, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :recipe_id, references(:recipes, type: :binary_id, on_delete: :delete_all), null: false
      add :raw_text, :text, null: false
      add :name, :text, null: false
      add :quantity, :float
      add :unit, :text

      add :inserted_at, :utc_datetime, null: false, default: fragment("now()")
    end

    create index(:ingredients, [:recipe_id])
    create index(:ingredients, [:name])
  end
end
```

- [ ] **Step 4: Write checked_items migration**

Replace the contents of the generated `*_create_checked_items.exs` file:

```elixir
defmodule ListIt.Repo.Migrations.CreateCheckedItems do
  use Ecto.Migration

  def change do
    create table(:checked_items, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :name, :text, null: false
      add :checked, :boolean, null: false, default: false
      timestamps(type: :utc_datetime)
    end

    create unique_index(:checked_items, [:name])
  end
end
```

- [ ] **Step 5: Run migrations**

```bash
cd ~/code/caitlin_decodes/list_it/backend && mix ecto.migrate
```

Expected: 3 migrations run successfully.

- [ ] **Step 6: Verify by checking database tables**

```bash
cd ~/code/caitlin_decodes/list_it/backend && mix run -e "ListIt.Repo.query!(\"SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'\") |> Map.get(:rows) |> IO.inspect()"
```

Expected: Output includes `["recipes"]`, `["ingredients"]`, `["checked_items"]`, `["schema_migrations"]`.

- [ ] **Step 7: Commit**

```bash
cd ~/code/caitlin_decodes/list_it
git add backend/priv/repo/migrations/
git commit -m "feat: add database migrations for recipes, ingredients, checked_items"
```

---

## Task 4: Ecto Schemas

**Files:**
- Create: `backend/lib/list_it/recipes/recipe.ex`
- Create: `backend/lib/list_it/recipes/ingredient.ex`
- Create: `backend/lib/list_it/grocery/checked_item.ex`

- [ ] **Step 1: Create Recipe schema**

Create `backend/lib/list_it/recipes/recipe.ex`:

```elixir
defmodule ListIt.Recipes.Recipe do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "recipes" do
    field :title, :string
    field :url, :string
    field :source_name, :string
    field :image_url, :string
    field :servings, :string
    field :prep_time, :string
    field :cook_time, :string
    has_many :ingredients, ListIt.Recipes.Ingredient
    timestamps(type: :utc_datetime)
  end

  def changeset(recipe, attrs) do
    recipe
    |> cast(attrs, [:title, :url, :source_name, :image_url, :servings, :prep_time, :cook_time])
    |> validate_required([:title, :url])
    |> unique_constraint(:url)
  end
end
```

- [ ] **Step 2: Create Ingredient schema**

Create `backend/lib/list_it/recipes/ingredient.ex`:

```elixir
defmodule ListIt.Recipes.Ingredient do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "ingredients" do
    field :raw_text, :string
    field :name, :string
    field :quantity, :float
    field :unit, :string
    belongs_to :recipe, ListIt.Recipes.Recipe

    field :inserted_at, :utc_datetime, read_after_writes: true
  end

  def changeset(ingredient, attrs) do
    ingredient
    |> cast(attrs, [:raw_text, :name, :quantity, :unit, :recipe_id])
    |> validate_required([:raw_text, :name, :recipe_id])
    |> foreign_key_constraint(:recipe_id)
  end
end
```

- [ ] **Step 3: Create CheckedItem schema**

Create `backend/lib/list_it/grocery/checked_item.ex`:

```elixir
defmodule ListIt.Grocery.CheckedItem do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "checked_items" do
    field :name, :string
    field :checked, :boolean, default: false
    timestamps(type: :utc_datetime)
  end

  def changeset(checked_item, attrs) do
    checked_item
    |> cast(attrs, [:name, :checked])
    |> validate_required([:name, :checked])
    |> unique_constraint(:name)
  end
end
```

- [ ] **Step 4: Verify compilation**

```bash
cd ~/code/caitlin_decodes/list_it/backend && mix compile
```

Expected: Compiles with no errors.

- [ ] **Step 5: Commit**

```bash
cd ~/code/caitlin_decodes/list_it
git add backend/lib/list_it/recipes/ backend/lib/list_it/grocery/
git commit -m "feat: add Ecto schemas for Recipe, Ingredient, CheckedItem"
```

---

## Task 5: Ingredient Parser

**Files:**
- Create: `backend/lib/list_it/parser/ingredient_parser.ex`
- Create: `backend/test/list_it/parser/ingredient_parser_test.exs`

- [ ] **Step 1: Write ingredient parser tests**

Create `backend/test/list_it/parser/ingredient_parser_test.exs`:

```elixir
defmodule ListIt.Parser.IngredientParserTest do
  use ExUnit.Case, async: true

  alias ListIt.Parser.IngredientParser

  describe "parse/1" do
    test "simple quantity and unit" do
      result = IngredientParser.parse("2 cups flour")
      assert result.quantity == 2.0
      assert result.unit == "cup"
      assert result.name == "flour"
      assert result.raw_text == "2 cups flour"
    end

    test "simple fraction" do
      result = IngredientParser.parse("1/2 teaspoon salt")
      assert result.quantity == 0.5
      assert result.unit == "tsp"
      assert result.name == "salt"
    end

    test "mixed number" do
      result = IngredientParser.parse("1 1/2 cups sugar")
      assert result.quantity == 1.5
      assert result.unit == "cup"
      assert result.name == "sugar"
    end

    test "no quantity — freeform text" do
      result = IngredientParser.parse("salt and pepper to taste")
      assert result.quantity == nil
      assert result.unit == nil
      assert result.name == "salt and pepper to taste"
    end

    test "parenthetical ounce annotation stripped" do
      result = IngredientParser.parse("1 (14 oz) can tomatoes")
      assert result.quantity == 1.0
      assert result.unit == "can"
      assert result.name == "tomatoes"
    end

    test "unicode fraction standalone" do
      result = IngredientParser.parse("½ cup milk")
      assert result.quantity == 0.5
      assert result.unit == "cup"
      assert result.name == "milk"
    end

    test "unicode fraction attached to whole number" do
      result = IngredientParser.parse("1½ cups cream")
      assert result.quantity == 1.5
      assert result.unit == "cup"
      assert result.name == "cream"
    end

    test "decimal quantity" do
      result = IngredientParser.parse("2.5 oz cheddar cheese")
      assert result.quantity == 2.5
      assert result.unit == "oz"
      assert result.name == "cheddar cheese"
    end

    test "plural unit normalized to singular" do
      result = IngredientParser.parse("3 tablespoons butter")
      assert result.quantity == 3.0
      assert result.unit == "tbsp"
      assert result.name == "butter"
    end

    test "weight unit" do
      result = IngredientParser.parse("1 pound ground beef")
      assert result.quantity == 1.0
      assert result.unit == "lb"
      assert result.name == "ground beef"
    end

    test "metric unit" do
      result = IngredientParser.parse("500 grams chicken breast")
      assert result.quantity == 500.0
      assert result.unit == "g"
      assert result.name == "chicken breast"
    end

    test "multi-word unit" do
      result = IngredientParser.parse("2 fluid ounces cream")
      assert result.quantity == 2.0
      assert result.unit == "fl oz"
      assert result.name == "cream"
    end

    test "count unit" do
      result = IngredientParser.parse("3 cloves garlic")
      assert result.quantity == 3.0
      assert result.unit == "clove"
      assert result.name == "garlic"
    end

    test "quantity only, no unit" do
      result = IngredientParser.parse("4 eggs")
      assert result.quantity == 4.0
      assert result.unit == nil
      assert result.name == "eggs"
    end

    test "HTML tags stripped" do
      result = IngredientParser.parse("<b>2 cups</b> <i>flour</i>")
      assert result.quantity == 2.0
      assert result.unit == "cup"
      assert result.name == "flour"
    end

    test "trailing punctuation removed from name" do
      result = IngredientParser.parse("1 cup rice,")
      assert result.quantity == 1.0
      assert result.unit == "cup"
      assert result.name == "rice"
    end

    test "three-quarter unicode fraction" do
      result = IngredientParser.parse("¾ teaspoon cinnamon")
      assert result.quantity == 0.75
      assert result.unit == "tsp"
      assert result.name == "cinnamon"
    end
  end
end
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd ~/code/caitlin_decodes/list_it/backend && mix test test/list_it/parser/ingredient_parser_test.exs
```

Expected: All tests fail with `module ListIt.Parser.IngredientParser is not available`.

- [ ] **Step 3: Implement ingredient parser**

Create `backend/lib/list_it/parser/ingredient_parser.ex`:

```elixir
defmodule ListIt.Parser.IngredientParser do
  @moduledoc """
  Parses ingredient strings like "2 1/2 cups all-purpose flour" into structured data.
  """

  @units %{
    # Volume
    "cup" => "cup", "cups" => "cup", "c" => "cup",
    "tablespoon" => "tbsp", "tablespoons" => "tbsp", "tbsp" => "tbsp", "tbs" => "tbsp", "tb" => "tbsp",
    "teaspoon" => "tsp", "teaspoons" => "tsp", "tsp" => "tsp",
    "fluid ounce" => "fl oz", "fluid ounces" => "fl oz", "fl oz" => "fl oz",
    "milliliter" => "ml", "milliliters" => "ml", "ml" => "ml",
    "liter" => "liter", "liters" => "liter", "l" => "liter",
    "gallon" => "gallon", "gallons" => "gallon",
    "quart" => "quart", "quarts" => "quart", "qt" => "quart",
    "pint" => "pint", "pints" => "pint", "pt" => "pint",
    # Weight
    "ounce" => "oz", "ounces" => "oz", "oz" => "oz",
    "pound" => "lb", "pounds" => "lb", "lb" => "lb", "lbs" => "lb",
    "gram" => "g", "grams" => "g", "g" => "g",
    "kilogram" => "kg", "kilograms" => "kg", "kg" => "kg",
    # Count/packaging
    "can" => "can", "cans" => "can",
    "jar" => "jar", "jars" => "jar",
    "package" => "package", "packages" => "package", "pkg" => "package",
    "bag" => "bag", "bags" => "bag",
    "box" => "box", "boxes" => "box",
    "bunch" => "bunch", "bunches" => "bunch",
    "head" => "head", "heads" => "head",
    "clove" => "clove", "cloves" => "clove",
    "slice" => "slice", "slices" => "slice",
    "piece" => "piece", "pieces" => "piece",
    "stick" => "stick", "sticks" => "stick",
    "sprig" => "sprig", "sprigs" => "sprig",
    "pinch" => "pinch", "dash" => "dash", "handful" => "handful",
    "large" => "large", "medium" => "medium", "small" => "small"
  }

  @unicode_fractions %{
    "½" => 0.5, "⅓" => 0.333, "⅔" => 0.667,
    "¼" => 0.25, "¾" => 0.75,
    "⅕" => 0.2, "⅖" => 0.4, "⅗" => 0.6, "⅘" => 0.8,
    "⅙" => 0.167, "⅚" => 0.833,
    "⅛" => 0.125, "⅜" => 0.375, "⅝" => 0.625, "⅞" => 0.875
  }

  @type parsed :: %{
          name: String.t(),
          quantity: float() | nil,
          unit: String.t() | nil,
          raw_text: String.t()
        }

  @spec parse(String.t()) :: parsed()
  def parse(text) when is_binary(text) do
    raw_text = text
    text = clean(text)

    {quantity, text} = extract_quantity(text)
    {unit, text} = extract_unit(text)
    name = normalize_name(text)

    %{
      name: name,
      quantity: quantity,
      unit: unit,
      raw_text: raw_text
    }
  end

  defp clean(text) do
    text
    |> String.replace(~r/<[^>]+>/, "")
    |> String.replace(~r/\([^)]*oz[^)]*\)/, "")
    |> String.replace(~r/\([^)]*ounce[^)]*\)/, "")
    |> String.trim()
  end

  defp extract_quantity(text) do
    text = replace_unicode_fractions(text)

    cond do
      match = Regex.run(~r/^(\d+)\s+(\d+)\/(\d+)\s*(.*)$/, text) ->
        [_, whole, num, den, rest] = match
        qty = String.to_integer(whole) + String.to_integer(num) / String.to_integer(den)
        {Float.round(qty, 3), String.trim(rest)}

      match = Regex.run(~r/^(\d+)\/(\d+)\s*(.*)$/, text) ->
        [_, num, den, rest] = match
        qty = String.to_integer(num) / String.to_integer(den)
        {Float.round(qty, 3), String.trim(rest)}

      match = Regex.run(~r/^(\d+\.?\d*)\s*(.*)$/, text) ->
        [_, num, rest] = match
        {parse_number(num), String.trim(rest)}

      true ->
        {nil, text}
    end
  end

  defp replace_unicode_fractions(text) do
    Enum.reduce(@unicode_fractions, text, fn {char, value}, acc ->
      acc = Regex.replace(~r/(\d)#{Regex.escape(char)}/, acc, fn _, whole ->
        "#{String.to_integer(whole) + value}"
      end)

      String.replace(acc, char, "#{value}")
    end)
  end

  defp parse_number(str) do
    if String.contains?(str, ".") do
      {f, _} = Float.parse(str)
      Float.round(f, 3)
    else
      String.to_integer(str) * 1.0
    end
  end

  defp extract_unit(text) do
    lower = String.downcase(text)

    multi_word_match =
      @units
      |> Map.keys()
      |> Enum.filter(&String.contains?(&1, " "))
      |> Enum.sort_by(&(-String.length(&1)))
      |> Enum.find(fn unit ->
        String.starts_with?(lower, unit <> " ") or lower == unit
      end)

    if multi_word_match do
      canonical = Map.get(@units, multi_word_match)
      rest = String.slice(text, String.length(multi_word_match)..-1//1) |> String.trim()
      {canonical, rest}
    else
      case Regex.run(~r/^(\S+)\s+(.+)$/, text) do
        [_, first_word, rest] ->
          key = String.downcase(first_word) |> String.replace(~r/[.,]$/, "")

          case Map.get(@units, key) do
            nil -> {nil, text}
            canonical -> {canonical, rest}
          end

        _ ->
          key = String.downcase(text) |> String.trim() |> String.replace(~r/[.,]$/, "")

          case Map.get(@units, key) do
            nil -> {nil, text}
            canonical -> {canonical, ""}
          end
      end
    end
  end

  defp normalize_name(text) do
    text
    |> String.downcase()
    |> String.replace(~r/[,.]$/, "")
    |> String.replace(~r/\s+/, " ")
    |> String.trim()
    |> case do
      "" -> "unknown"
      name -> name
    end
  end
end
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd ~/code/caitlin_decodes/list_it/backend && mix test test/list_it/parser/ingredient_parser_test.exs
```

Expected: All 17 tests pass.

- [ ] **Step 5: Commit**

```bash
cd ~/code/caitlin_decodes/list_it
git add backend/lib/list_it/parser/ingredient_parser.ex backend/test/list_it/parser/ingredient_parser_test.exs
git commit -m "feat: add ingredient parser with unit normalization and fraction handling"
```

---

## Task 6: Recipe Scraper

**Files:**
- Create: `backend/lib/list_it/parser/scraper.ex`
- Create: `backend/test/list_it/parser/scraper_test.exs`

- [ ] **Step 1: Write scraper tests**

Create `backend/test/list_it/parser/scraper_test.exs`:

```elixir
defmodule ListIt.Parser.ScraperTest do
  use ExUnit.Case, async: true

  alias ListIt.Parser.Scraper

  describe "extract_recipe_from_html/2" do
    test "extracts recipe from simple JSON-LD" do
      html = """
      <html><head>
      <script type="application/ld+json">
      {
        "@type": "Recipe",
        "name": "Test Recipe",
        "image": "https://example.com/image.jpg",
        "recipeIngredient": ["2 cups flour", "1 tsp salt"],
        "recipeYield": "4 servings",
        "prepTime": "PT10M",
        "cookTime": "PT20M"
      }
      </script>
      </head><body></body></html>
      """

      assert {:ok, data} = Scraper.extract_recipe_from_html(html, "https://example.com/recipe")
      assert data.title == "Test Recipe"
      assert data.image_url == "https://example.com/image.jpg"
      assert data.servings == "4 servings"
      assert data.prep_time == "PT10M"
      assert data.cook_time == "PT20M"
      assert data.ingredients == ["2 cups flour", "1 tsp salt"]
      assert data.source_name == "example.com"
    end

    test "extracts recipe from @graph wrapper" do
      html = """
      <html><head>
      <script type="application/ld+json">
      {
        "@graph": [
          {"@type": "WebPage", "name": "Some Page"},
          {"@type": "Recipe", "name": "Graph Recipe", "recipeIngredient": ["1 cup sugar"]}
        ]
      }
      </script>
      </head><body></body></html>
      """

      assert {:ok, data} = Scraper.extract_recipe_from_html(html, "https://food.com/recipe")
      assert data.title == "Graph Recipe"
      assert data.ingredients == ["1 cup sugar"]
      assert data.source_name == "food.com"
    end

    test "extracts recipe from JSON-LD array" do
      html = """
      <html><head>
      <script type="application/ld+json">
      [
        {"@type": "WebSite", "name": "Food Blog"},
        {"@type": "Recipe", "name": "Array Recipe", "recipeIngredient": ["3 eggs"]}
      ]
      </script>
      </head><body></body></html>
      """

      assert {:ok, data} = Scraper.extract_recipe_from_html(html, "https://blog.com/r")
      assert data.title == "Array Recipe"
    end

    test "handles recipe with list @type" do
      html = """
      <html><head>
      <script type="application/ld+json">
      {"@type": ["Recipe"], "name": "List Type Recipe", "recipeIngredient": ["1 onion"]}
      </script>
      </head><body></body></html>
      """

      assert {:ok, data} = Scraper.extract_recipe_from_html(html, "https://x.com/r")
      assert data.title == "List Type Recipe"
    end

    test "handles image as array of strings" do
      html = """
      <html><head>
      <script type="application/ld+json">
      {"@type": "Recipe", "name": "R", "image": ["https://img1.jpg", "https://img2.jpg"], "recipeIngredient": []}
      </script>
      </head><body></body></html>
      """

      assert {:ok, data} = Scraper.extract_recipe_from_html(html, "https://x.com/r")
      assert data.image_url == "https://img1.jpg"
    end

    test "handles image as object with url" do
      html = """
      <html><head>
      <script type="application/ld+json">
      {"@type": "Recipe", "name": "R", "image": {"url": "https://obj.jpg"}, "recipeIngredient": []}
      </script>
      </head><body></body></html>
      """

      assert {:ok, data} = Scraper.extract_recipe_from_html(html, "https://x.com/r")
      assert data.image_url == "https://obj.jpg"
    end

    test "handles recipeYield as integer" do
      html = """
      <html><head>
      <script type="application/ld+json">
      {"@type": "Recipe", "name": "R", "recipeYield": 6, "recipeIngredient": []}
      </script>
      </head><body></body></html>
      """

      assert {:ok, data} = Scraper.extract_recipe_from_html(html, "https://x.com/r")
      assert data.servings == "6"
    end

    test "handles recipeYield as array" do
      html = """
      <html><head>
      <script type="application/ld+json">
      {"@type": "Recipe", "name": "R", "recipeYield": ["4", "4 servings"], "recipeIngredient": []}
      </script>
      </head><body></body></html>
      """

      assert {:ok, data} = Scraper.extract_recipe_from_html(html, "https://x.com/r")
      assert data.servings == "4"
    end

    test "returns error when no recipe found" do
      html = """
      <html><head>
      <script type="application/ld+json">
      {"@type": "WebSite", "name": "Not a recipe"}
      </script>
      </head><body></body></html>
      """

      assert {:error, "No recipe data found on this page"} =
               Scraper.extract_recipe_from_html(html, "https://x.com/page")
    end

    test "returns error when no JSON-LD found at all" do
      html = "<html><head></head><body>Just text</body></html>"

      assert {:error, "No recipe data found on this page"} =
               Scraper.extract_recipe_from_html(html, "https://x.com/page")
    end

    test "strips www from domain" do
      html = """
      <html><head>
      <script type="application/ld+json">
      {"@type": "Recipe", "name": "R", "recipeIngredient": []}
      </script>
      </head><body></body></html>
      """

      assert {:ok, data} = Scraper.extract_recipe_from_html(html, "https://www.example.com/r")
      assert data.source_name == "example.com"
    end

    test "handles missing optional fields gracefully" do
      html = """
      <html><head>
      <script type="application/ld+json">
      {"@type": "Recipe", "name": "Minimal", "recipeIngredient": ["1 egg"]}
      </script>
      </head><body></body></html>
      """

      assert {:ok, data} = Scraper.extract_recipe_from_html(html, "https://x.com/r")
      assert data.title == "Minimal"
      assert data.image_url == nil
      assert data.servings == nil
      assert data.prep_time == nil
      assert data.cook_time == nil
      assert data.ingredients == ["1 egg"]
    end
  end
end
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd ~/code/caitlin_decodes/list_it/backend && mix test test/list_it/parser/scraper_test.exs
```

Expected: All tests fail — `module ListIt.Parser.Scraper is not available`.

- [ ] **Step 3: Implement scraper**

Create `backend/lib/list_it/parser/scraper.ex`:

```elixir
defmodule ListIt.Parser.Scraper do
  @moduledoc """
  Scrapes recipe data from URLs by extracting JSON-LD structured data (schema.org Recipe).
  """

  @type recipe_data :: %{
          title: String.t(),
          image_url: String.t() | nil,
          servings: String.t() | nil,
          prep_time: String.t() | nil,
          cook_time: String.t() | nil,
          ingredients: [String.t()],
          source_name: String.t()
        }

  @spec scrape(String.t()) :: {:ok, recipe_data()} | {:error, String.t()}
  def scrape(url) when is_binary(url) do
    with {:ok, html} <- fetch_page(url) do
      extract_recipe_from_html(html, url)
    end
  end

  @spec extract_recipe_from_html(String.t(), String.t()) ::
          {:ok, recipe_data()} | {:error, String.t()}
  def extract_recipe_from_html(html, url) do
    with {:ok, recipe_json} <- extract_recipe_json(html) do
      {:ok, build_recipe_data(recipe_json, url)}
    end
  end

  defp fetch_page(url) do
    case Req.get(url,
           headers: [
             {"user-agent",
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"},
             {"accept",
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8"},
             {"accept-language", "en-US,en;q=0.9"},
             {"accept-encoding", "gzip, deflate"},
             {"sec-ch-ua", ~s("Chromium";v="131", "Not_A Brand";v="24")},
             {"sec-ch-ua-mobile", "?0"},
             {"sec-ch-ua-platform", ~s("macOS")},
             {"sec-fetch-dest", "document"},
             {"sec-fetch-mode", "navigate"},
             {"sec-fetch-site", "none"},
             {"sec-fetch-user", "?1"},
             {"upgrade-insecure-requests", "1"},
             {"cache-control", "max-age=0"}
           ],
           redirect: true,
           max_redirects: 5,
           receive_timeout: 15_000
         ) do
      {:ok, %{status: status, body: body}} when status in 200..299 ->
        {:ok, body}

      {:ok, %{status: status}} ->
        {:error, "Failed to fetch URL: HTTP #{status}"}

      {:error, reason} ->
        {:error, "Failed to fetch URL: #{inspect(reason)}"}
    end
  end

  defp extract_recipe_json(html) do
    {:ok, doc} = Floki.parse_document(html)

    doc
    |> Floki.find("script[type='application/ld+json']")
    |> Enum.reduce_while({:error, "No recipe data found on this page"}, fn node, acc ->
      text = script_content(node)

      case Jason.decode(text) do
        {:ok, json} ->
          case find_recipe(json) do
            nil -> {:cont, acc}
            recipe -> {:halt, {:ok, recipe}}
          end

        {:error, _} ->
          {:cont, acc}
      end
    end)
  end

  defp script_content({"script", _, [content]}) when is_binary(content), do: content
  defp script_content({"script", _, _}), do: ""
  defp script_content(_), do: ""

  defp find_recipe(%{"@type" => type} = json) when type in ["Recipe", ["Recipe"]] do
    json
  end

  defp find_recipe(%{"@type" => types} = json) when is_list(types) do
    if "Recipe" in types, do: json, else: nil
  end

  defp find_recipe(%{"@graph" => graph}) when is_list(graph) do
    Enum.find_value(graph, &find_recipe/1)
  end

  defp find_recipe(list) when is_list(list) do
    Enum.find_value(list, &find_recipe/1)
  end

  defp find_recipe(_), do: nil

  defp build_recipe_data(json, url) do
    %{
      title: get_string(json, "name") || "Untitled Recipe",
      image_url: extract_image(json),
      servings: extract_yield(json),
      prep_time: get_string(json, "prepTime"),
      cook_time: get_string(json, "cookTime"),
      ingredients: extract_ingredients(json),
      source_name: extract_domain(url)
    }
  end

  defp extract_image(%{"image" => %{"url" => url}}), do: url
  defp extract_image(%{"image" => [first | _]}) when is_binary(first), do: first
  defp extract_image(%{"image" => [%{"url" => url} | _]}), do: url
  defp extract_image(%{"image" => url}) when is_binary(url), do: url
  defp extract_image(_), do: nil

  defp extract_yield(%{"recipeYield" => [first | _]}), do: to_string(first)
  defp extract_yield(%{"recipeYield" => yield}) when is_binary(yield), do: yield
  defp extract_yield(%{"recipeYield" => yield}) when is_integer(yield), do: to_string(yield)
  defp extract_yield(_), do: nil

  defp extract_ingredients(%{"recipeIngredient" => ingredients}) when is_list(ingredients) do
    Enum.map(ingredients, &to_string/1)
  end

  defp extract_ingredients(_), do: []

  defp extract_domain(url) do
    case URI.parse(url) do
      %{host: host} when is_binary(host) ->
        host |> String.replace_leading("www.", "")

      _ ->
        "unknown"
    end
  end

  defp get_string(map, key) do
    case Map.get(map, key) do
      val when is_binary(val) -> val
      _ -> nil
    end
  end
end
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd ~/code/caitlin_decodes/list_it/backend && mix test test/list_it/parser/scraper_test.exs
```

Expected: All 12 tests pass.

- [ ] **Step 5: Commit**

```bash
cd ~/code/caitlin_decodes/list_it
git add backend/lib/list_it/parser/scraper.ex backend/test/list_it/parser/scraper_test.exs
git commit -m "feat: add recipe scraper with JSON-LD extraction and comprehensive tests"
```

---

## Task 7: Recipes Context

**Files:**
- Create: `backend/lib/list_it/recipes.ex`
- Create: `backend/test/list_it/recipes_test.exs`

- [ ] **Step 1: Write recipes context tests**

Create `backend/test/list_it/recipes_test.exs`:

```elixir
defmodule ListIt.RecipesTest do
  use ListIt.DataCase, async: true

  alias ListIt.Recipes
  alias ListIt.Recipes.{Recipe, Ingredient}
  alias ListIt.Repo

  defp create_recipe_directly(attrs \\ %{}) do
    default = %{
      title: "Test Recipe",
      url: "https://example.com/recipe-#{System.unique_integer([:positive])}",
      source_name: "example.com"
    }

    {:ok, recipe} =
      %Recipe{}
      |> Recipe.changeset(Map.merge(default, attrs))
      |> Repo.insert()

    recipe
  end

  defp create_ingredient(recipe, attrs) do
    default = %{
      recipe_id: recipe.id,
      raw_text: attrs[:raw_text] || "#{attrs[:quantity]} #{attrs[:unit]} #{attrs[:name]}",
      name: attrs[:name] || "ingredient",
      quantity: attrs[:quantity],
      unit: attrs[:unit]
    }

    {:ok, ingredient} =
      %Ingredient{}
      |> Ingredient.changeset(Map.merge(default, attrs))
      |> Repo.insert()

    ingredient
  end

  describe "list_recipes/0" do
    test "returns all recipes ordered by newest first" do
      r1 = create_recipe_directly(%{title: "First"})
      r2 = create_recipe_directly(%{title: "Second"})

      recipes = Recipes.list_recipes()
      assert length(recipes) == 2
      assert hd(recipes).id == r2.id
    end

    test "preloads ingredients" do
      recipe = create_recipe_directly()
      create_ingredient(recipe, %{name: "flour", quantity: 2.0, unit: "cup"})

      [loaded] = Recipes.list_recipes()
      assert length(loaded.ingredients) == 1
      assert hd(loaded.ingredients).name == "flour"
    end

    test "returns empty list when no recipes" do
      assert Recipes.list_recipes() == []
    end
  end

  describe "get_recipe!/1" do
    test "returns recipe with ingredients" do
      recipe = create_recipe_directly()
      create_ingredient(recipe, %{name: "salt", quantity: 1.0, unit: "tsp"})

      loaded = Recipes.get_recipe!(recipe.id)
      assert loaded.title == recipe.title
      assert length(loaded.ingredients) == 1
    end

    test "raises on missing id" do
      assert_raise Ecto.NoResultsError, fn ->
        Recipes.get_recipe!(Ecto.UUID.generate())
      end
    end
  end

  describe "delete_recipe/1" do
    test "deletes recipe and cascades to ingredients" do
      recipe = create_recipe_directly()
      create_ingredient(recipe, %{name: "egg", quantity: 2.0, unit: nil})

      assert {:ok, _} = Recipes.delete_recipe(recipe)
      assert Recipes.list_recipes() == []
      assert Repo.all(Ingredient) == []
    end

    test "deletes by id" do
      recipe = create_recipe_directly()
      assert {:ok, _} = Recipes.delete_recipe(recipe.id)
      assert Recipes.list_recipes() == []
    end
  end
end
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd ~/code/caitlin_decodes/list_it/backend && mix test test/list_it/recipes_test.exs
```

Expected: Fails — `module ListIt.Recipes is not available`.

- [ ] **Step 3: Implement Recipes context**

Create `backend/lib/list_it/recipes.ex`:

```elixir
defmodule ListIt.Recipes do
  @moduledoc """
  Context for managing recipes and their ingredients.
  """

  import Ecto.Query
  alias ListIt.Repo
  alias ListIt.Recipes.{Recipe, Ingredient}
  alias ListIt.Parser.{Scraper, IngredientParser}

  def list_recipes do
    Recipe
    |> order_by(desc: :inserted_at)
    |> preload(:ingredients)
    |> Repo.all()
  end

  def get_recipe!(id) do
    Recipe
    |> preload(:ingredients)
    |> Repo.get!(id)
  end

  def create_recipe_from_url(url) do
    with {:ok, data} <- Scraper.scrape(url) do
      recipe_attrs = %{
        title: data.title,
        url: url,
        source_name: data.source_name,
        image_url: data.image_url,
        servings: data.servings,
        prep_time: data.prep_time,
        cook_time: data.cook_time
      }

      Ecto.Multi.new()
      |> Ecto.Multi.insert(:recipe, Recipe.changeset(%Recipe{}, recipe_attrs))
      |> Ecto.Multi.run(:ingredients, fn repo, %{recipe: recipe} ->
        ingredients =
          Enum.map(data.ingredients, fn raw_text ->
            parsed = IngredientParser.parse(raw_text)

            %Ingredient{}
            |> Ingredient.changeset(%{
              recipe_id: recipe.id,
              raw_text: parsed.raw_text,
              name: parsed.name,
              quantity: parsed.quantity,
              unit: parsed.unit
            })
            |> repo.insert!()
          end)

        {:ok, ingredients}
      end)
      |> Repo.transaction()
      |> case do
        {:ok, %{recipe: recipe, ingredients: ingredients}} ->
          {:ok, %{recipe | ingredients: ingredients}}

        {:error, :recipe, changeset, _} ->
          {:error, changeset}

        {:error, _step, reason, _} ->
          {:error, reason}
      end
    end
  end

  def delete_recipe(%Recipe{} = recipe) do
    Repo.delete(recipe)
  end

  def delete_recipe(id) when is_binary(id) do
    get_recipe!(id) |> Repo.delete()
  end
end
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd ~/code/caitlin_decodes/list_it/backend && mix test test/list_it/recipes_test.exs
```

Expected: All 6 tests pass.

- [ ] **Step 5: Commit**

```bash
cd ~/code/caitlin_decodes/list_it
git add backend/lib/list_it/recipes.ex backend/test/list_it/recipes_test.exs
git commit -m "feat: add Recipes context with list, get, create_from_url, delete"
```

---

## Task 8: Grocery Context

**Files:**
- Create: `backend/lib/list_it/grocery.ex`
- Create: `backend/test/list_it/grocery_test.exs`

- [ ] **Step 1: Write grocery context tests**

Create `backend/test/list_it/grocery_test.exs`:

```elixir
defmodule ListIt.GroceryTest do
  use ListIt.DataCase, async: true

  alias ListIt.Grocery
  alias ListIt.Recipes.{Recipe, Ingredient}
  alias ListIt.Grocery.CheckedItem
  alias ListIt.Repo

  defp create_recipe(attrs \\ %{}) do
    default = %{
      title: "Recipe",
      url: "https://example.com/r-#{System.unique_integer([:positive])}",
      source_name: "example.com"
    }

    {:ok, recipe} =
      %Recipe{}
      |> Recipe.changeset(Map.merge(default, attrs))
      |> Repo.insert()

    recipe
  end

  defp add_ingredient(recipe, name, quantity, unit) do
    {:ok, ingredient} =
      %Ingredient{}
      |> Ingredient.changeset(%{
        recipe_id: recipe.id,
        raw_text: "#{quantity} #{unit} #{name}",
        name: name,
        quantity: quantity,
        unit: unit
      })
      |> Repo.insert()

    ingredient
  end

  describe "get_grocery_list/0" do
    test "returns empty list when no recipes" do
      assert Grocery.get_grocery_list() == []
    end

    test "aggregates quantities for same name and unit" do
      r1 = create_recipe(%{title: "R1"})
      r2 = create_recipe(%{title: "R2"})
      add_ingredient(r1, "flour", 2.0, "cup")
      add_ingredient(r2, "flour", 1.0, "cup")

      list = Grocery.get_grocery_list()
      flour = Enum.find(list, &(&1.name == "flour"))
      assert flour.quantity == 3.0
      assert flour.unit == "cup"
      assert flour.recipe_count == 2
    end

    test "keeps different units as separate items" do
      r1 = create_recipe(%{title: "R1"})
      add_ingredient(r1, "butter", 2.0, "tbsp")
      add_ingredient(r1, "butter", 1.0, "stick")

      list = Grocery.get_grocery_list()
      butter_items = Enum.filter(list, &(&1.name == "butter"))
      assert length(butter_items) == 2
    end

    test "includes checked state from checked_items" do
      r1 = create_recipe()
      add_ingredient(r1, "salt", 1.0, "tsp")
      Grocery.toggle_check("salt", true)

      list = Grocery.get_grocery_list()
      salt = Enum.find(list, &(&1.name == "salt"))
      assert salt.checked == true
    end

    test "unchecked by default" do
      r1 = create_recipe()
      add_ingredient(r1, "pepper", 0.5, "tsp")

      list = Grocery.get_grocery_list()
      pepper = Enum.find(list, &(&1.name == "pepper"))
      assert pepper.checked == false
    end

    test "handles null quantities" do
      r1 = create_recipe()
      add_ingredient(r1, "salt and pepper", nil, nil)

      list = Grocery.get_grocery_list()
      item = Enum.find(list, &(&1.name == "salt and pepper"))
      assert item.quantity == nil
      assert item.unit == nil
      assert item.recipe_count == 1
    end

    test "ordered by name" do
      r1 = create_recipe()
      add_ingredient(r1, "zucchini", 1.0, nil)
      add_ingredient(r1, "apple", 2.0, nil)

      list = Grocery.get_grocery_list()
      names = Enum.map(list, & &1.name)
      assert names == ["apple", "zucchini"]
    end
  end

  describe "toggle_check/2" do
    test "creates checked_item when it does not exist" do
      assert {:ok, item} = Grocery.toggle_check("flour", true)
      assert item.name == "flour"
      assert item.checked == true
    end

    test "updates existing checked_item" do
      {:ok, _} = Grocery.toggle_check("flour", true)
      {:ok, item} = Grocery.toggle_check("flour", false)
      assert item.checked == false
    end
  end

  describe "uncheck_all/0" do
    test "deletes all checked items" do
      Grocery.toggle_check("a", true)
      Grocery.toggle_check("b", true)
      assert {:ok, 2} = Grocery.uncheck_all()
      assert Repo.all(CheckedItem) == []
    end

    test "returns 0 when nothing to uncheck" do
      assert {:ok, 0} = Grocery.uncheck_all()
    end
  end
end
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd ~/code/caitlin_decodes/list_it/backend && mix test test/list_it/grocery_test.exs
```

Expected: Fails — `module ListIt.Grocery is not available`.

- [ ] **Step 3: Implement Grocery context**

Create `backend/lib/list_it/grocery.ex`:

```elixir
defmodule ListIt.Grocery do
  @moduledoc """
  Context for the aggregated grocery list.
  Computes the list from all recipe ingredients, joined with checked state.
  """

  import Ecto.Query
  alias ListIt.Repo
  alias ListIt.Recipes.Ingredient
  alias ListIt.Grocery.CheckedItem

  def get_grocery_list do
    ingredients =
      Ingredient
      |> group_by([i], [i.name, i.unit])
      |> select([i], %{
        name: i.name,
        unit: i.unit,
        quantity: sum(i.quantity),
        recipe_count: count(i.id)
      })
      |> order_by([i], asc: i.name)
      |> Repo.all()

    checked_names =
      CheckedItem
      |> where([c], c.checked == true)
      |> select([c], c.name)
      |> Repo.all()
      |> MapSet.new()

    Enum.map(ingredients, fn item ->
      Map.put(item, :checked, MapSet.member?(checked_names, item.name))
    end)
  end

  def toggle_check(name, checked) when is_binary(name) and is_boolean(checked) do
    case Repo.get_by(CheckedItem, name: name) do
      nil ->
        %CheckedItem{}
        |> CheckedItem.changeset(%{name: name, checked: checked})
        |> Repo.insert()

      existing ->
        existing
        |> CheckedItem.changeset(%{checked: checked})
        |> Repo.update()
    end
  end

  def uncheck_all do
    {count, _} = Repo.delete_all(CheckedItem)
    {:ok, count}
  end
end
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd ~/code/caitlin_decodes/list_it/backend && mix test test/list_it/grocery_test.exs
```

Expected: All 9 tests pass.

- [ ] **Step 5: Commit**

```bash
cd ~/code/caitlin_decodes/list_it
git add backend/lib/list_it/grocery.ex backend/test/list_it/grocery_test.exs
git commit -m "feat: add Grocery context with aggregation, check toggle, uncheck all"
```

---

## Task 9: API Controllers & Router

**Files:**
- Create: `backend/lib/list_it_web/controllers/fallback_controller.ex`
- Create: `backend/lib/list_it_web/controllers/recipe_controller.ex`
- Create: `backend/lib/list_it_web/controllers/recipe_json.ex`
- Create: `backend/lib/list_it_web/controllers/grocery_controller.ex`
- Create: `backend/lib/list_it_web/controllers/grocery_json.ex`
- Modify: `backend/lib/list_it_web/router.ex`

- [ ] **Step 1: Create FallbackController**

Create `backend/lib/list_it_web/controllers/fallback_controller.ex`:

```elixir
defmodule ListItWeb.FallbackController do
  use ListItWeb, :controller

  def call(conn, {:error, %Ecto.Changeset{} = changeset}) do
    conn
    |> put_status(:unprocessable_entity)
    |> put_view(json: ListItWeb.ErrorJSON)
    |> render("error.json", changeset: changeset)
  end

  def call(conn, {:error, message}) when is_binary(message) do
    conn
    |> put_status(:unprocessable_entity)
    |> json(%{errors: %{detail: message}})
  end
end
```

- [ ] **Step 2: Update ErrorJSON to handle changesets**

Check if `backend/lib/list_it_web/controllers/error_json.ex` exists. If so, add changeset rendering. Replace its contents with:

```elixir
defmodule ListItWeb.ErrorJSON do
  def render("error.json", %{changeset: changeset}) do
    errors =
      Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
        Regex.replace(~r"%{(\w+)}", msg, fn _, key ->
          opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
        end)
      end)

    %{errors: errors}
  end

  def render(template, _assigns) do
    %{errors: %{detail: Phoenix.Controller.status_message_from_template(template)}}
  end
end
```

- [ ] **Step 3: Create RecipeController**

Create `backend/lib/list_it_web/controllers/recipe_controller.ex`:

```elixir
defmodule ListItWeb.RecipeController do
  use ListItWeb, :controller

  alias ListIt.Recipes
  action_fallback ListItWeb.FallbackController

  def index(conn, _params) do
    recipes = Recipes.list_recipes()
    render(conn, :index, recipes: recipes)
  end

  def create(conn, %{"url" => url}) do
    case Recipes.create_recipe_from_url(url) do
      {:ok, recipe} ->
        conn
        |> put_status(:created)
        |> render(:show, recipe: recipe)

      {:error, _} = error ->
        error
    end
  end

  def create(conn, _params) do
    conn
    |> put_status(:unprocessable_entity)
    |> json(%{errors: %{detail: "Missing required field: url"}})
  end

  def delete(conn, %{"id" => id}) do
    case Recipes.delete_recipe(id) do
      {:ok, _} ->
        send_resp(conn, :no_content, "")

      {:error, _} = error ->
        error
    end
  end
end
```

- [ ] **Step 4: Create RecipeJSON**

Create `backend/lib/list_it_web/controllers/recipe_json.ex`:

```elixir
defmodule ListItWeb.RecipeJSON do
  alias ListIt.Recipes.{Recipe, Ingredient}

  def index(%{recipes: recipes}) do
    %{data: Enum.map(recipes, &recipe_data/1)}
  end

  def show(%{recipe: recipe}) do
    %{data: recipe_data(recipe)}
  end

  defp recipe_data(%Recipe{} = recipe) do
    %{
      id: recipe.id,
      title: recipe.title,
      url: recipe.url,
      source_name: recipe.source_name,
      image_url: recipe.image_url,
      servings: recipe.servings,
      prep_time: recipe.prep_time,
      cook_time: recipe.cook_time,
      ingredients: Enum.map(recipe.ingredients, &ingredient_data/1),
      inserted_at: recipe.inserted_at
    }
  end

  defp ingredient_data(%Ingredient{} = ingredient) do
    %{
      id: ingredient.id,
      raw_text: ingredient.raw_text,
      name: ingredient.name,
      quantity: ingredient.quantity,
      unit: ingredient.unit
    }
  end
end
```

- [ ] **Step 5: Create GroceryController**

Create `backend/lib/list_it_web/controllers/grocery_controller.ex`:

```elixir
defmodule ListItWeb.GroceryController do
  use ListItWeb, :controller

  alias ListIt.Grocery
  action_fallback ListItWeb.FallbackController

  def index(conn, _params) do
    items = Grocery.get_grocery_list()
    render(conn, :index, items: items)
  end

  def check(conn, %{"name" => name, "checked" => checked})
      when is_binary(name) and is_boolean(checked) do
    case Grocery.toggle_check(name, checked) do
      {:ok, item} ->
        json(conn, %{data: %{name: item.name, checked: item.checked}})

      {:error, _} = error ->
        error
    end
  end

  def check(conn, _params) do
    conn
    |> put_status(:unprocessable_entity)
    |> json(%{errors: %{detail: "Missing required fields: name (string), checked (boolean)"}})
  end

  def uncheck_all(conn, _params) do
    {:ok, _count} = Grocery.uncheck_all()
    send_resp(conn, :no_content, "")
  end
end
```

- [ ] **Step 6: Create GroceryJSON**

Create `backend/lib/list_it_web/controllers/grocery_json.ex`:

```elixir
defmodule ListItWeb.GroceryJSON do
  def index(%{items: items}) do
    %{data: Enum.map(items, &item_data/1)}
  end

  defp item_data(item) do
    %{
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      checked: item.checked,
      recipe_count: item.recipe_count
    }
  end
end
```

- [ ] **Step 7: Configure router**

Replace the contents of `backend/lib/list_it_web/router.ex`:

```elixir
defmodule ListItWeb.Router do
  use ListItWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/api", ListItWeb do
    pipe_through :api

    resources "/recipes", RecipeController, only: [:index, :create, :delete]
    get "/grocery", GroceryController, :index
    put "/grocery/check", GroceryController, :check
    delete "/grocery/checked", GroceryController, :uncheck_all
  end
end
```

- [ ] **Step 8: Verify compilation**

```bash
cd ~/code/caitlin_decodes/list_it/backend && mix compile
```

Expected: Compiles with no errors.

- [ ] **Step 9: Write controller tests**

Create `backend/test/list_it_web/controllers/recipe_controller_test.exs`:

```elixir
defmodule ListItWeb.RecipeControllerTest do
  use ListItWeb.ConnCase, async: true

  alias ListIt.Recipes.{Recipe, Ingredient}
  alias ListIt.Repo

  defp create_recipe_with_ingredients do
    {:ok, recipe} =
      %Recipe{}
      |> Recipe.changeset(%{
        title: "Test Recipe",
        url: "https://example.com/r-#{System.unique_integer([:positive])}",
        source_name: "example.com"
      })
      |> Repo.insert()

    {:ok, _} =
      %Ingredient{}
      |> Ingredient.changeset(%{
        recipe_id: recipe.id,
        raw_text: "2 cups flour",
        name: "flour",
        quantity: 2.0,
        unit: "cup"
      })
      |> Repo.insert()

    Repo.preload(recipe, :ingredients)
  end

  describe "GET /api/recipes" do
    test "returns empty list", %{conn: conn} do
      conn = get(conn, "/api/recipes")
      assert json_response(conn, 200)["data"] == []
    end

    test "returns recipes with ingredients", %{conn: conn} do
      create_recipe_with_ingredients()
      conn = get(conn, "/api/recipes")
      data = json_response(conn, 200)["data"]
      assert length(data) == 1
      assert hd(data)["title"] == "Test Recipe"
      assert length(hd(data)["ingredients"]) == 1
    end
  end

  describe "POST /api/recipes" do
    test "returns error for missing url", %{conn: conn} do
      conn = post(conn, "/api/recipes", %{})
      assert json_response(conn, 422)["errors"]["detail"] =~ "Missing"
    end
  end

  describe "DELETE /api/recipes/:id" do
    test "deletes a recipe", %{conn: conn} do
      recipe = create_recipe_with_ingredients()
      conn = delete(conn, "/api/recipes/#{recipe.id}")
      assert response(conn, 204)
    end
  end
end
```

Create `backend/test/list_it_web/controllers/grocery_controller_test.exs`:

```elixir
defmodule ListItWeb.GroceryControllerTest do
  use ListItWeb.ConnCase, async: true

  alias ListIt.Recipes.{Recipe, Ingredient}
  alias ListIt.Repo

  defp seed_grocery_data do
    {:ok, recipe} =
      %Recipe{}
      |> Recipe.changeset(%{
        title: "Recipe",
        url: "https://example.com/r-#{System.unique_integer([:positive])}",
        source_name: "example.com"
      })
      |> Repo.insert()

    {:ok, _} =
      %Ingredient{}
      |> Ingredient.changeset(%{
        recipe_id: recipe.id,
        raw_text: "2 cups flour",
        name: "flour",
        quantity: 2.0,
        unit: "cup"
      })
      |> Repo.insert()

    recipe
  end

  describe "GET /api/grocery" do
    test "returns empty list", %{conn: conn} do
      conn = get(conn, "/api/grocery")
      assert json_response(conn, 200)["data"] == []
    end

    test "returns aggregated items", %{conn: conn} do
      seed_grocery_data()
      conn = get(conn, "/api/grocery")
      data = json_response(conn, 200)["data"]
      assert length(data) == 1
      assert hd(data)["name"] == "flour"
      assert hd(data)["quantity"] == 2.0
    end
  end

  describe "PUT /api/grocery/check" do
    test "toggles check state", %{conn: conn} do
      conn = put(conn, "/api/grocery/check", %{name: "flour", checked: true})
      data = json_response(conn, 200)["data"]
      assert data["name"] == "flour"
      assert data["checked"] == true
    end

    test "returns error for missing params", %{conn: conn} do
      conn = put(conn, "/api/grocery/check", %{})
      assert json_response(conn, 422)["errors"]["detail"] =~ "Missing"
    end
  end

  describe "DELETE /api/grocery/checked" do
    test "clears all checked items", %{conn: conn} do
      put(conn, "/api/grocery/check", %{name: "flour", checked: true})
      conn = delete(conn, "/api/grocery/checked")
      assert response(conn, 204)
    end
  end
end
```

- [ ] **Step 10: Run all tests**

```bash
cd ~/code/caitlin_decodes/list_it/backend && mix test
```

Expected: All tests pass.

- [ ] **Step 11: Commit**

```bash
cd ~/code/caitlin_decodes/list_it
git add backend/lib/list_it_web/ backend/test/list_it_web/
git commit -m "feat: add API controllers, JSON views, and router for recipes and grocery"
```

---

## Task 10: Frontend Scaffold — Vite, React, Tailwind v4, shadcn

**Files:**
- Create: entire `frontend/` directory

- [ ] **Step 1: Scaffold Vite React TypeScript project**

```bash
cd ~/code/caitlin_decodes/list_it
npm create vite@latest frontend -- --template react-ts
```

- [ ] **Step 2: Install core dependencies**

```bash
cd ~/code/caitlin_decodes/list_it/frontend
npm install @tanstack/react-query zustand react-router-dom framer-motion sonner lucide-react
npm install -D tailwindcss @tailwindcss/vite
```

- [ ] **Step 3: Configure Tailwind v4 in vite.config.ts**

Replace `frontend/vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:4000",
    },
  },
});
```

- [ ] **Step 4: Configure Tailwind v4 CSS**

Replace `frontend/src/index.css`:

```css
@import "tailwindcss";
```

- [ ] **Step 5: Initialize shadcn**

```bash
cd ~/code/caitlin_decodes/list_it/frontend
npx shadcn@latest init
```

When prompted: select **New York** style, **Zinc** base color, **CSS variables** for colors. If it asks about Tailwind config / tsconfig paths, accept defaults.

- [ ] **Step 6: Install shadcn components**

```bash
cd ~/code/caitlin_decodes/list_it/frontend
npx shadcn@latest add button card dialog input badge separator scroll-area checkbox skeleton
```

- [ ] **Step 7: Update index.html title**

Replace the `<title>` in `frontend/index.html` with:

```html
<title>ListIt — Meal Planner & Grocery List</title>
```

- [ ] **Step 8: Create frontend Makefile**

Create `frontend/Makefile`:

```makefile
.PHONY: setup dev build lint

setup:
	npm install

dev:
	npm run dev

build:
	npm run build

lint:
	npm run lint
```

- [ ] **Step 9: Verify the dev server starts**

```bash
cd ~/code/caitlin_decodes/list_it/frontend && npm run dev &
sleep 3
curl -s http://localhost:5173 | head -5
kill %1
```

Expected: HTML output containing the Vite React app.

- [ ] **Step 10: Commit**

```bash
cd ~/code/caitlin_decodes/list_it
git add frontend/ .gitignore
git commit -m "feat: scaffold React frontend with Vite, Tailwind v4, shadcn UI"
```

---

## Task 11: Frontend Types & API Client

**Files:**
- Create: `frontend/src/types/index.ts`
- Create: `frontend/src/api/client.ts`

- [ ] **Step 1: Define TypeScript types**

Create `frontend/src/types/index.ts`:

```typescript
export interface Recipe {
  id: string;
  title: string;
  url: string;
  source_name: string;
  image_url: string | null;
  servings: string | null;
  prep_time: string | null;
  cook_time: string | null;
  ingredients: Ingredient[];
  inserted_at: string;
}

export interface Ingredient {
  id: string;
  raw_text: string;
  name: string;
  quantity: number | null;
  unit: string | null;
}

export interface GroceryItem {
  name: string;
  quantity: number | null;
  unit: string | null;
  checked: boolean;
  recipe_count: number;
}
```

- [ ] **Step 2: Create API client**

Create `frontend/src/api/client.ts`:

```typescript
import type { Recipe, GroceryItem } from "@/types";

const API_BASE = "/api";

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message =
      body?.errors?.detail ||
      body?.errors?.url?.[0] ||
      `Request failed: ${res.status}`;
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return res.json().then((body) => body.data);
}

export function fetchRecipes(): Promise<Recipe[]> {
  return request<Recipe[]>("/recipes");
}

export function createRecipe(url: string): Promise<Recipe> {
  return request<Recipe>("/recipes", {
    method: "POST",
    body: JSON.stringify({ url }),
  });
}

export function deleteRecipe(id: string): Promise<void> {
  return request<void>(`/recipes/${id}`, { method: "DELETE" });
}

export function fetchGroceryList(): Promise<GroceryItem[]> {
  return request<GroceryItem[]>("/grocery");
}

export function toggleGroceryCheck(
  name: string,
  checked: boolean
): Promise<void> {
  return request<void>("/grocery/check", {
    method: "PUT",
    body: JSON.stringify({ name, checked }),
  });
}

export function uncheckAllGrocery(): Promise<void> {
  return request<void>("/grocery/checked", { method: "DELETE" });
}
```

- [ ] **Step 3: Commit**

```bash
cd ~/code/caitlin_decodes/list_it
git add frontend/src/types/ frontend/src/api/
git commit -m "feat: add TypeScript types and API client"
```

---

## Task 12: Unit Conversion Module

**Files:**
- Create: `frontend/src/lib/unit-conversion.ts`

- [ ] **Step 1: Create unit conversion module**

Create `frontend/src/lib/unit-conversion.ts`:

```typescript
import type { GroceryItem } from "@/types";

export type UnitPreference = "imperial" | "metric";

type UnitCategory = "volume" | "weight" | "other";

interface UnitInfo {
  category: UnitCategory;
  toBase: number; // ml for volume, g for weight
}

const UNIT_INFO: Record<string, UnitInfo> = {
  // Volume (base: ml)
  tsp: { category: "volume", toBase: 4.929 },
  tbsp: { category: "volume", toBase: 14.787 },
  "fl oz": { category: "volume", toBase: 29.574 },
  cup: { category: "volume", toBase: 236.588 },
  pint: { category: "volume", toBase: 473.176 },
  quart: { category: "volume", toBase: 946.353 },
  liter: { category: "volume", toBase: 1000 },
  gallon: { category: "volume", toBase: 3785.41 },
  ml: { category: "volume", toBase: 1 },
  // Weight (base: g)
  oz: { category: "weight", toBase: 28.3495 },
  lb: { category: "weight", toBase: 453.592 },
  g: { category: "weight", toBase: 1 },
  kg: { category: "weight", toBase: 1000 },
};

const IMPERIAL_VOLUME = ["gallon", "quart", "pint", "cup", "tbsp", "tsp"];
const IMPERIAL_WEIGHT = ["lb", "oz"];
const METRIC_VOLUME = ["liter", "ml"];
const METRIC_WEIGHT = ["kg", "g"];

function getTargetUnits(
  category: "volume" | "weight",
  preference: UnitPreference
): string[] {
  if (category === "volume") {
    return preference === "imperial" ? IMPERIAL_VOLUME : METRIC_VOLUME;
  }
  return preference === "imperial" ? IMPERIAL_WEIGHT : METRIC_WEIGHT;
}

function pickDisplayUnit(
  baseValue: number,
  targetUnits: string[]
): { unit: string; value: number } {
  for (const unit of targetUnits) {
    const info = UNIT_INFO[unit];
    const converted = baseValue / info.toBase;
    if (converted >= 1) {
      return { unit, value: converted };
    }
  }
  // Fall back to smallest unit
  const smallest = targetUnits[targetUnits.length - 1];
  return {
    unit: smallest,
    value: baseValue / UNIT_INFO[smallest].toBase,
  };
}

export function formatQuantity(value: number): string {
  if (value >= 10) return Math.round(value).toString();
  if (value >= 1) {
    const rounded = Math.round(value * 10) / 10;
    return rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1);
  }
  const rounded = Math.round(value * 100) / 100;
  if (rounded % 1 === 0) return rounded.toFixed(0);
  return rounded.toString();
}

export interface ConvertedGroceryItem {
  name: string;
  displayQuantity: string | null;
  displayUnit: string | null;
  checked: boolean;
  recipeCount: number;
}

export function convertGroceryList(
  items: GroceryItem[],
  preference: UnitPreference
): ConvertedGroceryItem[] {
  // Group by name
  const grouped = new Map<string, GroceryItem[]>();
  for (const item of items) {
    const existing = grouped.get(item.name) || [];
    existing.push(item);
    grouped.set(item.name, existing);
  }

  const result: ConvertedGroceryItem[] = [];

  for (const [name, group] of grouped) {
    // Partition into convertible-together groups by category
    const byCategory = new Map<string, GroceryItem[]>();

    for (const item of group) {
      const unitInfo = item.unit ? UNIT_INFO[item.unit] : null;
      const key = unitInfo ? unitInfo.category : `other:${item.unit ?? "none"}`;
      const existing = byCategory.get(key) || [];
      existing.push(item);
      byCategory.set(key, existing);
    }

    for (const [categoryKey, categoryItems] of byCategory) {
      const totalRecipeCount = categoryItems.reduce(
        (sum, i) => sum + i.recipe_count,
        0
      );
      const checked = categoryItems.some((i) => i.checked);

      if (
        categoryKey === "other:none" ||
        categoryKey.startsWith("other:")
      ) {
        // Non-convertible: sum quantities directly if same unit
        const totalQty = categoryItems.reduce(
          (sum, i) => sum + (i.quantity ?? 0),
          0
        );
        const hasQty = categoryItems.some((i) => i.quantity != null);
        const unit = categoryItems[0].unit;

        result.push({
          name,
          displayQuantity: hasQty ? formatQuantity(totalQty) : null,
          displayUnit: unit,
          checked,
          recipeCount: totalRecipeCount,
        });
      } else {
        // Convertible: sum in base units, then convert to preferred system
        const category = categoryKey as "volume" | "weight";
        let baseTotal = 0;
        let hasQty = false;

        for (const item of categoryItems) {
          if (item.quantity != null && item.unit) {
            const info = UNIT_INFO[item.unit];
            if (info) {
              baseTotal += item.quantity * info.toBase;
              hasQty = true;
            }
          }
        }

        if (!hasQty) {
          result.push({
            name,
            displayQuantity: null,
            displayUnit: null,
            checked,
            recipeCount: totalRecipeCount,
          });
        } else {
          const targetUnits = getTargetUnits(category, preference);
          const { unit, value } = pickDisplayUnit(baseTotal, targetUnits);
          result.push({
            name,
            displayQuantity: formatQuantity(value),
            displayUnit: unit,
            checked,
            recipeCount: totalRecipeCount,
          });
        }
      }
    }
  }

  // Sort alphabetically by name
  result.sort((a, b) => a.name.localeCompare(b.name));

  return result;
}
```

- [ ] **Step 2: Commit**

```bash
cd ~/code/caitlin_decodes/list_it
git add frontend/src/lib/unit-conversion.ts
git commit -m "feat: add client-side unit conversion module with metric/imperial support"
```

---

## Task 13: Zustand Store & TanStack Query Hooks

**Files:**
- Create: `frontend/src/stores/app-store.ts`
- Create: `frontend/src/hooks/use-recipes.ts`
- Create: `frontend/src/hooks/use-grocery.ts`

- [ ] **Step 1: Create Zustand store with persistence**

Create `frontend/src/stores/app-store.ts`:

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UnitPreference } from "@/lib/unit-conversion";

interface AppState {
  addRecipeDialogOpen: boolean;
  setAddRecipeDialogOpen: (open: boolean) => void;
  activeView: "recipes" | "grocery";
  setActiveView: (view: "recipes" | "grocery") => void;
  unitPreference: UnitPreference;
  setUnitPreference: (pref: UnitPreference) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      addRecipeDialogOpen: false,
      setAddRecipeDialogOpen: (open) => set({ addRecipeDialogOpen: open }),
      activeView: "recipes",
      setActiveView: (view) => set({ activeView: view }),
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

- [ ] **Step 2: Create recipe query hooks**

Create `frontend/src/hooks/use-recipes.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchRecipes, createRecipe, deleteRecipe } from "@/api/client";

export function useRecipes() {
  return useQuery({
    queryKey: ["recipes"],
    queryFn: fetchRecipes,
  });
}

export function useAddRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (url: string) => createRecipe(url),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      queryClient.invalidateQueries({ queryKey: ["grocery"] });
    },
  });
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteRecipe(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      queryClient.invalidateQueries({ queryKey: ["grocery"] });
    },
  });
}
```

- [ ] **Step 3: Create grocery query hooks**

Create `frontend/src/hooks/use-grocery.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchGroceryList,
  toggleGroceryCheck,
  uncheckAllGrocery,
} from "@/api/client";

export function useGroceryList() {
  return useQuery({
    queryKey: ["grocery"],
    queryFn: fetchGroceryList,
  });
}

export function useToggleCheck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, checked }: { name: string; checked: boolean }) =>
      toggleGroceryCheck(name, checked),
    onMutate: async ({ name, checked }) => {
      await queryClient.cancelQueries({ queryKey: ["grocery"] });
      const previous = queryClient.getQueryData(["grocery"]);

      queryClient.setQueryData(
        ["grocery"],
        (old: ReturnType<typeof fetchGroceryList> extends Promise<infer T> ? T : never) =>
          old?.map((item) =>
            item.name === name ? { ...item, checked } : item
          )
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["grocery"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["grocery"] });
    },
  });
}

export function useUncheckAll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uncheckAllGrocery,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grocery"] });
    },
  });
}
```

- [ ] **Step 4: Commit**

```bash
cd ~/code/caitlin_decodes/list_it
git add frontend/src/stores/ frontend/src/hooks/
git commit -m "feat: add Zustand store with persisted unit preference and TanStack Query hooks"
```

---

## Task 14: Layout Components — Header & AppShell

**Files:**
- Create: `frontend/src/components/layout/header.tsx`
- Create: `frontend/src/components/layout/app-shell.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/main.tsx`

- [ ] **Step 1: Create Header**

Create `frontend/src/components/layout/header.tsx`:

```tsx
import { ShoppingBasket } from "lucide-react";

export function Header() {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4 md:px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <ShoppingBasket className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            ListIt
          </h1>
          <p className="text-xs text-muted-foreground">
            Plan meals, build your grocery list
          </p>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Create AppShell**

Create `frontend/src/components/layout/app-shell.tsx`:

```tsx
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
```

- [ ] **Step 3: Wire up App.tsx**

Replace `frontend/src/App.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { Header } from "@/components/layout/header";
import { AppShell } from "@/components/layout/app-shell";

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
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <AppShell />
      </div>
      <Toaster position="bottom-right" richColors />
    </QueryClientProvider>
  );
}

export default App;
```

- [ ] **Step 4: Clean up main.tsx**

Replace `frontend/src/main.tsx`:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 5: Commit**

Note: This will not compile yet because RecipeList and GroceryList components don't exist. That's expected — they're created in the next two tasks.

```bash
cd ~/code/caitlin_decodes/list_it
git add frontend/src/components/layout/ frontend/src/App.tsx frontend/src/main.tsx
git commit -m "feat: add Header, AppShell layout with responsive two-panel design"
```

---

## Task 15: Recipe Components

**Files:**
- Create: `frontend/src/components/recipes/add-recipe-dialog.tsx`
- Create: `frontend/src/components/recipes/recipe-card.tsx`
- Create: `frontend/src/components/recipes/recipe-list.tsx`

- [ ] **Step 1: Create AddRecipeDialog**

Create `frontend/src/components/recipes/add-recipe-dialog.tsx`:

```tsx
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
```

- [ ] **Step 2: Create RecipeCard**

Create `frontend/src/components/recipes/recipe-card.tsx`:

```tsx
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
```

- [ ] **Step 3: Create RecipeList**

Create `frontend/src/components/recipes/recipe-list.tsx`:

```tsx
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
```

- [ ] **Step 4: Commit**

```bash
cd ~/code/caitlin_decodes/list_it
git add frontend/src/components/recipes/
git commit -m "feat: add recipe components — list, card, add dialog with loading/empty states"
```

---

## Task 16: Grocery List Components

**Files:**
- Create: `frontend/src/components/grocery/grocery-item.tsx`
- Create: `frontend/src/components/grocery/grocery-list.tsx`

- [ ] **Step 1: Create GroceryItem**

Create `frontend/src/components/grocery/grocery-item.tsx`:

```tsx
import type { ConvertedGroceryItem } from "@/lib/unit-conversion";
import { useToggleCheck } from "@/hooks/use-grocery";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export function GroceryItem({ item }: { item: ConvertedGroceryItem }) {
  const toggleCheck = useToggleCheck();

  const handleToggle = () => {
    toggleCheck.mutate({ name: item.name, checked: !item.checked });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.15 }}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50 ${
        item.checked ? "opacity-50" : ""
      }`}
    >
      <Checkbox
        checked={item.checked}
        onCheckedChange={handleToggle}
        className="h-5 w-5"
      />
      <div className="flex flex-1 items-center gap-2">
        <span
          className={`text-sm ${
            item.checked
              ? "text-muted-foreground line-through"
              : "text-foreground"
          }`}
        >
          {item.name}
        </span>
        {item.recipeCount > 1 && (
          <Badge variant="outline" className="text-xs px-1.5 py-0">
            {item.recipeCount}
          </Badge>
        )}
      </div>
      {item.displayQuantity && (
        <span className="text-sm font-medium text-muted-foreground">
          {item.displayQuantity}
          {item.displayUnit ? ` ${item.displayUnit}` : ""}
        </span>
      )}
    </motion.div>
  );
}
```

- [ ] **Step 2: Create GroceryList**

Create `frontend/src/components/grocery/grocery-list.tsx`:

```tsx
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
```

- [ ] **Step 3: Verify frontend compiles**

```bash
cd ~/code/caitlin_decodes/list_it/frontend && npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 4: Commit**

```bash
cd ~/code/caitlin_decodes/list_it
git add frontend/src/components/grocery/
git commit -m "feat: add grocery list components with unit conversion toggle and check-off"
```

---

## Task 17: End-to-End Verification

- [ ] **Step 1: Start all services**

```bash
cd ~/code/caitlin_decodes/list_it && make setup
```

Expected: Postgres starts, backend deps install, DB created and migrated, frontend deps install.

- [ ] **Step 2: Start backend**

```bash
cd ~/code/caitlin_decodes/list_it/backend && make server &
```

Expected: Phoenix starts on port 4000.

- [ ] **Step 3: Start frontend**

```bash
cd ~/code/caitlin_decodes/list_it/frontend && make dev &
```

Expected: Vite starts on port 5173.

- [ ] **Step 4: Test API directly**

```bash
curl -s http://localhost:4000/api/recipes | python3 -m json.tool
```

Expected: `{"data": []}`

```bash
curl -s http://localhost:4000/api/grocery | python3 -m json.tool
```

Expected: `{"data": []}`

- [ ] **Step 5: Test adding a recipe via API**

```bash
curl -s -X POST http://localhost:4000/api/recipes \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.allrecipes.com/recipe/212721/indian-chicken-curry/"}' \
  | python3 -m json.tool
```

Expected: JSON response with recipe title, ingredients array populated.

- [ ] **Step 6: Verify grocery aggregation**

```bash
curl -s http://localhost:4000/api/grocery | python3 -m json.tool
```

Expected: JSON response with aggregated ingredients from the added recipe.

- [ ] **Step 7: Run backend tests**

```bash
cd ~/code/caitlin_decodes/list_it/backend && mix test
```

Expected: All tests pass.

- [ ] **Step 8: Verify frontend builds**

```bash
cd ~/code/caitlin_decodes/list_it/frontend && npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 9: Stop services**

```bash
cd ~/code/caitlin_decodes/list_it && make stop
```

- [ ] **Step 10: Final commit**

```bash
cd ~/code/caitlin_decodes/list_it
git add -A
git commit -m "chore: final verification — all tests pass, frontend builds"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** All spec sections covered — architecture, data model, API endpoints, scraping, parsing, unit conversion, UI layout, all component states
- [x] **No placeholders:** Every task has complete code, exact file paths, and runnable commands
- [x] **Type consistency:** `Recipe`, `Ingredient`, `GroceryItem` types match across API JSON views, TypeScript interfaces, and component props. `ConvertedGroceryItem` used consistently in grocery components. `UnitPreference` type used in store and conversion module.
- [x] **Unit conversion covered:** `unit-conversion.ts` (Task 12), Zustand persistence (Task 13), toggle UI in GroceryList (Task 16), formatting in GroceryItem (Task 16)
- [x] **Checked items in DB:** CheckedItem schema (Task 4), Grocery context (Task 8), API endpoint (Task 9), optimistic updates (Task 13), checkbox UI (Task 16)
- [x] **All Makefiles:** Root (Task 1), backend (Task 2), frontend (Task 10)
- [x] **Docker Compose:** Postgres 18 only (Task 1)
- [x] **TDD flow:** Tests written before implementation in Tasks 5-9
- [x] **Frontend libraries:** Tailwind v4, shadcn, Zustand, TanStack Query, Framer Motion, Lucide, Sonner, React Router v7 (all in Task 10)
