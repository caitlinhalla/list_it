defmodule ListItWeb.RecipeController do
  use ListItWeb, :controller

  alias ListIt.Recipes
  action_fallback ListItWeb.FallbackController

  def index(conn, _params) do
    recipes = Recipes.list_recipes()
    render(conn, :index, recipes: recipes)
  end

  def create(conn, %{"url" => url}) do
    case Recipes.create_recipe_from_url(url) do
      {:ok, recipe} ->
        conn
        |> put_status(:created)
        |> render(:show, recipe: recipe)

      {:error, _} = error ->
        error
    end
  end

  def create(conn, _params) do
    conn
    |> put_status(:unprocessable_entity)
    |> json(%{errors: %{detail: "Missing required field: url"}})
  end

  def delete(conn, %{"id" => id}) do
    case Recipes.delete_recipe(id) do
      {:ok, _} ->
        send_resp(conn, :no_content, "")

      {:error, _} = error ->
        error
    end
  end
end
