defmodule ListIt.Repo.Migrations.CreateCheckedItems do
  use Ecto.Migration

  def change do
    create table(:checked_items, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :name, :text, null: false
      add :checked, :boolean, null: false, default: false
      timestamps(type: :utc_datetime)
    end

    create unique_index(:checked_items, [:name])
  end
end
