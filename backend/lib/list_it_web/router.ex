defmodule ListItWeb.Router do
  use ListItWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/api", ListItWeb do
    pipe_through :api

    resources "/recipes", RecipeController, only: [:index, :create, :delete]
    get "/grocery", GroceryController, :index
    put "/grocery/check", GroceryController, :check
    delete "/grocery/checked", GroceryController, :uncheck_all
  end
end
