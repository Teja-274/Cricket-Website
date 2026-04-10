import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Trophy, ArrowLeft, IndianRupee, Users, TrendingUp, BarChart3, Download, Film } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { NumberTicker } from '@/components/magicui/number-ticker'
import { useAuctionStore } from '@/store/auctionStore'
import { exportAuctionResultsPDF } from '@/lib/pdfExport'

export function AuctionResultsPage() {
  const navigate = useNavigate()
  const { players, franchises, room, bids } = useAuctionStore()

  const soldPlayers = players.filter(p => p.status === 'sold')
  const unsoldPlayers = players.filter(p => p.status === 'unsold')
  const totalSpent = soldPlayers.reduce((s, p) => s + (p.soldPriceCr || 0), 0)
  const highestBid = soldPlayers.length > 0 ? Math.max(...soldPlayers.map(p => p.soldPriceCr || 0)) : 0
  const mvpPlayer = soldPlayers.find(p => p.soldPriceCr === highestBid)

  const franchiseResults = useMemo(() => {
    return franchises.map(f => {
      const bought = soldPlayers.filter(p => p.soldToId === f.id)
      const spent = bought.reduce((s, p) => s + (p.soldPriceCr || 0), 0)
      return { ...f, bought, spent: Math.round(spent * 100) / 100 }
    }).sort((a, b) => b.bought.length - a.bought.length)
  }, [franchises, soldPlayers])

  if (!room) {
    return (
      <div className="min-h-screen p-8 flex flex-col items-center justify-center">
        <Trophy className="w-16 h-16 text-muted-foreground/20 mb-4" />
        <h2 className="text-xl font-bold text-muted-foreground" style={{ fontFamily: 'var(--font-heading)' }}>NO AUCTION DATA</h2>
        <p className="text-sm text-muted-foreground mt-2">Complete an auction to see results here.</p>
        <Button variant="outline" onClick={() => navigate('/lobby')} className="mt-4 rounded-xl">Go to Lobby</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />Back
        </Button>

        <div className="mb-8 flex items-start justify-between">
          <div>
          <h1 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
            <Trophy className="inline-block w-8 h-8 text-primary mr-3 -mt-1" />AUCTION RESULTS
          </h1>
          <p className="text-muted-foreground mt-1">{room.name} | {soldPlayers.length} sold | {unsoldPlayers.length} unsold | {bids.length} total bids</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/replay')} className="rounded-xl">
              <Film className="w-4 h-4 mr-1.5" />Replay
            </Button>
            <Button size="sm" onClick={() => exportAuctionResultsPDF(room, franchises, players)} className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
              <Download className="w-4 h-4 mr-1.5" />Export PDF
            </Button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Players Sold', value: soldPlayers.length, icon: Users, color: 'text-chart-2' },
            { label: 'Total Spent', value: Math.round(totalSpent * 10) / 10, icon: IndianRupee, color: 'text-primary', suffix: ' Cr' },
            { label: 'Highest Bid', value: highestBid, icon: TrendingUp, color: 'text-chart-5', suffix: ' Cr' },
            { label: 'Total Bids', value: bids.length, icon: BarChart3, color: 'text-chart-3' },
          ].map(s => (
            <motion.div key={s.label} whileHover={{ scale: 1.03, y: -2 }}
              className="p-4 rounded-xl bg-card/80 backdrop-blur-sm border border-border/50">
              <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
              <div className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: 'var(--font-heading)' }}>
                <NumberTicker value={s.value} decimalPlaces={s.suffix ? 1 : 0} />{s.suffix || ''}
              </div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* MVP */}
        {mvpPlayer && (
          <Card className="bg-gradient-to-r from-primary/10 via-card/80 to-card/80 border-primary/20 mb-8">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                <Trophy className="w-7 h-7 text-primary" />
              </div>
              <div>
                <div className="text-xs text-primary uppercase font-bold tracking-wider">Most Expensive Player</div>
                <div className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{mvpPlayer.name}</div>
                <div className="text-sm text-muted-foreground">{mvpPlayer.role} | Sold for {mvpPlayer.soldPriceCr} Cr</div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Franchise breakdown */}
        <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>FRANCHISE SPENDING</h3>
        <div className="space-y-4 mb-8">
          {franchiseResults.map((f, i) => (
            <motion.div key={f.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card/80 backdrop-blur-sm rounded-xl border border-border/50 p-4"
              style={{ borderLeftWidth: 3, borderLeftColor: f.color }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold" style={{ color: f.color, fontFamily: 'var(--font-heading)' }}>{f.shortName}</span>
                  <span className="text-sm text-muted-foreground">{f.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-primary" style={{ fontFamily: 'var(--font-heading)' }}>{f.spent} Cr</span>
                  <span className="text-xs text-muted-foreground ml-2">({f.bought.length} players)</span>
                </div>
              </div>
              {/* Spending bar */}
              <div className="h-2 rounded-full bg-background/50 overflow-hidden mb-3">
                <motion.div initial={{ width: 0 }} animate={{ width: `${(f.spent / (room.totalPurseCr || 100)) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }} className="h-full rounded-full" style={{ backgroundColor: f.color }} />
              </div>
              {/* Players bought */}
              {f.bought.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {f.bought.sort((a, b) => (b.soldPriceCr || 0) - (a.soldPriceCr || 0)).map(p => (
                    <Badge key={p.id} variant="outline" className="text-[10px] cursor-pointer hover:bg-accent/50"
                      onClick={() => navigate(`/player/${p.id}`)}>
                      {p.name} — {p.soldPriceCr} Cr
                    </Badge>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Unsold */}
        {unsoldPlayers.length > 0 && (
          <div>
            <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>UNSOLD ({unsoldPlayers.length})</h3>
            <div className="flex flex-wrap gap-2">
              {unsoldPlayers.map(p => (
                <Badge key={p.id} variant="outline" className="text-xs text-muted-foreground cursor-pointer hover:bg-accent/50"
                  onClick={() => navigate(`/player/${p.id}`)}>
                  {p.name} ({p.basePriceCr} Cr)
                </Badge>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
