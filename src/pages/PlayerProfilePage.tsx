import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, User, Star, GitCompareArrows, Trophy, TrendingUp, MapPin, Loader2, Swords, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BorderBeam } from '@/components/magicui/border-beam'
import { NumberTicker } from '@/components/magicui/number-ticker'
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from '@/components/ui/line-chart'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart } from 'recharts'
import {
  getPlayerById, getPlayerCareerStats, getPlayerSeasonHistorySupabase,
  getPlayerVenuePerformance, getPlayerBattingMatchups, getPlayerBowlingMatchups,
  getPlayerDismissals,
} from '@/lib/queries'
import { useAppStore } from '@/store/appStore'

export function PlayerProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToShortlist } = useAppStore()

  const [player, setPlayer] = useState<any>(null)
  const [career, setCareer] = useState<any>(null)
  const [seasons, setSeasons] = useState<any[]>([])
  const [venues, setVenues] = useState<any[]>([])
  const [battingMatchups, setBattingMatchups] = useState<any[]>([])
  const [bowlingMatchups, setBowlingMatchups] = useState<any[]>([])
  const [dismissals, setDismissals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      getPlayerById(id),
      getPlayerCareerStats(id),
      getPlayerSeasonHistorySupabase(id),
      getPlayerVenuePerformance(id),
      getPlayerBattingMatchups(id),
      getPlayerBowlingMatchups(id),
      getPlayerDismissals(id),
    ]).then(([p, c, s, v, bat, bowl, d]) => {
      setPlayer(p)
      setCareer(c)
      setSeasons(s)
      setVenues(v)
      setBattingMatchups(bat.slice(0, 15))
      setBowlingMatchups(bowl.slice(0, 15))
      setDismissals(d)
      setLoading(false)
    })
  }, [id])

  const chartConfig: ChartConfig = {
    runs: { label: 'Runs', color: '#f5a623' },
    wickets: { label: 'Wickets', color: '#22c55e' },
    value: { label: 'Value', color: '#f5a623' },
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin mr-3" />
        <span className="text-muted-foreground">Loading player profile...</span>
      </div>
    )
  }

  if (!player) {
    return (
      <div className="min-h-screen p-8 flex flex-col items-center justify-center">
        <User className="w-16 h-16 text-muted-foreground/20 mb-4" />
        <p className="text-muted-foreground mb-4">Player not found.</p>
        <Button variant="outline" onClick={() => navigate('/analytics')}>Back to Analytics</Button>
      </div>
    )
  }

  const isBatsman = (career?.runs || 0) > 100
  const isBowler = (career?.wickets || 0) > 10

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />Back
        </Button>

        {/* Hero */}
        <div className="relative bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 overflow-hidden mb-6">
          <BorderBeam size={300} duration={10} colorFrom="#f5a623" colorTo="#22c55e" />
          <div className="p-6 lg:p-8">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-24 h-24 rounded-2xl bg-accent/50 flex items-center justify-center ring-2 ring-border/30 shrink-0">
                <User className="w-12 h-12 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{player.name}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">{player.role || 'Batsman'}</Badge>
                  <Badge variant="outline">{player.batting_style || 'Right-Hand'}</Badge>
                  {player.bowling_style && player.bowling_style !== 'None' && (
                    <Badge variant="outline">{player.bowling_style}</Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-2">Short name: {player.short_name}</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => addToShortlist({ id: player.id, name: player.name, role: 'Batsman', battingStyle: 'Right-Hand', bowlingStyle: 'None', state: 'India', iplTeam: 'None', basePriceCr: 1, isCapped: true, tier: 'IPL Proven', age: 28, stats: { ipl: { matches: career?.matches || 0 } }, status: 'pending' } as any)}>
                  <Star className="w-3.5 h-3.5 mr-1" />Shortlist
                </Button>
                <Button size="sm" variant="outline" onClick={() => navigate('/h2h')}>
                  <GitCompareArrows className="w-3.5 h-3.5 mr-1" />H2H
                </Button>
              </div>
            </div>

            {/* Career stats row */}
            {career && (
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-6">
                <div className="p-3 rounded-xl bg-background/50 text-center">
                  <div className="text-[10px] text-muted-foreground uppercase">Matches</div>
                  <div className="text-2xl font-bold text-primary" style={{ fontFamily: 'var(--font-heading)' }}>
                    <NumberTicker value={career.matches} />
                  </div>
                </div>
                {isBatsman && (
                  <>
                    <div className="p-3 rounded-xl bg-background/50 text-center">
                      <div className="text-[10px] text-muted-foreground uppercase">Runs</div>
                      <div className="text-2xl font-bold text-chart-2" style={{ fontFamily: 'var(--font-heading)' }}>
                        <NumberTicker value={career.runs} />
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-background/50 text-center">
                      <div className="text-[10px] text-muted-foreground uppercase">Average</div>
                      <div className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{career.avg}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-background/50 text-center">
                      <div className="text-[10px] text-muted-foreground uppercase">Strike Rate</div>
                      <div className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{career.sr}</div>
                    </div>
                  </>
                )}
                {isBowler && (
                  <>
                    <div className="p-3 rounded-xl bg-background/50 text-center">
                      <div className="text-[10px] text-muted-foreground uppercase">Wickets</div>
                      <div className="text-2xl font-bold text-chart-4" style={{ fontFamily: 'var(--font-heading)' }}>
                        <NumberTicker value={career.wickets} />
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-background/50 text-center">
                      <div className="text-[10px] text-muted-foreground uppercase">Economy</div>
                      <div className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{career.economy}</div>
                    </div>
                  </>
                )}
                {!isBowler && isBatsman && (
                  <>
                    <div className="p-3 rounded-xl bg-background/50 text-center">
                      <div className="text-[10px] text-muted-foreground uppercase">HS</div>
                      <div className="text-2xl font-bold text-destructive" style={{ fontFamily: 'var(--font-heading)' }}>{career.highestScore}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-background/50 text-center">
                      <div className="text-[10px] text-muted-foreground uppercase">Sixes</div>
                      <div className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{career.sixes}</div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <TabsList className="bg-card/80 backdrop-blur-sm rounded-xl">
            <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
            <TabsTrigger value="seasons" className="rounded-lg">Seasons</TabsTrigger>
            <TabsTrigger value="venues" className="rounded-lg">Venues</TabsTrigger>
            <TabsTrigger value="matchups" className="rounded-lg">Matchups</TabsTrigger>
            <TabsTrigger value="dismissals" className="rounded-lg">Dismissals</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="mt-6">
            {seasons.length > 0 ? (
              <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
                    <TrendingUp className="w-4 h-4 text-primary" />CAREER TIMELINE
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <LineChart data={seasons} margin={{ left: -10, right: 10 }}>
                      <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.3} />
                      <XAxis dataKey="year" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      {isBatsman && <Line type="monotone" dataKey="runs" stroke="#f5a623" strokeWidth={3} dot={{ fill: '#f5a623', r: 4 }} />}
                      {isBowler && <Line type="monotone" dataKey="wickets" stroke="#22c55e" strokeWidth={3} dot={{ fill: '#22c55e', r: 4 }} />}
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            ) : <p className="text-center py-8 text-muted-foreground">No season data available.</p>}
          </TabsContent>

          {/* Seasons */}
          <TabsContent value="seasons" className="mt-6">
            <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/20 text-[10px] uppercase text-muted-foreground">
                      <th className="text-left p-3">Year</th>
                      <th className="text-right p-3">Mat</th>
                      <th className="text-right p-3">Runs</th>
                      <th className="text-right p-3">Avg</th>
                      <th className="text-right p-3">SR</th>
                      <th className="text-right p-3">Wkts</th>
                      <th className="text-right p-3">Econ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seasons.map((s, i) => (
                      <motion.tr key={s.year} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                        className="border-b border-border/10 hover:bg-background/30">
                        <td className="p-3 font-bold text-primary">IPL {s.year}</td>
                        <td className="p-3 text-right">{s.matches}</td>
                        <td className="p-3 text-right font-bold">{s.runs || '—'}</td>
                        <td className="p-3 text-right">{s.avg || '—'}</td>
                        <td className="p-3 text-right">{s.sr || '—'}</td>
                        <td className="p-3 text-right font-bold">{s.wickets || '—'}</td>
                        <td className="p-3 text-right">{s.economy || '—'}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Venues */}
          <TabsContent value="venues" className="mt-6">
            {venues.length > 0 ? (
              <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
                    <MapPin className="w-4 h-4 text-primary" />BEST VENUES
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[400px]">
                    <BarChart data={venues.slice(0, 10)} layout="vertical" margin={{ left: 120, right: 10 }}>
                      <CartesianGrid horizontal={false} stroke="var(--border)" strokeOpacity={0.3} />
                      <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="venue" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} width={115} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="runs" fill="#f5a623" radius={[0, 4, 4, 0]} barSize={14} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            ) : <p className="text-center py-8 text-muted-foreground">No venue data available.</p>}
          </TabsContent>

          {/* Matchups */}
          <TabsContent value="matchups" className="mt-6">
            {isBatsman && battingMatchups.length > 0 && (
              <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden mb-4">
                <div className="p-4 border-b border-border/30 flex items-center gap-2">
                  <Swords className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold uppercase" style={{ fontFamily: 'var(--font-heading)' }}>VS BOWLERS (Batting)</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/20 text-[10px] uppercase text-muted-foreground">
                        <th className="text-left p-3">Bowler</th>
                        <th className="text-right p-3">Balls</th>
                        <th className="text-right p-3">Runs</th>
                        <th className="text-right p-3">SR</th>
                        <th className="text-right p-3">4s/6s</th>
                        <th className="text-right p-3">Out</th>
                      </tr>
                    </thead>
                    <tbody>
                      {battingMatchups.map((b, i) => (
                        <motion.tr key={b.bowler_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                          className="border-b border-border/10 hover:bg-background/30">
                          <td className="p-3 font-medium">{b.bowler_name}</td>
                          <td className="p-3 text-right">{b.balls}</td>
                          <td className="p-3 text-right font-bold text-primary">{b.runs}</td>
                          <td className="p-3 text-right">{b.sr}</td>
                          <td className="p-3 text-right">{b.boundaries}</td>
                          <td className="p-3 text-right text-destructive">{b.dismissals}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {isBowler && bowlingMatchups.length > 0 && (
              <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden">
                <div className="p-4 border-b border-border/30 flex items-center gap-2">
                  <Target className="w-4 h-4 text-chart-2" />
                  <h3 className="text-sm font-bold uppercase" style={{ fontFamily: 'var(--font-heading)' }}>VS BATSMEN (Bowling)</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/20 text-[10px] uppercase text-muted-foreground">
                        <th className="text-left p-3">Batsman</th>
                        <th className="text-right p-3">Balls</th>
                        <th className="text-right p-3">Runs</th>
                        <th className="text-right p-3">SR</th>
                        <th className="text-right p-3">Dots</th>
                        <th className="text-right p-3">Wkts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bowlingMatchups.map((b, i) => (
                        <motion.tr key={b.batter_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                          className="border-b border-border/10 hover:bg-background/30">
                          <td className="p-3 font-medium">{b.batter_name}</td>
                          <td className="p-3 text-right">{b.balls}</td>
                          <td className="p-3 text-right">{b.runs}</td>
                          <td className="p-3 text-right">{b.sr}</td>
                          <td className="p-3 text-right">{b.dots}</td>
                          <td className="p-3 text-right font-bold text-chart-2">{b.dismissals}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Dismissals */}
          <TabsContent value="dismissals" className="mt-6">
            {dismissals.length > 0 ? (
              <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
                    <Trophy className="w-4 h-4 text-destructive" />HOW OUT
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {dismissals.map((d, i) => {
                      const total = dismissals.reduce((s, x) => s + x.count, 0)
                      const pct = Math.round((d.count / total) * 100)
                      return (
                        <motion.div key={d.kind} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium capitalize">{d.kind}</span>
                            <span className="text-muted-foreground">{d.count} ({pct}%)</span>
                          </div>
                          <div className="h-2 bg-background/50 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: i * 0.05 }}
                              className="h-full bg-gradient-to-r from-destructive to-destructive/70 rounded-full" />
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            ) : <p className="text-center py-8 text-muted-foreground">No dismissal data available.</p>}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
