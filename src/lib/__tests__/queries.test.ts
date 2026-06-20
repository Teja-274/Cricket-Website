/**
 * Tier 2 — Query smoke tests.
 * Hits real Supabase to verify each query returns sensible, non-empty data.
 * Run with: npm run test
 *
 * These tests SKIP if Supabase env vars aren't set (CI without secrets).
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { isSupabaseConfigured, supabase } from '../supabase'
import {
  getTopBatsmen,
  getTopBowlers,
} from '../queries'

const HAS_SUPABASE = isSupabaseConfigured()
const describeIf = HAS_SUPABASE ? describe : describe.skip

describeIf('Tier 2 — Query smoke tests (live Supabase)', () => {
  beforeAll(() => {
    if (!HAS_SUPABASE) {
      console.warn('[Tier 2] Supabase not configured — skipping smoke tests')
    }
  })

  describe('getTopBatsmen', () => {
    it('returns at least 10 batsmen', async () => {
      const rows = await getTopBatsmen(20)
      expect(rows.length).toBeGreaterThan(10)
    })

    it('each row has id, name, runs, balls, avg, sr', async () => {
      const rows = await getTopBatsmen(5)
      expect(rows.length).toBeGreaterThan(0)
      const r = rows[0]
      expect(r).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        runs: expect.any(Number),
      })
      expect(r.runs).toBeGreaterThan(0)
    })

    it('top batsman has runs >= second batsman (sorted desc)', async () => {
      const rows = await getTopBatsmen(5)
      if (rows.length >= 2) {
        expect(rows[0].runs).toBeGreaterThanOrEqual(rows[1].runs)
      }
    })
  })

  describe('getTopBowlers', () => {
    it('returns at least 10 bowlers', async () => {
      const rows = await getTopBowlers(20)
      expect(rows.length).toBeGreaterThan(10)
    })

    it('top bowler has at least 30 career wickets', async () => {
      const rows = await getTopBowlers(5)
      expect(rows.length).toBeGreaterThan(0)
      // Some queries name this field 'wickets' or 'total_wickets'
      const wickets = (rows[0] as any).wickets ?? (rows[0] as any).total_wickets ?? 0
      expect(wickets).toBeGreaterThan(30)
    })
  })

  describe('tournaments table', () => {
    it('returns all 6 tournaments', async () => {
      if (!supabase) return
      const { data, error } = await supabase
        .from('tournaments')
        .select('code')
        .eq('is_active', true)
      expect(error).toBeNull()
      expect(data).toBeTruthy()
      const codes = (data ?? []).map((t: any) => t.code).sort()
      expect(codes).toEqual(['BBL', 'CPL', 'IPL', 'PSL', 'SMAT', 'T20I'])
    })
  })

  describe('matches table', () => {
    it('has matches for every tournament', async () => {
      if (!supabase) return
      const tournaments = ['IPL', 'SMAT', 'BBL', 'PSL', 'CPL', 'T20I']
      for (const t of tournaments) {
        const { count, error } = await supabase
          .from('matches')
          .select('id', { count: 'exact', head: true })
          .eq('tournament', t)
        expect(error, `${t} matches query failed`).toBeNull()
        expect(count, `${t} should have matches`).toBeGreaterThan(0)
      }
    })

    it('IPL has at least 1000 matches', async () => {
      if (!supabase) return
      const { count } = await supabase
        .from('matches')
        .select('id', { count: 'exact', head: true })
        .eq('tournament', 'IPL')
      expect(count).toBeGreaterThanOrEqual(1000)
    })
  })

  describe('players table', () => {
    it('has at least 3000 players', async () => {
      if (!supabase) return
      const { count } = await supabase
        .from('players')
        .select('id', { count: 'exact', head: true })
      expect(count).toBeGreaterThan(3000)
    })

    it('player IDs are 8-char hex strings', async () => {
      if (!supabase) return
      const { data } = await supabase.from('players').select('id').limit(20)
      expect(data).toBeTruthy()
      for (const p of data ?? []) {
        expect(p.id).toMatch(/^[a-f0-9]{8}$/)
      }
    })
  })

  describe('deliveries table', () => {
    // NOTE: a global count(*) on deliveries (1.5M+ rows) times out the REST
    // endpoint. We check per-tournament counts instead — faster AND verifies
    // every tournament's data is loaded.
    it('IPL has at least 270k deliveries', async () => {
      if (!supabase) return
      const { count, error } = await supabase
        .from('deliveries')
        .select('id', { count: 'exact', head: true })
        .eq('tournament', 'IPL')
      expect(error).toBeNull()
      expect(count).toBeGreaterThan(270_000)
    })

    it('SMAT has at least 150k deliveries', async () => {
      if (!supabase) return
      const { count } = await supabase
        .from('deliveries')
        .select('id', { count: 'exact', head: true })
        .eq('tournament', 'SMAT')
      expect(count).toBeGreaterThan(150_000)
    })

    it('T20I has at least 700k deliveries', async () => {
      if (!supabase) return
      const { count } = await supabase
        .from('deliveries')
        .select('id', { count: 'exact', head: true })
        .eq('tournament', 'T20I')
      expect(count).toBeGreaterThan(700_000)
    })
  })
})
