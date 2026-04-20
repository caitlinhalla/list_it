import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UnitPreference } from "@/lib/unit-conversion";

interface AppState {
  addRecipeDialogOpen: boolean;
  setAddRecipeDialogOpen: (open: boolean) => void;
  unitPreference: UnitPreference;
  setUnitPreference: (pref: UnitPreference) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      addRecipeDialogOpen: false,
      setAddRecipeDialogOpen: (open) => set({ addRecipeDialogOpen: open }),
      unitPreference: "imperial",
      setUnitPreference: (pref) => set({ unitPreference: pref }),
    }),
    {
      name: "listit-settings",
      partialize: (state) => ({
        unitPreference: state.unitPreference,
      }),
    }
  )
);
