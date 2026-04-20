export type AisleKey = "produce" | "meat" | "dairy" | "pantry" | "frozen";

export interface Aisle {
  key: AisleKey;
  label: string;
  icon: string;
  note: string;
}

export const AISLES: Aisle[] = [
  { key: "produce", label: "Produce",      icon: "🥬", note: "from the market" },
  { key: "meat",    label: "Meat & Fish",  icon: "🐓", note: "butcher counter" },
  { key: "dairy",   label: "Dairy & Eggs", icon: "🥚", note: "refrigerated" },
  { key: "pantry",  label: "Pantry",       icon: "🫙", note: "center aisles" },
  { key: "frozen",  label: "Frozen",       icon: "❄️", note: "freezer" },
];

// Keywords matched as substrings against lowercased ingredient name.
// Order matters only across categories (first match wins), not within a category.
const KEYWORDS: Record<AisleKey, string[]> = {
  produce: [
    "lettuce", "spinach", "kale", "arugula", "chard", "cabbage", "bok choy",
    "onion", "shallot", "garlic", "scallion", "leek", "chive",
    "tomato", "cucumber", "pepper", "chili", "jalapeno", "jalapeño",
    "carrot", "celery", "radish", "beet", "turnip", "parsnip",
    "potato", "sweet potato", "yam",
    "squash", "zucchini", "pumpkin", "eggplant",
    "broccoli", "cauliflower", "asparagus", "brussels",
    "mushroom",
    "avocado", "lemon", "lime", "orange", "grapefruit",
    "apple", "pear", "banana", "berry", "berries", "strawberr", "blueberr", "raspberr",
    "grape", "melon", "peach", "plum", "cherry", "pomegranate",
    "parsley", "cilantro", "basil", "mint", "thyme", "rosemary", "dill", "sage", "oregano",
    "ginger",
    "corn", "cucumb", "pea", "bean sprout", "green bean",
  ],
  meat: [
    "chicken", "turkey", "duck", "poultry",
    "beef", "steak", "ground beef", "brisket", "roast", "chuck",
    "pork", "bacon", "ham", "sausage", "prosciutto",
    "lamb",
    "salmon", "tuna", "cod", "halibut", "tilapia", "trout", "fish",
    "shrimp", "scallop", "crab", "lobster", "mussel", "clam", "oyster",
  ],
  dairy: [
    "milk", "cream", "half and half", "half-and-half",
    "butter", "ghee",
    "yogurt", "yoghurt", "kefir",
    "cheese", "parmesan", "cheddar", "mozzarella", "feta", "ricotta", "cotija", "goat cheese",
    "egg", "eggs",
    "tofu", "tempeh",
  ],
  frozen: [
    "frozen", "ice cream", "popsicle", "frozen peas", "frozen corn",
  ],
  pantry: [], // fallback
};

export function classifyAisle(name: string): AisleKey {
  const n = name.toLowerCase().trim();
  // Order across categories matters — first match wins.
  // frozen first so "frozen peas" beats "pea" in produce.
  // produce before dairy so "eggplant" beats "egg" and "butter lettuce" beats "butter".
  for (const aisle of ["frozen", "meat", "produce", "dairy"] as AisleKey[]) {
    for (const kw of KEYWORDS[aisle]) {
      if (n.includes(kw)) return aisle;
    }
  }
  return "pantry";
}

export function aisleByKey(key: AisleKey): Aisle {
  return AISLES.find((a) => a.key === key)!;
}
