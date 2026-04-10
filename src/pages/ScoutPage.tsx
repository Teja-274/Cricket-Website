import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, X, SlidersHorizontal, ArrowUpDown, Sparkles, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PlayerCard } from '@/components/scout/PlayerCard'
import { PLAYERS, type PlayerRole, type PlayerTier } from '@/data/players'
import { askGrok, SEARCH_SYSTEM_PROMPT, isGrokConfigured } from '@/lib/grok'
import { toast } from 'sonner'

const roles: PlayerRole[] = ['Batsman', 'Bowler', 'All-Rounder', 'WK-Batsman']
const tiers: PlayerTier[] = ['International Ready', 'IPL Proven', 'Domestic Star', 'Emerging Talent']
const battingStyles = ['Right-Hand', 'Left-Hand']
const states = [...new Set(PLAYERS.map(p => p.state).filter(s => s !== 'International'))].sort()
const sortOptions = [
  { value: 'name', label: 'Name' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'tier', label: 'Tier' },
]

export function ScoutPage() {
  const [search, setSearch] = useState('')
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set())
  const [selectedTiers, setSelectedTiers] = useState<Set<string>>(new Set())
  const [selectedBatting, setSelectedBatting] = useState<Set<string>>(new Set())
  const [selectedStates, setSelectedStates] = useState<Set<string>>(new Set())
  const [cappedOnly, setCappedOnly] = useState(false)
  const [showFilters, setShowFilters] = useState(true)
  const [sortBy, setSortBy] = useState('name')
  const [aiQuery, setAiQuery] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResults, setAiResults] = useState<string[] | null>(null)

  const handleAiSearch = async () => {
    if (!aiQuery.trim()) return
    setAiLoading(true)
    setAiResults(null)
    try {
      const response = await askGrok(aiQuery, SEARCH_SYSTEM_PROMPT)
      // Parse JSON array from response
      const match = response.match(/\[[\s\S]*\]/)
      if (match) {
        const names = JSON.parse(match[0]) as string[]
        setAiResults(names)
        toast.success(`AI found ${names.length} matching players`)
      } else {
        toast.error('AI returned an unexpected response')
      }
    } catch (err) {
      toast.error('AI search failed')
    } finally {
      setAiLoading(false)
    }
  }

  const toggle = (set: Set<string>, val: string) => { const n = new Set(set); if (n.has(val)) n.delete(val); else n.add(val); return n }
  const filterCount = selectedRoles.size + selectedTiers.size + selectedBatting.size + selectedStates.size + (cappedOnly ? 1 : 0)

  const filtered = useMemo(() => {
    let result = PLAYERS.filter(p => {
      if (search) {
        const q = search.toLowerCase()
        if (!(p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q) || p.state.toLowerCase().includes(q) || p.iplTeam.toLowerCase().includes(q) || p.bowlingStyle.toLowerCase().includes(q) || p.tier.toLowerCase().includes(q))) return false
      }
      if (selectedRoles.size > 0 && !selectedRoles.has(p.role)) return false
      if (selectedTiers.size > 0 && !selectedTiers.has(p.tier)) return false
      if (selectedBatting.size > 0 && !selectedBatting.has(p.battingStyle)) return false
      if (selectedStates.size > 0 && !selectedStates.has(p.state)) return false
      if (cappedOnly && !p.isCapped) return false
      return true
    })
    if (sortBy === 'price-desc') result.sort((a, b) => b.basePriceCr - a.basePriceCr)
    else if (sortBy === 'price-asc') result.sort((a, b) => a.basePriceCr - b.basePriceCr)
    else if (sortBy === 'tier') { const order = { 'International Ready': 0, 'IPL Proven': 1, 'Domestic Star': 2, 'Emerging Talent': 3 }; result.sort((a, b) => order[a.tier] - order[b.tier]) }
    else result.sort((a, b) => a.name.localeCompare(b.name))
    return result
  }, [search, selectedRoles, selectedTiers, selectedBatting, selectedStates, cappedOnly, sortBy])

  const clearFilters = () => { setSelectedRoles(new Set()); setSelectedTiers(new Set()); setSelectedBatting(new Set()); setSelectedStates(new Set()); setCappedOnly(false); setSearch('') }

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
              <Search className="inline-block w-8 h-8 text-primary mr-3 -mt-1" />SCOUT PLAYERS
            </h1>
            <p className="text-muted-foreground mt-1">Search and filter {PLAYERS.length}+ Indian cricket players.</p>
          </div>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="gap-2 rounded-xl relative">
            <SlidersHorizontal className="w-4 h-4" />Filters
            {filterCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">{filterCount}</span>
            )}
          </Button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, role, state, team, bowling style..."
            className="pl-12 py-6 text-base bg-card/80 backdrop-blur-sm border-border/50 rounded-xl" />
          {search && <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>}
        </div>

        {/* AI Search */}
        <div className="relative mb-6 bg-gradient-to-r from-primary/10 via-card/80 to-chart-3/10 rounded-xl border border-primary/20 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">AI SEARCH (Powered by Grok)</span>
            {!isGrokConfigured() && <Badge variant="outline" className="text-[10px]">Mock Mode</Badge>}
          </div>
          <div className="flex gap-2">
            <Input value={aiQuery} onChange={(e) => setAiQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
              placeholder="e.g. young left-arm spinner who bowls well in death overs"
              className="flex-1 bg-background/50 border-border/50 rounded-lg" />
            <Button onClick={handleAiSearch} disabled={aiLoading || !aiQuery.trim()} className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            </Button>
          </div>
          <AnimatePresence>
            {aiResults && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="mt-3 flex flex-wrap gap-2">
                <span className="text-xs text-muted-foreground">AI suggests:</span>
                {aiResults.map((name, i) => (
                  <Badge key={i} variant="outline" className="cursor-pointer hover:bg-primary/10"
                    onClick={() => { setSearch(name); setAiResults(null) }}>
                    {name}
                  </Badge>
                ))}
                <button onClick={() => setAiResults(null)} className="text-xs text-muted-foreground hover:text-foreground ml-auto">
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="bg-card/60 backdrop-blur-xl rounded-2xl border border-border/30 p-5 mb-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Filter className="w-4 h-4 text-primary" /><span className="text-sm font-bold uppercase tracking-wider text-muted-foreground" style={{ fontFamily: 'var(--font-heading)' }}>Filters</span></div>
              {filterCount > 0 && <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-muted-foreground">Clear All</Button>}
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-2">Role</div>
              <div className="flex flex-wrap gap-2">
                {roles.map(r => <Badge key={r} variant={selectedRoles.has(r) ? 'default' : 'outline'} className="cursor-pointer transition-all hover:scale-105" onClick={() => setSelectedRoles(toggle(selectedRoles, r))}>{r}</Badge>)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-2">Tier</div>
              <div className="flex flex-wrap gap-2">
                {tiers.map(t => <Badge key={t} variant={selectedTiers.has(t) ? 'default' : 'outline'} className="cursor-pointer transition-all hover:scale-105" onClick={() => setSelectedTiers(toggle(selectedTiers, t))}>{t}</Badge>)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-2">Batting & Type</div>
              <div className="flex flex-wrap gap-2">
                {battingStyles.map(s => <Badge key={s} variant={selectedBatting.has(s) ? 'default' : 'outline'} className="cursor-pointer transition-all hover:scale-105" onClick={() => setSelectedBatting(toggle(selectedBatting, s))}>{s}</Badge>)}
                <Badge variant={cappedOnly ? 'default' : 'outline'} className="cursor-pointer transition-all hover:scale-105" onClick={() => setCappedOnly(!cappedOnly)}>Capped Only</Badge>
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-2">Home State</div>
              <div className="flex flex-wrap gap-1.5">
                {states.map(s => <Badge key={s} variant={selectedStates.has(s) ? 'default' : 'outline'} className="cursor-pointer transition-all hover:scale-105 text-[10px]" onClick={() => setSelectedStates(toggle(selectedStates, s))}>{s}</Badge>)}
              </div>
            </div>
          </motion.div>
        )}

        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">Showing <span className="font-bold text-foreground">{filtered.length}</span> players</span>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
              className="text-sm bg-card/80 border border-border/50 rounded-lg px-2 py-1 text-foreground">
              {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((player, i) => <PlayerCard key={player.id} player={player} index={i} />)}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-bold text-muted-foreground">No players found</h3>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters.</p>
            <Button variant="outline" onClick={clearFilters} className="mt-4 rounded-xl">Clear Filters</Button>
          </div>
        )}
      </motion.div>
    </div>
  )
}
