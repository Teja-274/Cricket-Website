import { motion } from 'framer-motion'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { useAuctionStore } from '@/store/auctionStore'

export function FranchiseStrip() {
  const { franchises, currentBidderId, myFranchiseId, room } = useAuctionStore()
  const totalPurse = room?.totalPurseCr || 100

  return (
    <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 p-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
        Franchise Overview
      </h3>
      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-2">
          {franchises.map((f) => {
            const isHighest = f.id === currentBidderId
            const isMe = f.id === myFranchiseId
            const spent = ((totalPurse - f.purseRemaining) / totalPurse) * 100

            return (
              <motion.div
                key={f.id}
                animate={isHighest ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.3 }}
                className={`shrink-0 w-28 p-3 rounded-xl border-2 transition-all duration-300 bg-background/50 ${isMe ? 'ring-2 ring-primary/30' : ''}`}
                style={{
                  borderColor: isHighest ? f.color : 'var(--border)',
                  background: isHighest ? `linear-gradient(135deg, ${f.color}10, transparent)` : undefined,
                  boxShadow: isHighest ? `0 4px 20px ${f.color}20` : undefined,
                }}
              >
                <div className="text-center">
                  <div className="text-lg font-bold" style={{ color: f.color, fontFamily: 'var(--font-heading)' }}>{f.shortName}</div>
                  <div className="text-lg font-bold mt-0.5" style={{ fontFamily: 'var(--font-heading)' }}>{f.purseRemaining}</div>
                  <div className="text-[10px] text-muted-foreground">Cr left</div>

                  {/* Purse progress bar */}
                  <div className="h-1.5 rounded-full bg-accent/50 mt-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${spent}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: f.color }}
                    />
                  </div>
                  <div className="text-[9px] text-muted-foreground mt-1">{f.playersBought} players</div>
                </div>
              </motion.div>
            )
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}
