import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GitCompareArrows, Search, X, User, Star, BarChart3 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TextAnimate } from '@/components/magicui/text-animate'
import { BorderBeam } from '@/components/magicui/border-beam'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/line-chart'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  CartesianGrid,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from 'recharts'
import { PLAYERS, type Player } from '@/data/players'
import { useAppStore } from '@/store/appStore'

function PlayerSelector({ slot, onSelect }: { slot: 0 | 1; onSelect: (p: Player) => void }) {
  const [search, setSearch] = useState('')
  const results = useMemo(() => {
    if (!search.trim()) return []
    return PLAYERS.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.role.toLowerCase().includes(search.toLowerCase())).slice(0, 8)
  }, [search])

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search Player ${slot + 1}...`}
          className="pl-10 bg-background/50 border-border/50 rounded-xl" />
      </div>
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
            className="absolute top-full left-0 right-0 mt-1 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl z-10 overflow-hidden shadow-2xl">
            {results.map(p => (
              <button key={p.id} onClick={() => { onSelect(p); setSearch('') }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-accent/50 transition-colors text-sm">
                <div className="w-7 h-7 rounded-full bg-accent/50 flex items-center justify-center"><User className="w-3.5 h-3.5 text-muted-foreground" /></div>
                <span className="font-medium">{p.name}</span>
                <Badge variant="outline" className="text-[9px] ml-auto">{p.role}</Badge>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function StatBar({ label, val1, val2, higher }: { label: string; val1: number | undefined; val2: number | undefined; higher: 'higher' | 'lower' }) {
  if (val1 == null && val2 == null) return null
  const v1 = val1 ?? 0, v2 = val2 ?? 0, max = Math.max(v1, v2, 1)
  const winner = higher === 'higher' ? (v1 > v2 ? 1 : v2 > v1 ? 2 : 0) : (v1 < v2 ? 1 : v2 < v1 ? 2 : 0)

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center py-3 border-b border-border/20 last:border-0">
      <div className="text-right">
        <span className={`text-base font-bold ${winner === 1 ? 'text-chart-2' : 'text-foreground'}`}>{v1 || '—'}</span>
        <div className="h-2 rounded-full bg-accent/50 mt-1.5 relative overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${(v1 / max) * 100}%` }} transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
            className={`absolute right-0 top-0 h-full rounded-full ${winner === 1 ? 'bg-chart-2' : 'bg-muted-foreground/20'}`} />
        </div>
      </div>
      <span className="text-[11px] text-muted-foreground uppercase font-bold w-16 text-center tracking-wider">{label}</span>
      <div>
        <span className={`text-base font-bold ${winner === 2 ? 'text-chart-2' : 'text-foreground'}`}>{v2 || '—'}</span>
        <div className="h-2 rounded-full bg-accent/50 mt-1.5 relative overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${(v2 / max) * 100}%` }} transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
            className={`absolute left-0 top-0 h-full rounded-full ${winner === 2 ? 'bg-chart-2' : 'bg-muted-foreground/20'}`} />
        </div>
      </div>
    </div>
  )
}

function StatsRadarChart({ p1, p2, s1, s2 }: { p1: Player; p2: Player; s1: Record<string, number> | null; s2: Record<string, number> | null }) {
  if (!s1 && !s2) return null

  const metrics = [
    { key: 'matches', label: 'Matches', max: 250 },
    { key: 'runs', label: 'Runs', max: 8000 },
    { key: 'avg', label: 'Average', max: 60 },
    { key: 'sr', label: 'Strike Rate', max: 200 },
    { key: 'wickets', label: 'Wickets', max: 200 },
    { key: 'economy', label: 'Economy', max: 12, invert: true },
  ]

  const radarData = metrics
    .filter(m => (s1 && s1[m.key] != null) || (s2 && s2[m.key] != null))
    .map(m => {
      const v1Raw = s1?.[m.key] ?? 0
      const v2Raw = s2?.[m.key] ?? 0
      // Normalize to 0-100 scale
      const v1 = (m as { invert?: boolean }).invert ? Math.max(0, 100 - (v1Raw / m.max) * 100) : (v1Raw / m.max) * 100
      const v2 = (m as { invert?: boolean }).invert ? Math.max(0, 100 - (v2Raw / m.max) * 100) : (v2Raw / m.max) * 100
      return { stat: m.label, player1: Math.min(v1, 100), player2: Math.min(v2, 100) }
    })

  if (radarData.length < 3) return null

  const chartConfig: ChartConfig = {
    player1: { label: p1.name.split(' ').pop(), color: '#c0c8d4' },
    player2: { label: p2.name.split(' ').pop(), color: '#3b82f6' },
  }

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
          <BarChart3 className="w-4 h-4 text-primary" />
          RADAR COMPARISON
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px]">
          <RadarChart data={radarData}>
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis dataKey="stat" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar name={p1.name} dataKey="player1" stroke="#c0c8d4" fill="#c0c8d4" fillOpacity={0.2} strokeWidth={2} />
            <Radar name={p2.name} dataKey="player2" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
            <ChartTooltip content={<ChartTooltipContent />} />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

