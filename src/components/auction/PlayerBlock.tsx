import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { LivePulse } from '@/components/ui/live-pulse'
import type { Player } from '@/data/players'

const roleColors: Record<string, string> = {
  'Batsman': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Bowler': 'bg-red-500/20 text-red-400 border-red-500/30',
  'All-Rounder': 'bg-green-500/20 text-green-400 border-green-500/30',
  'WK-Batsman': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
}

const tierColors: Record<string, string> = {
  'International Ready': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'IPL Proven': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'Domestic Star': 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  'Emerging Talent': 'bg-violet-500/20 text-violet-400 border-violet-500/30',
}

export function PlayerBlock({ player, isActive }: { player: Player; isActive: boolean }) {
  const stats = player.stats

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={player.id}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.4 }}
        className="bg-card rounded-2xl border border-border p-6 relative overflow-hidden"
      >
        {/* Glow effect */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/0 via-primary/60 to-primary/0" />

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            {isActive && <LivePulse className="mb-2" />}
            <h2 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
              {player.name}
            </h2>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge className={roleColors[player.role]}>{player.role}</Badge>
              <Badge className={tierColors[player.tier]}>{player.tier}</Badge>
              {player.isCapped && <Badge variant="outline" className="border-amber-500/30 text-amber-400">Capped</Badge>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Base Price</div>
            <div className="text-2xl font-bold text-primary" style={{ fontFamily: 'var(--font-heading)' }}>
              {player.basePriceCr} Cr
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
          <div className="p-2.5 rounded-lg bg-background">
            <div className="text-[10px] text-muted-foreground uppercase">State</div>
            <div className="font-medium">{player.state}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-background">
            <div className="text-[10px] text-muted-foreground uppercase">Batting</div>
            <div className="font-medium">{player.battingStyle}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-background">
            <div className="text-[10px] text-muted-foreground uppercase">Bowling</div>
            <div className="font-medium text-xs">{player.bowlingStyle || 'None'}</div>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-2">
          {stats.ipl && (
            <div className="p-3 rounded-lg bg-background border border-border">
              <div className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1.5">IPL Stats</div>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div><span className="text-muted-foreground">Mat: </span><span className="font-semibold">{stats.ipl.matches}</span></div>
                {stats.ipl.runs != null && <div><span className="text-muted-foreground">Runs: </span><span className="font-semibold">{stats.ipl.runs}</span></div>}
                {stats.ipl.avg != null && <div><span className="text-muted-foreground">Avg: </span><span className="font-semibold">{stats.ipl.avg}</span></div>}
                {stats.ipl.sr != null && <div><span className="text-muted-foreground">SR: </span><span className="font-semibold">{stats.ipl.sr}</span></div>}
                {stats.ipl.wickets != null && <div><span className="text-muted-foreground">Wkts: </span><span className="font-semibold">{stats.ipl.wickets}</span></div>}
                {stats.ipl.economy != null && <div><span className="text-muted-foreground">Econ: </span><span className="font-semibold">{stats.ipl.economy}</span></div>}
              </div>
            </div>
          )}
          {stats.t20i && (
            <div className="p-3 rounded-lg bg-background border border-border">
              <div className="text-[10px] font-semibold text-chart-3 uppercase tracking-wider mb-1.5">T20I Stats</div>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div><span className="text-muted-foreground">Mat: </span><span className="font-semibold">{stats.t20i.matches}</span></div>
                {stats.t20i.runs != null && <div><span className="text-muted-foreground">Runs: </span><span className="font-semibold">{stats.t20i.runs}</span></div>}
                {stats.t20i.avg != null && <div><span className="text-muted-foreground">Avg: </span><span className="font-semibold">{stats.t20i.avg}</span></div>}
                {stats.t20i.sr != null && <div><span className="text-muted-foreground">SR: </span><span className="font-semibold">{stats.t20i.sr}</span></div>}
                {stats.t20i.wickets != null && <div><span className="text-muted-foreground">Wkts: </span><span className="font-semibold">{stats.t20i.wickets}</span></div>}
                {stats.t20i.economy != null && <div><span className="text-muted-foreground">Econ: </span><span className="font-semibold">{stats.t20i.economy}</span></div>}
              </div>
            </div>
          )}
          {stats.ranji && !stats.ipl && (
            <div className="p-3 rounded-lg bg-background border border-border">
              <div className="text-[10px] font-semibold text-chart-2 uppercase tracking-wider mb-1.5">Ranji Stats</div>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div><span className="text-muted-foreground">Mat: </span><span className="font-semibold">{stats.ranji.matches}</span></div>
                {stats.ranji.runs != null && <div><span className="text-muted-foreground">Runs: </span><span className="font-semibold">{stats.ranji.runs}</span></div>}
                {stats.ranji.avg != null && <div><span className="text-muted-foreground">Avg: </span><span className="font-semibold">{stats.ranji.avg}</span></div>}
                {stats.ranji.wickets != null && <div><span className="text-muted-foreground">Wkts: </span><span className="font-semibold">{stats.ranji.wickets}</span></div>}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
