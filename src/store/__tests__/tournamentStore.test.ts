/**
 * Tier 3 — Unit tests for the tournament store.
 * Pure logic — no DOM, no async.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { useTournamentStore } from '../tournamentStore'

const SEED_TOURNAMENTS = [
  { code: 'IPL',  name: 'IPL',  country: 'India', format: 'T20', short_name: 'IPL',  color: '#000', is_active: true, sort_order: 1 },
  { code: 'SMAT', name: 'SMAT', country: 'India', format: 'T20', short_name: 'SMAT', color: '#111', is_active: true, sort_order: 2 },
  { code: 'BBL',  name: 'BBL',  country: 'AUS',   format: 'T20', short_name: 'BBL',  color: '#222', is_active: true, sort_order: 3 },
]

describe('tournamentStore', () => {
  beforeEach(() => {
    // Reset to default state before each test
    useTournamentStore.setState({
      tournaments: [],
      selected: ['IPL'],
      loaded: false,
    })
  })

  it('starts with IPL selected by default', () => {
    expect(useTournamentStore.getState().selected).toEqual(['IPL'])
  })

  it('setTournaments populates the list and marks loaded', () => {
    useTournamentStore.getState().setTournaments(SEED_TOURNAMENTS)
    const s = useTournamentStore.getState()
    expect(s.tournaments).toHaveLength(3)
    expect(s.loaded).toBe(true)
  })

  it('toggle adds a tournament not currently selected', () => {
    useTournamentStore.getState().setTournaments(SEED_TOURNAMENTS)
    useTournamentStore.getState().toggle('SMAT')
    expect(useTournamentStore.getState().selected.sort()).toEqual(['IPL', 'SMAT'])
  })

  it('toggle removes a tournament currently selected', () => {
    useTournamentStore.getState().setTournaments(SEED_TOURNAMENTS)
    useTournamentStore.getState().toggle('SMAT')
    useTournamentStore.getState().toggle('SMAT')
    expect(useTournamentStore.getState().selected).toEqual(['IPL'])
  })

  it('toggle refuses to deselect the last remaining tournament', () => {
    // IPL is the only one selected; toggling it off should be a no-op
    useTournamentStore.getState().toggle('IPL')
    expect(useTournamentStore.getState().selected).toEqual(['IPL'])
  })

  it('selectAll selects every available tournament', () => {
    useTournamentStore.getState().setTournaments(SEED_TOURNAMENTS)
    useTournamentStore.getState().selectAll()
    expect(useTournamentStore.getState().selected.sort()).toEqual(['BBL', 'IPL', 'SMAT'])
  })

  it('selectOnly replaces selection with exactly one code', () => {
    useTournamentStore.getState().setTournaments(SEED_TOURNAMENTS)
    useTournamentStore.getState().selectAll()
    useTournamentStore.getState().selectOnly('BBL')
    expect(useTournamentStore.getState().selected).toEqual(['BBL'])
  })

  it('reset returns to IPL-only', () => {
    useTournamentStore.getState().setTournaments(SEED_TOURNAMENTS)
    useTournamentStore.getState().selectAll()
    useTournamentStore.getState().reset()
    expect(useTournamentStore.getState().selected).toEqual(['IPL'])
  })

  it('setSelected with empty array falls back to IPL', () => {
    useTournamentStore.getState().setSelected([])
    expect(useTournamentStore.getState().selected).toEqual(['IPL'])
  })

  it('setSelected with non-empty array updates selection', () => {
    useTournamentStore.getState().setSelected(['BBL', 'PSL'])
    expect(useTournamentStore.getState().selected.sort()).toEqual(['BBL', 'PSL'])
  })
})
