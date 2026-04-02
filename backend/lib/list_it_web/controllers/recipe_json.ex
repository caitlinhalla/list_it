defmodule ListItWeb.RecipeJSON do
  alias ListIt.Recipes.{Recipe, Ingredient}

  def index(%{recipes: recipes}) do
    %{data: Enum.map(recipes, &recipe_data/1)}
  end

  def show(%{recipe: recipe}) do
    %{data: recipe_data(recipe)}
  end

  defp recipe_data(%Recipe{} = recipe) do
    %{
      id: recipe.id,
      title: recipe.title,
      url: recipe.url,
      source_name: recipe.source_name,
      image_url: recipe.image_url,
      servings: recipe.servings,
      prep_time: recipe.prep_time,
      cook_time: recipe.cook_time,
      ingredients: Enum.map(recipe.ingredients, &ingredient_data/1),
      inserted_at: recipe.inserted_at
    }
  end

  defp ingredient_data(%Ingredient{} = ingredient) do
    %{
      id: ingredient.id,
      raw_text: ingredient.raw_text,
      name: ingredient.name,
      quantity: ingredient.quantity,
      unit: ingredient.unit
    }
  end
end
