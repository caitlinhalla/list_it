defmodule ListIt.Parser.ScraperTest do
  use ExUnit.Case, async: true

  alias ListIt.Parser.Scraper

  describe "extract_recipe_from_html/2" do
    test "extracts recipe from simple JSON-LD" do
      html = """
      <html><head>
      <script type="application/ld+json">
      {
        "@type": "Recipe",
        "name": "Test Recipe",
        "image": "https://example.com/image.jpg",
        "recipeIngredient": ["2 cups flour", "1 tsp salt"],
        "recipeYield": "4 servings",
        "prepTime": "PT10M",
        "cookTime": "PT20M"
      }
      </script>
      </head><body></body></html>
      """

      assert {:ok, data} = Scraper.extract_recipe_from_html(html, "https://example.com/recipe")
      assert data.title == "Test Recipe"
      assert data.image_url == "https://example.com/image.jpg"
      assert data.servings == "4 servings"
      assert data.prep_time == "PT10M"
      assert data.cook_time == "PT20M"
      assert data.ingredients == ["2 cups flour", "1 tsp salt"]
      assert data.source_name == "example.com"
    end

    test "extracts recipe from @graph wrapper" do
      html = """
      <html><head>
      <script type="application/ld+json">
      {
        "@graph": [
          {"@type": "WebPage", "name": "Some Page"},
          {"@type": "Recipe", "name": "Graph Recipe", "recipeIngredient": ["1 cup sugar"]}
        ]
      }
      </script>
      </head><body></body></html>
      """

      assert {:ok, data} = Scraper.extract_recipe_from_html(html, "https://food.com/recipe")
      assert data.title == "Graph Recipe"
      assert data.ingredients == ["1 cup sugar"]
      assert data.source_name == "food.com"
    end

    test "extracts recipe from JSON-LD array" do
      html = """
      <html><head>
      <script type="application/ld+json">
      [
        {"@type": "WebSite", "name": "Food Blog"},
        {"@type": "Recipe", "name": "Array Recipe", "recipeIngredient": ["3 eggs"]}
      ]
      </script>
      </head><body></body></html>
      """

      assert {:ok, data} = Scraper.extract_recipe_from_html(html, "https://blog.com/r")
      assert data.title == "Array Recipe"
    end

    test "handles recipe with list @type" do
      html = """
      <html><head>
      <script type="application/ld+json">
      {"@type": ["Recipe"], "name": "List Type Recipe", "recipeIngredient": ["1 onion"]}
      </script>
      </head><body></body></html>
      """

      assert {:ok, data} = Scraper.extract_recipe_from_html(html, "https://x.com/r")
      assert data.title == "List Type Recipe"
    end

    test "handles image as array of strings" do
      html = """
      <html><head>
      <script type="application/ld+json">
      {"@type": "Recipe", "name": "R", "image": ["https://img1.jpg", "https://img2.jpg"], "recipeIngredient": []}
      </script>
      </head><body></body></html>
      """

      assert {:ok, data} = Scraper.extract_recipe_from_html(html, "https://x.com/r")
      assert data.image_url == "https://img1.jpg"
    end

    test "handles image as object with url" do
      html = """
      <html><head>
      <script type="application/ld+json">
      {"@type": "Recipe", "name": "R", "image": {"url": "https://obj.jpg"}, "recipeIngredient": []}
      </script>
      </head><body></body></html>
      """

      assert {:ok, data} = Scraper.extract_recipe_from_html(html, "https://x.com/r")
      assert data.image_url == "https://obj.jpg"
    end

    test "handles recipeYield as integer" do
      html = """
      <html><head>
      <script type="application/ld+json">
      {"@type": "Recipe", "name": "R", "recipeYield": 6, "recipeIngredient": []}
      </script>
      </head><body></body></html>
      """

      assert {:ok, data} = Scraper.extract_recipe_from_html(html, "https://x.com/r")
      assert data.servings == "6"
    end

    test "handles recipeYield as array" do
      html = """
      <html><head>
      <script type="application/ld+json">
      {"@type": "Recipe", "name": "R", "recipeYield": ["4", "4 servings"], "recipeIngredient": []}
      </script>
      </head><body></body></html>
      """

      assert {:ok, data} = Scraper.extract_recipe_from_html(html, "https://x.com/r")
      assert data.servings == "4"
    end

    test "returns error when no recipe found" do
      html = """
      <html><head>
      <script type="application/ld+json">
      {"@type": "WebSite", "name": "Not a recipe"}
      </script>
      </head><body></body></html>
      """

      assert {:error, "No recipe data found on this page"} =
               Scraper.extract_recipe_from_html(html, "https://x.com/page")
    end

    test "returns error when no JSON-LD found at all" do
      html = "<html><head></head><body>Just text</body></html>"

      assert {:error, "No recipe data found on this page"} =
               Scraper.extract_recipe_from_html(html, "https://x.com/page")
    end

    test "strips www from domain" do
      html = """
      <html><head>
      <script type="application/ld+json">
      {"@type": "Recipe", "name": "R", "recipeIngredient": []}
      </script>
      </head><body></body></html>
      """

      assert {:ok, data} = Scraper.extract_recipe_from_html(html, "https://www.example.com/r")
      assert data.source_name == "example.com"
    end

    test "handles missing optional fields gracefully" do
      html = """
      <html><head>
      <script type="application/ld+json">
      {"@type": "Recipe", "name": "Minimal", "recipeIngredient": ["1 egg"]}
      </script>
      </head><body></body></html>
      """

      assert {:ok, data} = Scraper.extract_recipe_from_html(html, "https://x.com/r")
      assert data.title == "Minimal"
      assert data.image_url == nil
      assert data.servings == nil
      assert data.prep_time == nil
      assert data.cook_time == nil
      assert data.ingredients == ["1 egg"]
    end
  end
end
