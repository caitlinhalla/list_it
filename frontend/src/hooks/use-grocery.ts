import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchGroceryList,
  toggleGroceryCheck,
  uncheckAllGrocery,
} from "@/api/client";
import type { GroceryItem } from "@/types";

export function useGroceryList() {
  return useQuery({
    queryKey: ["grocery"],
    queryFn: fetchGroceryList,
  });
}

export function useToggleCheck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, checked }: { name: string; checked: boolean }) =>
      toggleGroceryCheck(name, checked),
    onMutate: async ({ name, checked }) => {
      await queryClient.cancelQueries({ queryKey: ["grocery"] });
      const previous = queryClient.getQueryData<GroceryItem[]>(["grocery"]);

      queryClient.setQueryData<GroceryItem[]>(
        ["grocery"],
        (old) =>
          old?.map((item) =>
            item.name === name ? { ...item, checked } : item
          )
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["grocery"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["grocery"] });
    },
  });
}

export function useUncheckAll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uncheckAllGrocery,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grocery"] });
    },
  });
}
