import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Target, Loader2, Filter } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'

const BOWL_STYLES = ['All', 'Right-Arm Fast', 'Left-Arm Fast', 'Off Spin', 'Leg Spin', 'Left-Arm Spin']
const BAT_STYLES = ['All', 'Right-Hand', 'Left-Hand']
const PHASES = [
  { value: 'all', label: 'All Overs' },
  { value: 'powerplay', label: 'Powerplay (1-6)' },
  { value: 'middle', label: 'Middle (7-15)' },
  { value: 'death', label: 'Death (16-20)' },
]

export function MatchupExplorerPage() {
  const [bowlStyle, setBowlStyle] = useState('All')
  const [batStyle, setBatStyle] = useState('All')
  const [phase, setPhase] = useState('all')
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      if (!supabase) return
      setLoading(true)
      const { data, error } = await supabase.rpc('explore_matchups', {
        bowl_style: bowlStyle === 'All' ? null : bowlStyle,
        bat_style: batStyle === 'All' ? null : batStyle,
        phase_filter: phase === 'all' ? null : phase,
        lim: 50,
      })
      if (error) console.error(error)
      setData((data as any[]) || [])
      setLoading(false)
    }
    fetch()
  }, [bowlStyle, batStyle, phase])

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
            <Target className="inline-block w-8 h-8 text-primary mr-3 -mt-1" />MATCHUP EXPLORER
          </h1>
          <p className="text-muted-foreground mt-1">Find specific bowler vs batter matchups across all IPL history.</p>
        </div>

        {/* Filters */}
        <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border/50 p-5 mb-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground" style={{ fontFamily: 'var(--font-heading)' }}>Filters</span>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-2">Bowling Style</div>
            <div className="flex flex-wrap gap-2">
              {BOWL_STYLES.map(s => (
                <Badge key={s} variant={bowlStyle === s ? 'default' : 'outline'}
                  className="cursor-pointer transition-all hover:scale-105" onClick={() => setBowlStyle(s)}>{s}</Badge>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-2">Batting Style</div>
            <div className="flex flex-wrap gap-2">
              {BAT_STYLES.map(s => (
                <Badge key={s} variant={batStyle === s ? 'default' : 'outline'}
                  className="cursor-pointer transition-all hover:scale-105" onClick={() => setBatStyle(s)}>{s}</Badge>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-2">Phase</div>
            <div className="flex flex-wrap gap-2">
              {PHASES.map(p => (
                <Badge key={p.value} variant={phase === p.value ? 'default' : 'outline'}
                  className="cursor-pointer transition-all hover:scale-105" onClick={() => setPhase(p.value)}>{p.label}</Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-primary animate-spin mr-3" /><span className="text-muted-foreground">Querying matchups...</span>
          </div>
        ) : data.length > 0 ? (
          <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden">
            <div className="p-4 border-b border-border/30">
              <h3 className="text-sm font-bold uppercase" style={{ fontFamily: 'var(--font-heading)' }}>MATCHUPS ({data.length} results)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/20 text-[10px] uppercase text-muted-foreground">
                    <th className="text-left p-3">Batsman</th>
                    <th className="text-left p-3">Bowler</th>
                    <th className="text-right p-3">Balls</th>
                    <th className="text-right p-3">Runs</th>
                    <th className="text-right p-3">SR</th>
                    <th className="text-right p-3">Dismissals</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((r, i) => (
                    <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.5) }}
                      className="border-b border-border/10 hover:bg-background/30">
                      <td className="p-3 font-medium">{r.batter_name}</td>
                      <td className="p-3 text-muted-foreground">{r.bowler_name}</td>
                      <td className="p-3 text-right">{r.balls}</td>
                      <td className="p-3 text-right font-bold text-primary">{r.runs}</td>
                      <td className="p-3 text-right">{r.sr}</td>
                      <td className="p-3 text-right font-bold text-destructive">{r.dismissals}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <Target className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground">No matchups found with these filters.</p>
          </div>
        )}
      </motion.div>
    </div>
  )
}
