defmodule ListIt.Parser.IngredientParserTest do
  use ExUnit.Case, async: true

  alias ListIt.Parser.IngredientParser

  describe "parse/1" do
    test "simple quantity and unit" do
      result = IngredientParser.parse("2 cups flour")
      assert result.quantity == 2.0
      assert result.unit == "cup"
      assert result.name == "flour"
      assert result.raw_text == "2 cups flour"
    end

    test "simple fraction" do
      result = IngredientParser.parse("1/2 teaspoon salt")
      assert result.quantity == 0.5
      assert result.unit == "tsp"
      assert result.name == "salt"
    end

    test "mixed number" do
      result = IngredientParser.parse("1 1/2 cups sugar")
      assert result.quantity == 1.5
      assert result.unit == "cup"
      assert result.name == "sugar"
    end

    test "no quantity — freeform text" do
      result = IngredientParser.parse("salt and pepper to taste")
      assert result.quantity == nil
      assert result.unit == nil
      assert result.name == "salt and pepper to taste"
    end

    test "parenthetical ounce annotation stripped" do
      result = IngredientParser.parse("1 (14 oz) can tomatoes")
      assert result.quantity == 1.0
      assert result.unit == "can"
      assert result.name == "tomatoes"
    end

    test "unicode fraction standalone" do
      result = IngredientParser.parse("½ cup milk")
      assert result.quantity == 0.5
      assert result.unit == "cup"
      assert result.name == "milk"
    end

    test "unicode fraction attached to whole number" do
      result = IngredientParser.parse("1½ cups cream")
      assert result.quantity == 1.5
      assert result.unit == "cup"
      assert result.name == "cream"
    end

    test "decimal quantity" do
      result = IngredientParser.parse("2.5 oz cheddar cheese")
      assert result.quantity == 2.5
      assert result.unit == "oz"
      assert result.name == "cheddar cheese"
    end

    test "plural unit normalized to singular" do
      result = IngredientParser.parse("3 tablespoons butter")
      assert result.quantity == 3.0
      assert result.unit == "tbsp"
      assert result.name == "butter"
    end

    test "weight unit" do
      result = IngredientParser.parse("1 pound ground beef")
      assert result.quantity == 1.0
      assert result.unit == "lb"
      assert result.name == "ground beef"
    end

    test "metric unit" do
      result = IngredientParser.parse("500 grams chicken breast")
      assert result.quantity == 500.0
      assert result.unit == "g"
      assert result.name == "chicken breast"
    end

    test "multi-word unit" do
      result = IngredientParser.parse("2 fluid ounces cream")
      assert result.quantity == 2.0
      assert result.unit == "fl oz"
      assert result.name == "cream"
    end

    test "count unit" do
      result = IngredientParser.parse("3 cloves garlic")
      assert result.quantity == 3.0
      assert result.unit == "clove"
      assert result.name == "garlic"
    end

    test "quantity only, no unit" do
      result = IngredientParser.parse("4 eggs")
      assert result.quantity == 4.0
      assert result.unit == nil
      assert result.name == "eggs"
    end

    test "HTML tags stripped" do
      result = IngredientParser.parse("<b>2 cups</b> <i>flour</i>")
      assert result.quantity == 2.0
      assert result.unit == "cup"
      assert result.name == "flour"
    end

    test "trailing punctuation removed from name" do
      result = IngredientParser.parse("1 cup rice,")
      assert result.quantity == 1.0
      assert result.unit == "cup"
      assert result.name == "rice"
    end

    test "three-quarter unicode fraction" do
      result = IngredientParser.parse("¾ teaspoon cinnamon")
      assert result.quantity == 0.75
      assert result.unit == "tsp"
      assert result.name == "cinnamon"
    end
  end
end
