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
