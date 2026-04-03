import { motion, AnimatePresence } from 'framer-motion'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuctionStore } from '@/store/auctionStore'

export function BidLog() {
  const { bids } = useAuctionStore()
  const recentBids = [...bids].reverse().slice(0, 50)

  return (
    <div className="bg-card rounded-2xl border border-border p-4 h-full">
      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
        Bid Log
      </h3>
      <ScrollArea className="h-[300px]">
        <AnimatePresence initial={false}>
          {recentBids.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No bids yet. Waiting for action...</p>
          ) : (
            <div className="space-y-1.5">
              {recentBids.map((bid) => (
                <motion.div
                  key={bid.id}
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  className="flex items-center gap-2 p-2 rounded-lg bg-background text-xs"
                >
                  <div
                    className="w-1.5 h-8 rounded-full shrink-0"
                    style={{ backgroundColor: bid.franchiseColor }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold" style={{ color: bid.franchiseColor }}>
                        {bid.franchiseShortName}
                      </span>
                      <span className="text-muted-foreground">
                        {bid.isRtm ? 'used RTM at' : 'raised to'}
                      </span>
                      <span className="font-bold text-primary">{bid.amountCr} Cr</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(bid.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </ScrollArea>
    </div>
  )
}
