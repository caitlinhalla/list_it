# ListIt

A meal planning & grocery shopping app that scrapes recipes and builds smart grocery lists.

Paste a recipe URL and ListIt extracts ingredients via JSON-LD structured data, parses quantities and units, and aggregates everything into a unified grocery list. Toggle between metric and imperial units instantly — conversion happens entirely client-side with no API refetch. Built with a Phoenix API backend and React SPA frontend.

![ListIt screenshot](docs/screenshot.png)

## Features

- **Recipe scraping** — paste a URL, extracts recipe data via JSON-LD structured data
- **Ingredient parsing** — handles fractions, Unicode characters, and unit normalization across 60+ unit variants
- **Smart aggregation** — combines duplicate ingredients across recipes and sums quantities with compatible units
- **Unit conversion** — client-side metric/imperial toggle with instant re-render, no API refetch
- **Check-off workflow** — track grocery shopping progress with a visual progress bar

## Tech Stack

| Layer | Tech |
|---|---|
| **Backend** | Elixir, Phoenix 1.8 (API-only), Ecto, Postgres 18 |
| **Scraping** | Req (HTTP), Floki (HTML/JSON-LD parsing) |
| **Frontend** | React 19, TypeScript, Vite |
| **Styling** | Tailwind CSS v4, shadcn/ui (New York/zinc) |
| **State** | Zustand (UI state), TanStack Query (server state) |
| **UX** | Framer Motion, Sonner (toasts), Lucide icons |
| **Infra** | Docker Compose (Postgres), Makefiles |

## Architecture Overview

ListIt is a monorepo with `backend/` (Phoenix JSON API) and `frontend/` (React SPA). The backend is API-only — no HTML rendering, LiveView, or Mailer. Unit conversion is entirely client-side: the API stores quantities in canonical units and the frontend converts at display time based on a user preference persisted in localStorage via Zustand. Vite proxies `/api` requests to Phoenix in development. The UI uses a two-panel responsive layout with recipes on the left (~60%) and the grocery list on the right (~40%), switching to a tab toggle on mobile.

## Getting Started

### Prerequisites

- Elixir 1.18+ / Erlang 27+ (via Homebrew)
- Node.js
- Docker

### Setup & Run

```sh
make setup    # starts Postgres, installs deps, creates/migrates DB
make start    # starts backend (port 4000) + frontend (Vite dev server)
make stop     # stops everything
```

### Other Commands

```sh
make test      # run backend tests
make db-reset  # drop and recreate database
make clean     # remove build artifacts and node_modules
```

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/recipes` | List all recipes with ingredients |
| `POST` | `/api/recipes` | Scrape a recipe URL and create it |
| `DELETE` | `/api/recipes/:id` | Delete a recipe (cascades to ingredients) |
| `GET` | `/api/grocery` | Aggregated grocery list |
| `PUT` | `/api/grocery/check` | Toggle an item's checked state |
| `DELETE` | `/api/grocery/checked` | Clear all checked items |

## Project Structure

```
list_it/
├── backend/                  # Phoenix API
│   ├── lib/list_it/
│   │   ├── recipes.ex        # Recipe context
│   │   ├── grocery.ex        # Grocery aggregation context
│   │   └── parser/           # Scraper + ingredient parser
│   └── test/
├── frontend/                 # React SPA
│   └── src/
│       ├── api/              # API client
│       ├── components/       # UI components (recipes/, grocery/, layout/)
│       ├── hooks/            # TanStack Query hooks
│       ├── stores/           # Zustand store
│       └── lib/              # Unit conversion module
├── docker-compose.yml        # Postgres 18
└── Makefile                  # Root orchestration
```
