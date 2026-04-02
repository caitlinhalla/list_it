defmodule ListIt.Recipes.Recipe do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "recipes" do
    field :title, :string
    field :url, :string
    field :source_name, :string
    field :image_url, :string
    field :servings, :string
    field :prep_time, :string
    field :cook_time, :string
    has_many :ingredients, ListIt.Recipes.Ingredient
    timestamps(type: :utc_datetime_usec)
  end

  def changeset(recipe, attrs) do
    recipe
    |> cast(attrs, [:title, :url, :source_name, :image_url, :servings, :prep_time, :cook_time])
    |> validate_required([:title, :url])
    |> unique_constraint(:url)
  end
end
