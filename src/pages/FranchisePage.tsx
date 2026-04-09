import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Loader2, Users } from 'lucide-react'
import { NumberTicker } from '@/components/magicui/number-ticker'
import { BorderBeam } from '@/components/magicui/border-beam'
import { IPL_FRANCHISES } from '@/data/franchises'
import { supabase } from '@/lib/supabase'

export function FranchisePage() {
  const [selected, setSelected] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [topPlayers, setTopPlayers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const handleSelect = async (team: any) => {
    if (!supabase) return
    setSelected(team)
    setLoading(true)
    const [statsRes, playersRes] = await Promise.all([
      supabase.rpc('get_franchise_stats', { team_name: team.name }),
      supabase.rpc('get_franchise_top_players', { team_name: team.name, lim: 10 }),
    ])
    setStats(statsRes.data?.[0] || null)
    setTopPlayers(playersRes.data || [])
    setLoading(false)
  }

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
            <Trophy className="inline-block w-8 h-8 text-primary mr-3 -mt-1" />FRANCHISE ANALYTICS
          </h1>
          <p className="text-muted-foreground mt-1">Win records, top performers for every IPL team.</p>
        </div>

        {/* Team grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {IPL_FRANCHISES.map((team, i) => (
            <motion.button
              key={team.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSelect(team)}
              className={`p-4 rounded-xl border-2 transition-all duration-300 text-center ${
                selected?.id === team.id ? '' : 'border-border/50'
              }`}
              style={{
                background: `linear-gradient(135deg, ${team.color}${selected?.id === team.id ? '20' : '08'}, transparent)`,
                borderColor: selected?.id === team.id ? team.color : undefined,
                boxShadow: selected?.id === team.id ? `0 4px 20px ${team.color}30` : undefined,
              }}
            >
              <div className="text-xl font-bold" style={{ color: team.color, fontFamily: 'var(--font-heading)' }}>{team.shortName}</div>
              <div className="text-[10px] text-muted-foreground mt-1">{team.name}</div>
            </motion.button>
          ))}
        </div>

        {/* Stats */}
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-primary animate-spin mr-3" />
              <span className="text-muted-foreground">Loading franchise stats...</span>
            </div>
          ) : selected && stats ? (
            <motion.div key={selected.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Overview cards */}
              <div className="relative bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 p-6 mb-6 overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${selected.color}10, transparent)` }}>
                <BorderBeam size={200} duration={8} colorFrom={selected.color} colorTo={`${selected.color}80`} />
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center border-2"
                    style={{ borderColor: `${selected.color}40`, background: `${selected.color}10` }}>
                    <span className="text-xl font-bold" style={{ color: selected.color, fontFamily: 'var(--font-heading)' }}>{selected.shortName}</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: selected.color }}>{selected.name}</h2>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
                  <div className="p-3 rounded-xl bg-background/50 text-center">
                    <div className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}><NumberTicker value={Number(stats.total_matches)} /></div>
                    <div className="text-[10px] text-muted-foreground">Matches</div>
                  </div>
                  <div className="p-3 rounded-xl bg-background/50 text-center">
                    <div className="text-2xl font-bold text-chart-2" style={{ fontFamily: 'var(--font-heading)' }}><NumberTicker value={Number(stats.wins)} /></div>
                    <div className="text-[10px] text-muted-foreground">Wins</div>
                  </div>
                  <div className="p-3 rounded-xl bg-background/50 text-center">
                    <div className="text-2xl font-bold text-destructive" style={{ fontFamily: 'var(--font-heading)' }}><NumberTicker value={Number(stats.losses)} /></div>
                    <div className="text-[10px] text-muted-foreground">Losses</div>
                  </div>
                  <div className="p-3 rounded-xl bg-background/50 text-center">
                    <div className="text-2xl font-bold text-primary" style={{ fontFamily: 'var(--font-heading)' }}>{Number(stats.win_pct)}%</div>
                    <div className="text-[10px] text-muted-foreground">Win Rate</div>
                  </div>
                  <div className="p-3 rounded-xl bg-background/50 text-center">
                    <div className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{stats.highest_score || '—'}</div>
                    <div className="text-[10px] text-muted-foreground">Highest</div>
                  </div>
                </div>
              </div>

              {/* Top players */}
              {topPlayers.length > 0 && (
                <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden">
                  <div className="p-4 border-b border-border/30 flex items-center gap-2">
                    <Users className="w-4 h-4" style={{ color: selected.color }} />
                    <h3 className="text-sm font-bold uppercase" style={{ fontFamily: 'var(--font-heading)' }}>TOP PERFORMERS</h3>
                  </div>
                  <div className="divide-y divide-border/10">
                    {topPlayers.map((p, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                        className="flex items-center gap-4 p-3 hover:bg-background/30">
                        <span className="text-muted-foreground w-6">{i + 1}</span>
                        <span className="font-medium flex-1">{p.player_name}</span>
                        <span className="text-xs text-muted-foreground">{p.matches} mat</span>
                        {Number(p.runs) > 0 && <span className="text-sm font-bold text-primary">{p.runs} runs</span>}
                        {Number(p.wickets) > 0 && <span className="text-sm font-bold text-chart-2">{p.wickets} wkts</span>}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="text-center py-16">
              <Trophy className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-muted-foreground">Click a franchise above to see their stats.</p>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
