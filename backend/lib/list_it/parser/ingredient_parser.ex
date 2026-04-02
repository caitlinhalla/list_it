defmodule ListIt.Parser.IngredientParser do
  @moduledoc """
  Parses ingredient strings like "2 1/2 cups all-purpose flour" into structured data.
  """

  @units %{
    # Volume
    "cup" => "cup", "cups" => "cup", "c" => "cup",
    "tablespoon" => "tbsp", "tablespoons" => "tbsp", "tbsp" => "tbsp", "tbs" => "tbsp", "tb" => "tbsp",
    "teaspoon" => "tsp", "teaspoons" => "tsp", "tsp" => "tsp",
    "fluid ounce" => "fl oz", "fluid ounces" => "fl oz", "fl oz" => "fl oz",
    "milliliter" => "ml", "milliliters" => "ml", "ml" => "ml",
    "liter" => "liter", "liters" => "liter", "l" => "liter",
    "gallon" => "gallon", "gallons" => "gallon",
    "quart" => "quart", "quarts" => "quart", "qt" => "quart",
    "pint" => "pint", "pints" => "pint", "pt" => "pint",
    # Weight
    "ounce" => "oz", "ounces" => "oz", "oz" => "oz",
    "pound" => "lb", "pounds" => "lb", "lb" => "lb", "lbs" => "lb",
    "gram" => "g", "grams" => "g", "g" => "g",
    "kilogram" => "kg", "kilograms" => "kg", "kg" => "kg",
    # Count/packaging
    "can" => "can", "cans" => "can",
    "jar" => "jar", "jars" => "jar",
    "package" => "package", "packages" => "package", "pkg" => "package",
    "bag" => "bag", "bags" => "bag",
    "box" => "box", "boxes" => "box",
    "bunch" => "bunch", "bunches" => "bunch",
    "head" => "head", "heads" => "head",
    "clove" => "clove", "cloves" => "clove",
    "slice" => "slice", "slices" => "slice",
    "piece" => "piece", "pieces" => "piece",
    "stick" => "stick", "sticks" => "stick",
    "sprig" => "sprig", "sprigs" => "sprig",
    "pinch" => "pinch", "dash" => "dash", "handful" => "handful",
    "large" => "large", "medium" => "medium", "small" => "small"
  }

  @unicode_fractions %{
    "½" => 0.5, "⅓" => 0.333, "⅔" => 0.667,
    "¼" => 0.25, "¾" => 0.75,
    "⅕" => 0.2, "⅖" => 0.4, "⅗" => 0.6, "⅘" => 0.8,
    "⅙" => 0.167, "⅚" => 0.833,
    "⅛" => 0.125, "⅜" => 0.375, "⅝" => 0.625, "⅞" => 0.875
  }

  @type parsed :: %{
          name: String.t(),
          quantity: float() | nil,
          unit: String.t() | nil,
          raw_text: String.t()
        }

  @spec parse(String.t()) :: parsed()
  def parse(text) when is_binary(text) do
    raw_text = text
    text = clean(text)

    {quantity, text} = extract_quantity(text)
    {unit, text} = extract_unit(text)
    name = normalize_name(text)

    %{
      name: name,
      quantity: quantity,
      unit: unit,
      raw_text: raw_text
    }
  end

  defp clean(text) do
    text
    |> String.replace(~r/<[^>]+>/, "")
    |> String.replace(~r/\([^)]*oz[^)]*\)/, "")
    |> String.replace(~r/\([^)]*ounce[^)]*\)/, "")
    |> String.trim()
  end

  defp extract_quantity(text) do
    text = replace_unicode_fractions(text)

    cond do
      match = Regex.run(~r/^(\d+)\s+(\d+)\/(\d+)\s*(.*)$/, text) ->
        [_, whole, num, den, rest] = match
        qty = String.to_integer(whole) + String.to_integer(num) / String.to_integer(den)
        {Float.round(qty, 3), String.trim(rest)}

      match = Regex.run(~r/^(\d+)\/(\d+)\s*(.*)$/, text) ->
        [_, num, den, rest] = match
        qty = String.to_integer(num) / String.to_integer(den)
        {Float.round(qty, 3), String.trim(rest)}

      match = Regex.run(~r/^(\d+\.?\d*)\s*(.*)$/, text) ->
        [_, num, rest] = match
        {parse_number(num), String.trim(rest)}

      true ->
        {nil, text}
    end
  end

  defp replace_unicode_fractions(text) do
    Enum.reduce(@unicode_fractions, text, fn {char, value}, acc ->
      acc = Regex.replace(~r/(\d)#{Regex.escape(char)}/, acc, fn _, whole ->
        "#{String.to_integer(whole) + value}"
      end)

      String.replace(acc, char, "#{value}")
    end)
  end

  defp parse_number(str) do
    if String.contains?(str, ".") do
      {f, _} = Float.parse(str)
      Float.round(f, 3)
    else
      String.to_integer(str) * 1.0
    end
  end

  defp extract_unit(text) do
    lower = String.downcase(text)

    multi_word_match =
      @units
      |> Map.keys()
      |> Enum.filter(&String.contains?(&1, " "))
      |> Enum.sort_by(&(-String.length(&1)))
      |> Enum.find(fn unit ->
        String.starts_with?(lower, unit <> " ") or lower == unit
      end)

    if multi_word_match do
      canonical = Map.get(@units, multi_word_match)
      rest = String.slice(text, String.length(multi_word_match)..-1//1) |> String.trim()
      {canonical, rest}
    else
      case Regex.run(~r/^(\S+)\s+(.+)$/, text) do
        [_, first_word, rest] ->
          key = String.downcase(first_word) |> String.replace(~r/[.,]$/, "")

          case Map.get(@units, key) do
            nil -> {nil, text}
            canonical -> {canonical, rest}
          end

        _ ->
          key = String.downcase(text) |> String.trim() |> String.replace(~r/[.,]$/, "")

          case Map.get(@units, key) do
            nil -> {nil, text}
            canonical -> {canonical, ""}
          end
      end
    end
  end

  defp normalize_name(text) do
    text
    |> String.downcase()
    |> String.replace(~r/[,.]$/, "")
    |> String.replace(~r/\s+/, " ")
    |> String.trim()
    |> case do
      "" -> "unknown"
      name -> name
    end
  end
end
