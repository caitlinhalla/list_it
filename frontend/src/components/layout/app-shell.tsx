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
