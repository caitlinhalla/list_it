defmodule ListItWeb.GroceryController do
  use ListItWeb, :controller

  alias ListIt.Grocery
  action_fallback ListItWeb.FallbackController

  def index(conn, _params) do
    items = Grocery.get_grocery_list()
    render(conn, :index, items: items)
  end

  def check(conn, %{"name" => name, "checked" => checked})
      when is_binary(name) and is_boolean(checked) do
    case Grocery.toggle_check(name, checked) do
      {:ok, item} ->
        json(conn, %{data: %{name: item.name, checked: item.checked}})

      {:error, _} = error ->
        error
    end
  end

  def check(conn, _params) do
    conn
    |> put_status(:unprocessable_entity)
    |> json(%{errors: %{detail: "Missing required fields: name (string), checked (boolean)"}})
  end

  def uncheck_all(conn, _params) do
    {:ok, _count} = Grocery.uncheck_all()
    send_resp(conn, :no_content, "")
  end
end
