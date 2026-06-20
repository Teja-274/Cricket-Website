/**
 * Tier 3 — Unit tests for the app store (shortlist + compare slots).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAppStore } from '../appStore'
import type { Player } from '@/data/players'

// Silence toast notifications during tests
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  }),
}))

const mockPlayer = (id: string, name: string): Player => ({
  id,
  name,
  role: 'Batsman',
  basePriceCr: 2,
  // Cast to Player — tests don't need every field
} as unknown as Player)

describe('appStore — shortlist', () => {
  beforeEach(() => {
    useAppStore.setState({ shortlist: [], compareSlots: [null, null] })
  })

  it('starts with empty shortlist', () => {
    expect(useAppStore.getState().shortlist).toEqual([])
  })

  it('addToShortlist appends a player', () => {
    useAppStore.getState().addToShortlist(mockPlayer('p1', 'Virat'))
    expect(useAppStore.getState().shortlist).toHaveLength(1)
    expect(useAppStore.getState().shortlist[0].name).toBe('Virat')
  })

  it('addToShortlist refuses to add a duplicate', () => {
    const p = mockPlayer('p1', 'Virat')
    useAppStore.getState().addToShortlist(p)
    useAppStore.getState().addToShortlist(p)
    expect(useAppStore.getState().shortlist).toHaveLength(1)
  })

  it('removeFromShortlist removes by id', () => {
    useAppStore.getState().addToShortlist(mockPlayer('p1', 'A'))
    useAppStore.getState().addToShortlist(mockPlayer('p2', 'B'))
    useAppStore.getState().removeFromShortlist('p1')
    expect(useAppStore.getState().shortlist).toHaveLength(1)
    expect(useAppStore.getState().shortlist[0].id).toBe('p2')
  })

  it('clearShortlist empties it', () => {
    useAppStore.getState().addToShortlist(mockPlayer('p1', 'A'))
    useAppStore.getState().addToShortlist(mockPlayer('p2', 'B'))
    useAppStore.getState().clearShortlist()
    expect(useAppStore.getState().shortlist).toEqual([])
  })

  it('isInShortlist returns true when player present', () => {
    useAppStore.getState().addToShortlist(mockPlayer('p1', 'A'))
    expect(useAppStore.getState().isInShortlist('p1')).toBe(true)
    expect(useAppStore.getState().isInShortlist('p99')).toBe(false)
  })
})

describe('appStore — compare slots', () => {
  beforeEach(() => {
    useAppStore.setState({ shortlist: [], compareSlots: [null, null] })
  })

  it('setCompareSlot sets the right slot', () => {
    const p = mockPlayer('p1', 'A')
    useAppStore.getState().setCompareSlot(0, p)
    expect(useAppStore.getState().compareSlots[0]).toEqual(p)
    expect(useAppStore.getState().compareSlots[1]).toBeNull()
  })

  it('clearCompare resets both slots', () => {
    useAppStore.getState().setCompareSlot(0, mockPlayer('p1', 'A'))
    useAppStore.getState().setCompareSlot(1, mockPlayer('p2', 'B'))
    useAppStore.getState().clearCompare()
    expect(useAppStore.getState().compareSlots).toEqual([null, null])
  })
})
