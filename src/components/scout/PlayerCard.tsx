import { motion } from 'framer-motion'
import { Star, GitCompareArrows, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Player } from '@/data/players'
import { useAppStore } from '@/store/appStore'

const roleColors: Record<string, string> = {
  'Batsman': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Bowler': 'bg-red-500/20 text-red-400 border-red-500/30',
  'All-Rounder': 'bg-green-500/20 text-green-400 border-green-500/30',
  'WK-Batsman': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
}

const tierGradients: Record<string, string> = {
  'International Ready': 'from-amber-500/10 via-transparent',
  'IPL Proven': 'from-emerald-500/10 via-transparent',
  'Domestic Star': 'from-sky-500/10 via-transparent',
  'Emerging Talent': 'from-violet-500/10 via-transparent',
}

const tierBorder: Record<string, string> = {
  'International Ready': 'border-l-amber-500/50',
  'IPL Proven': 'border-l-emerald-500/50',
  'Domestic Star': 'border-l-sky-500/50',
  'Emerging Talent': 'border-l-violet-500/50',
}

const tierColors: Record<string, string> = {
  'International Ready': 'text-amber-400',
  'IPL Proven': 'text-emerald-400',
  'Domestic Star': 'text-sky-400',
  'Emerging Talent': 'text-violet-400',
}

export function PlayerCard({ player, index }: { player: Player; index: number }) {
  const { addToShortlist, isInShortlist, setCompareSlot, compareSlots } = useAppStore()
  const inShortlist = isInShortlist(player.id)
  const primaryStat = player.stats.ipl || player.stats.t20i || player.stats.ranji
  const isInCompare = compareSlots[0]?.id === player.id || compareSlots[1]?.id === player.id

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ delay: Math.min(index * 0.03, 0.5), duration: 0.4 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className={`group relative bg-gradient-to-br ${tierGradients[player.tier]} to-card rounded-xl border border-border/50 border-l-2 ${tierBorder[player.tier]} p-4 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 overflow-hidden`}
    >
      {/* Hover glow */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/0 via-primary/0 to-primary/0 group-hover:via-primary/50 transition-all duration-500" />

      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent/50 flex items-center justify-center ring-1 ring-border/50">
            <User className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-bold text-sm leading-tight">{player.name}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge className={`text-[9px] py-0 ${roleColors[player.role]}`}>{player.role}</Badge>
              {player.isCapped && <Badge variant="outline" className="text-[9px] py-0 border-amber-500/30 text-amber-400">INT</Badge>}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-primary" style={{ fontFamily: 'var(--font-heading)' }}>{player.basePriceCr} Cr</div>
          <div className={`text-[10px] font-medium ${tierColors[player.tier]}`}>{player.tier}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-[10px] text-muted-foreground mb-3">
        <div className="truncate">{player.state}</div>
        <div>{player.battingStyle}</div>
        <div className="truncate text-right">{player.iplTeam !== 'None' ? player.iplTeam : '—'}</div>
      </div>

      {primaryStat && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="p-2 rounded-lg bg-background/50 text-center">
            <div className="text-[10px] text-muted-foreground">Mat</div>
            <div className="text-sm font-bold">{primaryStat.matches}</div>
          </div>
          {primaryStat.runs != null && (
            <div className="p-2 rounded-lg bg-background/50 text-center">
              <div className="text-[10px] text-muted-foreground">Runs</div>
              <div className="text-sm font-bold">{primaryStat.runs}</div>
            </div>
          )}
          {primaryStat.wickets != null && (
            <div className="p-2 rounded-lg bg-background/50 text-center">
              <div className="text-[10px] text-muted-foreground">Wkts</div>
              <div className="text-sm font-bold">{primaryStat.wickets}</div>
            </div>
          )}
          {primaryStat.avg != null && !primaryStat.wickets && (
            <div className="p-2 rounded-lg bg-background/50 text-center">
              <div className="text-[10px] text-muted-foreground">Avg</div>
              <div className="text-sm font-bold">{primaryStat.avg}</div>
            </div>
          )}
          {primaryStat.economy != null && !primaryStat.runs && (
            <div className="p-2 rounded-lg bg-background/50 text-center">
              <div className="text-[10px] text-muted-foreground">Econ</div>
              <div className="text-sm font-bold">{primaryStat.economy}</div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
        <Button size="sm" variant={inShortlist ? 'default' : 'outline'} onClick={() => addToShortlist(player)} disabled={inShortlist} className="flex-1 h-7 text-xs rounded-lg">
          <Star className="w-3 h-3 mr-1" />{inShortlist ? 'Listed' : 'Shortlist'}
        </Button>
        <Button size="sm" variant={isInCompare ? 'default' : 'outline'} onClick={() => { if (!compareSlots[0]) setCompareSlot(0, player); else if (!compareSlots[1]) setCompareSlot(1, player) }}
          disabled={isInCompare || (!!compareSlots[0] && !!compareSlots[1])} className="flex-1 h-7 text-xs rounded-lg">
          <GitCompareArrows className="w-3 h-3 mr-1" />Compare
        </Button>
      </div>
    </motion.div>
  )
}
