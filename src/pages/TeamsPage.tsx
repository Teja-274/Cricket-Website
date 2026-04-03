import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Star, GitCompareArrows, User, ChevronLeft, Shield, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BorderBeam } from '@/components/magicui/border-beam'
import { NumberTicker } from '@/components/magicui/number-ticker'
import { IPL_FRANCHISES } from '@/data/franchises'
import { PLAYERS, type Player, type PlayerRole } from '@/data/players'
import { useAppStore } from '@/store/appStore'

const roleColors: Record<string, string> = {
  'Batsman': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Bowler': 'bg-red-500/20 text-red-400 border-red-500/30',
  'All-Rounder': 'bg-green-500/20 text-green-400 border-green-500/30',
  'WK-Batsman': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
}

const roleOrder: PlayerRole[] = ['Batsman', 'WK-Batsman', 'All-Rounder', 'Bowler']

function getTeamPlayers(teamName: string) {
  return PLAYERS.filter(p => p.iplTeam === teamName)
}

function PlayerRow({ player, index }: { player: Player; index: number }) {
  const { addToShortlist, isInShortlist, setCompareSlot, compareSlots } = useAppStore()
  const inShortlist = isInShortlist(player.id)
  const primaryStat = player.stats.ipl || player.stats.t20i || player.stats.ranji

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      whileHover={{ x: 4 }}
      className="group flex items-center gap-3 p-3 rounded-xl hover:bg-background/50 transition-all duration-200"
    >
      <div className="w-9 h-9 rounded-full bg-accent/50 flex items-center justify-center shrink-0 ring-1 ring-border/30">
        <User className="w-4 h-4 text-muted-foreground" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm truncate">{player.name}</span>
          <Badge className={`text-[8px] py-0 px-1.5 ${roleColors[player.role]}`}>{player.role}</Badge>
          {player.isCapped && <Badge variant="outline" className="text-[8px] py-0 px-1 border-amber-500/30 text-amber-400">INT</Badge>}
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
          <span>{player.state}</span>
          <span>{player.battingStyle}</span>
          {primaryStat && (
            <>
              {primaryStat.runs != null && <span>{primaryStat.runs} runs</span>}
              {primaryStat.wickets != null && <span>{primaryStat.wickets} wkts</span>}
            </>
          )}
        </div>
      </div>

      <div className="text-right shrink-0">
        <div className="text-sm font-bold text-primary" style={{ fontFamily: 'var(--font-heading)' }}>{player.basePriceCr} Cr</div>
        <div className="text-[9px] text-muted-foreground">{player.tier}</div>
      </div>

      {/* Actions on hover */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => addToShortlist(player)} disabled={inShortlist}>
          <Star className={`w-3.5 h-3.5 ${inShortlist ? 'text-primary fill-primary' : 'text-muted-foreground'}`} />
        </Button>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => {
          if (!compareSlots[0]) setCompareSlot(0, player)
          else if (!compareSlots[1]) setCompareSlot(1, player)
        }}>
          <GitCompareArrows className="w-3.5 h-3.5 text-muted-foreground" />
        </Button>
      </div>
    </motion.div>
  )
}

