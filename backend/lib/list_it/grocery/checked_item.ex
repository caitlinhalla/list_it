defmodule ListIt.Grocery.CheckedItem do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "checked_items" do
    field :name, :string
    field :checked, :boolean, default: false
    timestamps(type: :utc_datetime)
  end

  def changeset(checked_item, attrs) do
    checked_item
    |> cast(attrs, [:name, :checked])
    |> validate_required([:name, :checked])
    |> unique_constraint(:name)
  end
end
