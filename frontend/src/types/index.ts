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
