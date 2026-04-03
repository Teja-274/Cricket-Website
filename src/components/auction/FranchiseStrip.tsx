import { motion } from 'framer-motion'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { useAuctionStore } from '@/store/auctionStore'

export function FranchiseStrip() {
  const { franchises, currentBidderId, myFranchiseId } = useAuctionStore()

  return (
    <div className="bg-card rounded-2xl border border-border p-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
        Franchise Overview
      </h3>
      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-2">
          {franchises.map((f) => {
            const isHighest = f.id === currentBidderId
            const isMe = f.id === myFranchiseId
            return (
              <motion.div
                key={f.id}
                animate={isHighest ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.3 }}
                className={`shrink-0 w-28 p-3 rounded-xl border-2 transition-all duration-300 ${
                  isHighest ? 'bg-opacity-20' : 'bg-background'
                } ${isMe ? 'ring-2 ring-primary/40' : ''}`}
                style={{
                  borderColor: isHighest ? f.color : 'var(--border)',
                  backgroundColor: isHighest ? `${f.color}10` : undefined,
                  boxShadow: isHighest ? `0 0 20px ${f.color}30` : undefined,
                }}
              >
                <div className="text-center">
                  <div
                    className="text-lg font-bold"
                    style={{ color: f.color, fontFamily: 'var(--font-heading)' }}
                  >
                    {f.shortName}
                  </div>
                  <div className="text-lg font-bold mt-0.5" style={{ fontFamily: 'var(--font-heading)' }}>
                    {f.purseRemaining}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Cr left</div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {f.playersBought} players
                  </div>
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
