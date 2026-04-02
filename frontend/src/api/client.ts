import type { Recipe, GroceryItem } from "@/types";

const API_BASE = "/api";

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message =
      body?.errors?.detail ||
      body?.errors?.url?.[0] ||
      `Request failed: ${res.status}`;
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return res.json().then((body) => body.data);
}

export function fetchRecipes(): Promise<Recipe[]> {
  return request<Recipe[]>("/recipes");
}

export function createRecipe(url: string): Promise<Recipe> {
  return request<Recipe>("/recipes", {
    method: "POST",
    body: JSON.stringify({ url }),
  });
}

export function deleteRecipe(id: string): Promise<void> {
  return request<void>(`/recipes/${id}`, { method: "DELETE" });
}

export function fetchGroceryList(): Promise<GroceryItem[]> {
  return request<GroceryItem[]>("/grocery");
}

export function toggleGroceryCheck(
  name: string,
  checked: boolean
): Promise<void> {
  return request<void>("/grocery/check", {
    method: "PUT",
    body: JSON.stringify({ name, checked }),
  });
}

export function uncheckAllGrocery(): Promise<void> {
  return request<void>("/grocery/checked", { method: "DELETE" });
}
