import { motion, AnimatePresence } from 'framer-motion'
import { Star, Trash2, Download, Brain, User, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/store/appStore'

const roleColors: Record<string, string> = {
  'Batsman': 'bg-blue-500/20 text-blue-400',
  'Bowler': 'bg-red-500/20 text-red-400',
  'All-Rounder': 'bg-green-500/20 text-green-400',
  'WK-Batsman': 'bg-purple-500/20 text-purple-400',
}

export function ShortlistPage() {
  const { shortlist, removeFromShortlist, clearShortlist } = useAppStore()

  const roleCounts = shortlist.reduce((acc, p) => {
    acc[p.role] = (acc[p.role] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const exportCSV = () => {
    const headers = ['Name', 'Role', 'State', 'IPL Team', 'Base Price (Cr)', 'Tier', 'Capped']
    const rows = shortlist.map(p => [
      p.name, p.role, p.state, p.iplTeam, p.basePriceCr, p.tier, p.isCapped ? 'Yes' : 'No'
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'scout_india_shortlist.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
              <Star className="inline-block w-8 h-8 text-primary mr-3 -mt-1" />
              SHORTLIST
            </h1>
            <p className="text-muted-foreground mt-1">{shortlist.length} players shortlisted.</p>
          </div>
          {shortlist.length > 0 && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download className="w-4 h-4 mr-1.5" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={clearShortlist} className="text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4 mr-1.5" />
                Clear All
              </Button>
            </div>
          )}
        </div>

        {/* Squad Summary */}
        {shortlist.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-5 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                Squad Composition
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(roleCounts).map(([role, count]) => (
                <div key={role} className="p-3 rounded-lg bg-background text-center">
                  <div className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{count}</div>
                  <div className="text-xs text-muted-foreground">{role}s</div>
                </div>
              ))}
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-center">
                <div className="text-2xl font-bold text-primary" style={{ fontFamily: 'var(--font-heading)' }}>
                  {shortlist.reduce((sum, p) => sum + p.basePriceCr, 0).toFixed(1)}
                </div>
                <div className="text-xs text-primary">Base Total (Cr)</div>
              </div>
            </div>

            {/* Gap analysis */}
            <div className="mt-4 p-3 rounded-lg bg-background">
              <div className="text-xs text-muted-foreground mb-2">Quick Analysis</div>
              <div className="flex flex-wrap gap-2">
                {!roleCounts['WK-Batsman'] && (
                  <Badge variant="outline" className="text-amber-400 border-amber-500/30 text-[10px]">
                    Need: Wicket-keeper
                  </Badge>
                )}
                {(roleCounts['Bowler'] || 0) < 3 && (
                  <Badge variant="outline" className="text-amber-400 border-amber-500/30 text-[10px]">
                    Need: More bowlers ({roleCounts['Bowler'] || 0}/3 min)
                  </Badge>
                )}
                {(roleCounts['All-Rounder'] || 0) < 2 && (
                  <Badge variant="outline" className="text-amber-400 border-amber-500/30 text-[10px]">
                    Need: All-rounder depth
                  </Badge>
                )}
                {shortlist.filter(p => p.isCapped).length >= 4 && (
                  <Badge variant="outline" className="text-green-400 border-green-500/30 text-[10px]">
                    Good: International experience
                  </Badge>
                )}
                {shortlist.length >= 8 && Object.keys(roleCounts).length >= 4 && (
                  <Badge variant="outline" className="text-green-400 border-green-500/30 text-[10px]">
                    Good: Balanced squad
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Player Grid */}
        <AnimatePresence>
          {shortlist.length > 0 ? (
            <motion.div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {shortlist.map((player, i) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.03 }}
                  layout
                  className="bg-card rounded-xl border border-border p-4 relative group"
                >
                  <button
                    onClick={() => removeFromShortlist(player.id)}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center shrink-0">
                      <User className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold truncate">{player.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge className={`text-[9px] py-0 ${roleColors[player.role]}`}>{player.role}</Badge>
                        <span className="text-[10px] text-muted-foreground">{player.state}</span>
                      </div>
                    </div>
                    <div className="ml-auto text-right shrink-0">
                      <div className="text-lg font-bold text-primary" style={{ fontFamily: 'var(--font-heading)' }}>
                        {player.basePriceCr} Cr
                      </div>
                      <div className="text-[10px] text-muted-foreground">{player.tier}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <Star className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-muted-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                NO PLAYERS SHORTLISTED
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                Go to the Scout page and add players to your shortlist.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
