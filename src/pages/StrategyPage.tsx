import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, Plus, X, User, IndianRupee, Brain, CheckCircle2, AlertCircle, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { NumberTicker } from '@/components/magicui/number-ticker'
import { BorderBeam } from '@/components/magicui/border-beam'
import { PLAYERS, type Player } from '@/data/players'

interface TargetPlayer {
  player: Player
  maxBid: number
  priority: 'must-have' | 'nice-to-have' | 'backup'
}

const priorityColors = {
  'must-have': 'text-red-400 bg-red-500/10 border-red-500/30',
  'nice-to-have': 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  'backup': 'text-blue-400 bg-blue-500/10 border-blue-500/30',
}

export function StrategyPage() {
  const [targets, setTargets] = useState<TargetPlayer[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [totalBudget, setTotalBudget] = useState(100)

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    const targetIds = new Set(targets.map(t => t.player.id))
    return PLAYERS.filter(p => !targetIds.has(p.id) && (p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q))).slice(0, 8)
  }, [searchQuery, targets])

  const addTarget = (player: Player) => {
    setTargets([...targets, { player, maxBid: player.basePriceCr * 2, priority: 'nice-to-have' }])
    setSearchQuery('')
    setShowSearch(false)
  }

  const removeTarget = (playerId: string) => {
    setTargets(targets.filter(t => t.player.id !== playerId))
  }

  const updateMaxBid = (playerId: string, maxBid: number) => {
    setTargets(targets.map(t => t.player.id === playerId ? { ...t, maxBid } : t))
  }

  const updatePriority = (playerId: string, priority: TargetPlayer['priority']) => {
    setTargets(targets.map(t => t.player.id === playerId ? { ...t, priority } : t))
  }

  const totalMaxSpend = targets.reduce((s, t) => s + t.maxBid, 0)
  const mustHaves = targets.filter(t => t.priority === 'must-have')

  const roleBreakdown = useMemo(() => {
    const counts: Record<string, number> = {}
    targets.forEach(t => { counts[t.player.role] = (counts[t.player.role] || 0) + 1 })
    return counts
  }, [targets])

  const analysis = useMemo(() => {
    const items: { text: string; type: 'warn' | 'good' | 'info' }[] = []
    if (totalMaxSpend > totalBudget) items.push({ text: `Max spend (${totalMaxSpend.toFixed(1)} Cr) exceeds budget (${totalBudget} Cr)`, type: 'warn' })
    if (totalMaxSpend <= totalBudget * 0.7) items.push({ text: `${((1 - totalMaxSpend / totalBudget) * 100).toFixed(0)}% budget headroom — room for surprise buys`, type: 'good' })
    if (mustHaves.length === 0 && targets.length > 0) items.push({ text: 'No must-have targets set — consider prioritizing key picks', type: 'info' })
    if (!roleBreakdown['Bowler'] && targets.length > 3) items.push({ text: 'No bowlers in targets — consider adding bowling options', type: 'warn' })
    if (!roleBreakdown['WK-Batsman'] && targets.length > 3) items.push({ text: 'No wicket-keeper targeted', type: 'warn' })
    if (targets.length >= 5 && Object.keys(roleBreakdown).length >= 3) items.push({ text: 'Good role diversity in targets', type: 'good' })
    return items
  }, [targets, totalMaxSpend, totalBudget, mustHaves, roleBreakdown])

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
            <Target className="inline-block w-8 h-8 text-primary mr-3 -mt-1" />STRATEGY BUILDER
          </h1>
          <p className="text-muted-foreground mt-1">Plan your auction targets and bid ceilings before auction day.</p>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* Main panel */}
          <div className="space-y-6">
            {/* Budget */}
            <div className="flex items-center gap-4 bg-card/80 backdrop-blur-sm rounded-xl border border-border/50 p-4">
              <IndianRupee className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <div className="text-xs text-muted-foreground uppercase">Total Budget</div>
                <div className="flex items-center gap-2">
                  <Input type="number" value={totalBudget} onChange={(e) => setTotalBudget(Number(e.target.value))}
                    className="w-24 h-8 text-sm bg-background/50 border-border/50 rounded-lg" />
                  <span className="text-sm text-muted-foreground">Crore</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Allocated</div>
                <div className={`text-lg font-bold ${totalMaxSpend > totalBudget ? 'text-destructive' : 'text-chart-2'}`} style={{ fontFamily: 'var(--font-heading)' }}>
                  {totalMaxSpend.toFixed(1)} / {totalBudget} Cr
                </div>
              </div>
            </div>

            {/* Add player */}
            <div className="relative">
              {showSearch ? (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search player to add..."
                      className="pl-10 bg-card/80 border-border/50 rounded-xl" autoFocus />
                    <button onClick={() => { setShowSearch(false); setSearchQuery('') }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <AnimatePresence>
                    {searchResults.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="absolute top-full left-0 right-0 mt-1 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl z-10 shadow-2xl overflow-hidden">
                        {searchResults.map(p => (
                          <button key={p.id} onClick={() => addTarget(p)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-accent/50 transition-colors text-sm">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium flex-1">{p.name}</span>
                            <Badge variant="outline" className="text-[9px]">{p.role}</Badge>
                            <span className="text-xs text-primary font-bold">{p.basePriceCr} Cr</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <Button variant="outline" onClick={() => setShowSearch(true)} className="w-full rounded-xl border-dashed border-border/50 py-6 text-muted-foreground hover:text-foreground">
                  <Plus className="w-5 h-5 mr-2" />Add Target Player
                </Button>
              )}
            </div>

            {/* Target list */}
            <AnimatePresence>
              {targets.length > 0 ? (
                <div className="space-y-3">
                  {['must-have', 'nice-to-have', 'backup'].map(priority => {
                    const group = targets.filter(t => t.priority === priority)
                    if (group.length === 0) return null
                    const labels = { 'must-have': 'Must-Have', 'nice-to-have': 'Nice-to-Have', 'backup': 'Backup' }
                    return (
                      <div key={priority}>
                        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                          {labels[priority as keyof typeof labels]} ({group.length})
                        </div>
                        {group.map((t, i) => (
                          <motion.div key={t.player.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }} transition={{ delay: i * 0.03 }} layout
                            className="flex items-center gap-3 p-3 rounded-xl bg-card/60 backdrop-blur-sm border border-border/30 mb-2 group">
                            <div className="w-9 h-9 rounded-full bg-accent/50 flex items-center justify-center shrink-0">
                              <User className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm truncate">{t.player.name}</div>
                              <div className="flex items-center gap-1.5">
                                <Badge variant="outline" className="text-[8px] py-0">{t.player.role}</Badge>
                                <span className="text-[10px] text-muted-foreground">Base: {t.player.basePriceCr} Cr</span>
                              </div>
                            </div>
                            {/* Priority selector */}
                            <select value={t.priority} onChange={(e) => updatePriority(t.player.id, e.target.value as TargetPlayer['priority'])}
                              className={`text-[10px] px-2 py-1 rounded-lg border ${priorityColors[t.priority]} bg-transparent`}>
                              <option value="must-have">Must-Have</option>
                              <option value="nice-to-have">Nice-to-Have</option>
                              <option value="backup">Backup</option>
                            </select>
                            {/* Max bid */}
                            <div className="flex items-center gap-1 shrink-0">
                              <Input type="number" value={t.maxBid} onChange={(e) => updateMaxBid(t.player.id, Number(e.target.value))}
                                className="w-16 h-7 text-xs text-center bg-background/50 border-border/50 rounded-lg" step={0.5} />
                              <span className="text-[10px] text-muted-foreground">Cr max</span>
                            </div>
                            <button onClick={() => removeTarget(t.player.id)}
                              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity">
                              <X className="w-4 h-4" />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Target className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No target players added yet. Search and add players above.</p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar analysis */}
          <div className="space-y-4">
            <div className="relative bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 p-5 overflow-hidden">
              <BorderBeam size={150} duration={8} colorFrom="#c0c8d4" colorTo="#22c55e" />
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                  STRATEGY ANALYSIS
                </h3>
              </div>

              <div className="space-y-3 mb-4">
                <div className="p-3 rounded-lg bg-background/50">
                  <div className="text-[10px] text-muted-foreground uppercase">Target Players</div>
                  <div className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
                    <NumberTicker value={targets.length} />
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-background/50">
                  <div className="text-[10px] text-muted-foreground uppercase">Max Allocation</div>
                  <div className={`text-2xl font-bold ${totalMaxSpend > totalBudget ? 'text-destructive' : 'text-chart-2'}`} style={{ fontFamily: 'var(--font-heading)' }}>
                    <NumberTicker value={Math.round(totalMaxSpend * 10) / 10} decimalPlaces={1} /> Cr
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-background/50">
                  <div className="text-[10px] text-muted-foreground uppercase">Budget Remaining</div>
                  <div className="text-2xl font-bold text-primary" style={{ fontFamily: 'var(--font-heading)' }}>
                    <NumberTicker value={Math.max(0, Math.round((totalBudget - totalMaxSpend) * 10) / 10)} decimalPlaces={1} /> Cr
                  </div>
                </div>
              </div>

              {/* Role breakdown */}
              {targets.length > 0 && (
                <div className="mb-4">
                  <div className="text-[10px] text-muted-foreground uppercase mb-2">Roles Targeted</div>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(roleBreakdown).map(([role, count]) => (
                      <Badge key={role} variant="outline" className="text-[10px]">{role}: {count}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Analysis alerts */}
              {analysis.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] text-muted-foreground uppercase mb-1">Insights</div>
                  {analysis.map((a, i) => (
                    <div key={i} className={`flex items-start gap-2 text-xs p-2 rounded-lg ${
                      a.type === 'warn' ? 'text-amber-400 bg-amber-500/5' : a.type === 'good' ? 'text-green-400 bg-green-500/5' : 'text-blue-400 bg-blue-500/5'
                    }`}>
                      {a.type === 'warn' ? <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> : <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
                      <span>{a.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
