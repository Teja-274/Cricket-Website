import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Tournament {
  code: string
  name: string
  country: string
  format: string
  short_name: string
  color: string
  is_active: boolean
  sort_order: number
}

interface TournamentState {
  // All available tournaments (loaded from DB once)
  tournaments: Tournament[]
  // Currently selected tournament codes (multi-select)
  selected: string[]
  // Loading state
  loaded: boolean

  setTournaments: (tournaments: Tournament[]) => void
  setSelected: (codes: string[]) => void
  toggle: (code: string) => void
  selectAll: () => void
  selectOnly: (code: string) => void
  reset: () => void
}

const DEFAULT_SELECTED = ['IPL']

export const useTournamentStore = create<TournamentState>()(
  persist(
    (set, get) => ({
      tournaments: [],
      selected: DEFAULT_SELECTED,
      loaded: false,

      setTournaments: (tournaments) => set({ tournaments, loaded: true }),

      setSelected: (codes) => {
        // Never allow empty selection — fall back to IPL
        set({ selected: codes.length > 0 ? codes : DEFAULT_SELECTED })
      },

      toggle: (code) => {
        const { selected } = get()
        if (selected.includes(code)) {
          // Don't allow deselecting the last one
          if (selected.length === 1) return
          set({ selected: selected.filter((c) => c !== code) })
        } else {
          set({ selected: [...selected, code] })
        }
      },

      selectAll: () => {
        const all = get().tournaments.map((t) => t.code)
        set({ selected: all.length > 0 ? all : DEFAULT_SELECTED })
      },

      selectOnly: (code) => set({ selected: [code] }),

      reset: () => set({ selected: DEFAULT_SELECTED }),
    }),
    {
      name: 'scout-india-tournament-filter',
      partialize: (state) => ({ selected: state.selected }),
    }
  )
)

/** Helper: are we filtering to just IPL? (Most legacy queries assume IPL-only) */
export const useIsIplOnly = () => {
  const selected = useTournamentStore((s) => s.selected)
  return selected.length === 1 && selected[0] === 'IPL'
}
