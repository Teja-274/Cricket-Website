import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuctionStore } from '@/store/auctionStore'

export function BidTimer() {
  const { timerSeconds, isTimerRunning, tickTimer, room } = useAuctionStore()
  const maxTime = room?.bidTimerSeconds || 30
  const progress = timerSeconds / maxTime
  const circumference = 2 * Math.PI * 54
  const strokeDashoffset = circumference * (1 - progress)

  const isUrgent = timerSeconds <= 5

  useEffect(() => {
    if (!isTimerRunning) return
    const interval = setInterval(tickTimer, 1000)
    return () => clearInterval(interval)
  }, [isTimerRunning, tickTimer])

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        {/* Background circle */}
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-border"
          />
          <motion.circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={isUrgent ? 'text-destructive' : 'text-primary'}
            animate={{
              strokeDashoffset,
              ...(isUrgent ? { opacity: [1, 0.5, 1] } : {}),
            }}
            transition={{
              strokeDashoffset: { duration: 0.3 },
              ...(isUrgent ? { opacity: { duration: 0.5, repeat: Infinity } } : {}),
            }}
          />
        </svg>
        {/* Timer text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            key={timerSeconds}
            initial={{ scale: 1.2, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`text-4xl font-bold ${isUrgent ? 'text-destructive' : 'text-foreground'}`}
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {timerSeconds}
          </motion.span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground mt-2 uppercase tracking-wider">
        {timerSeconds === 0 ? 'Time Up' : 'seconds'}
      </span>
    </div>
  )
}
