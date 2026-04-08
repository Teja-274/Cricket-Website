import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Swords, Search, User, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { NumberTicker } from '@/components/magicui/number-ticker'
import { BorderBeam } from '@/components/magicui/border-beam'
import { searchPlayersDB, getHeadToHead } from '@/lib/queries'

interface PlayerResult { id: string; name: string; short_name: string }

function PlayerSearch({ label, onSelect }: { label: string; onSelect: (p: PlayerResult) => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PlayerResult[]>([])
  const [searching, setSearching] = useState(false)

  const handleSearch = async (q: string) => {
    setQuery(q)
    if (q.length < 2) { setResults([]); return }
    setSearching(true)
    const r = await searchPlayersDB(q, 8)
    setResults(r)
    setSearching(false)
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input value={query} onChange={(e) => handleSearch(e.target.value)} placeholder={label}
        className="pl-10 bg-background/50 border-border/50 rounded-xl" />
      {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute top-full left-0 right-0 mt-1 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl z-10 shadow-2xl overflow-hidden">
            {results.map(p => (
              <button key={p.id} onClick={() => { onSelect(p); setQuery(p.name); setResults([]) }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-accent/50 transition-colors text-sm">
                <User className="w-4 h-4 text-muted-foreground" /><span className="font-medium">{p.name}</span>
                <span className="text-xs text-muted-foreground ml-auto">{p.short_name}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function HeadToHeadPage() {
  const [player1, setPlayer1] = useState<PlayerResult | null>(null)
  const [player2, setPlayer2] = useState<PlayerResult | null>(null)
  const [h2h, setH2h] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchH2H = async (p1: PlayerResult, p2: PlayerResult) => {
    setLoading(true)
    const data = await getHeadToHead(p1.id, p2.id)
    setH2h(data)
    setLoading(false)
  }

  const handleSelect1 = (p: PlayerResult) => {
    setPlayer1(p)
    if (player2) fetchH2H(p, player2)
  }
  const handleSelect2 = (p: PlayerResult) => {
    setPlayer2(p)
    if (player1) fetchH2H(player1, p)
  }

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
            <Swords className="inline-block w-8 h-8 text-primary mr-3 -mt-1" />HEAD-TO-HEAD
          </h1>
          <p className="text-muted-foreground mt-1">Ball-by-ball matchup data between any two IPL players.</p>
        </div>

        {/* Search */}
        <div className="grid md:grid-cols-[1fr_auto_1fr] gap-4 items-center mb-8">
          <PlayerSearch label="Search Player 1..." onSelect={handleSelect1} />
          <div className="text-center text-sm font-bold text-muted-foreground">VS</div>
          <PlayerSearch label="Search Player 2..." onSelect={handleSelect2} />
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-primary animate-spin mr-3" />
            <span className="text-muted-foreground">Analyzing {(player1?.name || '').split(' ').pop()} vs {(player2?.name || '').split(' ').pop()}...</span>
          </div>
        )}

        {h2h && player1 && player2 && !loading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Summary cards */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Player 1 batting vs Player 2 */}
              <div className="relative bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 p-6 overflow-hidden">
                <BorderBeam size={150} duration={8} colorFrom="#f5a623" colorTo="#22c55e" />
                <h3 className="text-xs font-bold uppercase text-muted-foreground mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
                  {player1.name} BATTING vs {player2.name.split(' ').pop()}
                </h3>
                {h2h.player1Batting.balls > 0 ? (
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="text-center p-3 rounded-lg bg-background/50">
                      <div className="text-2xl font-bold text-primary" style={{ fontFamily: 'var(--font-heading)' }}><NumberTicker value={h2h.player1Batting.runs} /></div>
                      <div className="text-[10px] text-muted-foreground">Runs</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-background/50">
                      <div className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{h2h.player1Batting.balls}</div>
                      <div className="text-[10px] text-muted-foreground">Balls</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-background/50">
                      <div className="text-2xl font-bold text-chart-2" style={{ fontFamily: 'var(--font-heading)' }}>{h2h.player1Batting.sr}</div>
                      <div className="text-[10px] text-muted-foreground">SR</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-background/50">
                      <div className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{h2h.player1Batting.boundaries}</div>
                      <div className="text-[10px] text-muted-foreground">Boundaries</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-background/50">
                      <div className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{h2h.player1Batting.dots}</div>
                      <div className="text-[10px] text-muted-foreground">Dots</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-background/50">
                      <div className="text-xl font-bold text-destructive" style={{ fontFamily: 'var(--font-heading)' }}>{h2h.player1Dismissals}</div>
                      <div className="text-[10px] text-muted-foreground">Dismissed</div>
                    </div>
                  </div>
                ) : <p className="text-muted-foreground text-sm mt-4">No data — these players haven't faced each other in this combination.</p>}
              </div>

              {/* Player 2 batting vs Player 1 */}
              <div className="relative bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 p-6 overflow-hidden">
                <BorderBeam size={150} duration={8} colorFrom="#3b82f6" colorTo="#a855f7" />
                <h3 className="text-xs font-bold uppercase text-muted-foreground mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
                  {player2.name} BATTING vs {player1.name.split(' ').pop()}
                </h3>
                {h2h.player2Batting.balls > 0 ? (
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="text-center p-3 rounded-lg bg-background/50">
                      <div className="text-2xl font-bold text-chart-3" style={{ fontFamily: 'var(--font-heading)' }}><NumberTicker value={h2h.player2Batting.runs} /></div>
                      <div className="text-[10px] text-muted-foreground">Runs</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-background/50">
                      <div className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{h2h.player2Batting.balls}</div>
                      <div className="text-[10px] text-muted-foreground">Balls</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-background/50">
                      <div className="text-2xl font-bold text-chart-2" style={{ fontFamily: 'var(--font-heading)' }}>{h2h.player2Batting.sr}</div>
                      <div className="text-[10px] text-muted-foreground">SR</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-background/50">
                      <div className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{h2h.player2Batting.boundaries}</div>
                      <div className="text-[10px] text-muted-foreground">Boundaries</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-background/50">
                      <div className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{h2h.player2Batting.dots}</div>
                      <div className="text-[10px] text-muted-foreground">Dots</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-background/50">
                      <div className="text-xl font-bold text-destructive" style={{ fontFamily: 'var(--font-heading)' }}>{h2h.player2Dismissals}</div>
                      <div className="text-[10px] text-muted-foreground">Dismissed</div>
                    </div>
                  </div>
                ) : <p className="text-muted-foreground text-sm mt-4">No data — these players haven't faced each other in this combination.</p>}
              </div>
            </div>

            {/* Phase breakdown */}
            {h2h.player1Batting.balls > 0 && (
              <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border/50 p-5">
                <h3 className="text-xs font-bold uppercase text-muted-foreground mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
                  PHASE BREAKDOWN — {player1.name} vs {player2.name.split(' ').pop()}
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {(['powerplay', 'middle', 'death'] as const).map(phase => {
                    const d = h2h.player1Batting.byPhase[phase]
                    const labels = { powerplay: 'Powerplay (1-6)', middle: 'Middle (7-15)', death: 'Death (16-20)' }
                    return (
                      <div key={phase} className="p-3 rounded-lg bg-background/50 text-center">
                        <div className="text-[10px] text-muted-foreground uppercase mb-1">{labels[phase]}</div>
                        <div className="text-lg font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{d.runs} / {d.balls}</div>
                        <div className="text-xs text-muted-foreground">runs / balls</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {!h2h && !loading && (
          <div className="text-center py-20">
            <Swords className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-muted-foreground" style={{ fontFamily: 'var(--font-heading)' }}>SEARCH TWO PLAYERS</h3>
            <p className="text-sm text-muted-foreground mt-2">Try "Virat Kohli" vs "Jasprit Bumrah"</p>
          </div>
        )}
      </motion.div>
    </div>
  )
}
