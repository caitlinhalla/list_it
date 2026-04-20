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
