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
