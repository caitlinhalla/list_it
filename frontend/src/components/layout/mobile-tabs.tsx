import { NavLink } from "react-router-dom";
import { Home, BookOpen, ShoppingBasket } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/",        label: "Home",    icon: Home },
  { to: "/grocery", label: "This week", icon: ShoppingBasket },
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
