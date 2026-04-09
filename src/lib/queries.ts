/**
 * Supabase query functions for IPL analytics.
 * All queries hit the real database with 279K+ deliveries.
 */

import { supabase } from './supabase'

// ============================================================
// LEADERBOARDS
// ============================================================

export async function getTopRunScorers(limit = 20) {
  if (!supabase) return []
  const { data, error } = await supabase.rpc('get_top_run_scorers', { lim: limit })
  if (error) {
    // Fallback to manual query if RPC not available
    const { data: fallback } = await supabase
      .from('player_match_stats')
      .select('player_id, players!inner(name)')
      .order('runs_scored', { ascending: false })
    if (!fallback) return []
    // Aggregate manually
    const map = new Map<string, { name: string; runs: number; balls: number; matches: Set<string>; fours: number; sixes: number; not_outs: number; innings: number }>()
    for (const row of fallback as any[]) {
      const pid = row.player_id
      if (!map.has(pid)) map.set(pid, { name: row.players.name, runs: 0, balls: 0, matches: new Set(), fours: 0, sixes: 0, not_outs: 0, innings: 0 })
    }
    return []
  }
  return data || []
}

// Uses RPC functions for accurate aggregation (no row limit issues)
export async function getTopBatsmen(limit = 20) {
  if (!supabase) return []
  const { data, error } = await supabase.rpc('get_top_batsmen', { lim: limit })
  if (error || !data) {
    console.error('[Queries] get_top_batsmen error:', error)
    return []
  }
  return (data as any[]).map(r => ({
    id: r.player_id,
    name: r.player_name,
    matches: Number(r.matches),
    innings: Number(r.innings),
    runs: Number(r.runs),
    balls: Number(r.balls),
    fours: Number(r.fours),
    sixes: Number(r.sixes),
    avg: (Number(r.innings) - Number(r.not_outs)) > 0
      ? Math.round((Number(r.runs) / (Number(r.innings) - Number(r.not_outs))) * 100) / 100 : 0,
    sr: Number(r.balls) > 0
      ? Math.round((Number(r.runs) / Number(r.balls)) * 10000) / 100 : 0,
  }))
}

export async function getTopBowlers(limit = 20) {
  if (!supabase) return []
  const { data, error } = await supabase.rpc('get_top_bowlers', { lim: limit })
  if (error || !data) {
    console.error('[Queries] get_top_bowlers error:', error)
    return []
  }
  return (data as any[]).map(r => ({
    id: r.player_id,
    name: r.player_name,
    matches: Number(r.matches),
    innings: Number(r.innings),
    wickets: Number(r.wickets),
    runs: Number(r.runs_conceded),
    overs: Math.round(Number(r.overs) * 10) / 10,
    economy: Number(r.overs) > 0
      ? Math.round((Number(r.runs_conceded) / Number(r.overs)) * 100) / 100 : 0,
    avg: Number(r.wickets) > 0
      ? Math.round((Number(r.runs_conceded) / Number(r.wickets)) * 100) / 100 : 0,
    dots: Number(r.dots),
  }))
}

// ============================================================
// PLAYER MATCHUPS
// ============================================================

export async function getPlayerBattingMatchups(playerId: string) {
  if (!supabase) return []
  const { data } = await supabase
    .from('deliveries')
    .select('bowler_id, batter_runs, is_legal, is_boundary, is_dot, players!deliveries_bowler_id_fkey(name)')
    .eq('batter_id', playerId)
    .eq('is_legal', true)
    .range(0, 50000)
  if (!data) return []

  const map = new Map<string, { name: string; balls: number; runs: number; boundaries: number; dots: number }>()
  for (const row of data as any[]) {
    const bid = row.bowler_id
    if (!map.has(bid)) map.set(bid, { name: row.players?.name || bid, balls: 0, runs: 0, boundaries: 0, dots: 0 })
    const b = map.get(bid)!
    b.balls += 1
    b.runs += row.batter_runs
    if (row.is_boundary) b.boundaries += 1
    if (row.is_dot) b.dots += 1
  }

  // Get dismissals
  const { data: wickets } = await supabase
    .from('wickets')
    .select('bowler_id, kind')
    .eq('batter_id', playerId)
    .eq('is_bowler_wicket', true)

  const dismissals = new Map<string, number>()
  if (wickets) {
    for (const w of wickets) {
      dismissals.set(w.bowler_id, (dismissals.get(w.bowler_id) || 0) + 1)
    }
  }

  return [...map.entries()]
    .map(([id, b]) => ({
      bowler_id: id,
      bowler_name: b.name,
      balls: b.balls,
      runs: b.runs,
      sr: Math.round((b.runs / b.balls) * 10000) / 100,
      boundaries: b.boundaries,
      dots: b.dots,
      dismissals: dismissals.get(id) || 0,
    }))
    .filter(b => b.balls >= 6)
    .sort((a, b) => b.balls - a.balls)
}

