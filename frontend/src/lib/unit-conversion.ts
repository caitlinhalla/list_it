import type { GroceryItem } from "@/types";

export type UnitPreference = "imperial" | "metric";

type UnitCategory = "volume" | "weight" | "other";

interface UnitInfo {
  category: UnitCategory;
  toBase: number;
}

const UNIT_INFO: Record<string, UnitInfo> = {
  tsp: { category: "volume", toBase: 4.929 },
  tbsp: { category: "volume", toBase: 14.787 },
  "fl oz": { category: "volume", toBase: 29.574 },
  cup: { category: "volume", toBase: 236.588 },
  pint: { category: "volume", toBase: 473.176 },
  quart: { category: "volume", toBase: 946.353 },
  liter: { category: "volume", toBase: 1000 },
  gallon: { category: "volume", toBase: 3785.41 },
  ml: { category: "volume", toBase: 1 },
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
  const grouped = new Map<string, GroceryItem[]>();
  for (const item of items) {
    const existing = grouped.get(item.name) || [];
    existing.push(item);
    grouped.set(item.name, existing);
  }

  const result: ConvertedGroceryItem[] = [];

  for (const [name, group] of grouped) {
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

  result.sort((a, b) => a.name.localeCompare(b.name));
  return result;
}
