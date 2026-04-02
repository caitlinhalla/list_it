defmodule ListItWeb.FallbackController do
  use ListItWeb, :controller

  def call(conn, {:error, %Ecto.Changeset{} = changeset}) do
    conn
    |> put_status(:unprocessable_entity)
    |> put_view(json: ListItWeb.ErrorJSON)
    |> render("error.json", changeset: changeset)
  end

  def call(conn, {:error, message}) when is_binary(message) do
    conn
    |> put_status(:unprocessable_entity)
    |> json(%{errors: %{detail: message}})
  end
end