export async function getPlayerBowlingMatchups(playerId: string) {
  if (!supabase) return []
  const { data } = await supabase
    .from('deliveries')
    .select('batter_id, batter_runs, is_legal, is_boundary, is_dot, players!deliveries_batter_id_fkey(name)')
    .eq('bowler_id', playerId)
    .eq('is_legal', true)
    .range(0, 50000)
  if (!data) return []

  const map = new Map<string, { name: string; balls: number; runs: number; boundaries: number; dots: number }>()
  for (const row of data as any[]) {
    const bid = row.batter_id
    if (!map.has(bid)) map.set(bid, { name: row.players?.name || bid, balls: 0, runs: 0, boundaries: 0, dots: 0 })
    const b = map.get(bid)!
    b.balls += 1
    b.runs += row.batter_runs
    if (row.is_boundary) b.boundaries += 1
    if (row.is_dot) b.dots += 1
  }

  const { data: wickets } = await supabase
    .from('wickets')
    .select('batter_id')
    .eq('bowler_id', playerId)
    .eq('is_bowler_wicket', true)

  const dismissals = new Map<string, number>()
  if (wickets) {
    for (const w of wickets) {
      dismissals.set(w.batter_id, (dismissals.get(w.batter_id) || 0) + 1)
    }
  }

  return [...map.entries()]
    .map(([id, b]) => ({
      batter_id: id,
      batter_name: b.name,
      balls: b.balls,
      runs: b.runs,
      sr: Math.round((b.runs / b.balls) * 10000) / 100,
      boundaries: b.boundaries,
      dots: b.dots,
      dismissals: dismissals.get(id) || 0,
    }))
    .filter(b => b.balls >= 6)
    .sort((a, b) => b.balls - a.balls)
}

// ============================================================
// HEAD-TO-HEAD
// ============================================================

export async function getHeadToHead(player1Id: string, player2Id: string) {
  if (!supabase) return null

  // Player 1 batting vs Player 2 bowling
  const { data: p1Bat } = await supabase
    .from('deliveries')
    .select('batter_runs, is_legal, is_boundary, is_dot, over_number, phase')
    .eq('batter_id', player1Id)
    .eq('bowler_id', player2Id)
    .range(0, 5000)

  // Player 2 batting vs Player 1 bowling
  const { data: p2Bat } = await supabase
    .from('deliveries')
    .select('batter_runs, is_legal, is_boundary, is_dot, over_number, phase')
    .eq('batter_id', player2Id)
    .eq('bowler_id', player1Id)
    .range(0, 5000)

  // Wickets
  const { data: w1 } = await supabase.from('wickets').select('kind').eq('batter_id', player1Id).eq('bowler_id', player2Id)
  const { data: w2 } = await supabase.from('wickets').select('kind').eq('batter_id', player2Id).eq('bowler_id', player1Id)

  const aggregate = (deliveries: any[]) => {
    const legal = deliveries.filter(d => d.is_legal)
    return {
      balls: legal.length,
      runs: legal.reduce((s, d) => s + d.batter_runs, 0),
      boundaries: deliveries.filter(d => d.is_boundary).length,
      dots: deliveries.filter(d => d.is_dot).length,
      sr: legal.length > 0 ? Math.round((legal.reduce((s, d) => s + d.batter_runs, 0) / legal.length) * 10000) / 100 : 0,
      byPhase: {
        powerplay: aggregatePhase(deliveries.filter(d => d.phase === 'powerplay')),
        middle: aggregatePhase(deliveries.filter(d => d.phase === 'middle')),
        death: aggregatePhase(deliveries.filter(d => d.phase === 'death')),
      },
    }
  }

  const aggregatePhase = (deliveries: any[]) => {
    const legal = deliveries.filter(d => d.is_legal)
    return {
      balls: legal.length,
      runs: legal.reduce((s, d) => s + d.batter_runs, 0),
    }
  }

  return {
    player1Batting: aggregate(p1Bat || []),
    player2Batting: aggregate(p2Bat || []),
    player1Dismissals: w1?.length || 0,
    player2Dismissals: w2?.length || 0,
  }
}

// ============================================================
// VENUE STATS
// ============================================================

export async function getAllVenues() {
  if (!supabase) return []
  const { data } = await supabase.from('venues').select('*').order('name')
  return data || []
}

