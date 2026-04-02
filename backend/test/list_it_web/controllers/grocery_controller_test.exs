defmodule ListItWeb.GroceryControllerTest do
  use ListItWeb.ConnCase, async: true

  alias ListIt.Recipes.{Recipe, Ingredient}
  alias ListIt.Repo

  defp seed_grocery_data do
    {:ok, recipe} =
      %Recipe{}
      |> Recipe.changeset(%{
        title: "Recipe",
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

    recipe
  end

  describe "GET /api/grocery" do
    test "returns empty list", %{conn: conn} do
      conn = get(conn, "/api/grocery")
      assert json_response(conn, 200)["data"] == []
    end

    test "returns aggregated items", %{conn: conn} do
      seed_grocery_data()
      conn = get(conn, "/api/grocery")
      data = json_response(conn, 200)["data"]
      assert length(data) == 1
      assert hd(data)["name"] == "flour"
      assert hd(data)["quantity"] == 2.0
    end
  end

  describe "PUT /api/grocery/check" do
    test "toggles check state", %{conn: conn} do
      conn = put(conn, "/api/grocery/check", %{name: "flour", checked: true})
      data = json_response(conn, 200)["data"]
      assert data["name"] == "flour"
      assert data["checked"] == true
    end

    test "returns error for missing params", %{conn: conn} do
      conn = put(conn, "/api/grocery/check", %{})
      assert json_response(conn, 422)["errors"]["detail"] =~ "Missing"
    end
  end

  describe "DELETE /api/grocery/checked" do
    test "clears all checked items", %{conn: conn} do
      put(conn, "/api/grocery/check", %{name: "flour", checked: true})
      conn = delete(conn, "/api/grocery/checked")
      assert response(conn, 204)
    end
  end
end
