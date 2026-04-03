import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GitCompareArrows, Search, X, User, Star, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PLAYERS, type Player } from '@/data/players'
import { useAppStore } from '@/store/appStore'

function PlayerSelector({ slot, onSelect }: { slot: 0 | 1; onSelect: (p: Player) => void }) {
  const [search, setSearch] = useState('')
  const results = useMemo(() => {
    if (!search.trim()) return []
    const q = search.toLowerCase()
    return PLAYERS.filter(p =>
      p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q)
    ).slice(0, 8)
  }, [search])

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search Player ${slot + 1}...`}
          className="pl-10 bg-background border-border"
        />
      </div>
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg z-10 overflow-hidden shadow-xl"
          >
            {results.map(p => (
              <button
                key={p.id}
                onClick={() => { onSelect(p); setSearch('') }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-accent transition-colors text-sm"
              >
                <User className="w-4 h-4 text-muted-foreground" />
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
  const v1 = val1 ?? 0
  const v2 = val2 ?? 0
  const max = Math.max(v1, v2, 1)
  const winner = higher === 'higher'
    ? (v1 > v2 ? 1 : v2 > v1 ? 2 : 0)
    : (v1 < v2 ? 1 : v2 < v1 ? 2 : 0)

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center py-2">
      <div className="text-right">
        <span className={`text-sm font-bold ${winner === 1 ? 'text-chart-2' : 'text-foreground'}`}>{v1 || '-'}</span>
        <div className="h-1.5 rounded-full bg-accent mt-1 relative overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(v1 / max) * 100}%` }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className={`absolute right-0 top-0 h-full rounded-full ${winner === 1 ? 'bg-chart-2' : 'bg-muted-foreground/30'}`}
          />
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground uppercase font-medium w-16 text-center">{label}</span>
      <div>
        <span className={`text-sm font-bold ${winner === 2 ? 'text-chart-2' : 'text-foreground'}`}>{v2 || '-'}</span>
        <div className="h-1.5 rounded-full bg-accent mt-1 relative overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(v2 / max) * 100}%` }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className={`absolute left-0 top-0 h-full rounded-full ${winner === 2 ? 'bg-chart-2' : 'bg-muted-foreground/30'}`}
          />
        </div>
      </div>
    </div>
  )
}

export function ComparePage() {
  const { compareSlots, setCompareSlot, clearCompare, addToShortlist } = useAppStore()
  const [format, setFormat] = useState<'ipl' | 't20i' | 'ranji'>('ipl')
  const [p1, p2] = compareSlots

  const getStats = (p: Player | null, fmt: string) => {
    if (!p) return null
    return (p.stats as Record<string, Record<string, number> | undefined>)[fmt] ?? null
  }

  const s1 = getStats(p1, format)
  const s2 = getStats(p2, format)

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
              <GitCompareArrows className="inline-block w-8 h-8 text-primary mr-3 -mt-1" />
              COMPARE PLAYERS
            </h1>
            <p className="text-muted-foreground mt-1">Head-to-head stat comparison across formats.</p>
          </div>
          {(p1 || p2) && (
            <Button variant="outline" onClick={clearCompare}>Clear</Button>
          )}
        </div>

        {/* Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-start mb-8">
          <div className="space-y-3">
            {p1 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card rounded-xl border border-border p-5 relative"
              >
                <button
                  onClick={() => setCompareSlot(0, null)}
                  className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mx-auto mb-3">
                    <User className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{p1.name}</h3>
                  <Badge className="mt-1">{p1.role}</Badge>
                  <div className="text-xs text-muted-foreground mt-1">{p1.state} | {p1.iplTeam}</div>
                </div>
              </motion.div>
            ) : (
              <PlayerSelector slot={0} onSelect={(p) => setCompareSlot(0, p)} />
            )}
          </div>

          <div className="flex items-center justify-center py-8">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-primary" />
            </div>
          </div>

          <div className="space-y-3">
            {p2 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card rounded-xl border border-border p-5 relative"
              >
                <button
                  onClick={() => setCompareSlot(1, null)}
                  className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mx-auto mb-3">
                    <User className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{p2.name}</h3>
                  <Badge className="mt-1">{p2.role}</Badge>
                  <div className="text-xs text-muted-foreground mt-1">{p2.state} | {p2.iplTeam}</div>
                </div>
              </motion.div>
            ) : (
              <PlayerSelector slot={1} onSelect={(p) => setCompareSlot(1, p)} />
            )}
          </div>
        </div>

        {/* Format selector */}
        {p1 && p2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex justify-center">
              <Tabs value={format} onValueChange={(v) => setFormat(v as typeof format)}>
                <TabsList className="bg-card">
                  <TabsTrigger value="ipl">IPL</TabsTrigger>
                  <TabsTrigger value="t20i">T20I</TabsTrigger>
                  <TabsTrigger value="ranji">Ranji</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Comparison */}
            <div className="max-w-2xl mx-auto bg-card rounded-2xl border border-border p-6">
              <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center mb-4 pb-4 border-b border-border">
                <h3 className="text-right font-bold text-lg" style={{ fontFamily: 'var(--font-heading)' }}>{p1.name}</h3>
                <span className="text-xs text-muted-foreground">vs</span>
                <h3 className="font-bold text-lg" style={{ fontFamily: 'var(--font-heading)' }}>{p2.name}</h3>
              </div>

              {(!s1 && !s2) ? (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  No {format.toUpperCase()} stats available for either player. Try another format.
                </p>
              ) : (
                <div className="space-y-1">
                  <StatBar label="Matches" val1={s1?.matches} val2={s2?.matches} higher="higher" />
                  <StatBar label="Runs" val1={s1?.runs} val2={s2?.runs} higher="higher" />
                  <StatBar label="Average" val1={s1?.avg} val2={s2?.avg} higher="higher" />
                  <StatBar label="SR" val1={s1?.sr} val2={s2?.sr} higher="higher" />
                  <StatBar label="Wickets" val1={s1?.wickets} val2={s2?.wickets} higher="higher" />
                  <StatBar label="Economy" val1={s1?.economy} val2={s2?.economy} higher="lower" />
                </div>
              )}

              {/* Quick actions */}
              <div className="flex gap-3 mt-6 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addToShortlist(p1)}
                  className="flex-1"
                >
                  <Star className="w-3.5 h-3.5 mr-1.5" />
                  Shortlist {p1.name.split(' ')[0]}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addToShortlist(p2)}
                  className="flex-1"
                >
                  <Star className="w-3.5 h-3.5 mr-1.5" />
                  Shortlist {p2.name.split(' ')[0]}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Empty state */}
        {!p1 && !p2 && (
          <div className="text-center py-20">
            <GitCompareArrows className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-muted-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
              SELECT TWO PLAYERS
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              Search for players above or add them from the Scout page.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  )
}