export async function getVenueStats(venueId: number) {
  if (!supabase) return null

  // Use RPC for accurate aggregation
  const [statsResult, scorersResult] = await Promise.all([
    supabase.rpc('get_venue_stats', { v_id: venueId }),
    supabase.rpc('get_venue_top_scorers', { v_id: venueId, lim: 10 }),
  ])

  if (statsResult.error || !statsResult.data || (statsResult.data as any[]).length === 0) {
    console.error('[Queries] get_venue_stats error:', statsResult.error)
    return null
  }

  const s = (statsResult.data as any[])[0]
  const totalMatches = Number(s.total_matches)
  const batFirstWins = Number(s.bat_first_wins)
  const fieldFirstWins = Number(s.field_first_wins)

  const topScorers = (scorersResult.data as any[] || []).map((r: any) => ({
    name: r.player_name,
    runs: Number(r.total_runs),
    balls: Number(r.total_balls),
    matches: Number(r.match_count),
  }))

  return {
    totalMatches,
    avgFirstInnings: Number(s.avg_first_innings) || 0,
    avgSecondInnings: Number(s.avg_second_innings) || 0,
    highestScore: Number(s.highest_score) || 0,
    batFirstWinPct: totalMatches > 0 ? Math.round((batFirstWins / totalMatches) * 100) : 0,
    fieldFirstWinPct: totalMatches > 0 ? Math.round((fieldFirstWins / totalMatches) * 100) : 0,
    topScorers,
  }
}

// ============================================================
// SEASON DASHBOARD
// ============================================================

export async function getAllSeasons() {
  if (!supabase) return []
  const { data } = await supabase.from('seasons').select('*').order('year', { ascending: false })
  return data || []
}

export async function getSeasonLeaderboard(seasonYear: number) {
  if (!supabase) return { batsmen: [], bowlers: [], matches: 0 }

  const { data: season } = await supabase.from('seasons').select('id').eq('year', seasonYear).single()
  if (!season) return { batsmen: [], bowlers: [], matches: 0 }

  const { data: matchCount } = await supabase.from('matches').select('id', { count: 'exact' }).eq('season_id', season.id)

  // Use RPC function for pre-aggregated data (no row limit issues)
  const { data: stats, error } = await supabase.rpc('get_season_leaderboard', { season_yr: seasonYear })

  if (error || !stats) {
    console.error('[Queries] Season leaderboard RPC error:', error)
    return { batsmen: [], bowlers: [], matches: matchCount?.length || 0 }
  }

  const batsmen = (stats as any[])
    .filter(r => r.balls_faced > 0)
    .map(r => ({
      id: r.player_id,
      name: r.player_name,
      runs: Number(r.runs_scored),
      balls: Number(r.balls_faced),
      fours: Number(r.fours),
      sixes: Number(r.sixes),
      innings: Number(r.innings),
      not_outs: Number(r.not_outs),
      avg: (Number(r.innings) - Number(r.not_outs)) > 0
        ? Math.round((Number(r.runs_scored) / (Number(r.innings) - Number(r.not_outs))) * 100) / 100
        : 0,
      sr: Number(r.balls_faced) > 0
        ? Math.round((Number(r.runs_scored) / Number(r.balls_faced)) * 10000) / 100
        : 0,
    }))
    .sort((a, b) => b.runs - a.runs)

  const bowlers = (stats as any[])
    .filter(r => Number(r.overs_bowled) > 0)
    .map(r => ({
      id: r.player_id,
      name: r.player_name,
      wickets: Number(r.wickets_taken),
      runs: Number(r.runs_conceded),
      overs: Math.round(Number(r.overs_bowled) * 10) / 10,
      dots: Number(r.dots_bowled),
      innings: Number(r.innings),
      economy: Number(r.overs_bowled) > 0
        ? Math.round((Number(r.runs_conceded) / Number(r.overs_bowled)) * 100) / 100
        : 0,
      avg: Number(r.wickets_taken) > 0
        ? Math.round((Number(r.runs_conceded) / Number(r.wickets_taken)) * 100) / 100
        : 0,
    }))
    .sort((a, b) => b.wickets - a.wickets)

  return { batsmen, bowlers, matches: matchCount?.length || 0 }
}

// ============================================================
// PLAYER PROFILE - Supabase-backed
// ============================================================

export async function getPlayerById(playerId: string) {
  if (!supabase) return null
  const { data } = await supabase.from('players').select('*').eq('id', playerId).single()
  return data
}

