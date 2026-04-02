defmodule ListIt.RecipesTest do
  use ListIt.DataCase, async: true

  alias ListIt.Recipes
  alias ListIt.Recipes.{Recipe, Ingredient}
  alias ListIt.Repo

  defp create_recipe_directly(attrs \\ %{}) do
    default = %{
      title: "Test Recipe",
      url: "https://example.com/recipe-#{System.unique_integer([:positive])}",
      source_name: "example.com"
    }

    {:ok, recipe} =
      %Recipe{}
      |> Recipe.changeset(Map.merge(default, attrs))
      |> Repo.insert()

    recipe
  end

  defp create_ingredient(recipe, attrs) do
    default = %{
      recipe_id: recipe.id,
      raw_text: attrs[:raw_text] || "#{attrs[:quantity]} #{attrs[:unit]} #{attrs[:name]}",
      name: attrs[:name] || "ingredient",
      quantity: attrs[:quantity],
      unit: attrs[:unit]
    }

    {:ok, ingredient} =
      %Ingredient{}
      |> Ingredient.changeset(Map.merge(default, attrs))
      |> Repo.insert()

    ingredient
  end

  describe "list_recipes/0" do
    test "returns all recipes ordered by newest first" do
      r1 = create_recipe_directly(%{title: "First"})
      r2 = create_recipe_directly(%{title: "Second"})

      recipes = Recipes.list_recipes()
      assert length(recipes) == 2
      assert hd(recipes).id == r2.id
    end

    test "preloads ingredients" do
      recipe = create_recipe_directly()
      create_ingredient(recipe, %{name: "flour", quantity: 2.0, unit: "cup"})

      [loaded] = Recipes.list_recipes()
      assert length(loaded.ingredients) == 1
      assert hd(loaded.ingredients).name == "flour"
    end

    test "returns empty list when no recipes" do
      assert Recipes.list_recipes() == []
    end
  end

  describe "get_recipe!/1" do
    test "returns recipe with ingredients" do
      recipe = create_recipe_directly()
      create_ingredient(recipe, %{name: "salt", quantity: 1.0, unit: "tsp"})

      loaded = Recipes.get_recipe!(recipe.id)
      assert loaded.title == recipe.title
      assert length(loaded.ingredients) == 1
    end

    test "raises on missing id" do
      assert_raise Ecto.NoResultsError, fn ->
        Recipes.get_recipe!(Ecto.UUID.generate())
      end
    end
  end

  describe "delete_recipe/1" do
    test "deletes recipe and cascades to ingredients" do
      recipe = create_recipe_directly()
      create_ingredient(recipe, %{name: "egg", quantity: 2.0, unit: nil})

      assert {:ok, _} = Recipes.delete_recipe(recipe)
      assert Recipes.list_recipes() == []
      assert Repo.all(Ingredient) == []
    end

    test "deletes by id" do
      recipe = create_recipe_directly()
      assert {:ok, _} = Recipes.delete_recipe(recipe.id)
      assert Recipes.list_recipes() == []
    end
  end
end
