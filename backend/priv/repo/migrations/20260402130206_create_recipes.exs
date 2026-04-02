defmodule ListIt.Repo.Migrations.CreateRecipes do
  use Ecto.Migration

  def change do
    create table(:recipes, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :title, :text, null: false
      add :url, :text, null: false
      add :source_name, :text
      add :image_url, :text
      add :servings, :text
      add :prep_time, :text
      add :cook_time, :text
      timestamps(type: :utc_datetime)
    end

    create unique_index(:recipes, [:url])
  end
end
