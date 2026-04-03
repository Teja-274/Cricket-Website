import { create } from 'zustand'
import type { Player } from '@/data/players'
import type { Franchise } from '@/data/franchises'

export interface Bid {
  id: string
  playerId: string
  franchiseId: string
  franchiseName: string
  franchiseShortName: string
  franchiseColor: string
  amountCr: number
  isRtm: boolean
  timestamp: number
}

export interface AuctionRoom {
  id: string
  name: string
  status: 'lobby' | 'active' | 'paused' | 'complete'
  format: 'ipl' | 'fantasy' | 'private'
  currentPlayerIdx: number
  bidTimerSeconds: number
  totalPurseCr: number
  maxPlayers: number
}

interface AuctionState {
  room: AuctionRoom | null
  players: Player[]
  franchises: Franchise[]
  bids: Bid[]
  currentBid: number
  currentBidderId: string | null
  timerSeconds: number
  isTimerRunning: boolean
  myFranchiseId: string | null

  setRoom: (room: AuctionRoom) => void
  setPlayers: (players: Player[]) => void
  setFranchises: (franchises: Franchise[]) => void
  setMyFranchise: (id: string) => void
  getCurrentPlayer: () => Player | null
  placeBid: (franchiseId: string) => void
  placeRtmBid: (franchiseId: string) => void
  markSold: () => void
  markUnsold: () => void
  advancePlayer: () => void
  tickTimer: () => void
  resetTimer: () => void
  startTimer: () => void
  pauseTimer: () => void
  startAuction: () => void
}

function getBidIncrement(currentBid: number): number {
  if (currentBid < 1) return 0.05
  if (currentBid < 2) return 0.10
  if (currentBid < 5) return 0.25
  if (currentBid < 10) return 0.50
  return 1.0
}

export const useAuctionStore = create<AuctionState>((set, get) => ({
  room: null,
  players: [],
  franchises: [],
  bids: [],
  currentBid: 0,
  currentBidderId: null,
  timerSeconds: 30,
  isTimerRunning: false,
  myFranchiseId: null,

  setRoom: (room) => set({ room }),
  setPlayers: (players) => set({ players }),
  setFranchises: (franchises) => set({ franchises }),
  setMyFranchise: (id) => set({ myFranchiseId: id }),

  getCurrentPlayer: () => {
    const { players, room } = get()
    if (!room) return null
    const pending = players.filter(p => p.status === 'pending' || p.status === 'active')
    return pending[room.currentPlayerIdx] || null
  },

  placeBid: (franchiseId) => {
    const state = get()
    const player = state.getCurrentPlayer()
    if (!player || !state.room) return

    const franchise = state.franchises.find(f => f.id === franchiseId)
    if (!franchise) return

    const currentAmount = state.currentBid || player.basePriceCr
    const increment = state.currentBid === 0 ? 0 : getBidIncrement(currentAmount)
    const newAmount = state.currentBid === 0 ? player.basePriceCr : Math.round((currentAmount + increment) * 100) / 100

    if (newAmount > franchise.purseRemaining) return

    const bid: Bid = {
      id: `bid-${Date.now()}`,
      playerId: player.id,
      franchiseId,
      franchiseName: franchise.name,
      franchiseShortName: franchise.shortName,
      franchiseColor: franchise.color,
      amountCr: newAmount,
      isRtm: false,
      timestamp: Date.now(),
    }

    const updatedPlayers = state.players.map(p =>
      p.id === player.id ? { ...p, status: 'active' as const } : p
    )

    set({
      bids: [...state.bids, bid],
      currentBid: newAmount,
      currentBidderId: franchiseId,
      timerSeconds: state.room.bidTimerSeconds,
      players: updatedPlayers,
    })
  },

  placeRtmBid: (franchiseId) => {
    const state = get()
    const player = state.getCurrentPlayer()
    if (!player || !state.room) return

    const franchise = state.franchises.find(f => f.id === franchiseId)
    if (!franchise || franchise.rtmCards <= 0) return

    const newAmount = state.currentBid
    if (newAmount > franchise.purseRemaining) return

    const bid: Bid = {
      id: `bid-${Date.now()}`,
      playerId: player.id,
      franchiseId,
      franchiseName: franchise.name,
      franchiseShortName: franchise.shortName,
      franchiseColor: franchise.color,
      amountCr: newAmount,
      isRtm: true,
      timestamp: Date.now(),
    }

    set({
      bids: [...state.bids, bid],
      currentBidderId: franchiseId,
      timerSeconds: state.room.bidTimerSeconds,
      franchises: state.franchises.map(f =>
        f.id === franchiseId ? { ...f, rtmCards: f.rtmCards - 1 } : f
      ),
    })
  },

  markSold: () => {
    const state = get()
    const player = state.getCurrentPlayer()
    if (!player || !state.currentBidderId) return

    const updatedPlayers = state.players.map(p =>
      p.id === player.id
        ? { ...p, status: 'sold' as const, soldToId: state.currentBidderId!, soldPriceCr: state.currentBid }
        : p
    )

    const updatedFranchises = state.franchises.map(f =>
      f.id === state.currentBidderId
        ? {
            ...f,
            purseRemaining: Math.round((f.purseRemaining - state.currentBid) * 100) / 100,
            playersBought: f.playersBought + 1,
            players: [...f.players, player.id],
          }
        : f
    )

    set({
      players: updatedPlayers,
      franchises: updatedFranchises,
      isTimerRunning: false,
    })

    setTimeout(() => get().advancePlayer(), 1500)
  },

  markUnsold: () => {
    const state = get()
    const player = state.getCurrentPlayer()
    if (!player) return

    const updatedPlayers = state.players.map(p =>
      p.id === player.id ? { ...p, status: 'unsold' as const } : p
    )

    set({
      players: updatedPlayers,
      isTimerRunning: false,
    })

    setTimeout(() => get().advancePlayer(), 1500)
  },

  advancePlayer: () => {
    const state = get()
    if (!state.room) return

    const pendingPlayers = state.players.filter(p => p.status === 'pending')
    if (pendingPlayers.length === 0) {
      set({ room: { ...state.room, status: 'complete' }, isTimerRunning: false })
      return
    }

    set({
      room: { ...state.room, currentPlayerIdx: 0 },
      currentBid: 0,
      currentBidderId: null,
      timerSeconds: state.room.bidTimerSeconds,
      isTimerRunning: true,
    })
  },

  tickTimer: () => {
    const state = get()
    if (!state.isTimerRunning) return
    if (state.timerSeconds <= 0) {
      set({ isTimerRunning: false })
      return
    }
    set({ timerSeconds: state.timerSeconds - 1 })
  },

  resetTimer: () => {
    const state = get()
    if (!state.room) return
    set({ timerSeconds: state.room.bidTimerSeconds })
  },

  startTimer: () => set({ isTimerRunning: true }),
  pauseTimer: () => set({ isTimerRunning: false }),

  startAuction: () => {
    const state = get()
    if (!state.room) return
    set({
      room: { ...state.room, status: 'active' },
      currentBid: 0,
      currentBidderId: null,
      timerSeconds: state.room.bidTimerSeconds,
      isTimerRunning: true,
    })
  },
}))
