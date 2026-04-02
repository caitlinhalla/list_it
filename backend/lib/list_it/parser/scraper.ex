defmodule ListIt.Parser.Scraper do
  @moduledoc """
  Scrapes recipe data from URLs by extracting JSON-LD structured data (schema.org Recipe).
  """

  @type recipe_data :: %{
          title: String.t(),
          image_url: String.t() | nil,
          servings: String.t() | nil,
          prep_time: String.t() | nil,
          cook_time: String.t() | nil,
          ingredients: [String.t()],
          source_name: String.t()
        }

  @spec scrape(String.t()) :: {:ok, recipe_data()} | {:error, String.t()}
  def scrape(url) when is_binary(url) do
    with {:ok, html} <- fetch_page(url) do
      extract_recipe_from_html(html, url)
    end
  end

  @spec extract_recipe_from_html(String.t(), String.t()) ::
          {:ok, recipe_data()} | {:error, String.t()}
  def extract_recipe_from_html(html, url) do
    with {:ok, recipe_json} <- extract_recipe_json(html) do
      {:ok, build_recipe_data(recipe_json, url)}
    end
  end

  defp fetch_page(url) do
    case Req.get(url,
           headers: [
             {"user-agent",
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"},
             {"accept",
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8"},
             {"accept-language", "en-US,en;q=0.9"},
             {"accept-encoding", "gzip, deflate"},
             {"sec-ch-ua", ~s("Chromium";v="131", "Not_A Brand";v="24")},
             {"sec-ch-ua-mobile", "?0"},
             {"sec-ch-ua-platform", ~s("macOS")},
             {"sec-fetch-dest", "document"},
             {"sec-fetch-mode", "navigate"},
             {"sec-fetch-site", "none"},
             {"sec-fetch-user", "?1"},
             {"upgrade-insecure-requests", "1"},
             {"cache-control", "max-age=0"}
           ],
           redirect: true,
           max_redirects: 5,
           receive_timeout: 15_000
         ) do
      {:ok, %{status: status, body: body}} when status in 200..299 ->
        {:ok, body}

      {:ok, %{status: status}} ->
        {:error, "Failed to fetch URL: HTTP #{status}"}

      {:error, reason} ->
        {:error, "Failed to fetch URL: #{inspect(reason)}"}
    end
  end

  defp extract_recipe_json(html) do
    {:ok, doc} = Floki.parse_document(html)

    doc
    |> Floki.find("script[type='application/ld+json']")
    |> Enum.reduce_while({:error, "No recipe data found on this page"}, fn node, acc ->
      text = script_content(node)

      case Jason.decode(text) do
        {:ok, json} ->
          case find_recipe(json) do
            nil -> {:cont, acc}
            recipe -> {:halt, {:ok, recipe}}
          end

        {:error, _} ->
          {:cont, acc}
      end
    end)
  end

  defp script_content({"script", _, [content]}) when is_binary(content), do: content
  defp script_content({"script", _, _}), do: ""
  defp script_content(_), do: ""

  defp find_recipe(%{"@type" => type} = json) when type in ["Recipe", ["Recipe"]] do
    json
  end

  defp find_recipe(%{"@type" => types} = json) when is_list(types) do
    if "Recipe" in types, do: json, else: nil
  end

  defp find_recipe(%{"@graph" => graph}) when is_list(graph) do
    Enum.find_value(graph, &find_recipe/1)
  end

  defp find_recipe(list) when is_list(list) do
    Enum.find_value(list, &find_recipe/1)
  end

  defp find_recipe(_), do: nil

  defp build_recipe_data(json, url) do
    %{
      title: get_string(json, "name") || "Untitled Recipe",
      image_url: extract_image(json),
      servings: extract_yield(json),
      prep_time: get_string(json, "prepTime"),
      cook_time: get_string(json, "cookTime"),
      ingredients: extract_ingredients(json),
      source_name: extract_domain(url)
    }
  end

  defp extract_image(%{"image" => %{"url" => url}}), do: url
  defp extract_image(%{"image" => [first | _]}) when is_binary(first), do: first
  defp extract_image(%{"image" => [%{"url" => url} | _]}), do: url
  defp extract_image(%{"image" => url}) when is_binary(url), do: url
  defp extract_image(_), do: nil

  defp extract_yield(%{"recipeYield" => [first | _]}), do: to_string(first)
  defp extract_yield(%{"recipeYield" => yield}) when is_binary(yield), do: yield
  defp extract_yield(%{"recipeYield" => yield}) when is_integer(yield), do: to_string(yield)
  defp extract_yield(_), do: nil

  defp extract_ingredients(%{"recipeIngredient" => ingredients}) when is_list(ingredients) do
    Enum.map(ingredients, &to_string/1)
  end

  defp extract_ingredients(_), do: []

  defp extract_domain(url) do
    case URI.parse(url) do
      %{host: host} when is_binary(host) ->
        host |> String.replace_leading("www.", "")

      _ ->
        "unknown"
    end
  end

  defp get_string(map, key) do
    case Map.get(map, key) do
      val when is_binary(val) -> val
      _ -> nil
    end
  end
end
