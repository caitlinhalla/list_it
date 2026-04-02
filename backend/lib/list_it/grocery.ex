defmodule ListIt.Grocery do
  @moduledoc """
  Context for the aggregated grocery list.
  Computes the list from all recipe ingredients, joined with checked state.
  """

  import Ecto.Query
  alias ListIt.Repo
  alias ListIt.Recipes.Ingredient
  alias ListIt.Grocery.CheckedItem

  def get_grocery_list do
    ingredients =
      Ingredient
      |> group_by([i], [i.name, i.unit])
      |> select([i], %{
        name: i.name,
        unit: i.unit,
        quantity: sum(i.quantity),
        recipe_count: count(i.id)
      })
      |> order_by([i], asc: i.name)
      |> Repo.all()

    checked_names =
      CheckedItem
      |> where([c], c.checked == true)
      |> select([c], c.name)
      |> Repo.all()
      |> MapSet.new()

    Enum.map(ingredients, fn item ->
      Map.put(item, :checked, MapSet.member?(checked_names, item.name))
    end)
  end

  def toggle_check(name, checked) when is_binary(name) and is_boolean(checked) do
    case Repo.get_by(CheckedItem, name: name) do
      nil ->
        %CheckedItem{}
        |> CheckedItem.changeset(%{name: name, checked: checked})
        |> Repo.insert()

      existing ->
        existing
        |> CheckedItem.changeset(%{checked: checked})
        |> Repo.update()
    end
  end

  def uncheck_all do
    {count, _} = Repo.delete_all(CheckedItem)
    {:ok, count}
  end
end
