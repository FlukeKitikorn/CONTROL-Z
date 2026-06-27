/**
 * REFACTOR(CANDIDATE-REMOVAL): ไม่ถูก import — Phase A dead-code audit
 */
export {}

/*
import { create } from "zustand"

type Scope = "all" | "scope1" | "scope2" | "scope3"

interface EmissionFilterState {
  scope: Scope
  year: number
  setScope: (scope: Scope) => void
  setYear: (year: number) => void
}

export const useEmissionFilterStore = create<EmissionFilterState>((set) => ({
  scope: "all",
  year: new Date().getFullYear(),
  setScope: (scope) => set({ scope }),
  setYear: (year) => set({ year }),
}))
*/