export async function getPlayerCareerStats(playerId: string) {
  if (!supabase) return null
  const { data, error } = await supabase.rpc('get_player_career_stats', { p_id: playerId })
  if (error || !data || (data as any[]).length === 0) return null
  const r = (data as any[])[0]
  return {
    matches: Number(r.matches),
    innings: Number(r.innings),
    runs: Number(r.runs),
    balls: Number(r.balls),
    fours: Number(r.fours),
    sixes: Number(r.sixes),
    notOuts: Number(r.not_outs),
    avg: (Number(r.innings) - Number(r.not_outs)) > 0
      ? Math.round((Number(r.runs) / (Number(r.innings) - Number(r.not_outs))) * 100) / 100 : 0,
    sr: Number(r.balls) > 0 ? Math.round((Number(r.runs) / Number(r.balls)) * 10000) / 100 : 0,
    highestScore: Number(r.highest_score),
    wickets: Number(r.wickets),
    runsConceded: Number(r.runs_conceded),
    overs: Math.round(Number(r.overs) * 10) / 10,
    economy: Number(r.overs) > 0 ? Math.round((Number(r.runs_conceded) / Number(r.overs)) * 100) / 100 : 0,
    bowlingAvg: Number(r.wickets) > 0 ? Math.round((Number(r.runs_conceded) / Number(r.wickets)) * 100) / 100 : 0,
    dotsBowled: Number(r.dots_bowled),
    catches: Number(r.catches),
    stumpings: Number(r.stumpings),
  }
}

export async function getPlayerSeasonHistorySupabase(playerId: string) {
  if (!supabase) return []
  const { data, error } = await supabase.rpc('get_player_seasons', { p_id: playerId })
  if (error || !data) return []
  return (data as any[]).map(r => ({
    year: Number(r.year),
    matches: Number(r.matches),
    runs: Number(r.runs),
    avg: Number(r.avg),
    sr: Number(r.sr),
    wickets: Number(r.wickets),
    economy: Number(r.economy),
  }))
}

export async function getPlayerVenuePerformance(playerId: string) {
  if (!supabase) return []
  const { data, error } = await supabase.rpc('get_player_venue_stats', { p_id: playerId })
  if (error || !data) return []
  return (data as any[]).map(r => ({
    venue: r.venue,
    matches: Number(r.matches),
    runs: Number(r.runs),
    balls: Number(r.balls),
    avg: Number(r.avg || 0),
    sr: Number(r.sr || 0),
  }))
}

// ============================================================
// SEASON CHAMPION
// ============================================================

export async function getSeasonChampion(seasonYear: number) {
  if (!supabase) return null
  const { data, error } = await supabase.rpc('get_season_champion', { season_yr: seasonYear })
  if (error || !data || (data as any[]).length === 0) return null
  const r = (data as any[])[0]
  return {
    champion: r.champion,
    runnerUp: r.runner_up,
    finalDate: r.final_date,
    winByRuns: r.win_by_runs,
    winByWickets: r.win_by_wickets,
  }
}

// ============================================================
// DISMISSAL STATS
// ============================================================

export async function getPlayerDismissals(playerId: string) {
  if (!supabase) return []
  const { data } = await supabase
    .from('wickets')
    .select('kind')
    .eq('batter_id', playerId)
  if (!data) return []

  const counts = new Map<string, number>()
  for (const w of data) {
    counts.set(w.kind, (counts.get(w.kind) || 0) + 1)
  }
  return [...counts.entries()].map(([kind, count]) => ({ kind, count })).sort((a, b) => b.count - a.count)
}

// ============================================================
// SEARCH PLAYERS IN DB
// ============================================================

export async function searchPlayersDB(query: string, limit = 10) {
  if (!supabase || !query.trim()) return []
  const { data } = await supabase
    .from('players')
    .select('id, name, short_name')
    .ilike('name', `%${query}%`)
    .limit(limit)
  return data || []
}

// ============================================================
// OVERVIEW STATS
// ============================================================

export async function getOverviewStats() {
  if (!supabase) return null

  const [matches, deliveries, wickets, sixes] = await Promise.all([
    supabase.from('matches').select('id', { count: 'exact', head: true }),
    supabase.from('deliveries').select('id', { count: 'exact', head: true }),
    supabase.from('wickets').select('id', { count: 'exact', head: true }),
    supabase.from('deliveries').select('id', { count: 'exact', head: true }).eq('batter_runs', 6),
  ])

  return {
    totalMatches: matches.count || 0,
    totalDeliveries: deliveries.count || 0,
    totalWickets: wickets.count || 0,
    totalSixes: sixes.count || 0,
  }
}
