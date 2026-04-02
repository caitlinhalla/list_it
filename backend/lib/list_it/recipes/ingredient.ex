defmodule ListIt.Recipes.Ingredient do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "ingredients" do
    field :raw_text, :string
    field :name, :string
    field :quantity, :float
    field :unit, :string
    belongs_to :recipe, ListIt.Recipes.Recipe

    field :inserted_at, :utc_datetime, read_after_writes: true
  end

  def changeset(ingredient, attrs) do
    ingredient
    |> cast(attrs, [:raw_text, :name, :quantity, :unit, :recipe_id])
    |> validate_required([:raw_text, :name, :recipe_id])
    |> foreign_key_constraint(:recipe_id)
  end
end
