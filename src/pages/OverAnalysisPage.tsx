import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Loader2, Search, User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from '@/components/ui/line-chart'
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Bar, BarChart } from 'recharts'
import { IPL_FRANCHISES } from '@/data/franchises'
import { supabase } from '@/lib/supabase'
import { searchPlayersDB } from '@/lib/queries'

// ===== TEAM TAB =====
function TeamOverAnalysis() {
  const [selected, setSelected] = useState(IPL_FRANCHISES[0])
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      if (!supabase) return
      setLoading(true)
      const { data: rows, error } = await supabase.rpc('get_team_over_stats', { team_name: selected.name })
      if (error) console.error(error)
      setData((rows as any[] || []).map(r => ({
        over: Number(r.over_num) + 1,
        runsPerMatch: Number(r.avg_runs),
        totalRuns: Number(r.total_runs),
        wicketsLost: Number(r.wickets_lost),
      })))
      setLoading(false)
    }
    fetch()
  }, [selected])

  const chartConfig: ChartConfig = {
    runsPerMatch: { label: 'Avg Runs', color: '#c0c8d4' },
    wicketsLost: { label: 'Wickets', color: '#ef4444' },
  }

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {IPL_FRANCHISES.map(team => (
          <motion.button key={team.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setSelected(team)}
            className={`p-3 rounded-xl border-2 text-center transition-all ${selected.id === team.id ? '' : 'border-border/50'}`}
            style={{
              background: `linear-gradient(135deg, ${team.color}${selected.id === team.id ? '20' : '08'}, transparent)`,
              borderColor: selected.id === team.id ? team.color : undefined,
            }}>
            <div className="text-lg font-bold" style={{ color: team.color, fontFamily: 'var(--font-heading)' }}>{team.shortName}</div>
          </motion.button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-primary animate-spin mr-3" /><span className="text-muted-foreground">Loading...</span>
        </div>
      ) : data.length > 0 ? (
        <div className="space-y-6">
          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
                <span style={{ color: selected.color }}>{selected.shortName}</span> — AVG RUNS PER OVER
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <LineChart data={data} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.3} />
                  <XAxis dataKey="over" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="runsPerMatch" stroke={selected.color} strokeWidth={3} dot={{ fill: selected.color, r: 4 }} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
                <span style={{ color: selected.color }}>{selected.shortName}</span> — WICKETS LOST PER OVER
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <BarChart data={data} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.3} />
                  <XAxis dataKey="over" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="wicketsLost" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={16} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      ) : (
        <p className="text-center py-12 text-muted-foreground">No data for {selected.name}</p>
      )}
    </div>
  )
}