function StatsBarChart({ p1, p2, s1, s2 }: { p1: Player; p2: Player; s1: Record<string, number> | null; s2: Record<string, number> | null }) {
  if (!s1 && !s2) return null

  const metrics = ['matches', 'runs', 'avg', 'sr', 'wickets', 'economy']
  const labels: Record<string, string> = { matches: 'Mat', runs: 'Runs', avg: 'Avg', sr: 'SR', wickets: 'Wkts', economy: 'Econ' }

  const barData = metrics
    .filter(m => (s1 && s1[m] != null) || (s2 && s2[m] != null))
    .map(m => ({
      stat: labels[m],
      player1: s1?.[m] ?? 0,
      player2: s2?.[m] ?? 0,
    }))

  if (barData.length === 0) return null

  const chartConfig: ChartConfig = {
    player1: { label: p1.name.split(' ').pop(), color: '#c0c8d4' },
    player2: { label: p2.name.split(' ').pop(), color: '#3b82f6' },
  }

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
          <BarChart3 className="w-4 h-4 text-chart-2" />
          STAT COMPARISON
          <div className="flex items-center gap-3 ml-auto text-[10px] font-normal">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#c0c8d4]" />{p1.name.split(' ').pop()}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#3b82f6]" />{p2.name.split(' ').pop()}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px]">
          <BarChart data={barData} margin={{ left: -10, right: 10 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.3} />
            <XAxis dataKey="stat" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 11 }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Bar dataKey="player1" fill="#c0c8d4" radius={[4, 4, 0, 0]} barSize={20} filter="url(#bar-glow-1)" />
            <Bar dataKey="player2" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} filter="url(#bar-glow-2)" />
            <defs>
              <filter id="bar-glow-1" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="bar-glow-2" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export function ComparePage() {
  const { compareSlots, setCompareSlot, clearCompare, addToShortlist } = useAppStore()
  const [format, setFormat] = useState<'ipl' | 't20i' | 'ranji'>('ipl')
  const [p1, p2] = compareSlots
  const getStats = (p: Player | null, fmt: string) => p ? (p.stats as Record<string, Record<string, number> | undefined>)[fmt] ?? null : null
  const s1 = getStats(p1, format), s2 = getStats(p2, format)

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
              <GitCompareArrows className="inline-block w-8 h-8 text-primary mr-3 -mt-1" />COMPARE PLAYERS
            </h1>
            <p className="text-muted-foreground mt-1">Head-to-head stat comparison with charts.</p>
          </div>
          {(p1 || p2) && <Button variant="outline" onClick={clearCompare} className="rounded-xl">Clear</Button>}
        </div>

        {/* Player selectors */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-start mb-8">
          <div>
            {p1 ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="relative bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 p-6 overflow-hidden">
                <BorderBeam size={150} duration={8} colorFrom="#c0c8d4" colorTo="#22c55e" />
                <button onClick={() => setCompareSlot(0, null)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-3 ring-2 ring-amber-500/30">
                    <User className="w-10 h-10 text-amber-400" />
                  </div>
                  <h3 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{p1.name}</h3>
                  <Badge className="mt-2">{p1.role}</Badge>
                  <div className="text-xs text-muted-foreground mt-2">{p1.state} | {p1.iplTeam}</div>
                  <div className="text-lg font-bold text-primary mt-2" style={{ fontFamily: 'var(--font-heading)' }}>{p1.basePriceCr} Cr</div>
                </div>
              </motion.div>
            ) : <PlayerSelector slot={0} onSelect={(p) => setCompareSlot(0, p)} />}
          </div>

          <div className="flex items-center justify-center py-8">
            <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <TextAnimate animation="blurInUp" by="character" className="text-xl font-bold text-primary">VS</TextAnimate>
            </motion.div>
          </div>

          <div>
            {p2 ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="relative bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 p-6 overflow-hidden">
                <BorderBeam size={150} duration={8} colorFrom="#3b82f6" colorTo="#a855f7" />
                <button onClick={() => setCompareSlot(1, null)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-3 ring-2 ring-blue-500/30">
                    <User className="w-10 h-10 text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{p2.name}</h3>
                  <Badge className="mt-2">{p2.role}</Badge>
                  <div className="text-xs text-muted-foreground mt-2">{p2.state} | {p2.iplTeam}</div>
                  <div className="text-lg font-bold text-primary mt-2" style={{ fontFamily: 'var(--font-heading)' }}>{p2.basePriceCr} Cr</div>
                </div>
              </motion.div>
            ) : <PlayerSelector slot={1} onSelect={(p) => setCompareSlot(1, p)} />}
          </div>
        </div>

        {/* Comparison content */}
        {p1 && p2 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Format tabs */}
            <div className="flex justify-center">
              <Tabs value={format} onValueChange={(v) => setFormat(v as typeof format)}>
                <TabsList className="bg-card/80 backdrop-blur-sm rounded-xl">
                  <TabsTrigger value="ipl" className="rounded-lg">IPL</TabsTrigger>
                  <TabsTrigger value="t20i" className="rounded-lg">T20I</TabsTrigger>
                  <TabsTrigger value="ranji" className="rounded-lg">Ranji</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {(!s1 && !s2) ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No {format.toUpperCase()} stats available for either player. Try another format.</p>
              </div>
            ) : (
              <>
                {/* Charts row */}
                <div className="grid md:grid-cols-2 gap-6">
                  <StatsBarChart p1={p1} p2={p2} s1={s1} s2={s2} />
                  <StatsRadarChart p1={p1} p2={p2} s1={s1} s2={s2} />
                </div>

                {/* Stat bars */}
                <div className="max-w-2xl mx-auto relative bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 p-6 overflow-hidden">
                  <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center mb-6 pb-4 border-b border-border/30">
                    <h3 className="text-right font-bold text-lg" style={{ fontFamily: 'var(--font-heading)' }}>
                      <span className="text-amber-400">{p1.name}</span>
                    </h3>
                    <span className="text-xs text-muted-foreground font-bold">vs</span>
                    <h3 className="font-bold text-lg" style={{ fontFamily: 'var(--font-heading)' }}>
                      <span className="text-blue-400">{p2.name}</span>
                    </h3>
                  </div>

                  <StatBar label="Mat" val1={s1?.matches} val2={s2?.matches} higher="higher" />
                  <StatBar label="Runs" val1={s1?.runs} val2={s2?.runs} higher="higher" />
                  <StatBar label="Avg" val1={s1?.avg} val2={s2?.avg} higher="higher" />
                  <StatBar label="SR" val1={s1?.sr} val2={s2?.sr} higher="higher" />
                  <StatBar label="Wkts" val1={s1?.wickets} val2={s2?.wickets} higher="higher" />
                  <StatBar label="Econ" val1={s1?.economy} val2={s2?.economy} higher="lower" />

                  <div className="flex gap-3 mt-6 pt-4 border-t border-border/30">
                    <Button variant="outline" size="sm" onClick={() => addToShortlist(p1)} className="flex-1 rounded-lg">
                      <Star className="w-3.5 h-3.5 mr-1.5" />Shortlist {p1.name.split(' ')[0]}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => addToShortlist(p2)} className="flex-1 rounded-lg">
                      <Star className="w-3.5 h-3.5 mr-1.5" />Shortlist {p2.name.split(' ')[0]}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* Empty state */}
        {!p1 && !p2 && (
          <div className="text-center py-20">
            <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }}>
              <GitCompareArrows className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
            </motion.div>
            <h3 className="text-xl font-bold text-muted-foreground" style={{ fontFamily: 'var(--font-heading)' }}>SELECT TWO PLAYERS</h3>
            <p className="text-sm text-muted-foreground mt-2">Search above or add from the Scout page.</p>
          </div>
        )}
      </motion.div>
    </div>
  )
}
