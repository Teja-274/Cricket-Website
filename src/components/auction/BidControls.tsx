import { motion } from 'framer-motion'
import { Gavel, RotateCcw, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnimatedCounter } from '@/components/ui/animated-counter'
import { useAuctionStore } from '@/store/auctionStore'

function getBidIncrement(currentBid: number): number {
  if (currentBid < 1) return 0.05
  if (currentBid < 2) return 0.10
  if (currentBid < 5) return 0.25
  if (currentBid < 10) return 0.50
  return 1.0
}

export function BidControls({ isAdmin }: { isAdmin: boolean }) {
  const {
    currentBid,
    currentBidderId,
    myFranchiseId,
    franchises,
    placeBid,
    placeRtmBid,
    markSold,
    markUnsold,
    getCurrentPlayer,
  } = useAuctionStore()

  const player = getCurrentPlayer()
  const myFranchise = franchises.find(f => f.id === myFranchiseId)
  const currentBidder = franchises.find(f => f.id === currentBidderId)

  if (!player || !myFranchise) return null

  const nextBid = currentBid === 0
    ? player.basePriceCr
    : Math.round((currentBid + getBidIncrement(currentBid)) * 100) / 100
  const canBid = nextBid <= myFranchise.purseRemaining && currentBidderId !== myFranchiseId
  const canRtm = myFranchise.rtmCards > 0 && currentBid > 0 && currentBidderId !== myFranchiseId

  return (
    <div className="space-y-6">
      {/* Current Bid Display */}
      <div className="text-center">
        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
          {currentBid === 0 ? 'Starting Bid' : 'Current Bid'}
        </div>
        <motion.div
          key={currentBid}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          className="text-5xl md:text-6xl font-bold text-primary"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          <AnimatedCounter value={currentBid || player.basePriceCr} suffix=" Cr" decimals={2} />
        </motion.div>
        {currentBidder && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full"
            style={{ backgroundColor: `${currentBidder.color}20`, color: currentBidder.color }}
          >
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentBidder.color }} />
            <span className="text-sm font-semibold">{currentBidder.shortName}</span>
            <span className="text-xs opacity-70">Highest Bidder</span>
          </motion.div>
        )}
      </div>

      {/* Bid Buttons */}
      <div className="flex flex-col gap-3">
        <motion.div whileHover={{ scale: canBid ? 1.02 : 1 }} whileTap={{ scale: canBid ? 0.98 : 1 }}>
          <Button
            onClick={() => placeBid(myFranchiseId!)}
            disabled={!canBid}
            className="w-full py-8 text-xl font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-30 shadow-lg shadow-primary/20"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            <Gavel className="w-6 h-6 mr-3" />
            BID {nextBid} Cr
          </Button>
        </motion.div>

        {canRtm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={() => placeRtmBid(myFranchiseId!)}
              className="w-full py-6 text-lg font-bold rounded-xl bg-chart-3 text-white hover:bg-chart-3/90"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              RTM ({myFranchise.rtmCards} left)
            </Button>
          </motion.div>
        )}

        {/* Admin controls */}
        {isAdmin && currentBid > 0 && (
          <div className="flex gap-3 pt-2 border-t border-border">
            <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={markSold}
                className="w-full py-5 bg-chart-2 hover:bg-chart-2/90 text-white font-bold rounded-xl"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                SOLD
              </Button>
            </motion.div>
            <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={markUnsold}
                variant="outline"
                className="w-full py-5 border-destructive text-destructive hover:bg-destructive/10 font-bold rounded-xl"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                <XCircle className="w-5 h-5 mr-2" />
                UNSOLD
              </Button>
            </motion.div>
          </div>
        )}
      </div>

      {/* My Franchise Info */}
      <div className="p-4 rounded-xl bg-background border border-border">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">My Purse</span>
          <span className="font-bold text-chart-2">{myFranchise.purseRemaining} Cr</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="text-muted-foreground">Players Bought</span>
          <span className="font-bold">{myFranchise.playersBought}</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="text-muted-foreground">RTM Cards</span>
          <span className="font-bold text-chart-3">{myFranchise.rtmCards}</span>
        </div>
      </div>
    </div>
  )
}