// ===== PLAYER TAB =====
function PlayerOverAnalysis() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null)
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [filterMode, setFilterMode] = useState<'for' | 'vs'>('vs')
  const [batData, setBatData] = useState<any[]>([])
  const [bowlData, setBowlData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)

  const handleSearch = async (q: string) => {
    setQuery(q)
    if (q.length < 2) { setResults([]); return }
    setSearching(true)
    const r = await searchPlayersDB(q, 8)
    setResults(r)
    setSearching(false)
  }

  const fetchData = async (player: any, teamName: string | null, mode: 'for' | 'vs' = filterMode) => {
    if (!supabase || !player) return
    setLoading(true)

    const batFn = teamName === null ? 'get_batter_over_stats' : mode === 'vs' ? 'get_batter_over_stats_vs_team' : 'get_batter_over_stats_by_team'
    const bowlFn = teamName === null ? 'get_bowler_over_stats' : mode === 'vs' ? 'get_bowler_over_stats_vs_team' : 'get_bowler_over_stats_by_team'

    const [batRes, bowlRes] = await Promise.all([
      supabase.rpc(batFn, teamName === null ? { p_id: player.id } : { p_id: player.id, team_name: teamName }),
      supabase.rpc(bowlFn, teamName === null ? { p_id: player.id } : { p_id: player.id, team_name: teamName }),
    ])

    setBatData((batRes.data as any[] || []).map(r => ({
      over: Number(r.over_num) + 1,
      runs: Number(r.runs),
      avgRuns: Number(r.avg_runs),
      balls: Number(r.balls),
      fours: Number(r.fours),
      sixes: Number(r.sixes),
      dots: Number(r.dots),
      dismissals: Number(r.dismissals),
      sr: Number(r.balls) > 0 ? Math.round((Number(r.runs) / Number(r.balls)) * 10000) / 100 : 0,
    })))

    setBowlData((bowlRes.data as any[] || []).map(r => ({
      over: Number(r.over_num) + 1,
      runsConceded: Number(r.runs_conceded),
      avgRuns: Number(r.avg_runs),
      balls: Number(r.balls),
      wickets: Number(r.wickets),
      dots: Number(r.dots),
      foursConceded: Number(r.fours_conceded),
      sixesConceded: Number(r.sixes_conceded),
    })))

    setLoading(false)
  }

  const handleSelect = async (player: any) => {
    setSelectedPlayer(player)
    setQuery(player.name)
    setResults([])
    setSelectedTeam(null)
    await fetchData(player, null)
  }

  const handleTeamFilter = async (teamName: string | null) => {
    setSelectedTeam(teamName)
    await fetchData(selectedPlayer, teamName, filterMode)
  }

  const handleModeSwitch = async (mode: 'for' | 'vs') => {
    setFilterMode(mode)
    if (selectedTeam) {
      await fetchData(selectedPlayer, selectedTeam, mode)
    }
  }

  const hasBatData = batData.some(d => d.runs > 0)
  const hasBowlData = bowlData.some(d => d.balls > 0)

  const batChartConfig: ChartConfig = {
    avgRuns: { label: 'Avg Runs', color: '#c0c8d4' },
    sr: { label: 'Strike Rate', color: '#22c55e' },
    fours: { label: 'Fours', color: '#3b82f6' },
    sixes: { label: 'Sixes', color: '#a855f7' },
    dismissals: { label: 'Dismissals', color: '#ef4444' },
  }

  const bowlChartConfig: ChartConfig = {
    avgRuns: { label: 'Avg Conceded', color: '#ef4444' },
    wickets: { label: 'Wickets', color: '#22c55e' },
    dots: { label: 'Dots', color: '#c0c8d4' },
    foursConceded: { label: '4s Conceded', color: '#3b82f6' },
    sixesConceded: { label: '6s Conceded', color: '#a855f7' },
  }

  return (
    <div>
      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={query} onChange={(e) => handleSearch(e.target.value)} placeholder="Search player name..."
          className="pl-10 bg-card/80 border-border/50 rounded-xl" />
        {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
        <AnimatePresence>
          {results.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="absolute top-full left-0 right-0 mt-1 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl z-10 shadow-2xl overflow-hidden">
              {results.map(p => (
                <button key={p.id} onClick={() => handleSelect(p)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-accent/50 transition-colors text-sm">
                  <User className="w-4 h-4 text-muted-foreground" /><span className="font-medium">{p.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{p.short_name}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-primary animate-spin mr-3" /><span className="text-muted-foreground">Loading over-by-over stats...</span>
        </div>
      ) : selectedPlayer ? (
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-accent/50 flex items-center justify-center ring-1 ring-border/30">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{selectedPlayer.name}</h3>
              <span className="text-xs text-muted-foreground">{selectedPlayer.short_name}</span>
            </div>
          </div>

          {/* Team filter */}
          <div className="bg-card/60 backdrop-blur-sm rounded-xl border border-border/30 p-3 mb-4 space-y-3">
            {/* For / Vs toggle */}
            <div className="flex items-center justify-between">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Filter by Team</div>
              {selectedTeam && (
                <div className="flex items-center bg-background/50 rounded-lg border border-border/30 p-0.5">
                  <button onClick={() => handleModeSwitch('for')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                      filterMode === 'for' ? 'bg-chart-2/20 text-chart-2' : 'text-muted-foreground hover:text-foreground'
                    }`}>
                    Playing For
                  </button>
                  <button onClick={() => handleModeSwitch('vs')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                      filterMode === 'vs' ? 'bg-destructive/20 text-destructive' : 'text-muted-foreground hover:text-foreground'
                    }`}>
                    Vs (Against)
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => handleTeamFilter(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedTeam === null ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-background/50 text-muted-foreground border border-border/30 hover:text-foreground'
                }`}>
                All Teams
              </motion.button>
              {IPL_FRANCHISES.map(team => (
                <motion.button key={team.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => handleTeamFilter(team.name)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedTeam === team.name ? 'border' : 'bg-background/50 border border-border/30'
                  }`}
                  style={{
                    color: selectedTeam === team.name ? team.color : undefined,
                    borderColor: selectedTeam === team.name ? team.color : undefined,
                    backgroundColor: selectedTeam === team.name ? `${team.color}15` : undefined,
                  }}>
                  {team.shortName}
                </motion.button>
              ))}
            </div>

            {selectedTeam && (
              <div className="text-xs text-muted-foreground">
                Showing stats {filterMode === 'vs' ? <span className="text-destructive font-medium">against</span> : <span className="text-chart-2 font-medium">playing for</span>} {selectedTeam}
              </div>
            )}
          </div>

          {/* Batting over-by-over */}
          {hasBatData && (
            <>
              <h3 className="text-sm font-bold uppercase text-muted-foreground" style={{ fontFamily: 'var(--font-heading)' }}>BATTING — OVER BY OVER</h3>

              <div className="grid lg:grid-cols-3 gap-6">
                <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold">AVG RUNS PER OVER</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={batChartConfig} className="h-[250px]">
                      <LineChart data={batData} margin={{ left: -10, right: 10 }}>
                        <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.3} />
                        <XAxis dataKey="over" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="avgRuns" stroke="#c0c8d4" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold">STRIKE RATE PER OVER</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={batChartConfig} className="h-[250px]">
                      <LineChart data={batData} margin={{ left: -10, right: 10 }}>
                        <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.3} />
                        <XAxis dataKey="over" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="sr" stroke="#22c55e" strokeWidth={2} dot={{ r: 3, fill: '#22c55e' }} />
                      </LineChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold">BOUNDARIES & DISMISSALS</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={batChartConfig} className="h-[250px]">
                      <BarChart data={batData} margin={{ left: -10, right: 10 }}>
                        <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.3} />
                        <XAxis dataKey="over" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="fours" fill="#3b82f6" radius={[2, 2, 0, 0]} barSize={8} />
                        <Bar dataKey="sixes" fill="#a855f7" radius={[2, 2, 0, 0]} barSize={8} />
                        <Bar dataKey="dismissals" fill="#ef4444" radius={[2, 2, 0, 0]} barSize={8} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Batting table */}
              <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/20 text-[10px] uppercase text-muted-foreground">
                        <th className="text-left p-3">Over</th>
                        <th className="text-right p-3">Balls</th>
                        <th className="text-right p-3">Runs</th>
                        <th className="text-right p-3">Avg</th>
                        <th className="text-right p-3">SR</th>
                        <th className="text-right p-3">4s</th>
                        <th className="text-right p-3">6s</th>
                        <th className="text-right p-3">Dots</th>
                        <th className="text-right p-3">Out</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batData.map((d, i) => (
                        <motion.tr key={d.over} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                          className="border-b border-border/10 hover:bg-background/30">
                          <td className="p-3 font-bold text-primary">Over {d.over}</td>
                          <td className="p-3 text-right">{d.balls}</td>
                          <td className="p-3 text-right font-bold">{d.runs}</td>
                          <td className="p-3 text-right">{d.avgRuns}</td>
                          <td className="p-3 text-right">{d.sr}</td>
                          <td className="p-3 text-right text-blue-400">{d.fours}</td>
                          <td className="p-3 text-right text-purple-400">{d.sixes}</td>
                          <td className="p-3 text-right">{d.dots}</td>
                          <td className="p-3 text-right text-destructive font-bold">{d.dismissals}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Bowling over-by-over */}
          {hasBowlData && (
            <>
              <h3 className="text-sm font-bold uppercase text-muted-foreground mt-8" style={{ fontFamily: 'var(--font-heading)' }}>BOWLING — OVER BY OVER</h3>

              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold">AVG RUNS CONCEDED</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={bowlChartConfig} className="h-[250px]">
                      <LineChart data={bowlData} margin={{ left: -10, right: 10 }}>
                        <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.3} />
                        <XAxis dataKey="over" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="avgRuns" stroke="#ef4444" strokeWidth={2} dot={{ r: 3, fill: '#ef4444' }} />
                      </LineChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold">WICKETS & DOT BALLS</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={bowlChartConfig} className="h-[250px]">
                      <BarChart data={bowlData} margin={{ left: -10, right: 10 }}>
                        <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.3} />
                        <XAxis dataKey="over" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="wickets" fill="#22c55e" radius={[2, 2, 0, 0]} barSize={10} />
                        <Bar dataKey="foursConceded" fill="#3b82f6" radius={[2, 2, 0, 0]} barSize={10} />
                        <Bar dataKey="sixesConceded" fill="#a855f7" radius={[2, 2, 0, 0]} barSize={10} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Bowling table */}
              <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/20 text-[10px] uppercase text-muted-foreground">
                        <th className="text-left p-3">Over</th>
                        <th className="text-right p-3">Balls</th>
                        <th className="text-right p-3">Runs</th>
                        <th className="text-right p-3">Avg</th>
                        <th className="text-right p-3">Wkts</th>
                        <th className="text-right p-3">Dots</th>
                        <th className="text-right p-3">4s</th>
                        <th className="text-right p-3">6s</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bowlData.map((d, i) => (
                        <motion.tr key={d.over} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                          className="border-b border-border/10 hover:bg-background/30">
                          <td className="p-3 font-bold text-primary">Over {d.over}</td>
                          <td className="p-3 text-right">{d.balls}</td>
                          <td className="p-3 text-right">{d.runsConceded}</td>
                          <td className="p-3 text-right">{d.avgRuns}</td>
                          <td className="p-3 text-right font-bold text-chart-2">{d.wickets}</td>
                          <td className="p-3 text-right">{d.dots}</td>
                          <td className="p-3 text-right text-blue-400">{d.foursConceded}</td>
                          <td className="p-3 text-right text-purple-400">{d.sixesConceded}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {!hasBatData && !hasBowlData && (
            <p className="text-center py-12 text-muted-foreground">No over-by-over data for this player.</p>
          )}
        </div>
      ) : (
        <div className="text-center py-16">
          <User className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground">Search a player above to see their over-by-over breakdown.</p>
        </div>
      )}
    </div>
  )
}

// ===== MAIN PAGE =====
export function OverAnalysisPage() {
  return (
    <div className="min-h-screen p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
            <Activity className="inline-block w-8 h-8 text-primary mr-3 -mt-1" />OVER-BY-OVER
          </h1>
          <p className="text-muted-foreground mt-1">Detailed analysis of how teams and players perform across all 20 overs.</p>
        </div>

        <Tabs defaultValue="teams" className="space-y-6">
          <TabsList className="bg-card/80 backdrop-blur-sm rounded-xl">
            <TabsTrigger value="teams" className="rounded-lg">Team Analysis</TabsTrigger>
            <TabsTrigger value="players" className="rounded-lg">Player Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="teams">
            <TeamOverAnalysis />
          </TabsContent>

          <TabsContent value="players">
            <PlayerOverAnalysis />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
