defmodule ListItWeb.GroceryJSON do
  def index(%{items: items}) do
    %{data: Enum.map(items, &item_data/1)}
  end

  defp item_data(item) do
    %{
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      checked: item.checked,
      recipe_count: item.recipe_count
    }
  end
end
