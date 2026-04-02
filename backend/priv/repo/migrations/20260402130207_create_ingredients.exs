defmodule ListIt.Repo.Migrations.CreateIngredients do
  use Ecto.Migration

  def change do
    create table(:ingredients, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :recipe_id, references(:recipes, type: :binary_id, on_delete: :delete_all), null: false
      add :raw_text, :text, null: false
      add :name, :text, null: false
      add :quantity, :float
      add :unit, :text

      add :inserted_at, :utc_datetime, null: false, default: fragment("now()")
    end

    create index(:ingredients, [:recipe_id])
    create index(:ingredients, [:name])
  end
end
