import { create } from 'zustand'
import { toast } from 'sonner'
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
    if (shortlist.find(p => p.id === player.id)) {
      toast.info(`${player.name} is already in your shortlist`)
      return
    }
    set({ shortlist: [...shortlist, player] })
    toast.success(`${player.name} added to shortlist`, {
      description: `${player.role} | ${player.basePriceCr} Cr base price`,
    })
  },

  removeFromShortlist: (playerId) => {
    const player = get().shortlist.find(p => p.id === playerId)
    set({ shortlist: get().shortlist.filter(p => p.id !== playerId) })
    if (player) toast(`${player.name} removed from shortlist`)
  },

  clearShortlist: () => {
    const count = get().shortlist.length
    set({ shortlist: [] })
    toast(`Cleared ${count} players from shortlist`)
  },

  setCompareSlot: (index, player) => {
    const slots = [...get().compareSlots] as [Player | null, Player | null]
    slots[index] = player
    set({ compareSlots: slots })
    if (player) toast.success(`${player.name} added to comparison slot ${index + 1}`)
  },

  clearCompare: () => set({ compareSlots: [null, null] }),

  isInShortlist: (playerId) => {
    return get().shortlist.some(p => p.id === playerId)
  },
}))
