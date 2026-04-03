import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, User, Star, GitCompareArrows, Trophy, TrendingUp, MapPin, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BorderBeam } from '@/components/magicui/border-beam'
import { NumberTicker } from '@/components/magicui/number-ticker'
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from '@/components/ui/line-chart'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import { PLAYERS } from '@/data/players'
import { IPL_FRANCHISES } from '@/data/franchises'
import { useAppStore } from '@/store/appStore'

const roleColors: Record<string, string> = {
  'Batsman': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Bowler': 'bg-red-500/20 text-red-400 border-red-500/30',
  'All-Rounder': 'bg-green-500/20 text-green-400 border-green-500/30',
  'WK-Batsman': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
}

const tierColors: Record<string, string> = {
  'International Ready': 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  'IPL Proven': 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  'Domestic Star': 'text-sky-400 border-sky-500/30 bg-sky-500/10',
  'Emerging Talent': 'text-violet-400 border-violet-500/30 bg-violet-500/10',
}

export function PlayerProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToShortlist, isInShortlist, setCompareSlot } = useAppStore()

  const player = PLAYERS.find(p => p.id === id)
  const franchise = player ? IPL_FRANCHISES.find(f => f.name === player.iplTeam) : null

  const formatStats = useMemo(() => {
    if (!player) return []
    const entries: { format: string; stats: Record<string, number> }[] = []
    if (player.stats.ipl) entries.push({ format: 'IPL', stats: player.stats.ipl as Record<string, number> })
    if (player.stats.t20i) entries.push({ format: 'T20I', stats: player.stats.t20i as Record<string, number> })
    if (player.stats.odi) entries.push({ format: 'ODI', stats: player.stats.odi as Record<string, number> })
    if (player.stats.ranji) entries.push({ format: 'Ranji', stats: player.stats.ranji as Record<string, number> })
    if (player.stats.lista) entries.push({ format: 'List A', stats: player.stats.lista as Record<string, number> })
    return entries
  }, [player])

  const barChartData = useMemo(() => {
    return formatStats.map(f => ({
      format: f.format,
      matches: f.stats.matches || 0,
      runs: f.stats.runs || 0,
      wickets: f.stats.wickets || 0,
    }))
  }, [formatStats])

  const radarData = useMemo(() => {
    if (!player) return []
    const allStats = player.stats.ipl || player.stats.t20i || player.stats.ranji
    if (!allStats) return []
    const s = allStats as Record<string, number>
    const metrics = [
      { stat: 'Matches', value: Math.min((s.matches || 0) / 250 * 100, 100) },
      { stat: 'Runs', value: Math.min((s.runs || 0) / 8000 * 100, 100) },
      { stat: 'Average', value: Math.min((s.avg || 0) / 60 * 100, 100) },
      { stat: 'Strike Rate', value: Math.min((s.sr || 0) / 200 * 100, 100) },
      { stat: 'Wickets', value: Math.min((s.wickets || 0) / 200 * 100, 100) },
      { stat: 'Economy', value: s.economy ? Math.max(0, 100 - (s.economy / 12 * 100)) : 0 },
    ].filter(m => m.value > 0)
    return metrics
  }, [player])

  if (!player) {
    return (
      <div className="min-h-screen p-8 flex flex-col items-center justify-center">
        <p className="text-muted-foreground mb-4">Player not found.</p>
        <Button variant="outline" onClick={() => navigate('/scout')}>Back to Scout</Button>
      </div>
    )
  }

  const inShortlist = isInShortlist(player.id)
  const chartConfig: ChartConfig = {
    matches: { label: 'Matches', color: '#f59e0b' },
    runs: { label: 'Runs', color: '#22c55e' },
    wickets: { label: 'Wickets', color: '#ef4444' },
    value: { label: 'Score', color: '#f59e0b' },
  }

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto">
        {/* Back */}
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />Back
        </Button>

        {/* Hero Card */}
        <div className="relative bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 overflow-hidden mb-6"
          style={{ background: franchise ? `linear-gradient(135deg, ${franchise.color}10, transparent)` : undefined }}>
          {franchise && <BorderBeam size={300} duration={10} colorFrom={franchise.color} colorTo={`${franchise.color}60`} />}

          <div className="p-6 lg:p-8">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-2xl bg-accent/50 flex items-center justify-center ring-2 ring-border/30 shrink-0"
                style={franchise ? { borderColor: `${franchise.color}40` } : {}}>
                <User className="w-12 h-12 text-muted-foreground" />
              </div>

              {/* Info */}
              <div className="flex-1">
                <h1 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{player.name}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge className={roleColors[player.role]}>{player.role}</Badge>
                  <Badge className={tierColors[player.tier]}>{player.tier}</Badge>
                  {player.isCapped && <Badge variant="outline" className="border-amber-500/30 text-amber-400">International</Badge>}
                </div>
                <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{player.state}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Age: {player.age}</span>
                  <span>{player.battingStyle} Bat</span>
                  {player.bowlingStyle !== 'None' && <span>{player.bowlingStyle}</span>}
                  {franchise && <span className="font-medium" style={{ color: franchise.color }}>{franchise.shortName}</span>}
                </div>
              </div>

              {/* Price & Actions */}
              <div className="text-right shrink-0">
                <div className="text-xs text-muted-foreground uppercase mb-1">Base Price</div>
                <div className="text-4xl font-bold text-primary" style={{ fontFamily: 'var(--font-heading)' }}>
                  <NumberTicker value={player.basePriceCr} decimalPlaces={1} /> Cr
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant={inShortlist ? 'default' : 'outline'} onClick={() => addToShortlist(player)} disabled={inShortlist} className="rounded-lg">
                    <Star className="w-3.5 h-3.5 mr-1" />{inShortlist ? 'Listed' : 'Shortlist'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setCompareSlot(0, player); navigate('/compare') }} className="rounded-lg">
                    <GitCompareArrows className="w-3.5 h-3.5 mr-1" />Compare
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-card/80 backdrop-blur-sm rounded-xl">
            <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
            <TabsTrigger value="formats" className="rounded-lg">By Format</TabsTrigger>
            <TabsTrigger value="charts" className="rounded-lg">Charts</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview">
            <div className="grid md:grid-cols-2 gap-6">
              {formatStats.map(f => (
                <motion.div key={f.format} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-card/80 backdrop-blur-sm rounded-xl border border-border/50 p-5">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
                    <Trophy className="w-4 h-4 inline mr-1.5 -mt-0.5" />{f.format}
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries(f.stats).map(([key, val]) => {
                      const labels: Record<string, string> = { matches: 'Matches', runs: 'Runs', avg: 'Average', sr: 'Strike Rate', wickets: 'Wickets', economy: 'Economy' }
                      return (
                        <div key={key} className="p-2.5 rounded-lg bg-background/50">
                          <div className="text-[10px] text-muted-foreground uppercase">{labels[key] || key}</div>
                          <div className="text-lg font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{val}</div>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              ))}
              {formatStats.length === 0 && (
                <p className="text-muted-foreground col-span-2 text-center py-8">No detailed stats available.</p>
              )}
            </div>
          </TabsContent>

          {/* By Format - detailed table */}
          <TabsContent value="formats">
            <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/30">
                      <th className="text-left p-4 text-xs uppercase text-muted-foreground font-bold">Format</th>
                      <th className="text-center p-4 text-xs uppercase text-muted-foreground font-bold">Mat</th>
                      <th className="text-center p-4 text-xs uppercase text-muted-foreground font-bold">Runs</th>
                      <th className="text-center p-4 text-xs uppercase text-muted-foreground font-bold">Avg</th>
                      <th className="text-center p-4 text-xs uppercase text-muted-foreground font-bold">SR</th>
                      <th className="text-center p-4 text-xs uppercase text-muted-foreground font-bold">Wkts</th>
                      <th className="text-center p-4 text-xs uppercase text-muted-foreground font-bold">Econ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formatStats.map((f, i) => (
                      <motion.tr key={f.format} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                        className="border-b border-border/10 hover:bg-background/30 transition-colors">
                        <td className="p-4 font-bold text-primary" style={{ fontFamily: 'var(--font-heading)' }}>{f.format}</td>
                        <td className="p-4 text-center font-medium">{f.stats.matches ?? '—'}</td>
                        <td className="p-4 text-center font-medium">{f.stats.runs ?? '—'}</td>
                        <td className="p-4 text-center font-medium">{f.stats.avg ?? '—'}</td>
                        <td className="p-4 text-center font-medium">{f.stats.sr ?? '—'}</td>
                        <td className="p-4 text-center font-medium">{f.stats.wickets ?? '—'}</td>
                        <td className="p-4 text-center font-medium">{f.stats.economy ?? '—'}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Charts */}
          <TabsContent value="charts">
            <div className="grid md:grid-cols-2 gap-6">
              {barChartData.length > 0 && (
                <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
                      <TrendingUp className="w-4 h-4 inline mr-1.5 text-primary" />ACROSS FORMATS
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[280px]">
                      <BarChart data={barChartData} margin={{ left: -10, right: 10 }}>
                        <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.3} />
                        <XAxis dataKey="format" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="matches" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={18} filter="url(#glow-p)" />
                        <Bar dataKey="runs" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={18} filter="url(#glow-p)" />
                        <Bar dataKey="wickets" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={18} filter="url(#glow-p)" />
                        <defs>
                          <filter id="glow-p" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                          </filter>
                        </defs>
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              )}

              {radarData.length >= 3 && (
                <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
                      <TrendingUp className="w-4 h-4 inline mr-1.5 text-chart-3" />SKILL RADAR
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[280px]">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="var(--border)" />
                        <PolarAngleAxis dataKey="stat" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar dataKey="value" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.25} strokeWidth={2} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </RadarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
