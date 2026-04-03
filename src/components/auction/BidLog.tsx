import { AnimatedList } from '@/components/magicui/animated-list'
import { useAuctionStore } from '@/store/auctionStore'

function BidItem({ bid }: { bid: { id: string; franchiseShortName: string; franchiseColor: string; amountCr: number; isRtm: boolean; timestamp: number } }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-background text-xs w-full">
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
    </div>
  )
}

export function BidLog() {
  const { bids } = useAuctionStore()
  const recentBids = [...bids].reverse().slice(0, 20)

  return (
    <div className="bg-card rounded-2xl border border-border p-4 h-full">
      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
        Bid Log
      </h3>
      <div className="h-[300px] overflow-hidden relative">
        {recentBids.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">No bids yet. Waiting for action...</p>
        ) : (
          <AnimatedList delay={300}>
            {recentBids.map((bid) => (
              <BidItem key={bid.id} bid={bid} />
            ))}
          </AnimatedList>
        )}
      </div>
    </div>
  )
}
