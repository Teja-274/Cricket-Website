import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, X, SlidersHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PlayerCard } from '@/components/scout/PlayerCard'
import { PLAYERS, type PlayerRole, type PlayerTier } from '@/data/players'

const roles: PlayerRole[] = ['Batsman', 'Bowler', 'All-Rounder', 'WK-Batsman']
const tiers: PlayerTier[] = ['International Ready', 'IPL Proven', 'Domestic Star', 'Emerging Talent']
const battingStyles = ['Right-Hand', 'Left-Hand']
const states = [...new Set(PLAYERS.map(p => p.state).filter(s => s !== 'International'))].sort()

export function ScoutPage() {
  const [search, setSearch] = useState('')
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set())
  const [selectedTiers, setSelectedTiers] = useState<Set<string>>(new Set())
  const [selectedBatting, setSelectedBatting] = useState<Set<string>>(new Set())
  const [selectedStates, setSelectedStates] = useState<Set<string>>(new Set())
  const [cappedOnly, setCappedOnly] = useState(false)
  const [showFilters, setShowFilters] = useState(true)

  const toggleSet = (set: Set<string>, value: string): Set<string> => {
    const next = new Set(set)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    return next
  }

  const filtered = useMemo(() => {
    return PLAYERS.filter(p => {
      if (search) {
        const q = search.toLowerCase()
        const matches = p.name.toLowerCase().includes(q) ||
          p.role.toLowerCase().includes(q) ||
          p.state.toLowerCase().includes(q) ||
          p.iplTeam.toLowerCase().includes(q) ||
          p.bowlingStyle.toLowerCase().includes(q) ||
          p.tier.toLowerCase().includes(q)
        if (!matches) return false
      }
      if (selectedRoles.size > 0 && !selectedRoles.has(p.role)) return false
      if (selectedTiers.size > 0 && !selectedTiers.has(p.tier)) return false
      if (selectedBatting.size > 0 && !selectedBatting.has(p.battingStyle)) return false
      if (selectedStates.size > 0 && !selectedStates.has(p.state)) return false
      if (cappedOnly && !p.isCapped) return false
      return true
    })
  }, [search, selectedRoles, selectedTiers, selectedBatting, selectedStates, cappedOnly])

  const clearFilters = () => {
    setSelectedRoles(new Set())
    setSelectedTiers(new Set())
    setSelectedBatting(new Set())
    setSelectedStates(new Set())
    setCappedOnly(false)
    setSearch('')
  }

  const hasFilters = selectedRoles.size > 0 || selectedTiers.size > 0 || selectedBatting.size > 0 || selectedStates.size > 0 || cappedOnly

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
              <Search className="inline-block w-8 h-8 text-primary mr-3 -mt-1" />
              SCOUT PLAYERS
            </h1>
            <p className="text-muted-foreground mt-1">Search and filter {PLAYERS.length}+ Indian cricket players.</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search players by name, role, state, team, bowling style..."
            className="pl-12 py-6 text-base bg-card border-border rounded-xl"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-card rounded-xl border border-border p-5 mb-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                  Filters
                </span>
              </div>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-muted-foreground">
                  Clear All
                </Button>
              )}
            </div>

            {/* Role */}
            <div>
              <div className="text-xs text-muted-foreground mb-2">Role</div>
              <div className="flex flex-wrap gap-2">
                {roles.map(role => (
                  <Badge
                    key={role}
                    variant={selectedRoles.has(role) ? 'default' : 'outline'}
                    className="cursor-pointer transition-colors"
                    onClick={() => setSelectedRoles(toggleSet(selectedRoles, role))}
                  >
                    {role}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Tier */}
            <div>
              <div className="text-xs text-muted-foreground mb-2">Tier</div>
              <div className="flex flex-wrap gap-2">
                {tiers.map(tier => (
                  <Badge
                    key={tier}
                    variant={selectedTiers.has(tier) ? 'default' : 'outline'}
                    className="cursor-pointer transition-colors"
                    onClick={() => setSelectedTiers(toggleSet(selectedTiers, tier))}
                  >
                    {tier}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Batting Style */}
            <div>
              <div className="text-xs text-muted-foreground mb-2">Batting</div>
              <div className="flex flex-wrap gap-2">
                {battingStyles.map(style => (
                  <Badge
                    key={style}
                    variant={selectedBatting.has(style) ? 'default' : 'outline'}
                    className="cursor-pointer transition-colors"
                    onClick={() => setSelectedBatting(toggleSet(selectedBatting, style))}
                  >
                    {style}
                  </Badge>
                ))}
                <Badge
                  variant={cappedOnly ? 'default' : 'outline'}
                  className="cursor-pointer transition-colors"
                  onClick={() => setCappedOnly(!cappedOnly)}
                >
                  Capped Only
                </Badge>
              </div>
            </div>

            {/* State */}
            <div>
              <div className="text-xs text-muted-foreground mb-2">Home State</div>
              <div className="flex flex-wrap gap-1.5">
                {states.map(state => (
                  <Badge
                    key={state}
                    variant={selectedStates.has(state) ? 'default' : 'outline'}
                    className="cursor-pointer transition-colors text-[10px]"
                    onClick={() => setSelectedStates(toggleSet(selectedStates, state))}
                  >
                    {state}
                  </Badge>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Results count */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">
            Showing <span className="font-bold text-foreground">{filtered.length}</span> players
          </span>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((player, i) => (
            <PlayerCard key={player.id} player={player} index={i} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-bold text-muted-foreground">No players found</h3>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters.</p>
            <Button variant="outline" onClick={clearFilters} className="mt-4">
              Clear Filters
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  )
}