export function TeamsPage() {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)

  const selectedFranchise = IPL_FRANCHISES.find(f => f.id === selectedTeamId)

  const teamPlayers = useMemo(() => {
    if (!selectedFranchise) return []
    return getTeamPlayers(selectedFranchise.name)
  }, [selectedFranchise])

  const grouped = useMemo(() => {
    const map: Record<string, Player[]> = {}
    for (const role of roleOrder) map[role] = []
    for (const p of teamPlayers) {
      if (map[p.role]) map[p.role].push(p)
    }
    return map
  }, [teamPlayers])

  const teamStats = useMemo(() => ({
    total: teamPlayers.length,
    capped: teamPlayers.filter(p => p.isCapped).length,
    baseValue: Math.round(teamPlayers.reduce((s, p) => s + p.basePriceCr, 0) * 10) / 10,
  }), [teamPlayers])

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
            <Shield className="inline-block w-8 h-8 text-primary mr-3 -mt-1" />
            TEAM SQUADS
          </h1>
          <p className="text-muted-foreground mt-1">Browse all 10 IPL franchise squads and their player rosters.</p>
        </div>

        <div className="grid lg:grid-cols-[320px_1fr] gap-6">
          {/* Team Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
              SELECT FRANCHISE
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
              {IPL_FRANCHISES.map((team, i) => {
                const players = getTeamPlayers(team.name)
                const isSelected = selectedTeamId === team.id
                return (
                  <motion.button
                    key={team.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedTeamId(isSelected ? null : team.id)}
                    className={`relative w-full p-4 rounded-xl border-2 text-left transition-all duration-300 overflow-hidden ${
                      isSelected ? '' : 'border-border/30 hover:border-border/60'
                    }`}
                    style={{
                      background: `linear-gradient(135deg, ${team.color}${isSelected ? '20' : '08'}, transparent)`,
                      borderColor: isSelected ? team.color : undefined,
                      boxShadow: isSelected ? `0 4px 24px ${team.color}20` : undefined,
                    }}
                  >
                    {isSelected && <BorderBeam size={100} duration={6} colorFrom={team.color} colorTo={`${team.color}80`} />}
                    <div className="flex items-center gap-3">
                      <div className="text-2xl font-bold shrink-0" style={{ color: team.color, fontFamily: 'var(--font-heading)' }}>
                        {team.shortName}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{team.name}</div>
                        <div className="text-[10px] text-muted-foreground">{players.length} players</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold" style={{ color: team.color }}>
                          {Math.round(players.reduce((s, p) => s + p.basePriceCr, 0) * 10) / 10}
                        </div>
                        <div className="text-[9px] text-muted-foreground">Cr base</div>
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Squad Panel */}
          <AnimatePresence mode="wait">
            {selectedFranchise ? (
              <motion.div
                key={selectedFranchise.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 overflow-hidden"
              >
                {/* Team header */}
                <div
                  className="p-6 border-b border-border/30"
                  style={{ background: `linear-gradient(135deg, ${selectedFranchise.color}15, transparent)` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center border-2"
                        style={{ borderColor: `${selectedFranchise.color}40`, background: `${selectedFranchise.color}10` }}>
                        <span className="text-2xl font-bold" style={{ color: selectedFranchise.color, fontFamily: 'var(--font-heading)' }}>
                          {selectedFranchise.shortName}
                        </span>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: selectedFranchise.color }}>
                          {selectedFranchise.name}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-0.5">{teamStats.total} players in squad</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedTeamId(null)} className="lg:hidden">
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Stats strip */}
                  <div className="grid grid-cols-4 gap-3 mt-4">
                    {[
                      { label: 'Total', value: teamStats.total, color: 'text-foreground' },
                      { label: 'Capped', value: teamStats.capped, color: 'text-amber-400' },
                      { label: 'Base Value', value: teamStats.baseValue, color: 'text-primary', suffix: ' Cr' },
                      { label: 'Avg Price', value: teamStats.total > 0 ? Math.round((teamStats.baseValue / teamStats.total) * 10) / 10 : 0, color: 'text-chart-3', suffix: ' Cr' },
                    ].map(s => (
                      <div key={s.label} className="p-3 rounded-xl bg-background/50 text-center">
                        <div className={`text-xl font-bold ${s.color}`} style={{ fontFamily: 'var(--font-heading)' }}>
                          <NumberTicker value={s.value} decimalPlaces={s.suffix ? 1 : 0} />{s.suffix || ''}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Role breakdown mini-bar */}
                  <div className="flex gap-1 mt-4 h-2 rounded-full overflow-hidden bg-background/30">
                    {roleOrder.map(role => {
                      const count = grouped[role]?.length || 0
                      if (count === 0) return null
                      const pct = (count / teamStats.total) * 100
                      const colors: Record<string, string> = {
                        'Batsman': 'bg-blue-500', 'Bowler': 'bg-red-500', 'All-Rounder': 'bg-green-500', 'WK-Batsman': 'bg-purple-500',
                      }
                      return <motion.div key={role} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, delay: 0.3 }} className={`h-full ${colors[role]}`} />
                    })}
                  </div>
                  <div className="flex gap-4 mt-2">
                    {roleOrder.map(role => {
                      const count = grouped[role]?.length || 0
                      if (count === 0) return null
                      const dotColors: Record<string, string> = { 'Batsman': 'bg-blue-500', 'Bowler': 'bg-red-500', 'All-Rounder': 'bg-green-500', 'WK-Batsman': 'bg-purple-500' }
                      return <div key={role} className="flex items-center gap-1 text-[10px] text-muted-foreground"><div className={`w-2 h-2 rounded-full ${dotColors[role]}`} />{role}s: {count}</div>
                    })}
                  </div>
                </div>

                {/* Player list by role */}
                <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
                  {roleOrder.map(role => {
                    const players = grouped[role]
                    if (!players || players.length === 0) return null
                    return (
                      <div key={role}>
                        <div className="flex items-center gap-2 mb-2 px-3">
                          <Zap className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                            {role}s ({players.length})
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          {players
                            .sort((a, b) => b.basePriceCr - a.basePriceCr)
                            .map((player, idx) => (
                              <PlayerRow key={player.id} player={player} index={idx} />
                            ))}
                        </div>
                      </div>
                    )
                  })}

                  {teamStats.total === 0 && (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">No players listed for this franchise.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }}>
                  <Shield className="w-16 h-16 text-muted-foreground/20 mb-4" />
                </motion.div>
                <h3 className="text-xl font-bold text-muted-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                  SELECT A FRANCHISE
                </h3>
                <p className="text-sm text-muted-foreground mt-2">Click on a team to view their squad.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
