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

// Simple aggregation queries that work without RPCs
export async function getTopBatsmen(limit = 20) {
  if (!supabase) return []
  const { data } = await supabase
    .from('player_match_stats')
    .select('player_id, match_id, runs_scored, balls_faced, fours, sixes, is_not_out, players!inner(name)')
    .gt('balls_faced', 0)
  if (!data) return []

  const map = new Map<string, { id: string; name: string; runs: number; balls: number; matches: Set<string>; fours: number; sixes: number; not_outs: number; innings: number }>()
  for (const row of data as any[]) {
    const pid = row.player_id
    if (!map.has(pid)) map.set(pid, { id: pid, name: row.players.name, runs: 0, balls: 0, matches: new Set(), fours: 0, sixes: 0, not_outs: 0, innings: 0 })
    const p = map.get(pid)!
    p.runs += row.runs_scored
    p.balls += row.balls_faced
    p.matches.add(row.match_id)
    p.fours += row.fours
    p.sixes += row.sixes
    p.innings += 1
    if (row.is_not_out) p.not_outs += 1
  }

  return [...map.values()]
    .map(p => ({
      id: p.id,
      name: p.name,
      matches: p.matches.size,
      innings: p.innings,
      runs: p.runs,
      balls: p.balls,
      avg: p.innings - p.not_outs > 0 ? Math.round((p.runs / (p.innings - p.not_outs)) * 100) / 100 : 0,
      sr: p.balls > 0 ? Math.round((p.runs / p.balls) * 10000) / 100 : 0,
      fours: p.fours,
      sixes: p.sixes,
    }))
    .sort((a, b) => b.runs - a.runs)
    .slice(0, limit)
}

