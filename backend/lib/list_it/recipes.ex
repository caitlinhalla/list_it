defmodule ListIt.Recipes do
  @moduledoc """
  Context for managing recipes and their ingredients.
  """

  import Ecto.Query
  alias ListIt.Repo
  alias ListIt.Recipes.{Recipe, Ingredient}
  alias ListIt.Parser.{Scraper, IngredientParser}

  def list_recipes do
    Recipe
    |> order_by(desc: :inserted_at)
    |> preload(:ingredients)
    |> Repo.all()
  end

  def get_recipe!(id) do
    Recipe
    |> preload(:ingredients)
    |> Repo.get!(id)
  end

  def create_recipe_from_url(url) do
    with {:ok, data} <- Scraper.scrape(url) do
      recipe_attrs = %{
        title: data.title,
        url: url,
        source_name: data.source_name,
        image_url: data.image_url,
        servings: data.servings,
        prep_time: data.prep_time,
        cook_time: data.cook_time
      }

      Ecto.Multi.new()
      |> Ecto.Multi.insert(:recipe, Recipe.changeset(%Recipe{}, recipe_attrs))
      |> Ecto.Multi.run(:ingredients, fn repo, %{recipe: recipe} ->
        ingredients =
          Enum.map(data.ingredients, fn raw_text ->
            parsed = IngredientParser.parse(raw_text)

            %Ingredient{}
            |> Ingredient.changeset(%{
              recipe_id: recipe.id,
              raw_text: parsed.raw_text,
              name: parsed.name,
              quantity: parsed.quantity,
              unit: parsed.unit
            })
            |> repo.insert!()
          end)

        {:ok, ingredients}
      end)
      |> Repo.transaction()
      |> case do
        {:ok, %{recipe: recipe, ingredients: ingredients}} ->
          {:ok, %{recipe | ingredients: ingredients}}

        {:error, :recipe, changeset, _} ->
          {:error, changeset}

        {:error, _step, reason, _} ->
          {:error, reason}
      end
    end
  end

  def delete_recipe(%Recipe{} = recipe) do
    Repo.delete(recipe)
  end

  def delete_recipe(id) when is_binary(id) do
    get_recipe!(id) |> Repo.delete()
  end
end
