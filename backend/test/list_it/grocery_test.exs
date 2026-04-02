defmodule ListIt.GroceryTest do
  use ListIt.DataCase, async: true

  alias ListIt.Grocery
  alias ListIt.Recipes.{Recipe, Ingredient}
  alias ListIt.Grocery.CheckedItem
  alias ListIt.Repo

  defp create_recipe(attrs \\ %{}) do
    default = %{
      title: "Recipe",
      url: "https://example.com/r-#{System.unique_integer([:positive])}",
      source_name: "example.com"
    }

    {:ok, recipe} =
      %Recipe{}
      |> Recipe.changeset(Map.merge(default, attrs))
      |> Repo.insert()

    recipe
  end

  defp add_ingredient(recipe, name, quantity, unit) do
    {:ok, ingredient} =
      %Ingredient{}
      |> Ingredient.changeset(%{
        recipe_id: recipe.id,
        raw_text: "#{quantity} #{unit} #{name}",
        name: name,
        quantity: quantity,
        unit: unit
      })
      |> Repo.insert()

    ingredient
  end

  describe "get_grocery_list/0" do
    test "returns empty list when no recipes" do
      assert Grocery.get_grocery_list() == []
    end

    test "aggregates quantities for same name and unit" do
      r1 = create_recipe(%{title: "R1"})
      r2 = create_recipe(%{title: "R2"})
      add_ingredient(r1, "flour", 2.0, "cup")
      add_ingredient(r2, "flour", 1.0, "cup")

      list = Grocery.get_grocery_list()
      flour = Enum.find(list, &(&1.name == "flour"))
      assert flour.quantity == 3.0
      assert flour.unit == "cup"
      assert flour.recipe_count == 2
    end

    test "keeps different units as separate items" do
      r1 = create_recipe(%{title: "R1"})
      add_ingredient(r1, "butter", 2.0, "tbsp")
      add_ingredient(r1, "butter", 1.0, "stick")

      list = Grocery.get_grocery_list()
      butter_items = Enum.filter(list, &(&1.name == "butter"))
      assert length(butter_items) == 2
    end

    test "includes checked state from checked_items" do
      r1 = create_recipe()
      add_ingredient(r1, "salt", 1.0, "tsp")
      Grocery.toggle_check("salt", true)

      list = Grocery.get_grocery_list()
      salt = Enum.find(list, &(&1.name == "salt"))
      assert salt.checked == true
    end

    test "unchecked by default" do
      r1 = create_recipe()
      add_ingredient(r1, "pepper", 0.5, "tsp")

      list = Grocery.get_grocery_list()
      pepper = Enum.find(list, &(&1.name == "pepper"))
      assert pepper.checked == false
    end

    test "handles null quantities" do
      r1 = create_recipe()
      add_ingredient(r1, "salt and pepper", nil, nil)

      list = Grocery.get_grocery_list()
      item = Enum.find(list, &(&1.name == "salt and pepper"))
      assert item.quantity == nil
      assert item.unit == nil
      assert item.recipe_count == 1
    end

    test "ordered by name" do
      r1 = create_recipe()
      add_ingredient(r1, "zucchini", 1.0, nil)
      add_ingredient(r1, "apple", 2.0, nil)

      list = Grocery.get_grocery_list()
      names = Enum.map(list, & &1.name)
      assert names == ["apple", "zucchini"]
    end
  end

  describe "toggle_check/2" do
    test "creates checked_item when it does not exist" do
      assert {:ok, item} = Grocery.toggle_check("flour", true)
      assert item.name == "flour"
      assert item.checked == true
    end

    test "updates existing checked_item" do
      {:ok, _} = Grocery.toggle_check("flour", true)
      {:ok, item} = Grocery.toggle_check("flour", false)
      assert item.checked == false
    end
  end

  describe "uncheck_all/0" do
    test "deletes all checked items" do
      Grocery.toggle_check("a", true)
      Grocery.toggle_check("b", true)
      assert {:ok, 2} = Grocery.uncheck_all()
      assert Repo.all(CheckedItem) == []
    end

    test "returns 0 when nothing to uncheck" do
      assert {:ok, 0} = Grocery.uncheck_all()
    end
  end
end