export async function getTopBowlers(limit = 20) {
  if (!supabase) return []
  const { data } = await supabase
    .from('player_match_stats')
    .select('player_id, match_id, wickets_taken, runs_conceded, overs_bowled, dots_bowled, players!inner(name)')
    .gt('overs_bowled', 0)
  if (!data) return []

  const map = new Map<string, { id: string; name: string; wickets: number; runs: number; overs: number; dots: number; matches: Set<string>; innings: number }>()
  for (const row of data as any[]) {
    const pid = row.player_id
    if (!map.has(pid)) map.set(pid, { id: pid, name: row.players.name, wickets: 0, runs: 0, overs: 0, dots: 0, matches: new Set(), innings: 0 })
    const p = map.get(pid)!
    p.wickets += row.wickets_taken
    p.runs += row.runs_conceded
    p.overs += row.overs_bowled
    p.dots += row.dots_bowled
    p.matches.add(row.match_id)
    p.innings += 1
  }

  return [...map.values()]
    .map(p => ({
      id: p.id,
      name: p.name,
      matches: p.matches.size,
      innings: p.innings,
      wickets: p.wickets,
      runs: p.runs,
      overs: Math.round(p.overs * 10) / 10,
      economy: p.overs > 0 ? Math.round((p.runs / p.overs) * 100) / 100 : 0,
      avg: p.wickets > 0 ? Math.round((p.runs / p.wickets) * 100) / 100 : 0,
      dots: p.dots,
    }))
    .sort((a, b) => b.wickets - a.wickets)
    .slice(0, limit)
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

  // Player 2 batting vs Player 1 bowling
  const { data: p2Bat } = await supabase
    .from('deliveries')
    .select('batter_runs, is_legal, is_boundary, is_dot, over_number, phase')
    .eq('batter_id', player2Id)
    .eq('bowler_id', player1Id)

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

  const { data: matches } = await supabase
    .from('matches')
    .select('id, date, team1_id, team2_id, winner_id, toss_winner_id, toss_decision, team1_score, team1_wickets, team2_score, team2_wickets, teams!matches_team1_id_fkey(name, short_name), season_id')
    .eq('venue_id', venueId)

  if (!matches || matches.length === 0) return null

  const totalMatches = matches.length
  let totalFirstInningsScore = 0, totalSecondInningsScore = 0, firstInningsCount = 0, secondInningsCount = 0
  let batFirstWins = 0, fieldFirstWins = 0

  for (const m of matches as any[]) {
    if (m.team1_score) { totalFirstInningsScore += m.team1_score; firstInningsCount++ }
    if (m.team2_score) { totalSecondInningsScore += m.team2_score; secondInningsCount++ }
    if (m.winner_id && m.toss_winner_id && m.toss_decision) {
      if (m.toss_decision === 'bat' && m.winner_id === m.toss_winner_id) batFirstWins++
      if (m.toss_decision === 'field' && m.winner_id === m.toss_winner_id) fieldFirstWins++
    }
  }

  // Top scorers at venue
  const { data: topScorers } = await supabase
    .from('player_match_stats')
    .select('player_id, runs_scored, balls_faced, players!inner(name)')
    .in('match_id', matches.map(m => m.id))
    .gt('runs_scored', 0)
    .order('runs_scored', { ascending: false })
    .limit(100)

  const scorerMap = new Map<string, { name: string; runs: number; balls: number; matches: number }>()
  if (topScorers) {
    for (const row of topScorers as any[]) {
      const pid = row.player_id
      if (!scorerMap.has(pid)) scorerMap.set(pid, { name: row.players.name, runs: 0, balls: 0, matches: 0 })
      const p = scorerMap.get(pid)!
      p.runs += row.runs_scored
      p.balls += row.balls_faced
      p.matches += 1
    }
  }

  return {
    totalMatches,
    avgFirstInnings: firstInningsCount > 0 ? Math.round(totalFirstInningsScore / firstInningsCount) : 0,
    avgSecondInnings: secondInningsCount > 0 ? Math.round(totalSecondInningsScore / secondInningsCount) : 0,
    highestScore: Math.max(...matches.map((m: any) => Math.max(m.team1_score || 0, m.team2_score || 0))),
    batFirstWinPct: totalMatches > 0 ? Math.round((batFirstWins / totalMatches) * 100) : 0,
    fieldFirstWinPct: totalMatches > 0 ? Math.round((fieldFirstWins / totalMatches) * 100) : 0,
    topScorers: [...scorerMap.values()].sort((a, b) => b.runs - a.runs).slice(0, 10),
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

  const { data: stats } = await supabase
    .from('player_match_stats')
    .select('player_id, runs_scored, balls_faced, fours, sixes, is_not_out, wickets_taken, runs_conceded, overs_bowled, dots_bowled, players!inner(name)')
    .eq('season_id', season.id)
  if (!stats) return { batsmen: [], bowlers: [], matches: matchCount?.length || 0 }

  // Aggregate batsmen
  const batMap = new Map<string, { id: string; name: string; runs: number; balls: number; fours: number; sixes: number; innings: number; not_outs: number }>()
  const bowlMap = new Map<string, { id: string; name: string; wickets: number; runs: number; overs: number; dots: number; innings: number }>()

  for (const row of stats as any[]) {
    const pid = row.player_id
    // Batting
    if (row.balls_faced > 0) {
      if (!batMap.has(pid)) batMap.set(pid, { id: pid, name: row.players.name, runs: 0, balls: 0, fours: 0, sixes: 0, innings: 0, not_outs: 0 })
      const b = batMap.get(pid)!
      b.runs += row.runs_scored; b.balls += row.balls_faced; b.fours += row.fours; b.sixes += row.sixes; b.innings += 1
      if (row.is_not_out) b.not_outs += 1
    }
    // Bowling
    if (row.overs_bowled > 0) {
      if (!bowlMap.has(pid)) bowlMap.set(pid, { id: pid, name: row.players.name, wickets: 0, runs: 0, overs: 0, dots: 0, innings: 0 })
      const b = bowlMap.get(pid)!
      b.wickets += row.wickets_taken; b.runs += row.runs_conceded; b.overs += row.overs_bowled; b.dots += row.dots_bowled; b.innings += 1
    }
  }

  const batsmen = [...batMap.values()]
    .map(b => ({ ...b, avg: b.innings - b.not_outs > 0 ? Math.round((b.runs / (b.innings - b.not_outs)) * 100) / 100 : 0, sr: b.balls > 0 ? Math.round((b.runs / b.balls) * 10000) / 100 : 0 }))
    .sort((a, b) => b.runs - a.runs)

  const bowlers = [...bowlMap.values()]
    .map(b => ({ ...b, economy: b.overs > 0 ? Math.round((b.runs / b.overs) * 100) / 100 : 0, avg: b.wickets > 0 ? Math.round((b.runs / b.wickets) * 100) / 100 : 0 }))
    .sort((a, b) => b.wickets - a.wickets)

  return { batsmen, bowlers, matches: matchCount?.length || 0 }
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
