import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, SkipForward, SkipBack, Film, ArrowLeft, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { NumberTicker } from '@/components/magicui/number-ticker'
import { useAuctionStore } from '@/store/auctionStore'

export function AuctionReplayPage() {
  const navigate = useNavigate()
  const { bids, players } = useAuctionStore()
  const [currentBidIndex, setCurrentBidIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1) // 1x, 2x, 4x
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (playing && currentBidIndex < bids.length) {
      intervalRef.current = setTimeout(() => {
        setCurrentBidIndex(i => Math.min(i + 1, bids.length))
      }, 1000 / speed)
    }
    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current)
    }
  }, [playing, currentBidIndex, bids.length, speed])

  useEffect(() => {
    if (currentBidIndex >= bids.length) setPlaying(false)
  }, [currentBidIndex, bids.length])

  if (bids.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <Film className="w-16 h-16 text-muted-foreground/20 mb-4" />
        <h2 className="text-xl font-bold text-muted-foreground mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
          NO AUCTION TO REPLAY
        </h2>
        <p className="text-sm text-muted-foreground mb-4">Complete an auction first to watch the replay.</p>
        <Button variant="outline" onClick={() => navigate('/lobby')}>Go to Lobby</Button>
      </div>
    )
  }

  const visibleBids = bids.slice(0, currentBidIndex)
  const currentBid = visibleBids[visibleBids.length - 1]
  const soldPlayers = players.filter(p => p.status === 'sold')

  // Track current totals at this point in the replay
  const franchiseTotals = new Map<string, { spent: number; players: number }>()
  for (const b of visibleBids) {
    if (!franchiseTotals.has(b.franchiseId)) {
      franchiseTotals.set(b.franchiseId, { spent: 0, players: 0 })
    }
  }

  // Handle back button navigation
  const handleReset = () => {
    setCurrentBidIndex(0)
    setPlaying(false)
  }

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />Back
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
            <Film className="inline-block w-8 h-8 text-primary mr-3 -mt-1" />AUCTION REPLAY
          </h1>
          <p className="text-muted-foreground mt-1">Watch the auction back bid-by-bid. {bids.length} total bids, {soldPlayers.length} players sold.</p>
        </div>

        {/* Current bid display */}
        <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 p-6 mb-6 text-center">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Bid #{currentBidIndex} of {bids.length}</div>
          <AnimatePresence mode="wait">
            {currentBid ? (
              <motion.div key={currentBid.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="text-5xl font-bold text-primary mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
                  <NumberTicker value={currentBid.amountCr} /> Cr
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full"
                  style={{ backgroundColor: `${currentBid.franchiseColor}20`, color: currentBid.franchiseColor }}>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentBid.franchiseColor }} />
                  <span className="font-semibold">{currentBid.franchiseName}</span>
                  {currentBid.isRtm && <Badge variant="outline" className="text-xs">RTM</Badge>}
                </div>
              </motion.div>
            ) : (
              <div className="text-muted-foreground">Press play to start the replay</div>
            )}
          </AnimatePresence>
        </div>

        {/* Playback controls */}
        <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border/50 p-4 mb-6">
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentBidIndex(i => Math.max(0, i - 1))}>
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button onClick={() => setPlaying(!playing)} className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 w-20">
              {playing ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
              {playing ? 'Pause' : 'Play'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentBidIndex(i => Math.min(bids.length, i + 1))}>
              <SkipForward className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-1 ml-4">
              {[1, 2, 4, 8].map(s => (
                <Button key={s} variant={speed === s ? 'default' : 'ghost'} size="sm" onClick={() => setSpeed(s)} className="h-7 px-2 text-xs">
                  {s}x
                </Button>
              ))}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-2 rounded-full bg-background/50 overflow-hidden">
            <motion.div
              animate={{ width: `${(currentBidIndex / bids.length) * 100}%` }}
              transition={{ duration: 0.3 }}
              className="h-full bg-gradient-to-r from-primary to-chart-2 rounded-full"
            />
          </div>
        </div>

        {/* Bid log */}
        <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border/50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-border/30 sticky top-0 bg-card/90 backdrop-blur-xl">
            <h3 className="text-sm font-bold uppercase" style={{ fontFamily: 'var(--font-heading)' }}>BID TIMELINE</h3>
          </div>
          <div className="p-2 space-y-1">
            {visibleBids.slice().reverse().map((bid, i) => (
              <motion.div
                key={bid.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: Math.min(i * 0.01, 0.3) }}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-background/30 text-sm"
              >
                <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: bid.franchiseColor }} />
                <span className="font-bold" style={{ color: bid.franchiseColor }}>{bid.franchiseShortName}</span>
                <span className="text-muted-foreground">{bid.isRtm ? 'used RTM at' : 'bid'}</span>
                <span className="font-bold text-primary ml-auto">{bid.amountCr} Cr</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
