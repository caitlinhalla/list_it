import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchRecipes, createRecipe, deleteRecipe } from "@/api/client";

export function useRecipes() {
  return useQuery({
    queryKey: ["recipes"],
    queryFn: fetchRecipes,
  });
}

export function useAddRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (url: string) => createRecipe(url),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      queryClient.invalidateQueries({ queryKey: ["grocery"] });
    },
  });
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteRecipe(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      queryClient.invalidateQueries({ queryKey: ["grocery"] });
    },
  });
}
