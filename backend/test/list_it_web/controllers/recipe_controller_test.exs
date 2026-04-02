defmodule ListItWeb.RecipeControllerTest do
  use ListItWeb.ConnCase, async: true

  alias ListIt.Recipes.{Recipe, Ingredient}
  alias ListIt.Repo

  defp create_recipe_with_ingredients do
    {:ok, recipe} =
      %Recipe{}
      |> Recipe.changeset(%{
        title: "Test Recipe",
        url: "https://example.com/r-#{System.unique_integer([:positive])}",
        source_name: "example.com"
      })
      |> Repo.insert()

    {:ok, _} =
      %Ingredient{}
      |> Ingredient.changeset(%{
        recipe_id: recipe.id,
        raw_text: "2 cups flour",
        name: "flour",
        quantity: 2.0,
        unit: "cup"
      })
      |> Repo.insert()

    Repo.preload(recipe, :ingredients)
  end

  describe "GET /api/recipes" do
    test "returns empty list", %{conn: conn} do
      conn = get(conn, "/api/recipes")
      assert json_response(conn, 200)["data"] == []
    end

    test "returns recipes with ingredients", %{conn: conn} do
      create_recipe_with_ingredients()
      conn = get(conn, "/api/recipes")
      data = json_response(conn, 200)["data"]
      assert length(data) == 1
      assert hd(data)["title"] == "Test Recipe"
      assert length(hd(data)["ingredients"]) == 1
    end
  end

  describe "POST /api/recipes" do
    test "returns error for missing url", %{conn: conn} do
      conn = post(conn, "/api/recipes", %{})
      assert json_response(conn, 422)["errors"]["detail"] =~ "Missing"
    end
  end

  describe "DELETE /api/recipes/:id" do
    test "deletes a recipe", %{conn: conn} do
      recipe = create_recipe_with_ingredients()
      conn = delete(conn, "/api/recipes/#{recipe.id}")
      assert response(conn, 204)
    end
  end
end
