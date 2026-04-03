import { motion, AnimatePresence } from 'framer-motion'
import { Star, Trash2, Download, Brain, User, X, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { NumberTicker } from '@/components/magicui/number-ticker'
import { useAppStore } from '@/store/appStore'

const roleColors: Record<string, string> = {
  'Batsman': 'bg-blue-500/20 text-blue-400',
  'Bowler': 'bg-red-500/20 text-red-400',
  'All-Rounder': 'bg-green-500/20 text-green-400',
  'WK-Batsman': 'bg-purple-500/20 text-purple-400',
}

const tierBorder: Record<string, string> = {
  'International Ready': 'border-l-amber-500',
  'IPL Proven': 'border-l-emerald-500',
  'Domestic Star': 'border-l-sky-500',
  'Emerging Talent': 'border-l-violet-500',
}

export function ShortlistPage() {
  const { shortlist, removeFromShortlist, clearShortlist } = useAppStore()
  const roleCounts = shortlist.reduce((acc, p) => { acc[p.role] = (acc[p.role] || 0) + 1; return acc }, {} as Record<string, number>)
  const totalBase = shortlist.reduce((sum, p) => sum + p.basePriceCr, 0)

  const exportCSV = () => {
    const csv = [['Name', 'Role', 'State', 'IPL Team', 'Base Price (Cr)', 'Tier', 'Capped'], ...shortlist.map(p => [p.name, p.role, p.state, p.iplTeam, p.basePriceCr, p.tier, p.isCapped ? 'Yes' : 'No'])].map(r => r.join(',')).join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'scout_india_shortlist.csv'; a.click()
  }

  const gaps = [
    { check: !roleCounts['WK-Batsman'], label: 'Wicket-keeper needed', type: 'warn' },
    { check: (roleCounts['Bowler'] || 0) < 3, label: `Bowlers: ${roleCounts['Bowler'] || 0}/3 min`, type: 'warn' },
    { check: (roleCounts['All-Rounder'] || 0) < 2, label: 'All-rounder depth needed', type: 'warn' },
    { check: shortlist.filter(p => p.isCapped).length >= 4, label: 'International experience', type: 'good' },
    { check: shortlist.length >= 8 && Object.keys(roleCounts).length >= 4, label: 'Balanced squad', type: 'good' },
  ].filter(g => g.check)

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
              <Star className="inline-block w-8 h-8 text-primary mr-3 -mt-1" />SHORTLIST
            </h1>
            <p className="text-muted-foreground mt-1">{shortlist.length} players shortlisted.</p>
          </div>
          {shortlist.length > 0 && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportCSV} className="rounded-xl"><Download className="w-4 h-4 mr-1.5" />Export CSV</Button>
              <Button variant="outline" size="sm" onClick={clearShortlist} className="rounded-xl text-destructive hover:text-destructive"><Trash2 className="w-4 h-4 mr-1.5" />Clear</Button>
            </div>
          )}
        </div>

        {shortlist.length > 0 && (
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground" style={{ fontFamily: 'var(--font-heading)' }}>SQUAD COMPOSITION</h3>
            </div>

            {/* Role bars */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
              {[
                { role: 'Batsman', color: 'bg-blue-500', textColor: 'text-blue-400' },
                { role: 'Bowler', color: 'bg-red-500', textColor: 'text-red-400' },
                { role: 'All-Rounder', color: 'bg-green-500', textColor: 'text-green-400' },
                { role: 'WK-Batsman', color: 'bg-purple-500', textColor: 'text-purple-400' },
              ].map(r => (
                <motion.div key={r.role} whileHover={{ scale: 1.03 }} className="p-3 rounded-xl bg-background/50 border border-border/30">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${r.color}`} />
                    <span className="text-[10px] text-muted-foreground uppercase">{r.role}s</span>
                  </div>
                  <div className={`text-2xl font-bold ${r.textColor}`} style={{ fontFamily: 'var(--font-heading)' }}>
                    {roleCounts[r.role] || 0}
                  </div>
                </motion.div>
              ))}
              <motion.div whileHover={{ scale: 1.03 }} className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                <div className="text-[10px] text-primary uppercase mb-1">Est. Total</div>
                <div className="text-2xl font-bold text-primary" style={{ fontFamily: 'var(--font-heading)' }}>
                  <NumberTicker value={Math.round(totalBase * 10) / 10} decimalPlaces={1} /> Cr
                </div>
              </motion.div>
            </div>

            {/* Gap analysis */}
            {gaps.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {gaps.map(g => (
                  <Badge key={g.label} variant="outline" className={`text-[10px] ${g.type === 'warn' ? 'text-amber-400 border-amber-500/30' : 'text-green-400 border-green-500/30'}`}>
                    {g.type === 'warn' ? <AlertCircle className="w-3 h-3 mr-1" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                    {g.label}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        <AnimatePresence>
          {shortlist.length > 0 ? (
            <motion.div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {shortlist.map((player, i) => (
                <motion.div key={player.id}
                  initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 0.9, filter: 'blur(4px)' }}
                  transition={{ delay: i * 0.03 }}
                  layout
                  whileHover={{ y: -2 }}
                  className={`bg-card/80 backdrop-blur-sm rounded-xl border border-border/50 border-l-2 ${tierBorder[player.tier]} p-4 relative group hover:shadow-lg hover:shadow-primary/5 transition-all duration-300`}
                >
                  <button onClick={() => removeFromShortlist(player.id)}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 text-muted-foreground hover:text-destructive">
                    <X className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-accent/50 flex items-center justify-center shrink-0 ring-1 ring-border/30">
                      <User className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold truncate">{player.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge className={`text-[9px] py-0 ${roleColors[player.role]}`}>{player.role}</Badge>
                        <span className="text-[10px] text-muted-foreground">{player.state}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-bold text-primary" style={{ fontFamily: 'var(--font-heading)' }}>{player.basePriceCr} Cr</div>
                      <div className="text-[10px] text-muted-foreground">{player.tier}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }}>
                <Star className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
              </motion.div>
              <h3 className="text-xl font-bold text-muted-foreground" style={{ fontFamily: 'var(--font-heading)' }}>NO PLAYERS SHORTLISTED</h3>
              <p className="text-sm text-muted-foreground mt-2">Go to the Scout page and add players.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
