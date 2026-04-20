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
