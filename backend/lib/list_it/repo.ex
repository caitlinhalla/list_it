defmodule ListIt.Repo do
  use Ecto.Repo,
    otp_app: :list_it,
    adapter: Ecto.Adapters.Postgres
end
