import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PlayerBlock } from '@/components/auction/PlayerBlock'
import { BidControls } from '@/components/auction/BidControls'
import { BidTimer } from '@/components/auction/BidTimer'
import { BidLog } from '@/components/auction/BidLog'
import { FranchiseStrip } from '@/components/auction/FranchiseStrip'
import { AIStrategist } from '@/components/auction/AIStrategist'
import { useAuctionStore } from '@/store/auctionStore'

export function AuctionRoomPage() {
  const navigate = useNavigate()
  const {
    room,
    players,
    franchises,
    myFranchiseId,
    getCurrentPlayer,
    startAuction,
    isTimerRunning,
  } = useAuctionStore()

  const currentPlayer = getCurrentPlayer()
  const myFranchise = franchises.find(f => f.id === myFranchiseId) || null
  const soldCount = players.filter(p => p.status === 'sold').length
  const unsoldCount = players.filter(p => p.status === 'unsold').length
  const pendingCount = players.filter(p => p.status === 'pending').length

  useEffect(() => {
    if (!room) navigate('/lobby')
  }, [room, navigate])

  if (!room) return null

  return (
    <div className="min-h-screen p-4 lg:p-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/lobby')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
              <Trophy className="w-5 h-5 text-primary" />
              {room.name}
            </h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className={room.status === 'active' ? 'border-green-500/30 text-green-400' : 'border-border'}>
                {room.status.toUpperCase()}
              </Badge>
              <span>Sold: {soldCount}</span>
              <span>Unsold: {unsoldCount}</span>
              <span>Remaining: {pendingCount}</span>
            </div>
          </div>
        </div>

        {room.status === 'lobby' && (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={startAuction}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-8 py-5 rounded-xl"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              START AUCTION
            </Button>
          </motion.div>
        )}
      </div>

      {/* Complete state */}
      <AnimatePresence>
        {room.status === 'complete' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
            >
              <Trophy className="w-20 h-20 text-primary mb-4" />
            </motion.div>
            <h2 className="text-4xl font-bold text-primary mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
              AUCTION COMPLETE
            </h2>
            <p className="text-muted-foreground">All players have been auctioned.</p>
            <div className="flex gap-4 mt-6">
              <Button onClick={() => navigate('/lobby')} className="bg-primary text-primary-foreground">
                New Auction
              </Button>
              <Button variant="outline" onClick={() => navigate('/shortlist')}>
                View Results
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lobby state */}
      {room.status === 'lobby' && (
        <div className="flex flex-col items-center justify-center py-20">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6"
          >
            <Trophy className="w-12 h-12 text-primary" />
          </motion.div>
          <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            WAITING TO START
          </h2>
          <p className="text-muted-foreground mb-4">
            {franchises.length} franchises ready. {pendingCount} players in the pool.
          </p>
          <FranchiseStrip />
        </div>
      )}

      {/* Active auction */}
      {(room.status === 'active' || room.status === 'paused') && currentPlayer && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: Player */}
          <div className="lg:col-span-4">
            <PlayerBlock player={currentPlayer} isActive={isTimerRunning} />
          </div>

          {/* Center: Bidding */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex justify-center">
              <BidTimer />
            </div>
            <BidControls isAdmin={true} />
          </div>

          {/* Right: AI Strategist */}
          <div className="lg:col-span-4">
            <AIStrategist player={currentPlayer} franchise={myFranchise} />
          </div>

          {/* Bottom: Franchise Strip + Bid Log */}
          <div className="lg:col-span-8">
            <FranchiseStrip />
          </div>
          <div className="lg:col-span-4">
            <BidLog />
          </div>
        </div>
      )}

      {/* Active but no player */}
      {room.status === 'active' && !currentPlayer && pendingCount === 0 && (
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-muted-foreground">No more players in the pool.</h2>
        </div>
      )}
    </div>
  )
}
