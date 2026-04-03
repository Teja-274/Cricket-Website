import { create } from 'zustand'
import type { Player } from '@/data/players'

interface AppState {
  shortlist: Player[]
  compareSlots: [Player | null, Player | null]
  addToShortlist: (player: Player) => void
  removeFromShortlist: (playerId: string) => void
  clearShortlist: () => void
  setCompareSlot: (index: 0 | 1, player: Player | null) => void
  clearCompare: () => void
  isInShortlist: (playerId: string) => boolean
}

export const useAppStore = create<AppState>((set, get) => ({
  shortlist: [],
  compareSlots: [null, null],

  addToShortlist: (player) => {
    const { shortlist } = get()
    if (shortlist.find(p => p.id === player.id)) return
    set({ shortlist: [...shortlist, player] })
  },

  removeFromShortlist: (playerId) => {
    set({ shortlist: get().shortlist.filter(p => p.id !== playerId) })
  },

  clearShortlist: () => set({ shortlist: [] }),

  setCompareSlot: (index, player) => {
    const slots = [...get().compareSlots] as [Player | null, Player | null]
    slots[index] = player
    set({ compareSlots: slots })
  },

  clearCompare: () => set({ compareSlots: [null, null] }),

  isInShortlist: (playerId) => {
    return get().shortlist.some(p => p.id === playerId)
  },
}))
