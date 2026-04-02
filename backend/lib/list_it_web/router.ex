defmodule ListItWeb.Router do
  use ListItWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/api", ListItWeb do
    pipe_through :api
  end
end
